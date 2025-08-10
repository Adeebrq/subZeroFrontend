import React from "react";
import { BackgroundGradientAnimation } from "./ui/background-gradient-animation";

export function HackathonFooter() {
  return (
    <BackgroundGradientAnimation>
      {/* ✅ Improved: Removed absolute positioning, added proper padding */}
      <div className="relative z-50 px-6 py-12 min-h-full flex flex-col justify-between">
        <div className="max-w-7xl mx-auto w-full">
          
          {/* Top Section - Main Footer Content */}
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-4 gap-8 text-white mb-12">
            
            {/* Project Info - Better positioned with more space */}
            <div className="lg:col-span-2 space-y-4">
              <div>
                <h3 className="logo text-2xl font-bold mb-3 text-white">
                  SubZero
                </h3>
                <p className="text-white/80 text-base leading-relaxed max-w-lg">
                  Built for the hackathon. Empowering traders with automated copy trading solutions on the Avalanche network.
                </p>
              </div>
              <div className="inline-block px-3 py-1 bg-white/10 rounded-full text-xs text-white/70 border border-white/20">
                Team1 2025 Project
              </div>
            </div>

            {/* Empty space for better balance on large screens */}
            <div className="hidden lg:block"></div>

            {/* Connect - Better positioned */}
            <div className="pointer-events-auto">
              <h4 className="text-base font-semibold mb-4 text-white">
                Connect
              </h4>
              <ul className="space-y-3 text-sm text-white/80">
                <li>
                  <a 
                    href="#" 
                    className="hover:text-white transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>→</span> GitHub
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="hover:text-white transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>→</span> Team
                  </a>
                </li>
                <li>
                  <a 
                    href="#" 
                    className="hover:text-white transition-colors duration-200 flex items-center gap-2"
                  >
                    <span>→</span> Support
                  </a>
                </li>
              </ul>
            </div>
          </div>

          {/* Bottom Section - Better positioned and styled */}
          <div className="border-t border-white/30 pt-8">
            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6">
              
              {/* Copyright - Better typography */}
              <div className="text-sm text-white/60 order-2 lg:order-1">
                © 2025 SubZero Platform. Built for Team1 Hackathon.
              </div>

              {/* ✅ TECH STACK IS HERE - Enhanced visibility */}
              <div className="flex flex-wrap items-center gap-3 text-xs order-1 lg:order-2">
                <span className="text-white/90 font-semibold mr-2">Built with:</span>
                <span className="px-3 py-1.5 bg-white/20 rounded-full text-white/90 border border-white/40 hover:bg-white/30 transition-colors font-medium">
                  Avalanche
                </span>
                <span className="px-3 py-1.5 bg-white/20 rounded-full text-white/90 border border-white/40 hover:bg-white/30 transition-colors font-medium">
                  Next.js
                </span>
                <span className="px-3 py-1.5 bg-white/20 rounded-full text-white/90 border border-white/40 hover:bg-white/30 transition-colors font-medium">
                  Tailwind CSS
                </span>
                <span className="px-3 py-1.5 bg-white/20 rounded-full text-white/90 border border-white/40 hover:bg-white/30 transition-colors font-medium">
                  TypeScript
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </BackgroundGradientAnimation>
  );
}
