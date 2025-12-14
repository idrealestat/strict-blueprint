/**
 * DashboardContext.tsx
 * السياق المركزي للوعي
 * حرفياً من الملف TECHNICAL-ARCHITECTURE-COMPLETE
 */

import React, { createContext, useContext, useState, ReactNode } from 'react';

// واجهة السياق
export interface DashboardContextType {
  // الصفحة النشطة
  activePage: string | null;
  setActivePage: (page: string | null) => void;

  // العميل النشط
  activeCustomer: any | null;
  setActiveCustomer: (customer: any | null) => void;

  // العرض النشط
  activeOffer: any | null;
  setActiveOffer: (offer: any | null) => void;

  // الطلب النشط
  activeRequest: any | null;
  setActiveRequest: (request: any | null) => void;

  // التبويب النشط
  activeTab: string | null;
  setActiveTab: (tab: string | null) => void;

  // المستخدم الحالي
  currentUser: any | null;
  setCurrentUser: (user: any | null) => void;

  // حالة القائمة اليسرى
  leftSidebarOpen: boolean;
  setLeftSidebarOpen: (open: boolean) => void;

  // حالة القائمة اليمنى
  rightSidebarOpen: boolean;
  setRightSidebarOpen: (open: boolean) => void;
}

// إنشاء السياق
const DashboardContext = createContext<DashboardContextType | undefined>(undefined);

// مزود السياق
interface DashboardProviderProps {
  children: ReactNode;
}

export function DashboardProvider({ children }: DashboardProviderProps) {
  const [activePage, setActivePage] = useState<string | null>('dashboard');
  const [activeCustomer, setActiveCustomer] = useState<any | null>(null);
  const [activeOffer, setActiveOffer] = useState<any | null>(null);
  const [activeRequest, setActiveRequest] = useState<any | null>(null);
  const [activeTab, setActiveTab] = useState<string | null>(null);
  const [currentUser, setCurrentUser] = useState<any | null>(null);
  const [leftSidebarOpen, setLeftSidebarOpen] = useState(false);
  const [rightSidebarOpen, setRightSidebarOpen] = useState(false);

  const value: DashboardContextType = {
    activePage,
    setActivePage,
    activeCustomer,
    setActiveCustomer,
    activeOffer,
    setActiveOffer,
    activeRequest,
    setActiveRequest,
    activeTab,
    setActiveTab,
    currentUser,
    setCurrentUser,
    leftSidebarOpen,
    setLeftSidebarOpen,
    rightSidebarOpen,
    setRightSidebarOpen,
  };

  return (
    <DashboardContext.Provider value={value}>
      {children}
    </DashboardContext.Provider>
  );
}

// Hook للاستخدام
export function useDashboardContext(): DashboardContextType {
  const context = useContext(DashboardContext);
  if (context === undefined) {
    throw new Error('useDashboardContext must be used within a DashboardProvider');
  }
  return context;
}

export default DashboardContext;
