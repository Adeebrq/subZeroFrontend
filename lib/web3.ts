// utils/web3.ts - Fixed to prevent request cascade
import { ethers } from "ethers";

// ✅ METAMASK TYPE DEFINITIONS
declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: unknown[] }) => Promise<unknown>;
      on: (event: string, callback: (...args: unknown[]) => void) => void;
      removeListener: (event: string, callback: (...args: unknown[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

// ✅ CONNECTION STATE MANAGEMENT - PREVENTS MULTIPLE CONNECTIONS
interface ConnectionState {
  isConnected: boolean;
  account: string | null;
  isConnecting: boolean;
  lastCheck: number;
  checkCooldown: number; // 5 seconds
  inFlightCheck?: Promise<{ isConnected: boolean; account: string | null }> | null;
}

const connectionState: ConnectionState = {
  isConnected: false,
  account: null,
  isConnecting: false,
  lastCheck: 0,
  checkCooldown: 5000,
  inFlightCheck: null
};

// ✅ SIMPLE RATE LIMITER - NO RECURSIVE CALLS
interface RateLimiterConfig {
  maxRequests: number;
  windowMs: number;
}

interface RequestRecord {
  timestamp: number;
}

class SimpleRateLimiter {
  private requests: Map<string, RequestRecord[]> = new Map();
  private configs: Map<string, RateLimiterConfig> = new Map();

  constructor() {
    // Conservative limits to prevent cascade
    this.addConfig('api', { maxRequests: 30, windowMs: 60000 }); // Increased from 10 to 30
    this.addConfig('rpc', { maxRequests: 20, windowMs: 60000 });
    this.addConfig('contract_read', { maxRequests: 30, windowMs: 60000 });
    this.addConfig('contract_write', { maxRequests: 5, windowMs: 60000 });
    // Relax wallet checks slightly; we'll also dedupe in-flight calls
    this.addConfig('wallet', { maxRequests: 15, windowMs: 60000 });
  }

  addConfig(key: string, config: RateLimiterConfig): void {
    this.configs.set(key, config);
  }

  private cleanupOldRequests(key: string, windowMs: number): void {
    const requests = this.requests.get(key) || [];
    const now = Date.now();
    const validRequests = requests.filter(req => now - req.timestamp < windowMs);
    this.requests.set(key, validRequests);
  }

  checkLimit(identifier: string, type: string): boolean {
    const config = this.configs.get(type);
    if (!config) {
      console.warn(`No rate limit config found for type: ${type}`);
      return true;
    }

    const key = `${identifier}_${type}`;
    this.cleanupOldRequests(key, config.windowMs);

    const requests = this.requests.get(key) || [];
    
    if (requests.length >= config.maxRequests) {
      const oldestRequest = requests[0];
      const timeUntilReset = config.windowMs - (Date.now() - oldestRequest.timestamp);
      console.warn(`Rate limit exceeded for ${type}. Try again in ${Math.ceil(timeUntilReset / 1000)} seconds`);
      return false;
    }

    // Add current request
    requests.push({ timestamp: Date.now() });
    this.requests.set(key, requests);

    return true;
  }

  getRemainingRequests(identifier: string, type: string): number {
    const config = this.configs.get(type);
    if (!config) return 0;

    const key = `${identifier}_${type}`;
    this.cleanupOldRequests(key, config.windowMs);
    
    const requests = this.requests.get(key) || [];
    return Math.max(0, config.maxRequests - requests.length);
  }
}

// Single rate limiter instance
const rateLimiter = new SimpleRateLimiter();

// ✅ FIXED USER IDENTIFIER - NO RECURSIVE CALLS
const getUserIdentifier = (): string => {
  // Use connection state to avoid recursive calls
  if (connectionState.account) {
    return connectionState.account.toLowerCase();
  }
  
  // Generate or retrieve session-based identifier
  if (typeof window !== 'undefined') {
    let sessionId = sessionStorage.getItem('subzero_session_id');
    if (!sessionId) {
      sessionId = 'session_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
      sessionStorage.setItem('subzero_session_id', sessionId);
    }
    return sessionId;
  }
  
  return 'anonymous_' + Date.now();
};

// ✅ RETRY LOGIC WITH BACKOFF
interface RetryConfig {
  maxAttempts: number;
  baseDelay: number;
  maxDelay: number;
}

const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 2, // Reduced from 3
  baseDelay: 1000,
  maxDelay: 5000
};

export async function withRetry<T>(
  operation: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  operationType: string = 'operation'
): Promise<T> {
  const finalConfig = { ...DEFAULT_RETRY_CONFIG, ...config };
  let lastError: Error;

  for (let attempt = 1; attempt <= finalConfig.maxAttempts; attempt++) {
    try {
      return await operation();
    } catch (error) {
      lastError = error instanceof Error ? error : new Error('Unknown error');
      
      if (attempt === finalConfig.maxAttempts) {
        console.error(`${operationType} failed after ${finalConfig.maxAttempts} attempts:`, lastError.message);
        break;
      }

      const delay = Math.min(
        finalConfig.baseDelay * Math.pow(2, attempt - 1),
        finalConfig.maxDelay
      );

      console.warn(`${operationType} failed (attempt ${attempt}/${finalConfig.maxAttempts}), retrying in ${delay}ms`);
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }

  throw lastError!;
}

// Contract Configuration
export const CONTRACT_CONFIG = {
  address: "0xefF79F639543f38223e02DbaBAE4200Df2b7A2F4",
  abi: [
    "function investInAsset(bytes32 asset) external payable",
    "function closePositionByAsset(bytes32 asset) external",
    "function sellPartial(bytes32 asset, uint256 sellAmountWei) external",
    "function getUserAssetInvestment(address user, bytes32 asset) external view returns (uint256)",
    "function getUserAssets(address user) external view returns (bytes32[])",
    "function getUserAssetPositionCount(address user, bytes32 asset) external view returns (uint256)",
    "function getCurrentAssetPrice(bytes32 asset) public view returns (uint256)",
    "function getUserPositionsWithPnL(address user) external view returns (tuple(bytes32,uint256,uint256,uint256,bool)[], int256[], uint256[])",
    "function getUserAssetPnL(address user, bytes32 asset) external view returns (int256)",
    "function getUserTotalValue(address user) external view returns (uint256, int256)",
    "function getSupportedAssets() external view returns (bytes32[])",
    "function isAssetSupportedByContract(bytes32 asset) external view returns (bool)",
    "function getContractBalance() external view returns (uint256)",
  ]
};

// ✅ Copy Trading Vault Configuration
export const VAULT_CONFIG = {
  address: "0xF0ECCD0844CE83Af362f029667c7dEDf664087Dd",
  abi: [
    "function depositForCopyTrading() external payable",
    "function followTrader(address trader, uint256 percentage) external",
    "function unfollowTrader(address trader) external",
    "function withdrawFunds(uint256 amount) external",
    "function getUserCopyInfo(address user) external view returns (uint256, uint256)",
    "function isFollowing(address follower, address trader) external view returns (bool)",
    "function copyPercentage(address follower, address trader) external view returns (uint256)",
    "function depositedFunds(address user) external view returns (uint256)",
    "function vaultPositions(address user, bytes32 asset) external view returns (uint256)",
    "function isAuthorizedExecutor(address executor) external view returns (bool)",
    "function addAuthorizedExecutor(address executor) external",
    "function removeAuthorizedExecutor(address executor) external",
    "function emergencyWithdraw(address user) external",
    "function executeCopyTrade(address follower, address trader, bytes32 asset, uint256 traderAmount) external",
    "function executeCopySell(address follower, address trader, bytes32 asset, uint256 sellPercentage) external",
    "event TradeCopied(address indexed follower, address indexed trader, bytes32 asset, uint256 amount)",
    "event TraderFollowed(address indexed follower, address indexed trader, uint256 percentage)",
    "event TraderUnfollowed(address indexed follower, address indexed trader)",
    "event FundsDeposited(address indexed user, uint256 amount)",
    "event FundsWithdrawn(address indexed user, uint256 amount)"
  ]
};

// ✅ Asset mappings
export const ASSET_SYMBOLS: { [key: string]: string } = {
  ETH: "0x4554480000000000000000000000000000000000000000000000000000000000",
  BTC: "0x4254430000000000000000000000000000000000000000000000000000000000",
  AVAX: "0x4156415800000000000000000000000000000000000000000000000000000000",
  APE: "0x4150450000000000000000000000000000000000000000000000000000000000",
  UNI: "0x554e490000000000000000000000000000000000000000000000000000000000",
};

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: "0xa869",
  chainName: "Avalanche Fuji Testnet",
  rpcUrl: "https://api.avax-test.network/ext/bc/C/rpc",
  blockExplorer: "https://testnet.snowtrace.io/",
  nativeCurrency: {
    name: "AVAX",
    symbol: "AVAX",
    decimals: 18,
  }
};

// API Configuration
export const API_CONFIG = {
  baseUrl: "https://subzero-q6rn.onrender.com",
  endpoints: {
    assets: "/v1/api/assets",
    trading: "/v1/api/trading",
    portfolio: "/v1/api/portfolio",
    copyTrading: "/v1/api/copytrading"
  }
};

// ✅ SINGLETON PATTERN FOR CONTRACT INSTANCES - PREVENTS MULTIPLE CREATION
class ContractManager {
  private readOnlyContract: ethers.Contract | null = null;
  private signerContract: ethers.Contract | null = null;
  private vaultReadOnlyContract: ethers.Contract | null = null;
  private vaultSignerContract: ethers.Contract | null = null;
  private provider: ethers.JsonRpcProvider | null = null;

  private getProvider(): ethers.JsonRpcProvider {
    if (!this.provider) {
      this.provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
    }
    return this.provider;
  }

  async getReadOnlyContract(): Promise<ethers.Contract> {
    if (!this.readOnlyContract) {
      const userIdentifier = getUserIdentifier();
      
      if (!rateLimiter.checkLimit(userIdentifier, 'contract_read')) {
        throw new Error('Rate limit exceeded for contract reads');
      }

      this.readOnlyContract = new ethers.Contract(
        CONTRACT_CONFIG.address, 
        CONTRACT_CONFIG.abi, 
        this.getProvider()
      );
    }
    return this.readOnlyContract;
  }

  async getSignerContract(): Promise<ethers.Contract> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("MetaMask not available");
    }

    // Always create new signer contract as signer may change
    const userIdentifier = getUserIdentifier();
    
    if (!rateLimiter.checkLimit(userIdentifier, 'contract_write')) {
      throw new Error('Rate limit exceeded for contract writes');
    }

    const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
    const signer = await provider.getSigner();
    return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
  }

  async getVaultReadOnlyContract(): Promise<ethers.Contract> {
    if (!this.vaultReadOnlyContract) {
      const userIdentifier = getUserIdentifier();
      
      if (!rateLimiter.checkLimit(userIdentifier, 'contract_read')) {
        throw new Error('Rate limit exceeded for vault reads');
      }

      this.vaultReadOnlyContract = new ethers.Contract(
        VAULT_CONFIG.address, 
        VAULT_CONFIG.abi, 
        this.getProvider()
      );
    }
    return this.vaultReadOnlyContract;
  }

  async getVaultSignerContract(): Promise<ethers.Contract> {
    if (typeof window === 'undefined' || !window.ethereum) {
      throw new Error("MetaMask not available");
    }

    // Always create new signer contract as signer may change
    const userIdentifier = getUserIdentifier();
    
    if (!rateLimiter.checkLimit(userIdentifier, 'contract_write')) {
      throw new Error('Rate limit exceeded for vault writes');
    }

    const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
    const signer = await provider.getSigner();
    return new ethers.Contract(VAULT_CONFIG.address, VAULT_CONFIG.abi, signer);
  }

  clearCache(): void {
    this.readOnlyContract = null;
    this.signerContract = null;
    this.vaultReadOnlyContract = null;
    this.vaultSignerContract = null;
    this.provider = null;
  }
}

