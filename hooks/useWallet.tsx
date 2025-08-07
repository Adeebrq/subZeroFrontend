// contexts/WalletContext.tsx
"use client";
import React, { createContext, useContext, ReactNode } from 'react';
import { useState, useEffect, useCallback } from 'react';
import { ethers, BrowserProvider, Signer } from 'ethers';

// Avalanche Fuji Testnet configuration
const AVAX_TESTNET_CONFIG = {
  chainId: '0xa869',
  chainIdDecimal: 43113,
  chainName: 'Avalanche Fuji Testnet',
  nativeCurrency: {
    name: 'AVAX',
    symbol: 'AVAX',
    decimals: 18,
  },
  rpcUrls: ['https://api.avax-test.network/ext/bc/C/rpc'],
  blockExplorerUrls: ['https://testnet.snowtrace.io/'],
};

interface WalletState {
  account: string | null;
  isConnected: boolean;
  isConnecting: boolean;
  chainId: number | null;
  balance: string | null;
  balanceFormatted: string | null;
  error: string | null;
  provider: BrowserProvider | null;
  signer: Signer | null;
}

interface TransactionParams {
  to: string;
  value?: string; // in ether (e.g., "0.1")
  data?: string;
  gasLimit?: string;
  gasPrice?: string;
  maxFeePerGas?: string;
  maxPriorityFeePerGas?: string;
}

interface ContractCallParams {
  contractAddress: string;
  abi: any[];
  method: string;
  params?: any[];
  value?: string; // in ether
}

interface UseWalletReturn extends WalletState {
  connect: () => Promise<void>;
  disconnect: () => void;
  switchToAvaxTestnet: () => Promise<void>;
  addAvaxTestnet: () => Promise<void>;
  refreshBalance: () => Promise<void>;
  sendTransaction: (params: TransactionParams) => Promise<ethers.TransactionResponse>;
  signMessage: (message: string) => Promise<string>;
  callContract: (params: ContractCallParams) => Promise<any>;
  getContract: (address: string, abi: any[]) => ethers.Contract | null;
  estimateGas: (params: TransactionParams) => Promise<bigint>;
  getGasPrice: () => Promise<bigint>;
  waitForTransaction: (txHash: string) => Promise<ethers.TransactionReceipt | null>;
  isMetaMaskInstalled: boolean;
  isOnCorrectNetwork: boolean;
}

declare global {
  interface Window {
    ethereum?: {
      request: (args: { method: string; params?: any[] }) => Promise<any>;
      on: (event: string, callback: (...args: any[]) => void) => void;
      removeListener: (event: string, callback: (...args: any[]) => void) => void;
      isMetaMask?: boolean;
    };
  }
}

const WalletContext = createContext<UseWalletReturn | undefined>(undefined);

