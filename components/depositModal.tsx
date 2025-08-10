import React, { useState } from 'react';
import { X, Wallet, Plus, AlertCircle, Check } from 'lucide-react';

interface DepositModalProps {
  isOpen: boolean;
  onClose: () => void;
  onDeposit: (amount: number) => Promise<void>;
  userAvaxBalance: number;
  vaultBalance: number;
  isLoading: boolean;
}

const DepositModal: React.FC<DepositModalProps> = ({
  isOpen,
  onClose,
  onDeposit,
  userAvaxBalance,
  vaultBalance,
  isLoading
}) => {
  const [depositAmount, setDepositAmount] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleAmountChange = (value: string) => {
    setDepositAmount(value);
    setError('');
    
    const amount = parseFloat(value);
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
    } else if (amount > userAvaxBalance) {
      setError(`Insufficient balance. You have ${userAvaxBalance.toFixed(4)} AVAX`);
    } else if (amount < 0.01) {
      setError('Minimum deposit is 0.01 AVAX');
    }
  };

  const handleQuickAmount = (percentage: number) => {
    const amount = (userAvaxBalance * percentage / 100);
    setDepositAmount(amount.toFixed(4));
    handleAmountChange(amount.toFixed(4));
  };

  const handleDeposit = async () => {
    const amount = parseFloat(depositAmount);
    
    if (isNaN(amount) || amount <= 0) {
      setError('Please enter a valid amount');
      return;
    }
    
    if (amount > userAvaxBalance) {
      setError('Insufficient balance');
      return;
    }

    try {
      await onDeposit(amount);
      setDepositAmount('');
      setError('');
      onClose();
    } catch (err: unknown) {
      const errorMessage = err instanceof Error ? err.message : 'Deposit failed';
      setError(errorMessage);
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full mx-4 overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#9bbfe2] to-[#f3f5f7] px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center">
                <Wallet className="w-5 h-5 text-white" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-white">Deposit AVAX</h3>
                <p className="text-gray-600 text-sm">Add funds to your copy trading vault</p>
              </div>
            </div>
            <button 
              onClick={onClose}
              className="text-gray-500 hover:text-gray-700 transition-colors"
              disabled={isLoading}
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-6">
          {/* Balance Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Wallet Balance</div>
              <div className="text-lg font-bold text-gray-900">
                {userAvaxBalance.toFixed(4)} AVAX
              </div>
            </div>
            <div className="bg-[#f3f5f7] rounded-lg p-4 text-center">
              <div className="text-sm text-gray-600 mb-1">Vault Balance</div>
              <div className="text-lg font-bold text-[#9bbfe2]">
                {vaultBalance.toFixed(4)} AVAX
              </div>
            </div>
          </div>

          {/* Deposit Amount Input */}
          <div className="space-y-3">
            <label className="block text-sm font-medium text-gray-700">
              Deposit Amount (AVAX)
            </label>
            <div className="relative">
              <input
                type="number"
                value={depositAmount}
                onChange={(e) => handleAmountChange(e.target.value)}
                placeholder="0.00"
                min="0.01"
                step="0.01"
                className={`w-full px-4 py-3 border rounded-lg text-lg font-medium text-center focus:ring-2 focus:ring-[#9bbfe2] focus:border-transparent transition-all ${
                  error ? 'border-red-300 bg-red-50' : 'border-gray-300 bg-white'
                } [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none`}
                disabled={isLoading}
              />
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                <span className="text-gray-400 font-medium">AVAX</span>
              </div>
            </div>

            {/* Quick Amount Buttons */}
            <div className="flex justify-between space-x-2">
              {[25, 50, 75, 100].map((percentage) => (
                <button
                  key={percentage}
                  onClick={() => handleQuickAmount(percentage)}
                  disabled={isLoading || userAvaxBalance === 0}
                  className="flex-1 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  {percentage}%
                </button>
              ))}
            </div>

            {/* Error Message */}
            {error && (
              <div className="flex items-center space-x-2 text-red-600 bg-red-50 p-3 rounded-lg">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span className="text-sm">{error}</span>
              </div>
            )}
          </div>

          {/* Info Box */}
          <div className="bg-[#f3f5f7] border border-[#9bbfe2] rounded-lg p-4">
            <div className="flex items-start space-x-3">
              <div className="w-5 h-5 bg-[#9bbfe2] rounded-full flex items-center justify-center mt-0.5">
                <Check className="w-3 h-3 text-white" />
              </div>
              <div className="flex-1">
                <h4 className="text-sm font-medium text-gray-800 mb-1">How it works</h4>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Funds are deposited to your secure copy trading vault</li>
                  <li>• You can follow traders and allocate percentages of your vault</li>
                  <li>• Withdraw your funds anytime (coming soon)</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onClose}
              disabled={isLoading}
              className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleDeposit}
              disabled={isLoading || !!error || !depositAmount || parseFloat(depositAmount) <= 0}
              className="flex-1 px-4 py-3 bg-gradient-to-r from-[#9bbfe2] to-[#f3f5f7] text-gray-800 rounded-lg hover:from-[#8aafe0] hover:to-[#e8eaec] disabled:opacity-50 disabled:cursor-not-allowed font-medium transition-all flex items-center justify-center space-x-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-gray-600/30 border-t-gray-600 rounded-full animate-spin" />
                  <span>Processing...</span>
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  <span>Deposit {depositAmount || '0'} AVAX</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DepositModal;