const contractManager = new ContractManager();

// ✅ EXPORT CONTRACT FUNCTIONS - USES SINGLETON
export const getReadOnlyContract = () => contractManager.getReadOnlyContract();
export const getSignerContract = () => contractManager.getSignerContract();
export const getVaultReadOnlyContract = () => contractManager.getVaultReadOnlyContract();
export const getVaultSignerContract = () => contractManager.getVaultSignerContract();

// Type guard function for ethereum accounts response
function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every(item => typeof item === 'string');
}

// ✅ FIXED METAMASK CONNECTION - PREVENTS CASCADE
export const checkMetaMaskConnection = async (): Promise<{isConnected: boolean, account: string | null}> => {
  // If a check is already running, reuse it
  if (connectionState.inFlightCheck) {
    return connectionState.inFlightCheck;
  }

  // Use cached state if recently checked
  const now = Date.now();
  if (now - connectionState.lastCheck < connectionState.checkCooldown) {
    return {
      isConnected: connectionState.isConnected,
      account: connectionState.account
    };
  }

  if (typeof window === 'undefined' || !window.ethereum) {
    return { isConnected: false, account: null };
  }

  const userIdentifier = getUserIdentifier();

  // Dedupe concurrent calls by storing the promise BEFORE rate limit checks
  connectionState.inFlightCheck = (async () => {
    try {
      // Only the first caller performs the rate-limit check
      if (!rateLimiter.checkLimit(userIdentifier, 'wallet')) {
        console.warn('Rate limit exceeded for wallet operations');
        return {
          isConnected: connectionState.isConnected,
          account: connectionState.account
        };
      }

      const eth = window.ethereum as any; // safe after earlier guard
      const response = await eth.request({
        method: "eth_accounts",
      });
      
      // Handle the response safely
      const accounts = isStringArray(response) ? response : [];

      connectionState.isConnected = accounts.length > 0;
      connectionState.account = accounts[0] || null;
      connectionState.lastCheck = Date.now();

      return {
        isConnected: connectionState.isConnected,
        account: connectionState.account
      };
    } catch (error) {
      console.error('Error checking MetaMask connection:', error);
      // Do not update lastCheck on error; allow retry soon
      return { isConnected: false, account: null };
    } finally {
      // Clear in-flight marker shortly after resolution to allow future checks
      setTimeout(() => { connectionState.inFlightCheck = null; }, 0);
    }
  })();

  return connectionState.inFlightCheck;
};

