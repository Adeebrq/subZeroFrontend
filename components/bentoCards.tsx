"use client";

import React from "react";
import { WobbleCard } from "./ui/wobble-card";

export function WobbleCardDemo() {
  return (
    <div className="mt-10 grid grid-cols-1 lg:grid-cols-3 gap-4 max-w-7xl mx-auto w-full">
      <WobbleCard
        containerClassName="col-span-1 lg:col-span-2 h-full bg-blue-600 min-h-[500px] lg:min-h-[300px]"
        className=""
      >
        <div className="max-w-xs">
          <h2 className="text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
          Watch Trading Magic Happen in Real-Time
          </h2>
          <p className="mt-4 text-left  text-base/6 text-neutral-200">
          Experience the power of automated copy trading as successful strategies are instantly replicated across follower portfolios.
          </p>
        </div>
        <img
          src="/chartPic.jpeg"
          width={500}
          height={500}
          alt="linear demo image"
          className="absolute -right-6 grayscale filter -bottom-10 object-contain rounded-2xl"
        />
      </WobbleCard>
      <WobbleCard containerClassName="col-span-1 min-h-[300px]">
        <h2 className="max-w-80  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
        Fully Decentralized Architecture
        </h2>
        <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
        Trade with complete autonomy through audited smart contracts where you control your keys and funds never leave your wallet until execution.
        </p>
      </WobbleCard>
      <WobbleCard containerClassName="col-span-1 lg:col-span-3 bg-blue-900 min-h-[500px] lg:min-h-[600px] xl:min-h-[300px]">
        <div className="max-w-sm">
          <h2 className="max-w-sm md:max-w-lg  text-left text-balance text-base md:text-xl lg:text-3xl font-semibold tracking-[-0.015em] text-white">
          Powered by the Avalanche Network
          </h2>
          <p className="mt-4 max-w-[26rem] text-left  text-base/6 text-neutral-200">
          Experience lightning-fast trades with sub-second finality and gas fees under $0.01, making frequent copy trading economically viable.
          </p>
        </div>
        <img
          src="/avax.webp"
          width={800}
          height={800}
          alt="linear demo image"
          className="absolute -right-8  -bottom-1 object-contain rounded-2xl"
        />
      </WobbleCard>
    </div>
  );
}
