'use client'

import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useRouter } from 'next/navigation';
import clsx from 'clsx';

// ✅ Import from centralized utils (same as TradePage)
import { 
  connectMetaMask, 
  checkMetaMaskConnection,
} from '../../../lib/web3';

interface ApiAsset {
  symbol: string;
  name: string;
  icon_url: string | null;
  category: string;
  price_usd: number;
  price_source: string;
  status: string;
}

interface CoinData {
  s_no: number;
  coin: {
    name: string;
    imgPath: string;
  };
  price: string;
  category: string;
  name: string;
  status: string;
}

// Button Component
interface ButtonProps {
  styles: string;
  text: string;
  handler?: (e: React.MouseEvent<HTMLButtonElement>) => void;
}

function Button({ styles, text, handler }: ButtonProps) {
  return (
    <button className={`${styles} cursor-pointer`} onClick={handler}>
      {text}
    </button>
  );
}

// Status Pill Component
interface StatusPillProps {
  status: string;
}

function StatusPill({ status }: StatusPillProps) {
  const isActive = status === 'active';
  
  return (
    <span
      className={clsx(
        'px-2 py-1 rounded-full text-xs font-medium',
        {
          'bg-green-100 text-green-600': isActive,
          'bg-red-100 text-red-600': !isActive
        }
      )}
    >
      {isActive ? 'Active' : 'Inactive'}
    </span>
  );
}

// Coming Soon Component
function ComingSoon() {
  return (
    <div className="text-center py-12">
      <div className="text-gray-400 text-6xl mb-4">🚀</div>
      <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
        Coming Soon...
      </h3>
      <p className="text-gray-600 dark:text-gray-400">
        This feature will be available soon
      </p>
    </div>
  );
}

