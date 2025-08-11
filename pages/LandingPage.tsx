"use client";
import dynamic from 'next/dynamic';
import { MacbookScroll } from "../components/ui/macbook-scroll";
import Head from "next/head";
import Image from "next/image";
import { WobbleCardDemo } from "@/components/bentoCards";
import { HackathonFooter } from "@/components/BackgroundGradientAnimation";
import { StickyScrollReveal } from "@/components/StickyScroll";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useWallet } from '../contexts/walletContext';

// Navigation Items
const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#workings", label: "Workings" },
];

// ✅ FIXED: WalletNavigation component with proper error boundaries
const WalletNavigation = () => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  // Safe wallet hook usage with error boundary
  let walletData;
  try {
    walletData = useWallet();
  } catch (error) {
    console.warn('Wallet context not available:', error);
    walletData = {
      isConnected: false,
      isConnecting: false,
      account: null,
      balanceFormatted: null,
      error: null,
      connect: async () => {},
      disconnect: () => {},
      isMetaMaskInstalled: false,
      isOnCorrectNetwork: false
    };
  }

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
  } = walletData;

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
      } catch (connectError) {
        console.error('Connection failed:', connectError);
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

// ✅ FIXED: HeroContent component with proper error boundaries
const HeroContent = () => {
  const [isMounted, setIsMounted] = useState(false);
  const router = useRouter();
  
  // Safe wallet hook usage with error boundary
  let walletData;
  try {
    walletData = useWallet();
  } catch (error) {
    console.warn('Wallet context not available:', error);
    walletData = {
      isConnected: false,
      isConnecting: false,
      account: null,
      connect: async () => {},
      disconnect: () => {},
      isMetaMaskInstalled: false,
      isOnCorrectNetwork: false
    };
  }

  const { 
    isConnected, 
    isConnecting, 
    account, 
    connect, 
    disconnect,
    isMetaMaskInstalled,
    isOnCorrectNetwork 
  } = walletData;

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
      } catch (connectError) {
        console.error('Connection failed:', connectError);
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
      <div className="cursor-pointer flex items-center gap-2">
        <span>Connect now</span>
        <Image src="/metaMaskLogo.png" alt="MetaMask" width={20} height={20} />
        <span className="text-base">→</span>
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
    return "bg-white text-indigo-600 hover:bg-indigo-600 hover:text-white";
  };

  return (
    <div className="flex-1">
      <h1 className="text-white text-6xl font-extrabold leading-tight mb-5 animate-fade-in-up">
        Turn your<br />
        Trades into<br />
        <span className="bg-[#ffffff] px-4 py-1 rounded-md inline-block">
          <span className="bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent font-extrabold">
            Fortunes
          </span>
        </span>
      </h1>
      <p className="text-white text-lg leading-relaxed mb-10 opacity-90 animate-fade-in-up animation-delay-150">
        {`Watch your wealth multiply while you sleep, master decentralized microtrading, copy proven strategies, and compound returns on Avalanche's lightning network.`}
      </p>
      {!isMounted ? (
        <button
          disabled
          className="bg-gray-500 text-white font-medium px-6 py-3 rounded-full opacity-50 cursor-not-allowed animate-fade-in-up animation-delay-200 shadow-lg"
        >
          Loading...
        </button>
      ) : (
        <button
          onClick={handleWalletAction}
          disabled={!isMetaMaskInstalled || isConnecting}
          className={`${getButtonStyle()} px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg w-fit animate-fade-in-up animation-delay-200 disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          {getButtonContent()}
        </button>
      )}
    </div>
  );
};

// ✅ COMPLETELY FIXED: Dynamic import with NoSSR and fallback
const DynamicWalletNavigation = dynamic(
  () => Promise.resolve(WalletNavigation),
  {
    ssr: false,
    loading: () => (
      <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/10 border border-white/20 shadow-lg px-10 py-3 rounded-full flex items-center gap-6 text-white text-sm font-medium">
        <div className="logo text-cyan-500 text-3xl font-bold mr-6">SubZero</div>
        <div className="flex items-center gap-6">
          <a href="#features" className="text-cyan-500 hover:text-gray-900 transition-colors">Features</a>
          <a href="#workings" className="text-cyan-500 hover:text-gray-900 transition-colors">Workings</a>
        </div>
        <div className="ml-6">
          <button
            disabled
            className="bg-gray-500 text-white font-semibold px-6 py-1.5 rounded-full opacity-50 cursor-not-allowed whitespace-nowrap"
          >
            Loading...
          </button>
        </div>
      </nav>
    )
  }
);

const DynamicHeroContent = dynamic(
  () => Promise.resolve(HeroContent),
  {
    ssr: false,
    loading: () => (
      <div className="flex-1">
        <h1 className="text-white text-6xl font-extrabold leading-tight mb-5 animate-fade-in-up">
          Turn your<br />
          Trades into<br />
          <span className="bg-[#ffffff] px-4 py-1 rounded-md inline-block">
            <span className="bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent font-extrabold">
              Fortunes
            </span>
          </span>
        </h1>
        <p className="text-white text-lg leading-relaxed mb-10 opacity-90 animate-fade-in-up animation-delay-150">
          {`Watch your wealth multiply while you sleep, master decentralized microtrading, copy proven strategies, and compound returns on Avalanche's lightning network.`}
        </p>
        <button
          disabled
          className="bg-gray-500 text-white font-medium px-6 py-3 rounded-full opacity-50 cursor-not-allowed animate-fade-in-up animation-delay-200 shadow-lg"
        >
          Loading...
        </button>
      </div>
    )
  }
);

const HeroSection = () => (
  <div className="min-h-screen bg-cover bg-center bg-no-repeat relative"
       style={{ backgroundImage: 'url(/bg.svg)' }}>
    <DynamicWalletNavigation />
    <div className="pt-32 flex items-center px-10 gap-20 max-w-7xl mx-auto">
      <DynamicHeroContent />
      <div className="w-auto p-0">
        <div className="flex flex-col gap-3">
          <div className="w-[356px] h-[249px] bg-white rounded-lg animate-fade-in-up animation-delay-300">
            <Image 
              src="/1.svg" 
              alt="Card 1" 
              width={356} 
              height={249} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="w-[350px] h-[200px] animate-fade-in-up animation-delay-600">
            <Image 
              src="/4.svg" 
              alt="Card 4" 
              width={350} 
              height={200} 
              className="w-full h-full object-cover" 
            />
          </div>
          <div className="w-[380px] h-[169px] animate-fade-in-up animation-delay-900">
            <Image 
              src="/3.svg" 
              alt="Card 3" 
              width={380} 
              height={169} 
              className="w-full h-full object-cover -ml-3" 
            />
          </div>
        </div>
      </div>
    </div>
  </div>
);

// Main Component
export default function CopticsLanding() {
  return (
    <div>
      <Head>
        <title>SubZero - Turn your Trades into Fortunes</title>
        <meta
          name="description"
          content="Decentralized trading platform on Avalanche"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <HeroSection />
      <MacbookScroll />
      <div className="min-h-[800px]"></div>
      <div id="features" className="mt-12"><WobbleCardDemo /></div>
      <div id="workings"><StickyScrollReveal/></div>
      <HackathonFooter/>
    </div>
  );
}