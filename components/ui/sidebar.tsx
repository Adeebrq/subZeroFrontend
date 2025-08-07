// components/ui/sidebar.tsx
"use client";
import { cn } from "@/lib/utils";
import React, { useState, createContext, useContext } from "react";
import { AnimatePresence, motion } from "motion/react";
import { IconMenu2, IconX } from "@tabler/icons-react";
import Link from "next/link";
import {
  IconArrowLeft,
  IconSettings,
  IconUserBolt,
  IconDashboard,
  IconHistory,        // For transaction history
  IconCoins,   
} from "@tabler/icons-react";
import { useWallet } from '../../contexts/walletContext';
import { useRouter } from "next/navigation";
import toast from 'react-hot-toast'; 

interface Links {
  label: string;
  href: string;
  icon: React.JSX.Element | React.ReactNode;
}

interface SidebarContextProps {
  open: boolean;
  setOpen: React.Dispatch<React.SetStateAction<boolean>>;
  animate: boolean;
}

const SidebarContext = createContext<SidebarContextProps | undefined>(
  undefined
);

export const useSidebar = () => {
  const context = useContext(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider");
  }
  return context;
};

export const SidebarProvider = ({
  children,
  open: openProp,
  setOpen: setOpenProp,
  animate = true,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  const [openState, setOpenState] = useState(false);

  const open = openProp !== undefined ? openProp : openState;
  const setOpen = setOpenProp !== undefined ? setOpenProp : setOpenState;

  return (
    <SidebarContext.Provider value={{ open, setOpen, animate: animate }}>
      {children}
    </SidebarContext.Provider>
  );
};

export const Sidebar = ({
  children,
  open,
  setOpen,
  animate,
}: {
  children: React.ReactNode;
  open?: boolean;
  setOpen?: React.Dispatch<React.SetStateAction<boolean>>;
  animate?: boolean;
}) => {
  return (
    <SidebarProvider open={open} setOpen={setOpen} animate={animate}>
      {children}
    </SidebarProvider>
  );
};

export const SidebarBody = (props: React.ComponentProps<typeof motion.div>) => {
  return (
    <>
      <DesktopSidebar {...props} />
      <MobileSidebar {...(props as React.ComponentProps<"div">)} />
    </>
  );
};

export const DesktopSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<typeof motion.div>) => {
  const { open, setOpen, animate } = useSidebar();
  return (
    <>
      <motion.div
        className={cn(
          "h-full px-4 py-4 hidden  md:flex md:flex-col bg-neutral-100 dark:bg-neutral-800 w-[300px] shrink-0",
          className
        )}
        animate={{
          width: animate ? (open ? "300px" : "60px") : "300px",
        }}
        onMouseEnter={() => setOpen(true)}
        onMouseLeave={() => setOpen(false)}
        {...props}
      >
        {children}
      </motion.div>
    </>
  );
};