// ✅ FIXED METAMASK CONNECTION - PREVENTS MULTIPLE SIMULTANEOUS CONNECTIONS
export const connectMetaMask = async (): Promise<{success: boolean, account: string}> => {
  // Prevent multiple simultaneous connection attempts
  if (connectionState.isConnecting) {
    throw new Error('Connection already in progress');
  }

  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("MetaMask is not installed");
  }

  const userIdentifier = getUserIdentifier();
  
  if (!rateLimiter.checkLimit(userIdentifier, 'wallet')) {
    throw new Error('Rate limit exceeded for wallet connections');
  }

  connectionState.isConnecting = true;

  try {
    // Request account connection
    const accounts = await window.ethereum.request({
      method: "eth_requestAccounts",
    }) as string[];

    if (accounts.length === 0) {
      throw new Error('No accounts returned from MetaMask');
    }

    // Switch to Avalanche Fuji Testnet
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: any) {
      if (switchError.code === 4902) {
        await window.ethereum.request({
          method: "wallet_addEthereumChain",
          params: [{
            chainId: NETWORK_CONFIG.chainId,
            chainName: NETWORK_CONFIG.chainName,
            rpcUrls: [NETWORK_CONFIG.rpcUrl],
            nativeCurrency: NETWORK_CONFIG.nativeCurrency,
            blockExplorerUrls: [NETWORK_CONFIG.blockExplorer],
          }],
        });
      } else {
        throw switchError;
      }
    }

    // Update connection state
    connectionState.isConnected = true;
    connectionState.account = accounts[0];
    connectionState.lastCheck = Date.now();
    
    return {
      success: true,
      account: accounts[0]
    };

  } finally {
    connectionState.isConnecting = false;
  }
};

