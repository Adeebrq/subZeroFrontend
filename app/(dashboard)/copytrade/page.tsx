'use client'

import React, { useState, useEffect } from 'react';
import toast from 'react-hot-toast';

// ✅ Import ALL the copy trading functions you need
import { 
  connectMetaMask, 
  checkMetaMaskConnection,
  getUserAvaxBalance,
  apiCall,
  API_CONFIG,
  // ✅ Copy trading specific functions
  getUserCopyInfo,
  depositForCopyTrading,
  followTrader as followTraderContract,
  unfollowTrader as unfollowTraderContract,
  followTraderAPI,
  unfollowTraderAPI,
} from '../../../lib/web3';

// Import the new Deposit Modal component
import DepositModal from '../../../components/depositModal';

interface TraderStats {
  rank: number;
  trader_address: string;
  total_trades: number;
  profitable_trades: number;
  win_rate: string;
  total_pnl: number;
  followers_count: number;
  user_type?: string;
}

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

interface CopyTradeHistory {
  id: string;
  trader_address: string; // ✅ FIXED: Made required instead of optional
  follower_address?: string;
  asset_symbol?: string;
  asset?: string;
  copied_amount?: string;
  amount?: string;
  created_at: string;
  status: string;
  pnl?: number;
}

interface DashboardStats {
  total_relationships: number;
  active_relationships: number;
  total_copied_trades: number;
  recent_trades_24h: number;
  top_traders?: Array<{
    trader_address: string;
    total_trades: number;
    total_pnl: number;
    followers_count: number;
  }>;
}

// ✅ FIXED: Define proper API response types that extend base ApiResponse
interface BaseApiResponse {
  success: boolean;
  error?: string;
}

interface LeaderboardResponse extends BaseApiResponse {
  leaderboard: Array<{
    rank: number;
    trader_address: string;
    total_trades: number;
    profitable_trades: number;
    win_rate: string;
    total_pnl: number;
    followers_count: number;
    user_type?: string;
  }>;
  total_traders: number;
  breakdown?: {
    active_traders: number;
    copy_traders: number;
    new_users: number;
  };
}

interface FollowingResponse extends BaseApiResponse {
  following: Array<{
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
  }>;
}

interface CopyHistoryResponse extends BaseApiResponse {
  copy_trades: Array<{
    id: string;
    trader_address?: string;
    follower_address?: string;
    asset_symbol?: string;
    asset?: string;
    copied_amount?: string;
    amount?: string;
    created_at: string;
    status: string;
    pnl?: number;
  }>;
  pagination?: {
    limit: number;
    offset: number;
    total: number | null;
  };
}

interface StatsResponse extends BaseApiResponse {
  statistics: {
    total_relationships: number;
    active_relationships: number;
    total_copied_trades: number;
    recent_trades_24h: number;
    top_traders?: Array<{
      trader_address: string;
      total_trades: number;
      total_pnl: number;
      followers_count: number;
    }>;
  };
}

interface SyncResponse extends BaseApiResponse {
  message: string;
  stats: {
    total_traders_found: number;
    processed_traders: number;
    skipped_traders: number;
  };
  details: {
    calculation_includes: string[];
  };
}

