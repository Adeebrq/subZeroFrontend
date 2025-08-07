// app/(dashboard)/layout.tsx
"use client";
import { DashboardLayoutWrapper } from "@/components/ui/sidebar";
import { useWallet } from "@/contexts/walletContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { isConnected, isConnecting } = useWallet();
  const router = useRouter();

  useEffect(() => {
    // Only redirect if not connecting and not connected
    if (!isConnecting && !isConnected) {
      router.push('/');
    }
  }, [isConnected, isConnecting, router]);

  // Show loading state while checking connection
  if (isConnecting) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Connecting wallet...</p>
        </div>
      </div>
    );
  }

  // If not connected and not connecting, component will redirect via useEffect
  // Show a brief loading state during redirect
  if (!isConnected) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100 dark:bg-neutral-800">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Redirecting...</p>
        </div>
      </div>
    );
  }

  // Only render dashboard if wallet is connected
  return <DashboardLayoutWrapper>{children}</DashboardLayoutWrapper>;
}