// ✅ FIXED BALANCE CHECK - USES RATE LIMITING
export const getUserAvaxBalance = async (address: string): Promise<number> => {
  const userIdentifier = getUserIdentifier();
  
  if (!rateLimiter.checkLimit(userIdentifier, 'rpc')) {
    throw new Error('Rate limit exceeded for balance checks');
  }

  if (typeof window === 'undefined' || !window.ethereum) {
    return 0;
  }

  return withRetry(
    async () => {
      const provider = new ethers.BrowserProvider(window.ethereum as unknown as ethers.Eip1193Provider);
      const balance = await provider.getBalance(address);
      return parseFloat(ethers.formatEther(balance));
    },
    { maxAttempts: 2, baseDelay: 500 },
    'getUserAvaxBalance'
  );
};

// ✅ UTILITY FUNCTIONS
export const getAssetBytes32 = (symbol: string): string => {
  const bytes32 = ASSET_SYMBOLS[symbol.toUpperCase()];
  if (!bytes32) {
    throw new Error(`Asset ${symbol} not supported`);
  }
  return bytes32;
};

// ✅ FIXED API CALL - USES RATE LIMITING
export const apiCall = async (endpoint: string, options?: RequestInit): Promise<any> => {
  const userIdentifier = getUserIdentifier();
  
  if (!rateLimiter.checkLimit(userIdentifier, 'api')) {
    throw new Error('Rate limit exceeded for API calls');
  }

  return withRetry(
    async () => {
      const url = `${API_CONFIG.baseUrl}${endpoint}`;
      const response = await fetch(url, {
        headers: {
          'Content-Type': 'application/json',
          Accept: 'application/json',
          ...(options?.headers || {})
        },
        ...options
      });

      const data = await response.json();
      
      if (!response.ok) {
        throw new Error(data.error || `API call failed: ${response.status}`);
      }

      return data;
    },
    { maxAttempts: 2, baseDelay: 1000 },
    `API ${endpoint}`
  );
};

