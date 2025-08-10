// utils/web3.ts - Complete with Copy Trading Integration
import { ethers } from "ethers";

// Contract Configuration - Single Source of Truth
export const CONTRACT_CONFIG = {
  address: "0xefF79F639543f38223e02DbaBAE4200Df2b7A2F4", // Main Subzero contract
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
  address: "0xF0ECCD0844CE83Af362f029667c7dEDf664087Dd", // "0x6906F359F7538B504aaAB464B2B7c30A2221c3cB", // Your deployed vault address
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

// ✅ Asset bytes32 mappings with proper typing
export const ASSET_SYMBOLS: { [key: string]: string } = {
  ETH: "0x4554480000000000000000000000000000000000000000000000000000000000",
  BTC: "0x4254430000000000000000000000000000000000000000000000000000000000",
  AVAX: "0x4156415800000000000000000000000000000000000000000000000000000000",
  APE: "0x4150450000000000000000000000000000000000000000000000000000000000",
  UNI: "0x554e490000000000000000000000000000000000000000000000000000000000",
};

// Network Configuration
export const NETWORK_CONFIG = {
  chainId: "0xa869", // Avalanche Fuji Testnet
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

// ✅ Type definitions for better type safety
interface ConnectionResult {
  isConnected: boolean;
  account: string | null;
}

interface ConnectResult {
  success: boolean;
  account: string;
}

interface CopyTradingInfo {
  depositedBalance: number;
  totalFollowing: number;
}

interface FollowingStatus {
  isFollowing: boolean;
  percentage: number;
}

/**
 * Get main contract instance for read-only operations
 */
export const getReadOnlyContract = (): ethers.Contract => {
  const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, provider);
};

/**
 * Get main contract instance with signer for transactions
 */
export const getSignerContract = async (): Promise<ethers.Contract> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("MetaMask not available");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(CONTRACT_CONFIG.address, CONTRACT_CONFIG.abi, signer);
};

/**
 * Get vault contract instance for read-only operations
 */
export const getVaultReadOnlyContract = (): ethers.Contract => {
  const provider = new ethers.JsonRpcProvider(NETWORK_CONFIG.rpcUrl);
  return new ethers.Contract(VAULT_CONFIG.address, VAULT_CONFIG.abi, provider);
};

/**
 * Get vault contract instance with signer for transactions
 */
export const getVaultSignerContract = async (): Promise<ethers.Contract> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("MetaMask not available");
  }

  const provider = new ethers.BrowserProvider(window.ethereum);
  const signer = await provider.getSigner();
  return new ethers.Contract(VAULT_CONFIG.address, VAULT_CONFIG.abi, signer);
};

/**
 * Check if MetaMask is connected
 */
export const checkMetaMaskConnection = async (): Promise<ConnectionResult> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return { isConnected: false, account: null };
  }

  try {
    const accounts: string[] = await window.ethereum.request({
      method: "eth_accounts",
    });
    
    return {
      isConnected: accounts.length > 0,
      account: accounts[0] || null
    };
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error checking MetaMask:", error.message);
    } else {
      console.error("Unknown error checking MetaMask");
    }
    return { isConnected: false, account: null };
  }
};

/**
 * Connect to MetaMask and switch to correct network
 */
export const connectMetaMask = async (): Promise<ConnectResult> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    throw new Error("MetaMask is not installed! Please install MetaMask extension.");
  }

  try {
    // Request account connection
    const accounts: string[] = await window.ethereum.request({
      method: "eth_requestAccounts",
    });

    // Switch to Avalanche Fuji Testnet
    try {
      await window.ethereum.request({
        method: "wallet_switchEthereumChain",
        params: [{ chainId: NETWORK_CONFIG.chainId }],
      });
    } catch (switchError: unknown) {
      if (
        typeof switchError === 'object' && 
        switchError !== null && 
        'code' in switchError && 
        (switchError as any).code === 4902
      ) {
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

    return {
      success: true,
      account: accounts[0]
    };

  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error connecting MetaMask:", error.message);
      throw new Error(`Failed to connect MetaMask: ${error.message}`);
    } else {
      console.error("Unknown error connecting MetaMask");
      throw new Error("Unknown error connecting MetaMask");
    }
  }
};

/**
 * Get user's AVAX balance
 */
export const getUserAvaxBalance = async (address: string): Promise<number> => {
  if (typeof window === 'undefined' || !window.ethereum) {
    return 0;
  }

  try {
    const provider = new ethers.BrowserProvider(window.ethereum);
    const balance = await provider.getBalance(address);
    return parseFloat(ethers.formatEther(balance));
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error("Error getting AVAX balance:", error.message);
    } else {
      console.error("Unknown error getting AVAX balance");
    }
    return 0;
  }
};

