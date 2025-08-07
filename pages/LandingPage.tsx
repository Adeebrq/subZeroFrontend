"use client";

import { MacbookScroll } from "../components/ui/macbook-scroll";
import Head from "next/head";

// Navigation items
const NAV_ITEMS = [
  { href: "#features", label: "Features" },
  { href: "#onboarding", label: "Onboarding" },
  { href: "#calculator", label: "Calculator" },
  { href: "#pricing", label: "Pricing" },
  { href: "#faqs", label: "FAQs" },
];


// Components
const Navigation = () => (
  <nav className="fixed top-6 left-1/2 transform -translate-x-1/2 z-50 backdrop-blur-md bg-white/10 border border-white/20 shadow-lg px-10 py-3 rounded-full flex items-center gap-6 text-white text-sm font-medium">
    <div className="text-white text-3xl font-bold  mr-6">SubZero</div>
    
    {NAV_ITEMS.map((item) => (
      <a 
        key={item.href}
        href={item.href} 
        className="hover:text-blue-400 transition-colors duration-200"
      >
        {item.label}
      </a>
    ))}
    
    <a
      href="#signup"
      className="bg-white text-blue-600 font-semibold px-6 py-1.5 rounded-full hover:bg-blue-600 hover:text-white transition-colors duration-200 ml-6 whitespace-nowrap"
    >
      Connect MetaMask
    </a>
  </nav>
);


const HeroContent = () => (
  <div className="flex-1">
    <h1 className="text-white text-6xl font-extrabold leading-tight mb-5 animate-fade-in-up">
      Turn your<br />
      Shoppers into<br />
      <span className="bg-white px-4 py-1 rounded-md inline-block">
        <span className="bg-gradient-to-r from-blue-600 to-blue-900 bg-clip-text text-transparent font-extrabold">
          Subscribers
        </span>
      </span>
    </h1>
    
    <p className="text-white text-lg leading-relaxed mb-10 opacity-90 animate-fade-in-up animation-delay-150">
      Watch your MRR grow while you sleep - manage subscriptions, optimize payments, and retain customers in one seamless platform.
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
    <Navigation />
    
    <div className="pt-32 flex items-center px-10 gap-20 max-w-7xl mx-auto">
      <HeroContent />
      <div className="w-auto p-0">
        <div className="flex flex-col gap-3">
          <div className="w-[356px] h-[249px] animate-fade-in-up animation-delay-300">
            <img src="/1.svg" alt="Card 1" className="w-full h-full object-cover" />
          </div>
          <div className="w-[350px] h-[200px] animate-fade-in-up animation-delay-600">
            <img src="/4.svg" alt="Card 4" className="w-full h-full object-cover" />
          </div>
          <div className="w-[380px] h-[169px] animate-fade-in-up animation-delay-900">
            <img src="/3.svg" alt="Card 3" className="w-full h-full object-cover -ml-3" />
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
        <title>Coptics - Turn your Shoppers into Subscribers</title>
        <meta
          name="description"
          content="Subscription management platform for Shopify"
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <HeroSection />
      <MacbookScroll />
    </div>
  );
}
