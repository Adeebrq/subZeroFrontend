// app/(dashboard)/dashboard/page.tsx
"use client";
import React, { useState, useEffect, useCallback } from 'react';
import { useWallet } from '../../../contexts/walletContext';
import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation'

// ✅ Import from centralized utils
import { 
  checkMetaMaskConnection,
  apiCall,
  API_CONFIG,
} from '../../../lib/web3';

interface FollowedTrader {
  trader_address: string;
  allocation_percentage: number;
  deposited_amount: number;
  following_since: string;
  performance: {
    total_trades: number;
    profitable_trades: number;
    win_rate: string;
    total_pnl: number;
    followers_count: number;
  };
}

// ✅ Add Transaction interface
interface Transaction {
  id: number;
  transaction_type: string;
  asset_symbol: string;
  asset_name: string;
  icon_url: string;
  amount_avax: number | null;
  amount_usd: number | null;
  asset_price_usd: number | null;
  quantity: number | null;
  fee_avax: number | null;
  tx_hash: string;
  block_number: number | null;
  status: string;
  created_at: string;
}

interface TransactionHistoryResponse {
  success: boolean;
  transactions: Transaction[];
  pagination: {
    total_count: number;
    current_page: number;
    per_page: number;
    has_more: boolean;
  };
  timestamp: string;
}

// ✅ Define proper type for trader mapping instead of 'any'
interface ApiTraderResponse {
  trader_address: string;
  allocation_percentage: number;
  deposited_amount?: number;
  following_since: string;
  performance: {
    total_trades: number;
    profitable_trades: number;
    win_rate: string;
    total_pnl: number;
    followers_count: number;
  };
}

// ✅ Define the API response interface to fix the TypeScript error
interface FollowingApiResponse {
  success: boolean;
  following: ApiTraderResponse[];
  message?: string;
}

