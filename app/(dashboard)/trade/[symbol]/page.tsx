'use client'

import { useParams, useSearchParams } from 'next/navigation';
import { useEffect, useState, useCallback } from 'react';
import Image from 'next/image';
import { AdvancedRealTimeChart } from "react-ts-tradingview-widgets";
import { ethers } from "ethers";
import toast from 'react-hot-toast'; 

// ✅ Import from centralized utils
import { 
  connectMetaMask, 
  checkMetaMaskConnection,
  getSignerContract,
  getReadOnlyContract,
  getUserAvaxBalance,
  getAssetBytes32,
  apiCall,
  API_CONFIG,
  type TransactionRequest 
} from '../../../../lib/web3';

// ✅ Fixed: Removed unused AssetInvestmentResponse import and defined proper interface
interface TradePageProps {
  // Add any props if needed in the future
}

interface AssetData {
  symbol: string;
  name: string;
  price: string;
  category: string;
  status: string;
  iconPath: string;
}

interface UserHoldings {
  avax: number;
  asset: number;
}

// ✅ Fixed: Proper type for symbol mappings
interface SymbolMappings {
  [key: string]: string;
}

// ✅ Fixed: Proper error type
interface ErrorWithMessage {
  message?: string;
  reason?: string;
}

export default function TradePage({}: TradePageProps) {
  const params = useParams();
  const searchParams = useSearchParams();
  const [assetData, setAssetData] = useState<AssetData | null>(null);
  const [tradeMode, setTradeMode] = useState<'buy' | 'sell'>('buy');
  const [avaxAmount, setAvaxAmount] = useState('');
  const [userHoldings, setUserHoldings] = useState<UserHoldings>({
    avax: 0,
    asset: 0
  });

  // 🚀 Web3 Integration States
  const [account, setAccount] = useState("");
  const [isConnected, setIsConnected] = useState(false);
  const [loading, setLoading] = useState(false);
  const [transactionStatus, setTransactionStatus] = useState<string>("");
  const [activeTab, setActiveTab] = useState<'holdings' | 'profits'>('holdings');
  const [profitsData, setProfitsData] = useState({
    totalPnL: 0,
    totalInvested: 0,
    currentValue: 0,
    profitPercentage: 0
  });

  // ✅ Fixed: Memoized fetchProfitsData function
  const fetchProfitsData = useCallback(async () => {
    if (!account || !assetData) return;

    try {
      const contract = getReadOnlyContract();
      const bytes32Symbol = getAssetBytes32(assetData.symbol);
      
      const assetPnL = await contract.getUserAssetPnL(account, bytes32Symbol);
      const totalValue = await contract.getUserTotalValue(account);
      
      // ✅ Fixed: Removed unused pnlAvax variable
      const totalInvested = parseFloat(ethers.formatEther(totalValue[0]));
      const totalPnL = parseFloat(ethers.formatEther(totalValue[1]));
      
      const currentValue = totalInvested + totalPnL;
      const profitPercentage = totalInvested > 0 ? (totalPnL / totalInvested) * 100 : 0;
      
      setProfitsData({
        totalPnL,
        totalInvested,
        currentValue,
        profitPercentage
      });

    } catch (error) {
      console.error("Error fetching profits data:", error);
      setProfitsData({
        totalPnL: 0,
        totalInvested: 0,
        currentValue: 0,
        profitPercentage: 0
      });
    }
  }, [account, assetData]);

  const symbol = params?.symbol as string;

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

  // ✅ Fixed: Memoized fetchUserHoldings function
  const fetchUserHoldings = useCallback(async () => {
    if (!account || !assetData) return;

    try {
      const refreshToast = toast.loading('Refreshing balances...');
      
      const avaxBalance = await getUserAvaxBalance(account);
      setUserHoldings(prev => ({ ...prev, avax: avaxBalance }));

      const contract = getReadOnlyContract();
      const bytes32Symbol = getAssetBytes32(assetData.symbol);
      
      const investmentWei = await contract.getUserAssetInvestment(account, bytes32Symbol);
      const investmentAvax = parseFloat(ethers.formatEther(investmentWei));
      
      setUserHoldings(prev => ({
        ...prev,
        asset: investmentAvax
      }));

      await fetchProfitsData();

      toast.dismiss(refreshToast);
      toast.success('Balances updated successfully!');

      console.log(`User has ${investmentAvax} AVAX invested in ${assetData.symbol}`);

    } catch (error) {
      const typedError = error as ErrorWithMessage;
      console.error("Error fetching user holdings:", error);
      toast.error('Failed to refresh balances');
      setUserHoldings(prev => ({ ...prev, asset: 0 }));
    }
  }, [account, assetData, fetchProfitsData]);

  // ✅ Fixed: Fetch user holdings when connected and asset data is available
  useEffect(() => {
    if (isConnected && assetData) {
      fetchUserHoldings();
    }
  }, [isConnected, assetData, fetchUserHoldings]);

  // ✅ Get asset data from URL search params
  useEffect(() => {
    if (searchParams && symbol) {
      const data: AssetData = {
        symbol: symbol.toUpperCase(),
        name: searchParams.get('name') || '',
        price: searchParams.get('price') || '',
        category: searchParams.get('category') || '',
        status: searchParams.get('status') || '',
        iconPath: searchParams.get('iconPath') || ''
      };
      setAssetData(data);
    }
  }, [symbol, searchParams]);

  // ✅ Connect to MetaMask using utils
  const handleConnectWallet = async () => {
    try {
      const loadingToast = toast.loading('Connecting to MetaMask...');
      const { account } = await connectMetaMask();
      toast.dismiss(loadingToast);
      toast.success('Wallet connected successfully!');
      setAccount(account);
      setIsConnected(true);
    } catch (error) {
      const typedError = error as ErrorWithMessage;
      toast.dismiss();
      toast.error(typedError.message || 'Failed to connect wallet');
    }
  };

  // ✅ Handle Buy Transaction
  const handleBuy = async () => {
    if (!isConnected) {
      toast.error("Please connect MetaMask first");
      return;
    }

    if (!avaxAmount || parseFloat(avaxAmount) <= 0) {
      toast.error("Please enter a valid AVAX amount");
      return;
    }

    const amount = parseFloat(avaxAmount);
    if (amount < 0.01 || amount > 10) {
      toast.error("Amount must be between 0.01 and 10 AVAX");
      return;
    }

    if (amount > userHoldings.avax) {
      toast.error(`Insufficient AVAX balance. You have ${userHoldings.avax.toFixed(4)} AVAX`);
      return;
    }

    setLoading(true);
    setTransactionStatus("Preparing transaction...");

    try {
      const contract = await getSignerContract();
      const bytes32Symbol = getAssetBytes32(assetData!.symbol);

      setTransactionStatus("Calling smart contract...");
      
      const tx = await contract.investInAsset(bytes32Symbol, {
        value: ethers.parseEther(avaxAmount),
        gasLimit: 300000,
      });

      toast.success(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      setTransactionStatus(`Transaction sent: ${tx.hash.substring(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      setTransactionStatus("Recording transaction in backend...");
      
      const requestData: TransactionRequest = {
        user_address: account,
        asset_symbol: assetData!.symbol,
        amount_avax: amount,
        tx_hash: receipt.hash,
      };

      const apiResult = await apiCall(`${API_CONFIG.endpoints.trading}/buy`, {
        method: "POST",
        body: JSON.stringify(requestData),
      });

      if (apiResult.success) {
        toast.success(`Successfully invested ${amount} AVAX in ${assetData!.symbol}!`);
        setTransactionStatus("✅ Investment successful!");
        setAvaxAmount('');
        await fetchUserHoldings();
        
        setTimeout(() => setTransactionStatus(""), 3000);
      } else {
        throw new Error(apiResult.error || "Backend API failed");
      }

    } catch (error) {
      const typedError = error as ErrorWithMessage;
      console.error("Buy failed:", error);
      
      let errorMessage = "Unknown error occurred";
      if (typedError.message) {
        errorMessage = typedError.message;
      } else if (typedError.reason) {
        errorMessage = typedError.reason;
      }
      
      toast.error(`Investment failed: ${errorMessage}`);
      setTransactionStatus(`❌ Error: ${errorMessage}`);
      setTimeout(() => setTransactionStatus(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Sell Transaction (Complete or Partial)
  const handleSell = async () => {
    if (!isConnected) {
      toast.error("Please connect MetaMask first");
      return;
    }

    if (!avaxAmount || parseFloat(avaxAmount) <= 0) {
      toast.error("Please enter a valid AVAX amount to sell");
      return;
    }

    const sellAmount = parseFloat(avaxAmount);
    if (sellAmount > userHoldings.asset) {
      toast.error(`Cannot sell ${sellAmount} AVAX - you only have ${userHoldings.asset} AVAX invested in ${assetData!.symbol}`);
      return;
    }

    if (sellAmount < 0.001) {
      toast.error("Minimum sell amount is 0.001 AVAX");
      return;
    }

    const isPartialSell = sellAmount < userHoldings.asset;
    
    setLoading(true);
    setTransactionStatus(isPartialSell ? "Preparing partial sell..." : "Preparing complete position closure...");

    try {
      const contract = await getSignerContract();
      const bytes32Symbol = getAssetBytes32(assetData!.symbol);

      let tx;
      let endpoint;
      let requestBody: TransactionRequest;

      if (isPartialSell) {
        setTransactionStatus("Executing partial sell...");
        const sellAmountWei = ethers.parseEther(avaxAmount);
        
        tx = await contract.sellPartial(bytes32Symbol, sellAmountWei, {
          gasLimit: 500000,
        });

        endpoint = `${API_CONFIG.endpoints.trading}/sellpartial`;
        requestBody = {
          user_address: account,
          asset_symbol: assetData!.symbol,
          sell_amount_avax: sellAmount,
          tx_hash: '',
        };
      } else {
        setTransactionStatus("Closing complete position...");
        
        tx = await contract.closePositionByAsset(bytes32Symbol, {
          gasLimit: 300000,
        });

        endpoint = `${API_CONFIG.endpoints.trading}/sell`;
        requestBody = {
          user_address: account,
          asset_symbol: assetData!.symbol,
          tx_hash: '',
        };
      }

      toast.success(`Transaction submitted: ${tx.hash.substring(0, 10)}...`);
      setTransactionStatus(`Transaction sent: ${tx.hash.substring(0, 10)}...`);
      
      const receipt = await tx.wait();
      
      setTransactionStatus("Recording transaction in backend...");
      
      requestBody.tx_hash = receipt.hash;
      
      const apiResult = await apiCall(endpoint, {
        method: "POST",
        body: JSON.stringify(requestBody),
      });
      
      if (apiResult.success) {
        const sellType = isPartialSell ? 'Partial sell' : 'Position closure';
        toast.success(`${sellType} completed successfully!`);
        setTransactionStatus(`✅ ${sellType} successful!`);
        setAvaxAmount('');
        await fetchUserHoldings();
        
        setTimeout(() => setTransactionStatus(""), 3000);
      } else {
        throw new Error(apiResult.error || "Backend API failed");
      }

    } catch (error) {
      const typedError = error as ErrorWithMessage;
      console.error("Sell failed:", error);
      
      let errorMessage = "Unknown error occurred";
      if (typedError.message) {
        errorMessage = typedError.message;
      } else if (typedError.reason) {
        errorMessage = typedError.reason;
      }
      
      toast.error(`Sell failed: ${errorMessage}`);
      setTransactionStatus(`❌ Error: ${errorMessage}`);
      setTimeout(() => setTransactionStatus(""), 5000);
    } finally {
      setLoading(false);
    }
  };

  // ✅ Function to get TradingView symbol format
  const getTradingViewSymbol = (assetSymbol: string): string => {
    const symbolMappings: SymbolMappings = {
      'BTC': 'BTCUSD',
      'BITCOIN': 'BTCUSD',
      'ETH': 'ETHUSD', 
      'ETHEREUM': 'ETHUSD',
      'AVAX': 'AVAXUSD',
      'AVALANCHE': 'AVAXUSD',
      'SOL': 'SOLUSD',
      'SOLANA': 'SOLUSD',
      'ADA': 'ADAUSD',
      'CARDANO': 'ADAUSD',
      'DOT': 'DOTUSD',
      'POLKADOT': 'DOTUSD',
      'LINK': 'LINKUSD',
      'CHAINLINK': 'LINKUSD',
      'UNI': 'UNIUSD',
      'UNISWAP': 'UNIUSD',
      'MATIC': 'MATICUSD',
      'POLYGON': 'MATICUSD'
    };

    const upperSymbol = assetSymbol.toUpperCase();
    return symbolMappings[upperSymbol] || `${upperSymbol}USD`;
  };

  // ✅ Early returns for error states
  if (!params || !symbol) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="text-red-600 text-center">
          <p className="text-lg font-semibold">Invalid asset</p>
          <p className="text-sm">Asset not found</p>
        </div>
      </div>
    );
  }

  if (!assetData) {
    return (
      <div className="flex justify-center items-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen overflow-y-auto">
      <div className="p-6 max-w-7xl mx-auto"> 
        {/* Header Section - Added card-bg */}
        <div className="flex items-center gap-4 mb-8 card-bg rounded-lg border border-gray-200 p-6">
          <Image 
            src={assetData.iconPath} 
            alt={assetData.name}
            width={48}
            height={48}
            onError={(e) => {
              (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
            }}
          />
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              {assetData.name}
            </h1>
            <p className="text-gray-600 dark:text-gray-400">
              {assetData.symbol} • {assetData.category}
            </p>
          </div>
          <div className="ml-auto">
            <div className="text-right">
              <div className="text-2xl font-bold text-gray-900 dark:text-white">
                {assetData.price}
              </div>
              <div className="text-sm text-gray-600 dark:text-gray-400">
                Current Price
              </div>
            </div>
          </div>
        </div>

        {/* 🚀 MetaMask Connection Banner - Added card-bg */}
        {!isConnected && (
          <div className="card-bg border border-orange-200 text-orange-700 px-4 py-3 rounded-lg mb-6">
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

        {/* Trading Interface */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Chart Section - NO card-bg applied here, chart stays untouched */}
          <div className="lg:col-span-2">
            <div className="h-[664px] w-full max-w-[860px]">
              <AdvancedRealTimeChart
                theme="light"
                symbol={getTradingViewSymbol(assetData.symbol)}
                interval="D"
                timezone="Etc/UTC"
                style="1"
                locale="en"
                toolbar_bg="#f1f3f6"
                enable_publishing={false}
                allow_symbol_change={true}
                height={664} 
                width="100%"
                container_id={`tradingview_chart_${assetData.symbol}`}
              />
            </div>
          </div>

          {/* Trading Panel */}
          <div className="space-y-6">
            {/* Buy/Sell Panel - Added card-bg */}
            <div className="card-bg rounded-lg border border-gray-200 p-6">
              <h2 className="text-xl font-semibold mb-4">Trade AVAX/{assetData.symbol}</h2>
              
              {/* 🚀 Transaction Status */}
              {transactionStatus && (
                <div className={`mb-4 p-3 rounded-md text-sm font-medium ${
                  transactionStatus.includes('✅') 
                    ? 'bg-green-100 text-green-700 border border-green-200'
                    : transactionStatus.includes('❌') 
                    ? 'bg-red-100 text-red-700 border border-red-200'
                    : 'bg-blue-100 text-blue-700 border border-blue-200'
                }`}>
                  {transactionStatus}
                </div>
              )}
              
              {/* Buy/Sell Tabs */}
              <div className="flex bg-gray-100 dark:bg-neutral-700 rounded-lg p-1 mb-4">
                <button 
                  onClick={() => setTradeMode('buy')}
                  disabled={loading}
                  className={`cursor-pointer flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    tradeMode === 'buy' 
                      ? 'bg-green-500 text-white' 
                      : 'text-gray-600 dark:text-gray-300 hover:text-green-500'
                  }`}
                >
                  Buy {assetData.symbol}
                </button>
                <button 
                  onClick={() => setTradeMode('sell')}
                  disabled={userHoldings.asset === 0 || loading}
                  className={`cursor-pointer flex-1 py-2 px-4 rounded-md font-medium transition-colors ${
                    tradeMode === 'sell' 
                      ? 'bg-red-500 text-white' 
                      : userHoldings.asset === 0
                      ? 'text-gray-400 cursor-not-allowed'
                      : 'text-gray-600 dark:text-gray-300 hover:text-red-500'
                  }`}
                >
                  Sell {assetData.symbol}
                </button>
              </div>

              {/* Trading Input */}
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                    {tradeMode === 'buy' ? 'AVAX Amount to Invest' : 'AVAX Amount to Sell'}
                  </label>
                  <div className="relative">
                    <input
                      type="number"
                      placeholder="0.00"
                      value={avaxAmount}
                      onChange={(e) => setAvaxAmount(e.target.value)}
                      min="0.01"
                      max={tradeMode === 'buy' ? "10" : userHoldings.asset.toString()}
                      step="0.001"
                      disabled={!isConnected || loading}
                      className="w-full px-3 py-2 pr-16 border border-gray-300 dark:border-neutral-600 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 dark:bg-neutral-700 disabled:bg-gray-100"
                    />
                    <div className="absolute right-3 top-2 flex items-center gap-1">
                      <Image 
                        src="https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/avax.svg"
                        alt="AVAX"
                        width={16}
                        height={16}
                      />
                      <span className="text-sm text-gray-500">AVAX</span>
                    </div>
                  </div>
                  
                  {/* Balance Information */}
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    {tradeMode === 'buy' ? (
                      <p>Wallet: {userHoldings.avax.toFixed(4)} AVAX</p>
                    ) : (
                      <p>Available to sell: {userHoldings.asset.toFixed(4)} AVAX</p>
                    )}
                    <p>Min: {tradeMode === 'buy' ? '0.01' : '0.001'} AVAX</p>
                  </div>

                  {/* Quick Amount Buttons for Selling */}
                  {tradeMode === 'sell' && userHoldings.asset > 0 && (
                    <div className="flex gap-2 mt-2">
                      <button 
                        onClick={() => setAvaxAmount((userHoldings.asset * 0.25).toFixed(4))}
                        disabled={loading}
                        className="cursor-pointer px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                      >
                        25%
                      </button>
                      <button 
                        onClick={() => setAvaxAmount((userHoldings.asset * 0.5).toFixed(4))}
                        disabled={loading}
                        className="cursor-pointer px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                      >
                        50%
                      </button>
                      <button 
                        onClick={() => setAvaxAmount((userHoldings.asset * 0.75).toFixed(4))}
                        disabled={loading}
                        className="cursor-pointer px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                      >
                        75%
                      </button>
                      <button 
                        onClick={() => setAvaxAmount(userHoldings.asset.toFixed(4))}
                        disabled={loading}
                        className="cursor-pointer px-2 py-1 text-xs bg-gray-200 hover:bg-gray-300 rounded disabled:opacity-50"
                      >
                        Max
                      </button>
                    </div>
                  )}
                </div>

                {/* Action Button */}
                <button 
                  onClick={tradeMode === 'buy' ? handleBuy : handleSell}
                  disabled={!isConnected || loading || !avaxAmount || parseFloat(avaxAmount || '0') <= 0}
                  className={`w-full font-semibold py-3 px-4 rounded-md transition-colors disabled:bg-gray-400 disabled:cursor-not-allowed ${
                    tradeMode === 'buy' 
                      ? 'bg-green-500 hover:bg-green-600 text-white'
                      : 'bg-red-500 hover:bg-red-600 text-white'
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center justify-center">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Processing...
                    </div>
                  ) : !isConnected ? (
                    'Connect Wallet First'
                  ) : (
                    `${tradeMode === 'buy' ? 'Buy' : 'Sell'} ${assetData.symbol}`
                  )}
                </button>

                {/* Transaction Limits Info */}
                <div className="text-xs text-gray-500 text-center">
                  {tradeMode === 'buy' ? (
                    <p>Investment limits: 0.01 - 10 AVAX</p>
                  ) : (
                    <p>Minimum sell: 0.001 AVAX</p>
                  )}
                </div>
              </div>
            </div>

            {/* Portfolio Holdings with Tabbed Interface - Added card-bg */}
            <div className="card-bg rounded-lg border border-gray-200 p-6">
              {/* Tab Header */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex bg-gray-100 dark:bg-neutral-700 rounded-lg p-1">
                  <button
                    onClick={() => setActiveTab('holdings')}
                    className={`cursor-pointer px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                      activeTab === 'holdings'
                        ? 'bg-white dark:bg-neutral-600 text-blue-600 dark:text-blue-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-blue-600'
                    }`}
                  >
                    Your Holdings
                  </button>
                  <button
                    onClick={() => setActiveTab('profits')}
                    className={`cursor-pointer px-4 py-2 rounded-md font-medium text-sm transition-colors ${
                      activeTab === 'profits'
                        ? 'bg-white dark:bg-neutral-600 text-green-600 dark:text-green-400 shadow-sm'
                        : 'text-gray-600 dark:text-gray-300 hover:text-green-600'
                    }`}
                  >
                    Your Profits
                  </button>
                </div>
                
                {isConnected && (
                  <button 
                    onClick={fetchUserHoldings}
                    disabled={loading}
                    className="cursor-pointer text-sm text-blue-600 hover:text-blue-800 disabled:opacity-50"
                  >
                    🔄 Refresh
                  </button>
                )}
              </div>

              {/* Tab Content */}
              <div className="space-y-3">
                {activeTab === 'holdings' ? (
                  // Holdings Tab Content
                  <>
                    {/* Current Asset Holdings */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Image 
                          src={assetData.iconPath}
                          alt={assetData.symbol}
                          width={24}
                          height={24}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
                          }}
                        />
                        <div>
                          <p className="font-medium">{assetData.symbol}</p>
                          <p className="text-sm text-gray-500">{assetData.name}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {userHoldings.asset.toFixed(4)} AVAX
                        </p>
                        <p className="text-sm text-gray-500">Invested</p>
                      </div>
                    </div>

                    {/* AVAX Balance */}
                    <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Image 
                          src="https://cdn.jsdelivr.net/gh/vadimmalykhin/binance-icons/crypto/avax.svg"
                          alt="AVAX"
                          width={24}
                          height={24}
                        />
                        <div>
                          <p className="font-medium">AVAX</p>
                          <p className="text-sm text-gray-500">Avalanche</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-gray-600 dark:text-gray-400">
                          {userHoldings.avax.toFixed(4)}
                        </p>
                        <p className="text-sm text-gray-500">Wallet</p>
                      </div>
                    </div>
                  </>
                ) : (
                  // Profits Tab Content
                  <>
                    {/* Total P&L */}
                    <div className={`flex items-center justify-between p-3 rounded-lg ${
                      profitsData.totalPnL >= 0 
                        ? 'bg-green-50 dark:bg-green-900/20' 
                        : 'bg-red-50 dark:bg-red-900/20'
                    }`}>
                      <div className="flex items-center gap-3">
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center ${
                          profitsData.totalPnL >= 0 ? 'bg-green-500' : 'bg-red-500'
                        }`}>
                          <span className="text-white text-xs font-bold">
                            {profitsData.totalPnL >= 0 ? '↗' : '↘'}
                          </span>
                        </div>
                        <div>
                          <p className="font-medium">Total P&L</p>
                          <p className="text-sm text-gray-500">All Positions</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className={`font-bold ${
                          profitsData.totalPnL >= 0 
                            ? 'text-green-600 dark:text-green-400' 
                            : 'text-red-600 dark:text-red-400'
                        }`}>
                          {profitsData.totalPnL >= 0 ? '+' : ''}{profitsData.totalPnL.toFixed(4)} AVAX
                        </p>
                        <p className={`text-sm ${
                          profitsData.profitPercentage >= 0 ? 'text-green-500' : 'text-red-500'
                        }`}>
                          {profitsData.profitPercentage >= 0 ? '+' : ''}{profitsData.profitPercentage.toFixed(2)}%
                        </p>
                      </div>
                    </div>

                    {/* Current Asset P&L */}
                    <div className="flex items-center justify-between p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Image 
                          src={assetData.iconPath}
                          alt={assetData.symbol}
                          width={24}
                          height={24}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = '/default-crypto-icon.svg';
                          }}
                        />
                        <div>
                          <p className="font-medium">{assetData.symbol} P&L</p>
                          <p className="text-sm text-gray-500">Current Position</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600 dark:text-blue-400">
                          {userHoldings.asset > 0 ? 'Active' : 'No Position'}
                        </p>
                        <p className="text-sm text-gray-500">
                          {userHoldings.asset.toFixed(4)} AVAX
                        </p>
                      </div>
                    </div>

                    {/* Portfolio Summary */}
                    <div className="border-t pt-3 mt-3">
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
                          <p className="text-gray-500 text-xs">Total Invested</p>
                          <p className="font-semibold">{profitsData.totalInvested.toFixed(4)} AVAX</p>
                        </div>
                        <div className="text-center p-2 bg-gray-50 dark:bg-gray-900/20 rounded">
                          <p className="text-gray-500 text-xs">Current Value</p>
                          <p className="font-semibold">{profitsData.currentValue.toFixed(4)} AVAX</p>
                        </div>
                      </div>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* ✅ Asset Info Panel - Added card-bg */}
        <div className="mb-10 lg:col-span-2 mt-6">
          <div className="card-bg rounded-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold mb-4">Trading Pair Info</h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Trading Pair:</span>
                  <span className="font-medium">AVAX/{assetData.symbol}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Base Currency:</span>
                  <span className="font-medium">AVAX</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Quote Currency:</span>
                  <span className="font-medium">{assetData.symbol}</span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Category:</span>
                  <span className="font-medium capitalize">{assetData.category}</span>
                </div>
              </div>
              <div className="space-y-3">
                <div className="flex gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Status:</span>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                    assetData.status === 'active' 
                      ? 'bg-green-100 text-green-700' 
                      : 'bg-red-100 text-red-700'
                  }`}>
                    {assetData.status === 'active' ? 'Active' : 'Inactive'}
                  </span>
                </div>
                <div className="flex gap-2">
                  <span className="text-gray-600 dark:text-gray-400">Current Price:</span>
                  <span className="font-medium">{assetData.price}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
