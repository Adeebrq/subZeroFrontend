"use client";
import dynamic from 'next/dynamic';
import { MacbookScroll } from "../components/ui/macbook-scroll";
import Head from "next/head";
import Image from "next/image";
import { WobbleCardDemo } from "@/components/bentoCards";
import { HackathonFooter } from "@/components/BackgroundGradientAnimation";
import { StickyScrollReveal } from "@/components/StickyScroll";

// ✅ FIXED: Dynamically import wallet-dependent components to avoid SSR issues
const WalletNavigation = dynamic(() => import('./WalletNavigation'), {
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
});

const HeroContent = () => (
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
    <a
      href="#get-started"
      className="bg-white text-indigo-600 px-6 py-3 rounded-full font-medium text-sm flex items-center gap-2 hover:-translate-y-0.5 hover:shadow-xl transition-all shadow-lg w-fit animate-fade-in-up animation-delay-200"
    >
      Get started now
      <span className="text-base">→</span>
    </a>
  </div>
);

const HeroSection = () => (
  <div className="min-h-screen bg-cover bg-center bg-no-repeat relative"
       style={{ backgroundImage: 'url(/bg.svg)' }}>
    <WalletNavigation />
    <div className="pt-32 flex items-center px-10 gap-20 max-w-7xl mx-auto">
      <HeroContent />
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