export const MobileSidebar = ({
  className,
  children,
  ...props
}: React.ComponentProps<"div">) => {
  const { open, setOpen } = useSidebar();
  return (
    <>
      <div
        className={cn(
          "h-10 px-4 py-4 flex flex-row md:hidden  items-center justify-between bg-neutral-100 dark:bg-neutral-800 w-full"
        )}
        {...props}
      >
        <div className="flex justify-end z-20 w-full">
          <IconMenu2
            className="text-neutral-800 dark:text-neutral-200"
            onClick={() => setOpen(!open)}
          />
        </div>
        <AnimatePresence>
          {open && (
            <motion.div
              initial={{ x: "-100%", opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: "-100%", opacity: 0 }}
              transition={{
                duration: 0.3,
                ease: "easeInOut",
              }}
              className={cn(
                "fixed h-full w-full inset-0 bg-white dark:bg-neutral-900 p-10 z-[100] flex flex-col justify-between",
                className
              )}
            >
              <div
                className="absolute right-10 top-10 z-50 text-neutral-800 dark:text-neutral-200"
                onClick={() => setOpen(!open)}
              >
                <IconX />
              </div>
              {children}
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </>
  );
};

export const SidebarLink = ({
  link,
  className,
  ...props
}: {
  link: Links;
  className?: string;
}) => {
  const { open, animate } = useSidebar();
  return (
    <Link
      href={link.href}
      className={cn(
        "flex items-center justify-start gap-2  group/sidebar py-2",
        className
      )}
      {...props}
    >
      {link.icon}

      <motion.span
        animate={{
          display: animate ? (open ? "inline-block" : "none") : "inline-block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="text-neutral-700 dark:text-neutral-200 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
      >
        {link.label}
      </motion.span>
    </Link>
  );
};

// Logo component with motion integrated
const Logo = () => {
  return (
    <Link
      href="/dashboard"
      className="font-normal flex space-x-2 items-center text-sm text-black py-1 relative z-20"
    >
      <div className="h-5 w-6 bg-black dark:bg-white rounded-br-lg rounded-tr-sm rounded-tl-lg rounded-bl-sm flex-shrink-0" />
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="logo text-2xl  text-black dark:text-white whitespace-pre"
      >
        SubZero
      </motion.span>
    </Link>
  );
};

// Wallet Info Component
const WalletInfo = () => {
  const { account, balanceFormatted, isConnected } = useWallet();
  const { open, animate } = useSidebar();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (account) {
      try {
        await navigator.clipboard.writeText(account);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);

        toast.success("Wallet Address Copied Successfully!")
      } catch (err) {
        console.error('Failed to copy: ', err);
        toast.error("An error has occured")
      }
    }
  };

  if (!isConnected || !account) {
    return (
      <div className="flex items-center justify-start gap-2 py-2">
        <div className="h-7 w-7 rounded-full bg-gray-400 flex items-center justify-center">
          <IconUserBolt className="h-4 w-4 text-white" />
        </div>
        <motion.div
          animate={{
            display: animate ? (open ? "block" : "none") : "block",
            opacity: animate ? (open ? 1 : 0) : 1,
          }}
          className="flex flex-col"
        >
          <span className="text-xs text-neutral-600 dark:text-neutral-400">
            Not Connected
          </span>
        </motion.div>
      </div>
    );
  }

  const displayAddress = `${account.slice(0, 6)}...${account.slice(-4)}`;

  return (
    <div className="flex items-start justify-start gap-2 py-2">
      <div className="h-7 w-7 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center flex-shrink-0 mt-0.5">
        <span className="text-white text-xs font-bold">
          {account.slice(2, 4).toUpperCase()}
        </span>
      </div>
      <motion.div
        animate={{
          display: animate ? (open ? "block" : "none") : "block",
          opacity: animate ? (open ? 1 : 0) : 1,
        }}
        className="flex flex-col flex-1 min-w-0"
      >
        {/* Wallet Address with Copy Button */}
        <div className="flex items-center gap-1 mb-1">
          <span className="text-xs font-bold text-neutral-700 dark:text-neutral-200 truncate">
            {displayAddress}
          </span>
          <button
            onClick={handleCopy}
            className="p-0.5 rounded hover:bg-neutral-200 dark:hover:bg-neutral-600 transition-colors flex-shrink-0"
            title="Copy address"
          >
            {copied ? (
              <svg className="h-3 w-3 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            ) : (
              <svg className="h-3 w-3 text-neutral-500 hover:text-neutral-700 dark:hover:text-neutral-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
            )}
          </button>
        </div>
        
        {/* Balance Display */}
        <span className="text-xs text-neutral-600 dark:text-neutral-400">
          Balance - {balanceFormatted ? `${balanceFormatted} AVAX` : "Loading..."}
        </span>
      </motion.div>
    </div>
  );
};

// Logout Button Component - Updated to match SidebarLink styling
const LogoutButton = () => {
  const { disconnect } = useWallet();
  const router = useRouter();
  const { open, animate } = useSidebar();

  const handleLogout = () => {
    disconnect(); // Disconnect wallet
    toast.success('Wallet disconnected successfully!');
    router.push('/'); // Navigate to landing page
  };

  return (
    <button
  onClick={handleLogout}
  className={cn(
    "cursor-pointer flex items-center justify-start gap-2 group/sidebar py-2 w-full text-left hover:text-red-500"
  )}
>
  <IconArrowLeft className="text-neutral-700 dark:text-neutral-200 group-hover/sidebar:text-red-500 h-5 w-5 flex-shrink-0" />
  <motion.span
    animate={{
      display: animate ? (open ? "inline-block" : "none") : "inline-block",
      opacity: animate ? (open ? 1 : 0) : 1,
    }}
    className="cursor-pointer text-neutral-700 dark:text-neutral-200 group-hover/sidebar:text-red-500 text-sm group-hover/sidebar:translate-x-1 transition duration-150 whitespace-pre inline-block !p-0 !m-0"
  >
    Logout
  </motion.span>
</button>
  
  );
};

// Complete Dashboard Layout Component
export const DashboardLayoutWrapper = ({
  children,
}: {
  children: React.ReactNode;
}) => {
  const links = [
    {
      label: "Dashboard",
      href: "/dashboard",
      icon: (
        <IconDashboard className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Assets",
      href: "/assets", 
      icon: (
        <IconCoins className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
    {
      label: "Transaction History",
      href: "/txnhistory",
      icon: (
        <IconHistory className="text-neutral-700 dark:text-neutral-200 h-5 w-5 flex-shrink-0" />
      ),
    },
  ];

  return (
    <div className={cn(
      "rounded-md flex flex-col md:flex-row bg-gray-100 dark:bg-neutral-800 w-full flex-1 max-w-full mx-auto border border-neutral-200 dark:border-neutral-700 overflow-hidden",
      "h-screen"
    )}>
      <Sidebar>
        <SidebarBody className="justify-between gap-10">
          <div className="flex flex-col flex-1 overflow-y-auto overflow-x-hidden">
            <Logo />
            <div className="mt-8 flex flex-col gap-2">
              {links.map((link, idx) => (
                <SidebarLink key={idx} link={link} />
              ))}
              <LogoutButton />
            </div>
          </div>
          {/* Wallet Info at bottom instead of static user */}
          <div className="border-t border-neutral-300 dark:border-neutral-700 pt-4">
            <WalletInfo />
          </div>
        </SidebarBody>
      </Sidebar>
      <div className="flex flex-1">
        <div className="p-2 md:p-10 rounded-tl-2xl border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-neutral-900 flex flex-col gap-2 flex-1 w-full h-full">
          {children}
        </div>
      </div>
    </div>
  );
};