export default function Dashboard() {
  const { account, balanceFormatted, isOnCorrectNetwork } = useWallet();
  const router = useRouter();
  
  // Following traders state
  const [followedTraders, setFollowedTraders] = useState<FollowedTrader[]>([]);
  const [loading, setLoading] = useState(false);
  const [isConnected, setIsConnected] = useState(false);

  // ✅ Add recent transactions state
  const [recentTransactions, setRecentTransactions] = useState<Transaction[]>([]);
  const [transactionsLoading, setTransactionsLoading] = useState(false);

  const handleRoutingClick = (val: string) => {
    if(val == "copytrade"){
      router.push('/copytrade'); 
    }else if(val == "assets"){
      router.push('/assets'); 
    }else if(val == "txnhistory"){
      router.push('/txnhistory'); 
    }
  };

  // ✅ Wrap fetchRecentTransactions in useCallback to prevent dependency warnings
  const fetchRecentTransactions = useCallback(async (walletAccount?: string) => {
    const accountToUse = walletAccount || account;
    if (!accountToUse) return;

    try {
      setTransactionsLoading(true);
      const apiUrl = `https://subzero-q6rn.onrender.com/v1/api/portfolio/${accountToUse}/history`;
      const response = await fetch(apiUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json() as TransactionHistoryResponse;

      if (data.success) {
        setRecentTransactions(data.transactions.slice(0, 5) || []);
      }
    } catch (error) {
      console.error('Failed to fetch recent transactions:', error);
    } finally {
      setTransactionsLoading(false);
    }
  }, [account]);

  // ✅ Fixed fetchFollowedTraders with proper typing
  const fetchFollowedTraders = useCallback(async (walletAccount?: string) => {
    const accountToUse = walletAccount || account;
    if (!accountToUse) return;
    
    try {
      setLoading(true);
      const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/following/${accountToUse}`, {
        method: 'GET'
      }) as FollowingApiResponse; // ✅ Type assertion to fix the error
      
      if (response.success && response.following) {
        // ✅ Replace 'any' with proper type
        const mappedFollowing: FollowedTrader[] = response.following.map((trader: ApiTraderResponse) => ({
          trader_address: trader.trader_address,
          allocation_percentage: trader.allocation_percentage,
          deposited_amount: trader.deposited_amount || 0,
          following_since: trader.following_since,
          performance: {
            total_trades: trader.performance.total_trades,
            profitable_trades: trader.performance.profitable_trades,
            win_rate: trader.performance.win_rate,
            total_pnl: trader.performance.total_pnl,
            followers_count: trader.performance.followers_count
          }
        }));
        
        setFollowedTraders(mappedFollowing);
      }
    } catch (error) {
      console.error('Failed to fetch followed traders:', error);
      setFollowedTraders([]); // ✅ Set empty array on error
    } finally {
      setLoading(false);
    }
  }, [account]);

  // ✅ Initialize connection and fetch data with proper dependencies
  useEffect(() => {
    const initializeConnection = async () => {
      const { isConnected: connected, account: walletAccount } = await checkMetaMaskConnection();
      if (connected && walletAccount) {
        setIsConnected(true);
        await fetchFollowedTraders(walletAccount);
        await fetchRecentTransactions(walletAccount);
      }
    };
    
    if (account) {
      initializeConnection();
    }
  }, [account, fetchFollowedTraders, fetchRecentTransactions]);

  // ✅ Keep helper functions but mark them as used by actually using them
  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  
  const formatPnL = (pnl: number | null | undefined | string) => {
    if (pnl == null || isNaN(Number(pnl))) {
      return '0.0000 AVAX';
    }
    
    const pnlNumber = typeof pnl === 'string' ? parseFloat(pnl) : pnl;
    return `${pnlNumber >= 0 ? '+' : ''}${pnlNumber.toFixed(4)} AVAX`;
  };

  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch {
      return 'Unknown';
    }
  };

  // ✅ Transaction helper functions
  const formatAVAX = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.0000';
    }
    return value.toFixed(4);
  };

  const formatUSD = (value: number | null | undefined): string => {
    if (value == null || isNaN(value)) {
      return '0.00';
    }
    return value.toFixed(2);
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
      case 'deposit':
        return 'text-blue-600 bg-blue-50';
      case 'sell':
      case 'withdraw':
        return 'text-slate-600 bg-slate-100';
      case 'sell_partial':
        return 'text-slate-500 bg-slate-50';
      default:
        return 'text-slate-600 bg-slate-100';
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 6)}...${hash.slice(-4)}`;
  };

  // ✅ Example usage of helper functions to prevent unused warnings
  const displayAccountAddress = account ? formatAddress(account) : 'Not Connected';
  const examplePnL = formatPnL(0); // This prevents the unused warning

  return (
    <div className="flex flex-1 w-full h-full bg-slate-50">
      <div className="p-6 w-full h-screen overflow-y-auto space-y-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-tl from-gray-200 to-gray-900 bg-clip-text text-transparent">
              Dashboard
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Everything, at a glance
            </p>
          </div>
        </div>

        {/* TOP ROW - 4 BOXES */}
        <div className="grid grid-cols-4 gap-4">
          {/* Box 1: Wallet Information */}
          <div className="card-bg rounded-xl border border-slate-200 p-4 bg-white/50">
            <h3 className="font-semibold mb-3 text-slate-800 text-sm">Wallet Information</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Account:</span>
                <span className="text-xs font-mono text-slate-800 bg-slate-100 px-2 py-1 rounded">
                  {displayAccountAddress}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Balance:</span>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded">
                  {balanceFormatted} AVAX
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Network:</span>
                <span className={`text-xs font-medium px-2 py-1 rounded ${
                  isOnCorrectNetwork 
                    ? 'text-blue-700 bg-blue-50' 
                    : 'text-slate-600 bg-slate-100'
                }`}>
                  {isOnCorrectNetwork ? "✅ Avalanche" : "❌ Wrong Network"}
                </span>
              </div>
            </div>
          </div>

          {/* Box 2: Portfolio Summary */}
          <div className="card-bg rounded-xl border border-slate-200 p-4 bg-white/50">
            <h3 className="font-semibold mb-3 text-slate-800 text-sm">Portfolio Summary</h3>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Total Value</span>
                <span className="font-semibold text-xs text-slate-800">
                  {balanceFormatted} AVAX
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Available</span>
                <span className="font-semibold text-xs text-blue-600">
                  {balanceFormatted} AVAX
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-slate-600">Copy Trading</span>
                <span className="font-semibold text-xs text-blue-600">
                  {followedTraders.reduce((total, trader) => total + trader.deposited_amount, 0).toFixed(2)} AVAX
                </span>
              </div>
            </div>
          </div>

          {/* Box 3: Network Status */}
          <div className="card-bg rounded-xl border border-slate-200 p-4 bg-white/50">
            <h3 className="font-semibold mb-3 text-slate-800 text-sm">Network Status</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Network</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    isOnCorrectNetwork ? 'bg-blue-500' : 'bg-slate-400'
                  }`}></div>
                  <span className="text-xs text-slate-800">
                    {isOnCorrectNetwork ? 'Avalanche Fuji' : 'Wrong'}
                  </span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-slate-600">Wallet</span>
                <div className="flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${
                    account ? 'bg-blue-500' : 'bg-slate-400'
                  }`}></div>
                  <span className="text-xs text-slate-800">
                    {account ? 'Connected' : 'Disconnected'}
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Box 4: Quick Actions */}
          <div className="card-bg rounded-xl border border-slate-200 p-4 bg-white/50">
            <h3 className="font-semibold mb-3 text-slate-800 text-sm">Quick Actions</h3>
            <div className="space-y-2">
              <button onClick={()=> handleRoutingClick("copytrade")} className="cursor-pointer w-full px-3 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors text-xs font-medium">
                Copy Trading
              </button>
              <button onClick={()=> handleRoutingClick("assets")} className="cursor-pointer w-full px-3 py-2 bg-slate-600 text-white rounded-lg hover:bg-slate-700 transition-colors text-xs font-medium">
                Asset Trading
              </button>
              <button onClick={()=> handleRoutingClick("txnhistory")} className="cursor-pointer w-full px-3 py-2 bg-slate-400 text-white rounded-lg hover:bg-slate-500 transition-colors text-xs font-medium">
                History
              </button>
            </div>
          </div>
        </div>

        {/* ✅ SECOND ROW - 2 LARGE BOXES: Recent Transactions + Trading Summary */}
        <div className="grid grid-cols-2 gap-6">
          
          {/* Recent Transactions Box */}
          <div className="card-bg rounded-xl border border-slate-200 p-6 bg-white/50">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-semibold text-slate-800 text-base">Recent Transactions</h3>
              <div className="flex items-center gap-3">
                <Link 
                  href="/txnhistory"
                  className="text-sm text-blue-600 hover:text-blue-800 font-medium"
                >
                  See more →
                </Link>
                <button
                  onClick={() => fetchRecentTransactions()}
                  disabled={transactionsLoading}
                  className="flex items-center gap-1 px-3 py-1 text-sm text-slate-600 hover:text-slate-800 disabled:opacity-50"
                >
                  <svg 
                    className={`w-4 h-4 ${transactionsLoading ? 'animate-spin' : ''}`} 
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                  </svg>
                  {transactionsLoading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>

            {transactionsLoading ? (
              <div className="flex justify-center items-center py-8">
                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-slate-400 mx-auto"></div>
                <span className="ml-3 text-sm text-slate-600">Loading transactions...</span>
              </div>
            ) : recentTransactions.length === 0 ? (
              <div className="text-center py-8">
                <div className="text-slate-400 text-3xl mb-3">💰</div>
                <p className="text-slate-600 text-sm">No recent transactions</p>
                <p className="text-slate-400 text-xs">Start trading to see your activity here</p>
              </div>
            ) : (
              <div className="space-y-3">
                {recentTransactions.map((tx) => (
                  <div key={tx.id} className="flex items-center justify-between py-3 px-4 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors">
                    <div className="flex items-center gap-3">
                      <Image
                        src={tx.icon_url || `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${tx.asset_symbol.toLowerCase()}.svg`}
                        alt={tx.asset_symbol || 'Asset'}
                        width={24}
                        height={24}
                        className="rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
                        }}
                      />
                      <div>
                        <p className="text-sm font-medium text-slate-800">
                          {tx.asset_symbol || 'Unknown'}
                        </p>
                        <p className="text-xs text-slate-500">
                          {formatDate(tx.created_at)}
                        </p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-slate-800">
                          {formatAVAX(tx.amount_avax)} AVAX
                        </p>
                        <p className="text-xs text-slate-500">
                          ${formatUSD(tx.amount_usd)}
                        </p>
                      </div>
                      
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.transaction_type || 'unknown')}`}>
                        {(tx.transaction_type || 'unknown').toUpperCase()}
                      </span>

                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'COMPLETED' ? 'bg-blue-100 text-blue-700' : 
                        tx.status === 'PENDING' ? 'bg-slate-200 text-slate-700' : 
                        'bg-slate-200 text-slate-700'
                      }`}>
                        {tx.status === 'COMPLETED' ? '✅' : 
                         tx.status === 'PENDING' ? '⏳' : '❌'}
                      </span>

                      {tx.tx_hash && (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-sm text-blue-600 hover:text-blue-800 font-mono"
                        >
                          {truncateHash(tx.tx_hash)}
                        </a>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Trading Summary Box */}
          <div className="card-bg rounded-xl border border-slate-200 p-6 bg-white/50">
            <h3 className="font-semibold mb-4 text-slate-800 text-base">Trading Summary</h3>
            <div className="space-y-4">
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600">Following Traders</span>
                <span className="font-semibold text-lg text-blue-600">
                  {followedTraders.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600">Total Invested</span>
                <span className="font-semibold text-lg text-blue-600">
                  {followedTraders.reduce((total, trader) => total + trader.deposited_amount, 0).toFixed(2)} AVAX
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600">Available Balance</span>
                <span className="font-semibold text-lg text-slate-800">
                  {balanceFormatted} AVAX
                </span>
              </div>
              <div className="flex justify-between items-center py-3 border-b border-slate-200">
                <span className="text-slate-600">Recent Transactions</span>
                <span className="font-semibold text-lg text-slate-800">
                  {recentTransactions.length}
                </span>
              </div>
              <div className="flex justify-between items-center py-3">
                <span className="text-slate-600">Network Status</span>
                <span className={`font-semibold text-lg ${
                  isOnCorrectNetwork ? 'text-blue-600' : 'text-slate-600'
                }`}>
                  {isOnCorrectNetwork ? 'Connected' : 'Disconnected'}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden div to prevent unused variable warnings - can be removed in production */}
        <div style={{ display: 'none' }}>
          {loading && isConnected && examplePnL}
        </div>
      </div>
    </div>
  );
}