// ✅ COPY TRADING FUNCTIONS - WITH PROPER RATE LIMITING

export const depositForCopyTrading = async (amountAVAX: string): Promise<string> => {
  return withRetry(
    async () => {
      const contract = await getVaultSignerContract();
      const tx = await contract.depositForCopyTrading({
        value: ethers.parseEther(amountAVAX),
        gasLimit: 200000
      });
      
      await tx.wait();
      return tx.hash;
    },
    { maxAttempts: 1 }, // Don't retry transactions
    'depositForCopyTrading'
  );
};

export const followTrader = async (traderAddress: string, percentage: number): Promise<string> => {
  if (!ethers.isAddress(traderAddress)) {
    throw new Error("Invalid trader address");
  }
  
  if (percentage < 1 || percentage > 100) {
    throw new Error("Percentage must be between 1 and 100");
  }

  return withRetry(
    async () => {
      const contract = await getVaultSignerContract();
      const tx = await contract.followTrader(traderAddress, percentage, {
        gasLimit: 150000
      });
      
      await tx.wait();
      return tx.hash;
    },
    { maxAttempts: 1 },
    'followTrader'
  );
};

export const unfollowTrader = async (traderAddress: string): Promise<string> => {
  return withRetry(
    async () => {
      const contract = await getVaultSignerContract();
      const tx = await contract.unfollowTrader(traderAddress, {
        gasLimit: 100000
      });
      
      await tx.wait();
      return tx.hash;
    },
    { maxAttempts: 1 },
    'unfollowTrader'
  );
};

// ✅ API functions for copy trading
export const followTraderAPI = async (traderAddress: string, percentage: number): Promise<{ success: boolean; message?: string }> => {
  // First check if user is connected to get their address
  const connectionStatus = await checkMetaMaskConnection();
  if (!connectionStatus.isConnected || !connectionStatus.account) {
    throw new Error('MetaMask not connected. Please connect your wallet first.');
  }

  const followerAddress = connectionStatus.account;

  // Check cache first
  const cacheKey = `follow_${traderAddress}_${percentage}_${followerAddress}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/follow`, {
      method: 'POST',
      body: JSON.stringify({
        follower_address: followerAddress, // ✅ Added missing follower_address
        trader_address: traderAddress,
        allocation_percentage: percentage, // ✅ Updated to match API expectation
        percentage: percentage // Keep both for backward compatibility
      })
    });
    const result = { success: true, message: response.message };
    // Cache for 30 seconds
    cache.set(cacheKey, result, 30000);
    return result;
  } catch (error) {
    console.error('API follow trader failed:', error);
    const result = { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    // Cache errors for 10 seconds to prevent spam
    cache.set(cacheKey, result, 10000);
    return result;
  }
};


