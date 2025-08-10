"use client";
import React from "react";
import { StickyScroll } from "./ui/sticky-scroll-reveal";
import Image from "next/image";

const content = [
  {
    title: "Connect Your MetaMask",
    description:
      "Start your trading journey by connecting your MetaMask wallet. Our platform seamlessly integrates with your existing wallet, ensuring secure and fast transactions. No complicated setup required - just connect and you're ready to trade.",
      content: (
        <div className="flex h-full w-full items-center justify-center bg-white text-gray-900 rounded-lg">
        <div className="text-center">
          <Image
            src="/metamask.png"
            alt="MetaMask Logo"
            width={900}
            height={500}
            className="mx-auto mb-4 rounded-lg"
          />
        </div>
      </div>
      
      ),
  },
  {
    title: "Pick AVAX Fuji Testnet",
    description:
      "Select the AVAX Fuji testnet to start trading with test tokens. This safe environment lets you practice trading strategies and explore features without risking real funds. Perfect for both beginners and experienced traders testing new approaches.",
    content: (
        <div className="flex h-full w-full items-center justify-center bg-white text-gray-900 rounded-lg">
        <div className="text-center">
          <Image
            src="/avaxScroll.webp"
            alt="MetaMask Logo"
            width={900}
            height={500}
            className="mx-auto mb-4 rounded-lg"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Trade Any Crypto",
    description:
      "Access a wide range of cryptocurrencies including Bitcoin, Ethereum, AVAX, and many more. Execute trades instantly with real-time pricing, low fees, and advanced trading features. Our platform supports all major crypto assets with live market data.",
    content: (
        <div className="flex h-full w-full items-center justify-center bg-white text-gray-900 rounded-lg">
        <div className="text-center">
          <Image
            src="/ccard.webp"
            alt="MetaMask Logo"
            width={900}
            height={400}
            className="mx-auto mb-4 rounded-lg"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Trade Stocks, Commodities, forex (Coming soon)",
    description:
      "Expand your portfolio beyond crypto with traditional assets. Trade stocks, precious metals like gold and silver, commodities, and forex pairs - all from one unified platform. Coming soon with the same seamless experience you love.",
    content: (
        <div className="flex h-full w-full items-center justify-center bg-white text-gray-900 rounded-lg">
        <div className="text-center">
          <Image
            src="/gold.webp"
            alt="MetaMask Logo"
            width={900}
            height={400}
            className="mx-auto mb-4 rounded-lg"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Copy Trade Top Traders",
    description:
      "Learn from the best by copying successful traders' strategies. Our copy trading feature lets you automatically mirror the trades of top-performing traders, helping you learn while potentially earning. Perfect for beginners and busy professionals.",
    content: (
        <div className="flex h-full w-full items-center justify-center bg-white text-gray-900 rounded-lg">
        <div className="text-center">
          <Image
            src="/copyCard.webp"
            alt="MetaMask Logo"
            width={1900}
            height={1900}
            className="mx-auto mb-4 rounded-lg"
          />
        </div>
      </div>
    ),
  },
  {
    title: "Track Performance & Reach New Echelons",
    description:
      "Monitor your trading progress with comprehensive analytics and performance metrics. Set goals, track your portfolio growth, and unlock achievement levels as you advance. Our gamified system keeps you motivated while building real trading skills.",
      content: (
        <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-purple-500 to-pink-500 text-white rounded-lg">
          <div className="text-center">
            <div className="text-6xl mb-4">📊</div>
            <div className="text-xl font-bold">Performance Tracking</div>
          </div>
        </div>
      ),      
  },
];

export function StickyScrollReveal() {
  return (
    <>
<h1 className="mt-12 text-5xl md:text-6xl lg:text-7xl xl:text-8xl font-bold text-center mb-12 bg-gradient-to-r from-gray-200 via-gray-530 to-gray-900 bg-clip-text text-transparent animate-slide-in">
  How It Works
</h1>



       <div className="w-full py-4 pt-0">
      <StickyScroll content={content} />
    </div>
    </>
  );
}
