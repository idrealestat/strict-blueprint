/**
 * QuickCalculator.tsx
 * حاسبة سريعة - أداة حساب مالي
 */

import { useState } from 'react';

const QuickCalculator = () => {
  const [amount, setAmount] = useState(10000);
  const [period, setPeriod] = useState(12);
  const [rate, setRate] = useState(5);
  const [activeTab, setActiveTab] = useState<'profit' | 'loan' | 'convert'>('loan');
  
  const calculateProfit = () => {
    const monthlyRate = rate / 12 / 100;
    const profit = amount * monthlyRate * period;
    return Math.round(profit);
  };
  
  const calculateTotal = () => {
    return amount + calculateProfit();
  };

  return (
    <div className="bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900 rounded-2xl shadow-lg p-6 border border-gray-200 dark:border-gray-700">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-xl font-bold text-gray-800 dark:text-white">الحاسبة السريعة</h3>
        <div className="flex items-center gap-2">
          <button 
            onClick={() => setActiveTab('profit')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${activeTab === 'profit' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            ربح
          </button>
          <button 
            onClick={() => setActiveTab('loan')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${activeTab === 'loan' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            قرض
          </button>
          <button 
            onClick={() => setActiveTab('convert')}
            className={`px-3 py-1 rounded-lg text-sm transition-colors ${activeTab === 'convert' ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' : 'bg-gray-100 dark:bg-gray-700'}`}
          >
            تحويل
          </button>
        </div>
      </div>
      
      {/* إدخالات */}
      <div className="space-y-5 mb-6">
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المبلغ</label>
            <span className="text-sm text-gray-500">${amount.toLocaleString()}</span>
          </div>
          <input
            type="range"
            min="1000"
            max="100000"
            step="1000"
            value={amount}
            onChange={(e) => setAmount(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-blue-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>$1,000</span>
            <span>$50,000</span>
            <span>$100,000</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">المدة (شهر)</label>
            <span className="text-sm text-gray-500">{period} شهر</span>
          </div>
          <input
            type="range"
            min="1"
            max="60"
            step="1"
            value={period}
            onChange={(e) => setPeriod(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-green-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1</span>
            <span>30</span>
            <span>60</span>
          </div>
        </div>
        
        <div>
          <div className="flex justify-between mb-2">
            <label className="text-sm font-medium text-gray-700 dark:text-gray-300">النسبة السنوية %</label>
            <span className="text-sm text-gray-500">{rate}%</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={rate}
            onChange={(e) => setRate(Number(e.target.value))}
            className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-lg appearance-none cursor-pointer [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:h-5 [&::-webkit-slider-thumb]:w-5 [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-purple-600"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>1%</span>
            <span>10%</span>
            <span>20%</span>
          </div>
        </div>
      </div>
      
      {/* النتائج */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 p-4 rounded-xl text-center">
          <div className="text-sm text-blue-600 dark:text-blue-400 mb-1">المبلغ الأصلي</div>
          <div className="text-2xl font-bold text-blue-800 dark:text-blue-300">
            ${amount.toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 p-4 rounded-xl text-center">
          <div className="text-sm text-green-600 dark:text-green-400 mb-1">الربح</div>
          <div className="text-2xl font-bold text-green-800 dark:text-green-300">
            ${calculateProfit().toLocaleString()}
          </div>
        </div>
        <div className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 p-4 rounded-xl text-center">
          <div className="text-sm text-purple-600 dark:text-purple-400 mb-1">الإجمالي</div>
          <div className="text-2xl font-bold text-purple-800 dark:text-purple-300">
            ${calculateTotal().toLocaleString()}
          </div>
        </div>
      </div>
      
      {/* زر الحساب */}
      <button className="w-full bg-gradient-to-r from-blue-600 to-cyan-500 text-white font-medium py-3.5 rounded-xl hover:shadow-lg transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]">
        احسب التفاصيل الكاملة
      </button>
    </div>
  );
};

export default QuickCalculator;