/**
 * Convert asset symbol to bytes32
 */
export const getAssetBytes32 = (symbol: string): string => {
  const bytes32 = ASSET_SYMBOLS[symbol.toUpperCase()];
  if (!bytes32) {
    throw new Error(`Asset ${symbol} not supported`);
  }
  return bytes32;
};

/**
 * Make API call with proper error handling
 */
export const apiCall = async (endpoint: string, options?: RequestInit): Promise<any> => {
  try {
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
  } catch (error: unknown) {
    if (error instanceof Error) {
      console.error(`API call failed for ${endpoint}:`, error.message);
      throw error;
    } else {
      console.error(`Unknown error calling API for ${endpoint}`);
      throw new Error('Unknown API call error');
    }
  }
};

// ✅ COPY TRADING FUNCTIONS

/**
 * Deposit AVAX for copy trading
 */
export const depositForCopyTrading = async (amountAVAX: string): Promise<string> => {
  try {
    const contract = await getVaultSignerContract();
    const tx = await contract.depositForCopyTrading({
      value: ethers.parseEther(amountAVAX),
      gasLimit: 200000
    });
    
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    throw new Error(`Deposit failed: ${error.message}`);
  }
};

/**
 * Follow a trader with percentage allocation
 */
export const followTrader = async (traderAddress: string, percentage: number): Promise<string> => {
  try {
    if (!ethers.isAddress(traderAddress)) {
      throw new Error("Invalid trader address");
    }
    
    if (percentage < 1 || percentage > 100) {
      throw new Error("Percentage must be between 1 and 100");
    }

    const contract = await getVaultSignerContract();
    const tx = await contract.followTrader(traderAddress, percentage, {
      gasLimit: 150000
    });
    
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    throw new Error(`Follow trader failed: ${error.message}`);
  }
};

/**
 * Unfollow a trader
 */
export const unfollowTrader = async (traderAddress: string): Promise<string> => {
  try {
    const contract = await getVaultSignerContract();
    const tx = await contract.unfollowTrader(traderAddress, {
      gasLimit: 100000
    });
    
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    throw new Error(`Unfollow trader failed: ${error.message}`);
  }
};

/**
 * Withdraw funds from copy trading vault
 */
export const withdrawFromVault = async (amountAVAX: string): Promise<string> => {
  try {
    const contract = await getVaultSignerContract();
    const tx = await contract.withdrawFunds(ethers.parseEther(amountAVAX), {
      gasLimit: 150000
    });
    
    await tx.wait();
    return tx.hash;
  } catch (error: any) {
    throw new Error(`Withdrawal failed: ${error.message}`);
  }
};

/**
 * Get user's copy trading information
 */
export const getUserCopyInfo = async (userAddress: string): Promise<CopyTradingInfo> => {
  try {
    const contract = getVaultReadOnlyContract();
    const [depositedBalance, totalFollowing] = await contract.getUserCopyInfo(userAddress);
    
    return {
      depositedBalance: parseFloat(ethers.formatEther(depositedBalance)),
      totalFollowing: parseInt(totalFollowing.toString())
    };
  } catch (error: any) {
    throw new Error(`Get copy info failed: ${error.message}`);
  }
};

/**
 * Check if user is following a trader
 */
export const checkIsFollowing = async (followerAddress: string, traderAddress: string): Promise<FollowingStatus> => {
  try {
    const contract = getVaultReadOnlyContract();
    const [isFollowing, percentage] = await Promise.all([
      contract.isFollowing(followerAddress, traderAddress),
      contract.copyPercentage(followerAddress, traderAddress)
    ]);
    
    return {
      isFollowing,
      percentage: parseInt(percentage.toString())
    };
  } catch (error: any) {
    throw new Error(`Check following failed: ${error.message}`);
  }
};

/**
 * Get user's deposited funds in vault
 */
export const getDepositedFunds = async (userAddress: string): Promise<number> => {
  try {
    const contract = getVaultReadOnlyContract();
    const depositedFunds = await contract.depositedFunds(userAddress);
    return parseFloat(ethers.formatEther(depositedFunds));
  } catch (error: any) {
    throw new Error(`Get deposited funds failed: ${error.message}`);
  }
};

/**
 * Get user's vault positions for specific asset
 */
export const getVaultPosition = async (userAddress: string, assetSymbol: string): Promise<number> => {
  try {
    const contract = getVaultReadOnlyContract();
    const bytes32Asset = getAssetBytes32(assetSymbol);
    const position = await contract.vaultPositions(userAddress, bytes32Asset);
    return parseFloat(ethers.formatEther(position));
  } catch (error: any) {
    throw new Error(`Get vault position failed: ${error.message}`);
  }
};

