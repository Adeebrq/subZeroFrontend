// app/(dashboard)/dashboard/page.tsx
"use client";
import { useWallet } from '../../../contexts/walletContext';

export default function Dashboard() {
  const { account, balanceFormatted, isOnCorrectNetwork } = useWallet();

  return (
    <div className="flex flex-1 w-full h-full">
      <div className="p-4 w-full">
        <h1 className="text-2xl font-bold text-neutral-800 dark:text-neutral-200 mb-4">
          Dashboard
        </h1>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full">
          <div className="bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Wallet Information</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Account: {account}</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">Balance: {balanceFormatted} AVAX</p>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Network: {isOnCorrectNetwork ? "✅ Correct" : "❌ Wrong"}
            </p>
          </div>
          <div className="bg-gray-100 dark:bg-neutral-800 p-4 rounded-lg">
            <h3 className="font-semibold mb-2">Quick Actions</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Manage your subscriptions</p>
          </div>
        </div>
      </div>
    </div>
  );
}
