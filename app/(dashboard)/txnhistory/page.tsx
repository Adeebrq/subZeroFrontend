'use client'

import React, { useState, useEffect, useCallback } from 'react';
import Image from 'next/image';

// ✅ Import from centralized utils (only what we need)
import { 
  connectMetaMask, 
  checkMetaMaskConnection
} from '../../../lib/web3';

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

export default function TransactionHistoryPage() {
  // ✅ Wallet states
  const [account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // ✅ Transaction history states
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [pagination, setPagination] = useState({
    total_count: 0,
    current_page: 1,
    per_page: 50,
    has_more: false
  });

  // ✅ Pagination state
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [itemsPerPage] = useState<number>(20);

  // ✅ HELPER FUNCTIONS: Safe number formatting
  const formatCurrency = (value: number | null | undefined, decimals: number = 2): string => {
    if (value == null || isNaN(value)) {
      return 'N/A';
    }
    return value.toFixed(decimals);
  };

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

  // ✅ FIXED: Correct API endpoint for portfolio history with useCallback
  const fetchTransactionHistory = useCallback(async () => {
    if (!account) return;

    setLoading(true);
    setError('');

    try {
      // ✅ FIXED: Use the correct portfolio endpoint with dynamic address
      const apiUrl = `https://subzero-q6rn.onrender.com/v1/api/portfolio/${account}/history`;
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
        setTransactions(data.transactions || []);
        setPagination(data.pagination);
      } else {
        setError('Failed to fetch transaction history');
      }
    } catch (err: unknown) {
      console.error('Error fetching transaction history:', err);
      const errorMessage = err instanceof Error ? err.message : 'Failed to fetch transaction history';
      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [account]);

  // ✅ Initialize MetaMask connection
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

  // ✅ Fetch transaction history when connected
  useEffect(() => {
    if (isConnected && account) {
      fetchTransactionHistory();
    }
  }, [isConnected, account, currentPage, fetchTransactionHistory]);

  // ✅ Connect to MetaMask
  const handleConnectWallet = async () => {
    try {
      const { account } = await connectMetaMask();
      setAccount(account);
      setIsConnected(true);
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to connect wallet';
      setError(errorMessage);
    }
  };

  // ✅ Helper functions
  const formatDate = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch {
      return 'Invalid Date';
    }
  };

  const getTransactionTypeColor = (type: string) => {
    switch (type.toLowerCase()) {
      case 'buy':
      case 'deposit':
        return 'text-green-600 bg-green-100';
      case 'sell':
      case 'withdraw':
        return 'text-red-600 bg-red-100';
      case 'sell_partial':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-blue-600 bg-blue-100';
    }
  };

  const truncateHash = (hash: string) => {
    if (!hash) return 'N/A';
    return `${hash.slice(0, 10)}...${hash.slice(-8)}`;
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
  };

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50 dark:bg-neutral-900">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-tl from-gray-200 to-gray-900 bg-clip-text text-transparent">
              Transaction History
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              View your complete trading history and transaction details
            </p>
          </div>
          <div className="ml-auto">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {pagination.total_count || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Total Transactions
              </div>
            </div>
          </div>
        </div>

        {/* ✅ MetaMask Connection Banner */}
        {!isConnected && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium">Connect your wallet to view transaction history</span>
              </div>
              <button
                onClick={handleConnectWallet}
                className="bg-orange-600 hover:bg-orange-700 text-white font-medium py-2 px-4 rounded transition-colors"
              >
                Connect MetaMask
              </button>
            </div>
          </div>
        )}

        {/* Error State */}
        {error && (
          <div className="mb-6 p-3 rounded-md text-sm font-medium bg-red-100 text-red-700 border border-red-200">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-900 dark:text-white">Loading transactions...</span>
          </div>
        )}

        {/* ✅ Transaction History Grid with null safety */}
        {isConnected && !loading && transactions && transactions.length > 0 && (
          <div className="bg-white dark:bg-neutral-800 rounded-lg border">
            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 dark:bg-neutral-700">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Asset
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Type
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Amount
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Transaction Hash
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Date
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {transactions.map((tx) => (
                    <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-neutral-700/50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <Image
                            src={tx.icon_url || '/default-crypto-icon.svg'}
                            alt={tx.asset_symbol || 'Asset'}
                            width={32}
                            height={32}
                            className="rounded-full"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
                            }}
                          />
                          <div className="ml-3">
                            <div className="font-medium text-gray-900 dark:text-white">
                              {tx.asset_symbol || 'Unknown'}
                            </div>
                            <div className="text-gray-500 dark:text-gray-400 text-sm">
                              {tx.asset_name || 'Unknown Asset'}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.transaction_type || 'unknown')}`}>
                          {(tx.transaction_type || 'UNKNOWN').toUpperCase()}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 dark:text-white font-medium">
                          {formatAVAX(tx.amount_avax)} AVAX
                        </div>
                        <div className="text-gray-500 dark:text-gray-400 text-sm">
                          ${formatUSD(tx.amount_usd)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-gray-900 dark:text-white">
                          ${formatCurrency(tx.asset_price_usd)}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        {tx.tx_hash ? (
                          <a
                            href={`https://testnet.snowtrace.io/tx/${tx.tx_hash}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-blue-600 hover:text-blue-800 font-mono text-sm"
                          >
                            {truncateHash(tx.tx_hash)}
                          </a>
                        ) : (
                          <span className="text-gray-500 dark:text-gray-400 text-sm">N/A</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                        {formatDate(tx.created_at)}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                          tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                          tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                          'bg-red-100 text-red-800'
                        }`}>
                          {tx.status || 'unknown'}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden p-4 space-y-4">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-gray-50 dark:bg-neutral-700 rounded-lg p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <Image
                        src={tx.icon_url || '/default-crypto-icon.svg'}
                        alt={tx.asset_symbol || 'Asset'}
                        width={24}
                        height={24}
                        className="rounded-full"
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
                        }}
                      />
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {tx.asset_symbol || 'Unknown'}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {tx.asset_name || 'Unknown Asset'}
                        </p>
                      </div>
                    </div>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getTransactionTypeColor(tx.transaction_type || 'unknown')}`}>
                      {(tx.transaction_type || 'UNKNOWN').toUpperCase()}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Amount</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {formatAVAX(tx.amount_avax)} AVAX
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Value</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${formatUSD(tx.amount_usd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Price</p>
                      <p className="font-medium text-gray-900 dark:text-white">
                        ${formatCurrency(tx.asset_price_usd)}
                      </p>
                    </div>
                    <div>
                      <p className="text-gray-500 dark:text-gray-400">Status</p>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        tx.status === 'COMPLETED' ? 'bg-green-100 text-green-800' : 
                        tx.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' : 
                        'bg-red-100 text-red-800'
                      }`}>
                        {tx.status || 'unknown'}
                      </span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-gray-200 dark:border-neutral-600">
                    <div className="flex items-center justify-between text-sm">
                      <p className="text-gray-500 dark:text-gray-400">{formatDate(tx.created_at)}</p>
                      {tx.tx_hash ? (
                        <a
                          href={`https://testnet.snowtrace.io/tx/${tx.tx_hash}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-blue-600 hover:text-blue-800 font-mono"
                        >
                          {truncateHash(tx.tx_hash)}
                        </a>
                      ) : (
                        <span className="text-gray-500 dark:text-gray-400">N/A</span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Pagination */}
            {pagination.total_count > itemsPerPage && (
              <div className="bg-white dark:bg-neutral-800 px-6 py-3 border-t border-gray-200 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <div className="text-sm text-gray-700 dark:text-gray-300">
                    Showing{' '}
                    <span className="font-medium">
                      {(currentPage - 1) * itemsPerPage + 1}
                    </span>{' '}
                    to{' '}
                    <span className="font-medium">
                      {Math.min(currentPage * itemsPerPage, pagination.total_count)}
                    </span>{' '}
                    of{' '}
                    <span className="font-medium">{pagination.total_count}</span>{' '}
                    results
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handlePageChange(currentPage - 1)}
                      disabled={currentPage === 1}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700"
                    >
                      Previous
                    </button>
                    <span className="px-3 py-1 text-sm">
                      Page {pagination.current_page}
                    </span>
                    <button
                      onClick={() => handlePageChange(currentPage + 1)}
                      disabled={!pagination.has_more}
                      className="px-3 py-1 text-sm border rounded disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-neutral-700"
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {isConnected && !loading && (!transactions || transactions.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">📈</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No transactions found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              You haven&apos;t made any transactions yet. Start trading to see your history here!
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