export default function AssetsPage() {
  const router = useRouter();
  
  // ✅ Wallet states (same pattern as TradePage and TxnHistory)
  const [_account, setAccount] = useState<string>('');
  const [isConnected, setIsConnected] = useState<boolean>(false);
  
  // ✅ Assets states
  const [activeButton, setActiveButton] = useState('All');
  const [filteredList, setFilteredList] = useState<CoinData[]>([]);
  const [allAssets, setAllAssets] = useState<CoinData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>('');
  
  const filterButtons = ['All', 'Crypto', 'Stocks', 'Commodities'];

  // ✅ Helper functions (same pattern as TxnHistory)
  const getSymbolFromName = (name: string): string => {
    const nameToSymbol: { [key: string]: string } = {
      'Ethereum': 'ETH',
      'Bitcoin': 'BTC',
      'Avalanche': 'AVAX',
      'Uniswap': 'UNI',
      'ApeCoin': 'APE',
    };
    
    return nameToSymbol[name] || name.substring(0, 3).toUpperCase();
  };

  // ✅ Initialize MetaMask connection (same as TxnHistory)
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

  // ✅ Fetch assets when component mounts (same pattern as TxnHistory)
  useEffect(() => {
    fetchAssets();
  }, []);

  // ✅ Connect to MetaMask (same as TxnHistory)
  const handleConnectWallet = async () => {
    try {
      const { account } = await connectMetaMask();
      setAccount(account);
      setIsConnected(true);
    } catch (error: any) {
      setError(error.message);
    }
  };

  // ✅ Fetch assets from API (same pattern as TxnHistory)
  const fetchAssets = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await fetch('https://subzero-q6rn.onrender.com/v1/api/assets/', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();

      if (data.success && data.assets) {
        const mappedAssets: CoinData[] = data.assets.map((asset: ApiAsset, index: number) => ({
          s_no: index + 1,
          coin: {
            name: asset.name,
            imgPath: asset.icon_url || `https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/${asset.symbol.toLowerCase()}.svg`
          },
          price: asset.price_usd > 0 ? `$${asset.price_usd.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` : 'N/A',
          category: asset.category,
          name: asset.name,
          status: asset.status || 'inactive'
        }));
        
        setAllAssets(mappedAssets);
        setFilteredList(mappedAssets);
      } else {
        setError('Failed to fetch assets');
      }
    } catch (error: any) {
      console.error('Error fetching assets:', error);
      setError(error.message || 'Failed to fetch assets');
    } finally {
      setLoading(false);
    }
  };

  // Navigation function
  const handleRowClick = (asset: CoinData) => {
    if (asset.status === 'active') {
      const symbol = getSymbolFromName(asset.name);
      
      const queryParams = new URLSearchParams({
        name: asset.name,
        price: asset.price,
        category: asset.category,
        status: asset.status,
        iconPath: asset.coin.imgPath
      });

      router.push(`/trade/${symbol}?${queryParams.toString()}`);
    }
  };

  // Filter handler
  function filterHandler(event: React.MouseEvent<HTMLButtonElement>, query: string) {
    setActiveButton(query);
    
    if (query === "All") {
      setFilteredList(allAssets);
    } else if (query === "Crypto") {
      setFilteredList(allAssets.filter(asset => asset.category.toLowerCase() === 'crypto'));
    } else if (query === "Stocks") {
      setFilteredList(allAssets.filter(asset => asset.category.toLowerCase() === 'stock'));
    } else if (query === "Commodities") {
      setFilteredList(allAssets.filter(asset => asset.category.toLowerCase() === 'commodity'));
    }
  }

  return (
    <div className="min-h-screen overflow-y-auto bg-gray-50 dark:bg-neutral-900">
      <div className="p-6 max-w-7xl mx-auto">
        {/* Header Section (same style as TxnHistory) */}
        <div className="flex items-center gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-tl from-gray-200 to-gray-900 bg-clip-text text-transparent">
              Asset Trading
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              Trade cryptocurrencies, stocks, and commodities
            </p>
          </div>
          <div className="ml-auto">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {filteredList.length || 0}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Available Assets
              </div>
            </div>
          </div>
        </div>

        {/* ✅ MetaMask Connection Banner (same as TxnHistory) */}
        {!isConnected && (
          <div className="bg-orange-100 border border-orange-400 text-orange-700 px-4 py-3 rounded mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="font-medium">Connect your wallet to start trading</span>
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

        {/* Filter Buttons (same style as TxnHistory) */}
        <div className="flex gap-2 mb-6">
          {filterButtons.map((name) => (
            <Button 
              key={name} 
              text={name} 
              handler={(e) => filterHandler(e, name)} 
              styles={clsx('px-4 py-2 rounded-lg text-sm font-medium transition-colors', {
                'bg-blue-600 text-white': activeButton === name,
                'bg-white dark:bg-neutral-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-neutral-700 hover:bg-gray-50 dark:hover:bg-neutral-700': activeButton !== name
              })} 
            />
          ))}
        </div>

        {/* Error State (same as TxnHistory) */}
        {error && (
          <div className="mb-6 p-3 rounded-md text-sm font-medium bg-red-100 text-red-700 border border-red-200">
            <p className="font-medium">Error</p>
            <p>{error}</p>
          </div>
        )}

        {/* Loading State (same as TxnHistory) */}
        {loading && (
          <div className="flex justify-center items-center py-12">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            <span className="ml-3 text-lg text-gray-900 dark:text-white">Loading assets...</span>
          </div>
        )}

        {/* Coming Soon for Stocks and Commodities */}
        {!loading && (activeButton === 'Stocks' || activeButton === 'Commodities') && (
          <ComingSoon />
        )}

        {/* ✅ Assets Grid with same styling as TxnHistory */}
        {!loading && activeButton !== 'Stocks' && activeButton !== 'Commodities' && filteredList && filteredList.length > 0 && (
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
                      Price
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Category
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Name
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                      Action
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200 dark:divide-neutral-700">
                  {filteredList.map((asset, index) => {
                    const isInactive = asset.status === 'inactive';
                    
                    return (
                      <tr 
                        key={asset.s_no}
                        onClick={() => handleRowClick(asset)}
                        className={clsx(
                          "transition-colors",
                          {
                            'cursor-not-allowed opacity-60': isInactive,
                            'cursor-pointer hover:bg-gray-50 dark:hover:bg-neutral-700/50': !isInactive
                          }
                        )}
                      >
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center">
                            <Image
                              src={asset.coin.imgPath}
                              alt={asset.coin.name}
                              width={32}
                              height={32}
                              className="rounded-full"
                              onError={(e) => {
                                (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
                              }}
                            />
                            <div className="ml-3">
                              <div className="font-medium text-gray-900 dark:text-white">
                                {asset.coin.name}
                              </div>
                              <div className="text-gray-500 dark:text-gray-400 text-sm">
                                #{index + 1}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white font-medium">
                            {asset.price}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white capitalize">
                            {asset.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900 dark:text-white">
                            {asset.name}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <StatusPill status={asset.status} />
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <button 
                            className={clsx(
                              "cursor-pointer px-3 py-1 rounded text-sm font-medium transition-colors",
                              {
                                'text-gray-400 bg-gray-100 cursor-not-allowed': isInactive,
                                'text-blue-600 bg-blue-100 hover:bg-blue-200': !isInactive
                              }
                            )}
                            disabled={isInactive}
                          >
                            Trade
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Mobile Card View (same as TxnHistory) */}
            <div className="md:hidden p-4 space-y-4">
              {filteredList.map((asset, index) => {
                const isInactive = asset.status === 'inactive';
                
                return (
                  <div 
                    key={asset.s_no}
                    onClick={() => handleRowClick(asset)}
                    className={clsx(
                      "bg-gray-50 dark:bg-neutral-700 rounded-lg p-4 space-y-3 transition-colors",
                      {
                        'cursor-not-allowed opacity-60': isInactive,
                        'cursor-pointer': !isInactive
                      }
                    )}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Image
                          src={asset.coin.imgPath}
                          alt={asset.coin.name}
                          width={24}
                          height={24}
                          className="rounded-full"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
                          }}
                        />
                        <div>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {asset.coin.name}
                          </p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">
                            #{index + 1}
                          </p>
                        </div>
                      </div>
                      <StatusPill status={asset.status} />
                    </div>
                    
                    <div className="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Price</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {asset.price}
                        </p>
                      </div>
                      <div>
                        <p className="text-gray-500 dark:text-gray-400">Category</p>
                        <p className="font-medium text-gray-900 dark:text-white capitalize">
                          {asset.category}
                        </p>
                      </div>
                      <div className="col-span-2">
                        <p className="text-gray-500 dark:text-gray-400">Name</p>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {asset.name}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2 border-t border-gray-200 dark:border-neutral-600">
                      <button 
                        className={clsx(
                          "w-full px-4 py-2 rounded text-sm font-medium transition-colors",
                          {
                            'text-gray-400 bg-gray-100 cursor-not-allowed': isInactive,
                            'text-blue-600 bg-blue-100 hover:bg-blue-200': !isInactive
                          }
                        )}
                        disabled={isInactive}
                      >
                        Trade Now
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Footer Stats (same as TxnHistory pagination style) */}
            <div className="bg-white dark:bg-neutral-800 px-6 py-3 border-t border-gray-200 dark:border-neutral-700">
              <div className="flex items-center justify-between text-sm">
                <div className="text-gray-700 dark:text-gray-300">
                  Showing {filteredList.length} of {allAssets.length} assets
                </div>
                <div className="text-gray-500 dark:text-gray-400">
                  Active: {filteredList.filter(a => a.status === 'active').length} | 
                  Inactive: {filteredList.filter(a => a.status === 'inactive').length}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Empty State (same as TxnHistory) */}
        {!loading && activeButton !== 'Stocks' && activeButton !== 'Commodities' && (!filteredList || filteredList.length === 0) && (
          <div className="text-center py-12">
            <div className="text-gray-400 text-6xl mb-4">🪙</div>
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              No assets found
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              No assets match your current filter. Try selecting a different category.
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