export const WalletProvider = ({ children }: { children: ReactNode }) => {
  const [state, setState] = useState<WalletState>({
    account: null,
    isConnected: false,
    isConnecting: false,
    chainId: null,
    balance: null,
    balanceFormatted: null,
    error: null,
    provider: null,
    signer: null,
  });

  const isMetaMaskInstalled = typeof window !== 'undefined' && 
    Boolean(window.ethereum?.isMetaMask);

  const isOnCorrectNetwork = state.chainId === AVAX_TESTNET_CONFIG.chainIdDecimal;

  // Helper function to update state
  const updateState = useCallback((updates: Partial<WalletState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Initialize provider and signer
  const initializeProvider = useCallback(async () => {
    if (!window.ethereum) return null;

    try {
      const provider = new BrowserProvider(window.ethereum);
      const signer = await provider.getSigner();
      return { provider, signer };
    } catch (error) {
      console.error('Error initializing provider:', error);
      return null;
    }
  }, []);

  // Get balance for connected account
  const refreshBalance = useCallback(async () => {
    if (!state.account || !state.provider) return;

    try {
      const balance = await state.provider.getBalance(state.account);
      const balanceFormatted = ethers.formatEther(balance);
      
      updateState({ 
        balance: balance.toString(),
        balanceFormatted: parseFloat(balanceFormatted).toFixed(4)
      });
    } catch (error) {
      console.error('Error fetching balance:', error);
    }
  }, [state.account, state.provider, updateState]);

  // Add Avalanche testnet to MetaMask
  const addAvaxTestnet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_addEthereumChain',
        params: [AVAX_TESTNET_CONFIG],
      });
    } catch (error: any) {
      console.error('Error adding Avalanche testnet:', error);
      throw new Error(`Failed to add Avalanche testnet: ${error.message}`);
    }
  }, []);

  // Switch to Avalanche testnet
  const switchToAvaxTestnet = useCallback(async () => {
    if (!window.ethereum) {
      throw new Error('MetaMask is not installed');
    }

    try {
      await window.ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: AVAX_TESTNET_CONFIG.chainId }],
      });
    } catch (error: any) {
      // If the chain hasn't been added to MetaMask, add it
      if (error.code === 4902) {
        await addAvaxTestnet();
      } else {
        console.error('Error switching to Avalanche testnet:', error);
        throw new Error(`Failed to switch to Avalanche testnet: ${error.message}`);
      }
    }
  }, [addAvaxTestnet]);

  // Connect wallet
  const connect = useCallback(async () => {
    if (!isMetaMaskInstalled) {
      updateState({ error: 'MetaMask is not installed. Please install MetaMask to continue.' });
      return;
    }

    updateState({ isConnecting: true, error: null });

    try {
      // Request account access
      const accounts = await window.ethereum!.request({
        method: 'eth_requestAccounts',
      });

      if (accounts.length === 0) {
        throw new Error('No accounts found. Please connect your MetaMask wallet.');
      }

      // Initialize provider and signer
      const providerData = await initializeProvider();
      if (!providerData) {
        throw new Error('Failed to initialize provider');
      }

      const { provider, signer } = providerData;
      const network = await provider.getNetwork();
      const account = accounts[0];

      updateState({
        account,
        isConnected: true,
        chainId: Number(network.chainId),
        provider,
        signer,
        isConnecting: false,
      });

      // Switch to Avalanche testnet if not already on it
      if (Number(network.chainId) !== AVAX_TESTNET_CONFIG.chainIdDecimal) {
        await switchToAvaxTestnet();
      }

    } catch (error: any) {
      console.error('Error connecting wallet:', error);
      
      // Handle specific error cases
      let errorMessage = 'Failed to connect wallet';
      
      if (error.code === 4001) {
        errorMessage = 'Connection rejected by user';
      } else if (error.code === -32002) {
        errorMessage = 'Connection request already pending';
      } else if (error.message) {
        errorMessage = error.message;
      }

      updateState({
        isConnecting: false,
        error: errorMessage,
      });
    }
  }, [isMetaMaskInstalled, updateState, switchToAvaxTestnet, initializeProvider]);

  // Disconnect wallet
  const disconnect = useCallback(() => {
    updateState({
      account: null,
      isConnected: false,
      chainId: null,
      balance: null,
      balanceFormatted: null,
      error: null,
      provider: null,
      signer: null,
    });
  }, [updateState]);

  // Send transaction
  const sendTransaction = useCallback(async (params: TransactionParams): Promise<ethers.TransactionResponse> => {
    if (!state.signer) {
      throw new Error('Wallet is not connected');
    }

    if (!isOnCorrectNetwork) {
      throw new Error('Please switch to Avalanche testnet');
    }

    try {
      const txParams: any = {
        to: params.to,
      };

      if (params.value) {
        txParams.value = ethers.parseEther(params.value);
      }

      if (params.data) {
        txParams.data = params.data;
      }

      if (params.gasLimit) {
        txParams.gasLimit = params.gasLimit;
      }

      if (params.gasPrice) {
        txParams.gasPrice = ethers.parseUnits(params.gasPrice, 'gwei');
      }

      if (params.maxFeePerGas) {
        txParams.maxFeePerGas = ethers.parseUnits(params.maxFeePerGas, 'gwei');
      }

      if (params.maxPriorityFeePerGas) {
        txParams.maxPriorityFeePerGas = ethers.parseUnits(params.maxPriorityFeePerGas, 'gwei');
      }

      const tx = await state.signer.sendTransaction(txParams);
      return tx;
    } catch (error: any) {
      console.error('Transaction failed:', error);
      throw new Error(`Transaction failed: ${error.message}`);
    }
  }, [state.signer, isOnCorrectNetwork]);

  // Sign message
  const signMessage = useCallback(async (message: string): Promise<string> => {
    if (!state.signer) {
      throw new Error('Wallet is not connected');
    }

    try {
      const signature = await state.signer.signMessage(message);
      return signature;
    } catch (error: any) {
      console.error('Message signing failed:', error);
      throw new Error(`Message signing failed: ${error.message}`);
    }
  }, [state.signer]);

  // Call contract method
  const callContract = useCallback(async (params: ContractCallParams): Promise<any> => {
    if (!state.signer) {
      throw new Error('Wallet is not connected');
    }

    try {
      const contract = new ethers.Contract(params.contractAddress, params.abi, state.signer);
      
      const txParams: any = {};
      if (params.value) {
        txParams.value = ethers.parseEther(params.value);
      }

      if (params.params && params.params.length > 0) {
        return await contract[params.method](...params.params, txParams);
      } else {
        return await contract[params.method](txParams);
      }
    } catch (error: any) {
      console.error('Contract call failed:', error);
      throw new Error(`Contract call failed: ${error.message}`);
    }
  }, [state.signer]);

  // Get contract instance
  const getContract = useCallback((address: string, abi: any[]): ethers.Contract | null => {
    if (!state.signer) return null;
    return new ethers.Contract(address, abi, state.signer);
  }, [state.signer]);

  // Estimate gas
  const estimateGas = useCallback(async (params: TransactionParams): Promise<bigint> => {
    if (!state.provider) {
      throw new Error('Provider not available');
    }

    try {
      const txParams: any = {
        to: params.to,
      };

      if (params.value) {
        txParams.value = ethers.parseEther(params.value);
      }

      if (params.data) {
        txParams.data = params.data;
      }

      if (state.account) {
        txParams.from = state.account;
      }

      const gasEstimate = await state.provider.estimateGas(txParams);
      return gasEstimate;
    } catch (error: any) {
      console.error('Gas estimation failed:', error);
      throw new Error(`Gas estimation failed: ${error.message}`);
    }
  }, [state.provider, state.account]);

  // Get current gas price
  const getGasPrice = useCallback(async (): Promise<bigint> => {
    if (!state.provider) {
      throw new Error('Provider not available');
    }

    try {
      const gasPrice = await state.provider.getFeeData();
      return gasPrice.gasPrice || BigInt(0);
    } catch (error: any) {
      console.error('Failed to get gas price:', error);
      throw new Error(`Failed to get gas price: ${error.message}`);
    }
  }, [state.provider]);

  // Wait for transaction confirmation
  const waitForTransaction = useCallback(async (txHash: string): Promise<ethers.TransactionReceipt | null> => {
    if (!state.provider) {
      throw new Error('Provider not available');
    }

    try {
      const receipt = await state.provider.waitForTransaction(txHash);
      return receipt;
    } catch (error: any) {
      console.error('Error waiting for transaction:', error);
      throw new Error(`Error waiting for transaction: ${error.message}`);
    }
  }, [state.provider]);

  // Handle account changes
  const handleAccountsChanged = useCallback((accounts: string[]) => {
    if (accounts.length === 0) {
      disconnect();
    } else if (accounts[0] !== state.account) {
      updateState({ account: accounts[0] });
      // Re-initialize provider and signer
      initializeProvider().then(providerData => {
        if (providerData) {
          updateState({ 
            provider: providerData.provider, 
            signer: providerData.signer 
          });
        }
      });
    }
  }, [disconnect, updateState, initializeProvider, state.account]);

  // Handle chain changes
  const handleChainChanged = useCallback((chainId: string) => {
    const chainIdDecimal = parseInt(chainId, 16);
    updateState({ chainId: chainIdDecimal });
    
    // Re-initialize provider when chain changes
    if (state.isConnected) {
      initializeProvider().then(providerData => {
        if (providerData) {
          updateState({ 
            provider: providerData.provider, 
            signer: providerData.signer 
          });
        }
      });
    }
  }, [updateState, initializeProvider, state.isConnected]);

  // Set up event listeners
  useEffect(() => {
    if (!window.ethereum) return;

    window.ethereum.on('accountsChanged', handleAccountsChanged);
    window.ethereum.on('chainChanged', handleChainChanged);

    // Cleanup event listeners
    return () => {
      if (window.ethereum) {
        window.ethereum.removeListener('accountsChanged', handleAccountsChanged);
        window.ethereum.removeListener('chainChanged', handleChainChanged);
      }
    };
  }, [handleAccountsChanged, handleChainChanged]);

  // Refresh balance when account or chain changes
  useEffect(() => {
    if (state.account && isOnCorrectNetwork && state.provider) {
      refreshBalance();
    }
  }, [state.account, isOnCorrectNetwork, state.provider, refreshBalance]);

  const value: UseWalletReturn = {
    ...state,
    connect,
    disconnect,
    switchToAvaxTestnet,
    addAvaxTestnet,
    refreshBalance,
    sendTransaction,
    signMessage,
    callContract,
    getContract,
    estimateGas,
    getGasPrice,
    waitForTransaction,
    isMetaMaskInstalled,
    isOnCorrectNetwork,
  };

  return (
    <WalletContext.Provider value={value}>
      {children}
    </WalletContext.Provider>
  );
};

export const useWallet = () => {
  const context = useContext(WalletContext);
  if (!context) {
    throw new Error('useWallet must be used within a WalletProvider');
  }
  return context;
};