export const unfollowTraderAPI = async (traderAddress: string): Promise<{ success: boolean; message?: string }> => {
  // Check cache first
  const cacheKey = `unfollow_${traderAddress}`;
  const cached = cache.get(cacheKey);
  if (cached) {
    return cached;
  }

  try {
    const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/unfollow`, {
      method: 'POST',
      body: JSON.stringify({
        trader_address: traderAddress
      })
    });
    const result = { success: true, message: response.message };
    // Cache for 30 seconds
    cache.set(cacheKey, result, 30000);
    return result;
  } catch (error) {
    console.error('API unfollow trader failed:', error);
    const result = { success: false, message: error instanceof Error ? error.message : 'Unknown error' };
    // Cache errors for 10 seconds to prevent spam
    cache.set(cacheKey, result, 10000);
    return result;
  }
};

export const withdrawFromVault = async (amountAVAX: string): Promise<string> => {
  return withRetry(
    async () => {
      const contract = await getVaultSignerContract();
      const tx = await contract.withdrawFunds(ethers.parseEther(amountAVAX), {
        gasLimit: 150000
      });
      
      await tx.wait();
      return tx.hash;
    },
    { maxAttempts: 1 },
    'withdrawFromVault'
  );
};

export const getUserCopyInfo = async (userAddress: string): Promise<{depositedBalance: number, totalFollowing: number}> => {
  return withRetry(
    async () => {
      const contract = await getVaultReadOnlyContract();
      const [depositedBalance, totalFollowing] = await contract.getUserCopyInfo(userAddress);
      
      return {
        depositedBalance: parseFloat(ethers.formatEther(depositedBalance)),
        totalFollowing: parseInt(totalFollowing.toString())
      };
    },
    { maxAttempts: 2 },
    'getUserCopyInfo'
  );
};

export const checkIsFollowing = async (followerAddress: string, traderAddress: string): Promise<{isFollowing: boolean, percentage: number}> => {
  return withRetry(
    async () => {
      const contract = await getVaultReadOnlyContract();
      const [isFollowing, percentage] = await Promise.all([
        contract.isFollowing(followerAddress, traderAddress),
        contract.copyPercentage(followerAddress, traderAddress)
      ]);
      
      return {
        isFollowing,
        percentage: parseInt(percentage.toString())
      };
    },
    { maxAttempts: 2 },
    'checkIsFollowing'
  );
};

export const getDepositedFunds = async (userAddress: string): Promise<number> => {
  return withRetry(
    async () => {
      const contract = await getVaultReadOnlyContract();
      const depositedFunds = await contract.depositedFunds(userAddress);
      return parseFloat(ethers.formatEther(depositedFunds));
    },
    { maxAttempts: 2 },
    'getDepositedFunds'
  );
};

// ✅ SIMPLE CACHING - NO COMPLEX OPERATIONS
class SimpleCache {
  private cache = new Map<string, { data: any; timestamp: number; ttl: number }>();
  private maxSize = 50; // Reduced cache size

  set(key: string, data: any, ttlMs: number = 30000): void {
    if (this.cache.size >= this.maxSize) {
      const oldestKey = this.cache.keys().next().value as string | undefined;
      if (oldestKey !== undefined) {
        this.cache.delete(oldestKey);
      }
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl: ttlMs
    });
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  clear(): void {
    this.cache.clear();
  }
}

export const cache = new SimpleCache();

// ✅ RATE LIMIT UTILITIES
export const getRemainingRequests = (type: string): number => {
  const userIdentifier = getUserIdentifier();
  return rateLimiter.getRemainingRequests(userIdentifier, type);
};

export const checkRateLimit = (type: string): boolean => {
  const userIdentifier = getUserIdentifier();
  return rateLimiter.checkLimit(userIdentifier, type);
};

// ✅ CLEANUP FUNCTION - PREVENTS MEMORY LEAKS
export const cleanup = (): void => {
  contractManager.clearCache();
  cache.clear();
  
  // Reset connection state
  connectionState.isConnected = false;
  connectionState.account = null;
  connectionState.isConnecting = false;
  connectionState.lastCheck = 0;
  
  console.log('Web3 utilities cleaned up');
};

// ✅ CONNECTION STATUS GETTER
export const getConnectionStatus = () => ({
  isConnected: connectionState.isConnected,
  account: connectionState.account,
  isConnecting: connectionState.isConnecting,
  lastCheck: connectionState.lastCheck,
  rateLimits: {
    api: getRemainingRequests('api'),
    rpc: getRemainingRequests('rpc'),
    contract_read: getRemainingRequests('contract_read'),
    contract_write: getRemainingRequests('contract_write'),
    wallet: getRemainingRequests('wallet')
  }
});

// ✅ EXPORT TYPES
export interface ConnectionResult {
  isConnected: boolean;
  account: string | null;
}

export interface ConnectResult {
  success: boolean;
  account: string;
}

// Auto-cleanup on page unload
if (typeof window !== 'undefined') {
  window.addEventListener('beforeunload', cleanup);
}