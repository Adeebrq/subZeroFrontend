# Introducing SubZero- The all in one trading app

Subzero is a microtrading dApp powered by the Avalanche blockchain & aims to streamline and provide a all in one trading app for all asset classes like cryptocurrencies, stocks, commodities, forex markets etc all under a single umbrella built for the team1 Avalanche hackathon in Chennai.

![Your Image Description](https://drive.google.com/uc?id=1Dlpv1M3woRqnhRncon9_7qBeWG8kJWSc)


## Table of Contents
- [About](#about)
- [Note](#%EF%B8%8F-note)     
- [Technologies](#technologies)
- [Features](#features)
- [Installation](#installation)
- [Usage](#usage)


## 📺 Video Demo


[![Watch the video](https://img.youtube.com/vi/CedpHdBQb04/hqdefault.jpg)](https://youtu.be/CedpHdBQb04)

Click on the thumbnail above to see the demo!


## About
It doesnt make sense to signup for multiple platforms to invest in different asset classes, leveraging the Avalanche blockchain and chainlink's oracle we streamline the process and provide a single dApp that can trade across different asset classes, while providing industry level charting systems for technical analysis & also a smart copytrading feature which allows you to copy the best traders in the game & make money passively.


## ⚠️ Note

Due to the lack of funds & SubZero operating under the Fuji testnet network, we have only implemented cryptocurrency trading for the time being. Accurate oracles for stock, commodities & other asset classes are only available on the mainnet, hence this has been kept aside for __future releases.__

Subzero only supports login via the __Avalanche Fuji testnet network & with metamask.__

The profitablity will always be 0 as the testnet oracle only updates every 24 hours. (Another testnet limitation)

In order to see a wallet under the copytrade leaderboard section they must have atleast 1 trade executed, this is done to filter out dormant users.

Subzero is not yet mobile-friendly.



## Technologies
| Tools used |
|-----------------|
| Solidity |
| Avalanche Fuji Testnet |
| MetaMask |
| Node.js |
| Express.js |
| TypeScript |
| PostgreSQL |
| Supabase |
| Next.js |
| Tailwind CSS |
| Vercel |


## Features

1) Microtrading

Leveraging the low gas fees Avalanche provides and out synthetic asset buying logic, we can significantly reduce gas fees prices hence allowing users to trade with very small capitals & making all asset classes accessible to everyone by lowering the barrier of entry.

![Image 1](https://drive.google.com/uc?id=1SFTpNbI8CXkrys_dos4v0zzsbH0rnL44)

2) Multiple Asset classes

Implementing chainlink's oracles we are able to feed our smart contracts with real time offchain data which enables us to mirror almost any asset in the world given there is a accurate oracle for it.

![Image Description](https://drive.google.com/uc?id=1wwInuCmerJnU4XKSXsPJIdc2Sdy79SmL)

3) Copytrading

Our smart contract logics allow users to be able to mirror winning traders, so that they can enjoy the same profits with the least effort, while also implementing a dynamic percentage allocation system so anyone can copy trade anyone with custom amounts.

![Image 2](https://drive.google.com/uc?id=1dX8dacymCgwvjs5F1QM7o7vGUKdm23ig)

4) Advanced charting

SubZero charts are powered by TradingView which is the worlds number 1 asset charting software hence allowing users to execute the most complex technical analysis effortlessly.

![Image 3](https://drive.google.com/uc?id=1KQRkMmVN2GIoL6LYcuKWVuM3hC1-g6hN)

5) Truly Decentrailized

Unlike traditional trading platforms that require KYC, verification time, email/mobile authentication, our users can immediately start trading their favorite assets in secounds

![Image 4](https://drive.google.com/uc?id=1Ep2byvVp0HgghQoEEsJo81UAS77NA7dL)


## Installation

### Prerequisites
- **Node.js** (v18.18.0 or later recommended)
- **npm** (comes with Node.js)  
- **Git** (to clone the repository)
- **MetaMask** (Signing transactions)
- **Avalanche Fuji testnet network**

### Steps
1. **Clone the repository**
`https://github.com/Adeebrq/subZeroFrontend.git`

2.  **Install dependencies**
`npm i --f`

3. **Run file**
`npm run dev`


## Usage

1) Open the deployed version or localhost
2) Have your metamask wallet setup with the Avalance Fuji testnet network
3) Click on `connect wallet` & authorize sign in
4) Viola! Enjoy the magic of Subzero at your fingertips 


## Repositories

- **Backend**: [subZeroBackend](https://github.com/Adeebrq/subZeroBackend)
- **Smart Contracts**: [subZeroSolidity](https://github.com/Adeebrq/subZeroSolidity) *(Deployed via Remix)*




Made with ❤️ by Adeeb, team oko