/**
 * Check if address is authorized executor
 */
export const checkIsAuthorizedExecutor = async (executorAddress: string): Promise<boolean> => {
  try {
    const contract = getVaultReadOnlyContract();
    return await contract.isAuthorizedExecutor(executorAddress);
  } catch (error: any) {
    throw new Error(`Check authorization failed: ${error.message}`);
  }
};

// ✅ COPY TRADING API FUNCTIONS

/**
 * Follow a trader via API (updates database)
 */
export const followTraderAPI = async (followerAddress: string, traderAddress: string, allocationPercentage: number) => {
  return await apiCall(`${API_CONFIG.endpoints.copyTrading}/follow`, {
    method: 'POST',
    body: JSON.stringify({
      follower_address: followerAddress,
      trader_address: traderAddress,
      allocation_percentage: allocationPercentage
    })
  });
};

/**
 * Unfollow a trader via API
 */
export const unfollowTraderAPI = async (followerAddress: string, traderAddress: string) => {
  return await apiCall(`${API_CONFIG.endpoints.copyTrading}/unfollow`, {
    method: 'POST',
    body: JSON.stringify({
      follower_address: followerAddress,
      trader_address: traderAddress
    })
  });
};

/**
 * Get user's followed traders
 */
export const getFollowedTraders = async (address: string) => {
  return await apiCall(`${API_CONFIG.endpoints.copyTrading}/following/${address}`);
};

/**
 * Get traders leaderboard
 */
export const getTradersLeaderboard = async (limit: number = 20) => {
  return await apiCall(`${API_CONFIG.endpoints.copyTrading}/leaderboard?limit=${limit}`);
};

/**
 * Get user's copy trade history
 */
export const getCopyTradeHistory = async (address: string, limit: number = 50, offset: number = 0) => {
  return await apiCall(`${API_CONFIG.endpoints.copyTrading}/history/${address}?limit=${limit}&offset=${offset}`);
};

/**
 * Test copy trading events
 */
export const testCopyTradingEvents = async () => {
  return await apiCall(`${API_CONFIG.endpoints.copyTrading}/test-events`);
};

/**
 * Check vault configuration
 */
export const checkVaultConfiguration = async () => {
  return await apiCall(`${API_CONFIG.endpoints.copyTrading}/check-vault-config`);
};

// ✅ UTILITY TYPES FOR BETTER TYPE SAFETY

export interface AssetInvestmentResponse {
  success: boolean;
  user_address: string;
  asset: {
    symbol: string;
    name: string;
    icon_url: string;
    bytes32_symbol: string;
  };
  investment: {
    amount_avax: number;
    amount_wei: string;
    amount_usd_estimate: number;
    position_count: number;
    current_asset_price_usd: number;
  };
  timestamp: string;
  method: string;
}

export interface TransactionRequest {
  user_address: string;
  asset_symbol: string;
  amount_avax?: number;
  sell_amount_avax?: number;
  tx_hash: string;
}

export interface TraderPerformance {
  trader_address: string;
  total_trades: number;
  profitable_trades: number;
  win_rate: string;
  total_pnl: number;
  followers_count: number;
}

export interface FollowedTrader {
  trader_address: string;
  allocation_percentage: number;
  following_since: string;
  performance: TraderPerformance;
}

export interface CopyTradeTransaction {
  id: number;
  follower_address: string;
  trader_address: string;
  asset_symbol: string;
  original_amount: string;
  copied_amount: string;
  copy_tx_hash: string;
  status: string;
  created_at: string;
}

export interface LeaderboardTrader extends TraderPerformance {
  rank: number;
}

// ✅ EVENT LISTENER TYPES

export interface TradeCopiedEvent {
  follower: string;
  trader: string;
  asset: string;
  amount: string;
  transactionHash: string;
  blockNumber: number;
}

export interface TraderFollowedEvent {
  follower: string;
  trader: string;
  percentage: number;
  transactionHash: string;
  blockNumber: number;
}

/**
 * Listen to vault contract events
 */
export const listenToVaultEvents = (callback: (event: any) => void) => {
  if (typeof window === 'undefined') return;
  
  try {
    const contract = getVaultReadOnlyContract();
    
    // Listen to all events
    contract.on("*", (event) => {
      callback(event);
    });
    
    return () => {
      contract.removeAllListeners();
    };
  } catch (error) {
    console.error('Error setting up vault event listeners:', error);
  }
};
