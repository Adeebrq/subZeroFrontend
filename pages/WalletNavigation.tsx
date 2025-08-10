// WalletNavigation.tsx
"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { useWallet } from '../contexts/walletContext';

const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#workings", label: "workings" },
];

const WalletNavigation = () => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  const { 
    isConnected, 
    isConnecting, 
    account, 
    balanceFormatted, 
    error, 
    connect, 
    disconnect,
    isMetaMaskInstalled,
    isOnCorrectNetwork 
  } = useWallet();

  useEffect(() => {
    setIsMounted(true);
  }, []);

  useEffect(() => {
    if (isConnected && account && isMounted) {
      router.push('/dashboard');
    }
  }, [isConnected, account, router, isMounted]);

  const handleWalletAction = async () => {
    if (isConnected) {
      disconnect();
    } else {
      try {
        await connect();
      } catch (error) {
        console.error('Connection failed:', error);
      }
    }
  };
  
  const getButtonContent = () => {
    if (!isMetaMaskInstalled) {
      return (
        <div className="cursor-pointer flex items-center gap-2">
          <span>Install MetaMask</span>
          <Image src="/metaMaskLogo.png" alt="MetaMask" width={20} height={20} />
        </div>
      );
    }
    if (isConnecting) return "Connecting...";
    if (isConnected) {
      return `${account?.slice(0, 6)}...${account?.slice(-4)}`;
    }
    return (
      <div className="cursor-pointer flex items-center justify-center gap-2">
        <span>Connect</span>
        <Image src="/metaMaskLogo.png" alt="MetaMask" width={20} height={20} />
      </div>
    );
  };
  
  const getButtonStyle = () => {
    if (isConnected && isOnCorrectNetwork) {
      return "bg-green-500 text-white hover:bg-green-600";
    }
    if (isConnected && !isOnCorrectNetwork) {
      return "bg-yellow-500 text-white hover:bg-yellow-600";
    }
    if (!isMetaMaskInstalled) {
      return "bg-gray-500 text-white cursor-not-allowed";
    }
    return "bg-white text-blue-600 hover:bg-blue-600 hover:text-white";
  };

  return (
    <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/10 border border-white/20 shadow-lg px-10 py-3 rounded-full flex items-center gap-6 text-white text-sm font-medium">
      <div className="logo text-cyan-500 text-3xl font-bold mr-6">SubZero</div>
      {NAV_ITEMS.map((item) => (
        <a
          key={item.label}
          href={item.href}
          className="text-cyan-500 hover:text-gray-900 transition-colors"
          onClick={(e) => {
            e.preventDefault();
            const element = document.querySelector(item.href);
            element?.scrollIntoView({ 
              behavior: 'smooth',
              block: 'start'
            });
          }}
        >
          {item.label}
        </a>
      ))}
      
      <div className="ml-6 flex flex-col items-end">
        {!isMounted ? (
          <button
            disabled
            className="bg-gray-500 text-white font-semibold px-6 py-1.5 rounded-full opacity-50 cursor-not-allowed whitespace-nowrap"
          >
            Loading...
          </button>
        ) : (
          <button
            onClick={handleWalletAction}
            disabled={!isMetaMaskInstalled || isConnecting}
            className={`${getButtonStyle()} font-semibold px-6 py-1.5 rounded-full transition-colors duration-200 whitespace-nowrap disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {getButtonContent()}
          </button>
        )}
        
        {isMounted && isConnected && (
          <div className="text-xs text-white/70 mt-1 flex items-center gap-2">
            {balanceFormatted && (
              <span>{balanceFormatted} AVAX</span>
            )}
            {!isOnCorrectNetwork && (
              <span className="text-yellow-300">Wrong Network</span>
            )}
          </div>
        )}
        
        {isMounted && error && (
          <div className="text-xs text-red-300 mt-1 max-w-40 truncate">
            {error}
          </div>
        )}
      </div>
    </nav>
  );
};

export default WalletNavigation;