const CopyTradingDashboard: React.FC = () => {
  // 🚀 Web3 Integration States
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string>("");

  // Dashboard States
  const [leaderboard, setLeaderboard] = useState<TraderStats[]>([]);
  const [followedTraders, setFollowedTraders] = useState<FollowedTrader[]>([]);
  const [copyHistory, setCopyHistory] = useState<CopyTradeHistory[]>([]);
  const [dashboardStats, setDashboardStats] = useState<DashboardStats | null>(null);
  const [activeTab, setActiveTab] = useState<'leaderboard' | 'following' | 'history'>('leaderboard');
  const [userAvaxBalance, setUserAvaxBalance] = useState<number>(0);
  const [vaultBalance, setVaultBalance] = useState<number>(0);

  // Modal States
  const [followModal, setFollowModal] = useState<{ show: boolean; trader: string }>({ show: false, trader: '' });
  const [followData, setFollowData] = useState({ allocation: 10, deposit: 0 });
  const [depositModal, setDepositModal] = useState<boolean>(false);

  // ✅ Initialize MetaMask connection on component mount
  useEffect(() => {
    const initializeConnection = async () => {
      const { isConnected, account } = await checkMetaMaskConnection();
      if (isConnected && account) {
        setAccount(account);
        setIsConnected(true);
      }
    };
    
    initializeConnection();
  }, []);

  // ✅ Fetch data when connected
  useEffect(() => {
    fetchLeaderboard();
    fetchDashboardStats();
  }, []);

  // ✅ Fixed dependency issue by moving fetchUserData logic inside useEffect
  useEffect(() => {
    const fetchData = async () => {
      if (!account) return;

      try {
        const avaxBalance = await getUserAvaxBalance(account);
        setUserAvaxBalance(avaxBalance);
        
        // ✅ Get vault balance
        try {
          const copyInfo = await getUserCopyInfo(account);
          setVaultBalance(copyInfo.depositedBalance);
        } catch (error) {
          console.log('Vault info not available:', error);
          setVaultBalance(0);
        }
        
        await fetchFollowedTraders();
        await fetchCopyHistory();
      } catch (error: unknown) {
        console.error("Error fetching user data:", error);
      }
    };

    if (isConnected && account) {
      fetchData();
    }
  }, [isConnected, account, vaultBalance]);

  // ✅ Connect to MetaMask
  const handleConnectWallet = async () => {
    try {
      const loadingToast = toast.loading('Connecting to MetaMask...');
      const { account } = await connectMetaMask();
      toast.dismiss(loadingToast);
      toast.success('Wallet connected successfully!');
      setAccount(account);
      setIsConnected(true);
    } catch (error: unknown) {
      toast.dismiss();
      const errorMessage = error instanceof Error ? error.message : 'Failed to connect wallet';
      toast.error(errorMessage);
    }
  };

  // ✅ NEW: Handle standalone deposit
  const handleStandaloneDeposit = async (amount: number) => {
    if (!isConnected || !account) {
      toast.error("Please connect MetaMask first");
      return;
    }

    if (amount > userAvaxBalance) {
      throw new Error(`Insufficient AVAX balance. You have ${userAvaxBalance.toFixed(4)} AVAX`);
    }

    setLoading(true);
    setTransactionStatus("Depositing AVAX to vault...");

    try {
      const depositTxHash = await depositForCopyTrading(amount.toString());
      toast.success(`Deposit successful! TX: ${depositTxHash.substring(0, 10)}...`);
      
      // ✅ Refresh user data after successful deposit
      const avaxBalance = await getUserAvaxBalance(account);
      setUserAvaxBalance(avaxBalance);
      
      try {
        const copyInfo = await getUserCopyInfo(account);
        setVaultBalance(copyInfo.depositedBalance);
      } catch (error) {
        console.log('Vault info not available:', error);
        setVaultBalance(0);
      }
      
    } catch (error: unknown) {
      console.error("Deposit failed:", error);
      throw error;
    } finally {
      setLoading(false);
      setTransactionStatus("");
    }
  };

  // ✅ FIXED: Updated leaderboard fetch with proper type casting
  const fetchLeaderboard = async () => {
    try {
      setLoading(true);
      const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/leaderboard?limit=50`, {
        method: 'GET'
      }) as LeaderboardResponse;
      
      if (response.success && response.leaderboard) {
        // ✅ Map the response data to match frontend interface
        const mappedLeaderboard: TraderStats[] = response.leaderboard.map((trader) => ({
          rank: trader.rank,
          trader_address: trader.trader_address,
          total_trades: trader.total_trades,
          profitable_trades: trader.profitable_trades,
          win_rate: trader.win_rate,
          total_pnl: trader.total_pnl,
          followers_count: trader.followers_count,
          user_type: trader.user_type
        }));
        
        setLeaderboard(mappedLeaderboard);
        console.log(`✅ Loaded ${mappedLeaderboard.length} traders from leaderboard`);
      } else {
        console.error('Leaderboard API returned error:', response.error);
        toast.error('Failed to load leaderboard');
      }
    } catch (error) {
      console.error('Failed to fetch leaderboard:', error);
      toast.error('Failed to load leaderboard');
    } finally {
      setLoading(false);
    }
  };

  // ✅ FIXED: Updated to handle correct API response structure with proper type casting
  const fetchFollowedTraders = async () => {
    if (!account) return;
    
    try {
      const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/following/${account}`, {
        method: 'GET'
      }) as FollowingResponse;
      
      if (response.success && response.following) {
        // ✅ Map the response to match frontend interface
        const mappedFollowing: FollowedTrader[] = response.following.map((trader) => ({
          trader_address: trader.trader_address,
          allocation_percentage: trader.allocation_percentage,
          // ✅ Use vaultBalance if deposited_amount is 0 or missing
          deposited_amount: trader.deposited_amount && trader.deposited_amount > 0 
            ? trader.deposited_amount 
            : vaultBalance,
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
    }
  };
  
  // ✅ FIXED: Updated to handle correct API response structure with proper type casting
  const fetchCopyHistory = async () => {
    if (!account) return;
    
    try {
      const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/history/${account}`, {
        method: 'GET'
      }) as CopyHistoryResponse;
      
      if (response.success && response.copy_trades) {
        // ✅ FIXED: Handle undefined trader_address properly
        const mappedHistory: CopyTradeHistory[] = response.copy_trades.map((trade) => ({
          id: trade.id,
          trader_address: trade.trader_address || trade.follower_address || 'Unknown', // ✅ Provide fallback
          asset: trade.asset_symbol || trade.asset || '',
          amount: trade.copied_amount || trade.amount || '',
          created_at: trade.created_at,
          status: trade.status,
          pnl: trade.pnl
        }));
        
        setCopyHistory(mappedHistory);
      }
    } catch (error) {
      console.error('Failed to fetch copy history:', error);
    }
  };

  // ✅ FIXED: Updated dashboard stats fetch with proper type casting
  const fetchDashboardStats = async () => {
    try {
      const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/stats`, {
        method: 'GET'
      }) as StatsResponse;
      
      if (response.success && response.statistics) {
        setDashboardStats(response.statistics);
      }
    } catch (error) {
      console.error('Failed to fetch dashboard stats:', error);
    }
  };

  // ✅ Enhanced Follow Trader Function with Smart Contract Integration
  const followTrader = async (traderAddress: string) => {
    if (!isConnected || !account) {
      toast.error("Please connect MetaMask first");
      return;
    }

    if (followData.allocation < 1 || followData.allocation > 100) {
      toast.error("Allocation must be between 1-100%");
      return;
    }

    if (followData.deposit > userAvaxBalance) {
      toast.error(`Insufficient AVAX balance. You have ${userAvaxBalance.toFixed(4)} AVAX`);
      return;
    }

    setLoading(true);
    setTransactionStatus("Following trader...");

    try {
      // ✅ STEP 1: Deposit AVAX to vault (if deposit amount > 0)
      if (followData.deposit > 0) {
        setTransactionStatus("Depositing AVAX to vault...");
        const depositTxHash = await depositForCopyTrading(followData.deposit.toString());
        toast.success(`Deposit successful! TX: ${depositTxHash.substring(0, 10)}...`);
      }

      // ✅ STEP 2: Follow trader on smart contract
      setTransactionStatus("Following trader on blockchain...");
      const followTxHash = await followTraderContract(traderAddress, followData.allocation);
      toast.success(`Blockchain follow successful! TX: ${followTxHash.substring(0, 10)}...`);

      // ✅ STEP 3: Update database via API
      setTransactionStatus("Updating database...");
      const apiResult = await followTraderAPI(account, traderAddress, followData.allocation);

      if (apiResult.success) {
        toast.success(`Successfully following trader!`);
        setTransactionStatus("");
        setFollowModal({ show: false, trader: '' });
        setFollowData({ allocation: 10, deposit: 0 });
        
        // ✅ Refresh all data
        const avaxBalance = await getUserAvaxBalance(account);
        setUserAvaxBalance(avaxBalance);
        
        try {
          const copyInfo = await getUserCopyInfo(account);
          setVaultBalance(copyInfo.depositedBalance);
        } catch (error) {
          console.log('Vault info not available:', error);
          setVaultBalance(0);
        }
        
        await fetchFollowedTraders();
        await fetchCopyHistory();
        await fetchDashboardStats();
      } else {
        throw new Error(apiResult.error || "Database update failed");
      }

    } catch (error: unknown) {
      console.error("Follow trader failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to follow trader: ${errorMessage}`);
      setTransactionStatus("");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Enhanced Unfollow Trader Function with Smart Contract Integration
  const unfollowTrader = async (traderAddress: string) => {
    if (!isConnected || !account) return;

    setLoading(true);
    setTransactionStatus("Unfollowing trader...");

    try {
      // ✅ STEP 1: Unfollow on smart contract
      setTransactionStatus("Unfollowing on blockchain...");
      const unfollowTxHash = await unfollowTraderContract(traderAddress);
      toast.success(`Blockchain unfollow successful! TX: ${unfollowTxHash.substring(0, 10)}...`);

      // ✅ STEP 2: Update database via API
      setTransactionStatus("Updating database...");
      const apiResult = await unfollowTraderAPI(account, traderAddress);

      if (apiResult.success) {
        toast.success('Successfully unfollowed trader!');
        
        // ✅ Refresh data
        await fetchFollowedTraders();
        await fetchDashboardStats();
      } else {
        throw new Error(apiResult.error || "Database update failed");
      }

    } catch (error: unknown) {
      console.error("Unfollow trader failed:", error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
      toast.error(`Failed to unfollow trader: ${errorMessage}`);
    } finally {
      setLoading(false);
      setTransactionStatus("");
    }
  };

  // ✅ FIXED: Add sync function with proper type casting
  const syncTraderPerformance = async () => {
    try {
      setLoading(true);
      const loadingToast = toast.loading('Syncing trader performance...');
      
      const response = await apiCall(`${API_CONFIG.endpoints.copyTrading}/sync-trader-performance`, {
        method: 'POST'
      }) as SyncResponse;
      
      toast.dismiss(loadingToast);
      
      if (response.success && response.stats) {
        toast.success(`Synced ${response.stats.processed_traders} traders!`);
        await fetchLeaderboard(); // Refresh leaderboard after sync
      } else {
        toast.error('Sync failed');
      }
    } catch (error) {
      console.error('Sync failed:', error);
      toast.error('Sync failed');
    } finally {
      setLoading(false);
    }
  };

  // ✅ Helper function to check if trader is already followed
  const isTraderFollowed = (traderAddress: string): boolean => {
    return followedTraders.some(followed => 
      followed.trader_address.toLowerCase() === traderAddress.toLowerCase()
    );
  };

  const formatAddress = (address: string) => `${address.slice(0, 6)}...${address.slice(-4)}`;
  const formatPnL = (pnl: number | null | undefined | string) => {
    // Handle null, undefined, or invalid values
    if (pnl == null || isNaN(Number(pnl))) {
      return '0.0000 AVAX';
    }
    
    // Convert to number if it's a string
    const pnlNumber = typeof pnl === 'string' ? parseFloat(pnl) : pnl;
    
    // Return formatted string
    return `${pnlNumber >= 0 ? '+' : ''}${pnlNumber.toFixed(4)} AVAX`;
  };
  
  return (
    <div className="min-h-screen bg-white text-gray-900 p-6 space-y-10 md:space-y-16 overflow-y-auto">
      {/* Header Section */}
      <div className="flex items-center gap-4 mb-8 py-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-tl from-gray-200 to-gray-900 bg-clip-text text-transparent">
            Copy Trade
          </h1>
          <p className="text-gray-600">
            Follow successful traders and automatically copy their trades
          </p>
        </div>
      </div>

      {/* Transaction Status */}
      {transactionStatus && (
        <div className="mb-4 p-3 rounded-lg text-blue-800 card-bg border border-blue-200">
          {transactionStatus}
        </div>
      )}

      {/* ✅ User Wallet Stats (Show when connected) - ENHANCED WITH DEPOSIT BUTTON */}
      {isConnected && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-gray-900">Your Wallet</h2>
            {/* ✅ NEW: Deposit Button */}
            <button
              onClick={() => setDepositModal(true)}
              disabled={loading}
              className="cursor-pointer px-4 py-2 bg-gradient-to-r from-[#9bbfe2] to-[#f3f5f7] text-gray-800 rounded-lg hover:from-[#8aafe0] hover:to-[#e8eaec] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              <span>Deposit AVAX</span>
            </button>
          </div>
          
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="rounded-lg p-4 text-center card-bg border border-gray-200">
              <div className="text-2xl font-bold text-blue-600">{userAvaxBalance.toFixed(4)}</div>
              <div className="text-sm text-gray-600">Wallet AVAX</div>
            </div>
            <div className="rounded-lg p-4 text-center card-bg border border-gray-200">
              <div className="text-2xl font-bold text-green-600">{vaultBalance.toFixed(4)}</div>
              <div className="text-sm text-gray-600">Vault AVAX</div>
            </div>
            <div className="rounded-lg p-4 text-center card-bg border border-gray-200">
              <div className="text-2xl font-bold text-purple-600">{followedTraders.length}</div>
              <div className="text-sm text-gray-600">Following</div>
            </div>
            <div className="rounded-lg p-4 text-center card-bg border border-gray-200">
              <div className="text-2xl font-bold text-orange-600">{copyHistory.length}</div>
              <div className="text-sm text-gray-600">Copy Trades</div>
            </div>
          </div>
        </div>
      )}

      {/* Stats Overview */}
      {dashboardStats && (
        <div className="mb-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: 'Active Followers', value: dashboardStats.active_relationships },
              { label: 'Total Trades', value: dashboardStats.total_copied_trades },
              { label: 'Trades (24h)', value: dashboardStats.recent_trades_24h },
              { label: 'Total Relationships', value: dashboardStats.total_relationships }
            ].map((stat, index) => (
              <div key={index} className="rounded-lg p-4 text-center card-bg border border-gray-200">
                <div className="text-2xl font-bold text-gray-900">{stat.value.toLocaleString()}</div>
                <div className="text-sm text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="mb-6">
        <div className="border-b border-gray-200">
          <nav className="-mb-px flex space-x-8">
            {[
              { key: 'leaderboard', label: 'Leaderboard' },
              { key: 'following', label: 'Following' },
              { key: 'history', label: 'History' }
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as 'leaderboard' | 'following' | 'history')}
                className={`py-2 px-1 border-b-2 font-medium text-sm ${
                  activeTab === tab.key
                    ? 'border-black text-black'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Content Area */}
      <div className="space-y-6">
        {/* Leaderboard Tab */}
        {activeTab === 'leaderboard' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Top Traders ({leaderboard.length})</h2>
              <div className="flex items-center space-x-2">
                <button 
                  onClick={fetchLeaderboard}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-900 disabled:opacity-50"
                >
                  {loading ? 'Loading...' : 'Refresh'}
                </button>
              </div>
            </div>
            
            {!isConnected && (
              <div className="mb-6 p-4 rounded-lg card-bg border border-gray-200">
                <div className="flex items-center justify-between">
                  <span>Connect your wallet to start copy trading</span>
                  <button
                    onClick={handleConnectWallet}
                    className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                  >
                    Connect Wallet
                  </button>
                </div>
              </div>
            )}

            {/* ✅ Show loading state */}
            {loading && leaderboard.length === 0 && (
              <div className="text-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900 mx-auto"></div>
                <p className="text-gray-600 mt-2">Loading traders...</p>
              </div>
            )}

            {/* ✅ Show empty state if no traders after loading */}
            {!loading && leaderboard.length === 0 && (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">No traders found. Try syncing the data first.</p>
                <button
                  onClick={syncTraderPerformance}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                >
                  Sync Trader Data
                </button>
              </div>
            )}
            
            <div className="grid gap-4">
              {leaderboard.map((trader) => (
                <div key={trader.trader_address} className="rounded-lg p-4 hover:bg-gray-50 card-bg border border-gray-200">
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-black text-white rounded-full flex items-center justify-center text-sm font-bold">
                        #{trader.rank}
                      </div>
                      <div className="flex flex-col">
                        <span className="font-mono text-sm">{formatAddress(trader.trader_address)}</span>
                        {trader.user_type && (
                          <span className="text-xs text-gray-500">{trader.user_type}</span>
                        )}
                      </div>
                    </div>
                    {isConnected && (
                      <>
                        {isTraderFollowed(trader.trader_address) ? (
                          <button 
                            onClick={() => unfollowTrader(trader.trader_address)}
                            disabled={loading}
                            className="cursor-pointer px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                          >
                            Unfollow
                          </button>
                        ) : (
                          <button 
                            onClick={() => setFollowModal({ show: true, trader: trader.trader_address })}
                            disabled={loading}
                            className="cursor-pointer px-3 py-1 bg-black text-white text-sm rounded hover:bg-gray-800 disabled:opacity-50"
                          >
                            Follow
                          </button>
                        )}
                      </>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                    <div>
                      <span className="text-gray-600">Win Rate: </span>
                      <span className="font-semibold text-green-600">{trader.win_rate}%</span>
                    </div>
                    <div>
                      <span className="text-gray-600">PnL: </span>
                      <span className={`font-semibold ${trader.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {formatPnL(trader.total_pnl)}
                      </span>
                    </div>
                    <div>
                      <span className="text-gray-600">Trades: </span>
                      <span className="font-semibold">{trader.total_trades}</span>
                    </div>
                    <div>
                      <span className="text-gray-600">Followers: </span>
                      <span className="font-semibold">{trader.followers_count}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Following Tab */}
        {activeTab === 'following' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="cursor-pointer text-xl font-semibold">Following ({followedTraders.length})</h2>
              {isConnected && (
                <button 
                  onClick={fetchFollowedTraders}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Refresh
                </button>
              )}
            </div>

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">Connect your wallet to view followed traders</p>
                <button
                  onClick={handleConnectWallet}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Connect Wallet
                </button>
              </div>
            ) : followedTraders.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600 mb-4">You&apos;re not following any traders yet</p>
                <button 
                  onClick={() => setActiveTab('leaderboard')}
                  className="px-4 py-2 bg-black text-white rounded-lg hover:bg-gray-800"
                >
                  Browse Traders
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                {followedTraders.map((followed) => (
                  <div key={followed.trader_address} className="rounded-lg p-4 card-bg border border-gray-200">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <span className="font-mono text-sm">{formatAddress(followed.trader_address)}</span>
                        <span className="px-2 py-1 bg-gray-100 text-gray-700 rounded text-xs">
                          {followed.allocation_percentage}%
                        </span>
                      </div>
                      <button 
                        onClick={() => unfollowTrader(followed.trader_address)}
                        disabled={loading}
                        className="px-3 py-1 bg-red-600 text-white text-sm rounded hover:bg-red-700 disabled:opacity-50"
                      >
                        Unfollow
                      </button>
                    </div>
                    
                    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                      <div>
                        <span className="text-gray-600">Deposited: </span>
                        <span className="font-semibold">{followed.deposited_amount.toFixed(4)} AVAX</span>
                      </div>
                      <div>
                        <span className="text-gray-600">Win Rate: </span>
                        <span className="font-semibold text-green-600">{followed.performance.win_rate}%</span>
                      </div>
                      <div>
                        <span className="text-gray-600">PnL: </span>
                        <span className={`font-semibold ${followed.performance.total_pnl >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                          {formatPnL(followed.performance.total_pnl)}
                        </span>
                      </div>
                      <div>
                        <span className="text-gray-600">Since: </span>
                        <span className="font-semibold text-xs">
                          {new Date(followed.following_since).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* History Tab */}
        {activeTab === 'history' && (
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold">Trade History ({copyHistory.length})</h2>
              {isConnected && (
                <button 
                  onClick={fetchCopyHistory}
                  disabled={loading}
                  className="text-sm text-gray-600 hover:text-gray-900"
                >
                  Refresh
                </button>
              )}
            </div>

            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-gray-600">Connect your wallet to view trade history</p>
              </div>
            ) : copyHistory.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-gray-600">No copy trades yet</p>
              </div>
            ) : (
              <div className="rounded-lg overflow-hidden card-bg border border-gray-200">
                <div className="bg-gray-50/80 grid grid-cols-5 gap-4 p-4 text-sm font-medium text-gray-700">
                  <div>Trader</div>
                  <div>Asset</div>
                  <div>Amount</div>
                  <div>Date</div>
                  <div>Status</div>
                </div>
                {copyHistory.map((trade) => (
                  <div key={trade.id} className="grid grid-cols-5 gap-4 p-4 border-t border-gray-200 text-sm">
                    <div className="font-mono">{formatAddress(trade.trader_address)}</div>
                    <div className="font-medium">{trade.asset}</div>
                    <div>{trade.amount} AVAX</div>
                    <div className="text-gray-600">{new Date(trade.created_at).toLocaleDateString()}</div>
                    <div>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        trade.status === 'SUCCESS' || trade.status === 'success' ? 'bg-green-100 text-green-800' :
                        trade.status === 'PENDING' || trade.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {trade.status}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Follow Modal */}
      {followModal.show && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
          <div className="rounded-lg p-6 max-w-md w-full mx-4 card-bg border border-gray-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-semibold">Follow Trader</h3>
              <button 
                onClick={() => setFollowModal({ show: false, trader: '' })}
                className="text-gray-400 hover:text-gray-600"
              >
                ✕
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Trader Address</label>
                <div className="font-mono text-sm bg-gray-50 p-2 rounded">{formatAddress(followModal.trader)}</div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Allocation Percentage (1-100%)
                </label>
                <input
                  type="number"
                  min="1"
                  max="100"
                  value={followData.allocation}
                  onChange={(e) => setFollowData(prev => ({ ...prev, allocation: parseInt(e.target.value) || 1 }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Initial Deposit (AVAX)
                </label>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={followData.deposit}
                  onChange={(e) => setFollowData(prev => ({ ...prev, deposit: parseFloat(e.target.value) || 0 }))}
                  className="w-full border border-gray-300 rounded px-3 py-2"
                />
                <div className="text-xs text-gray-500 mt-1">
                  Available: {userAvaxBalance.toFixed(4)} AVAX
                </div>
              </div>
            </div>
            
            <div className="flex space-x-3 mt-6">
              <button 
                onClick={() => setFollowModal({ show: false, trader: '' })}
                className="flex-1 px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={() => followTrader(followModal.trader)}
                disabled={loading}
                className="flex-1 px-4 py-2 bg-black text-white rounded hover:bg-gray-800 disabled:opacity-50"
              >
                {loading ? 'Following...' : 'Follow'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ NEW: Deposit Modal */}
      <DepositModal
        isOpen={depositModal}
        onClose={() => setDepositModal(false)}
        onDeposit={handleStandaloneDeposit}
        userAvaxBalance={userAvaxBalance}
        vaultBalance={vaultBalance}
        isLoading={loading}
      />
    </div>
  );
};

export default CopyTradingDashboard;
