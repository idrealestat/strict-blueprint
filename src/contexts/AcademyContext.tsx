import React, { createContext, useContext, useEffect, useState } from 'react';
import { useAuthContext } from '@/context/AuthContext';
import { fetchUserStatus, AcademyUserStatus } from '@/lib/academyApi';

interface AcademyContextType {
  status: AcademyUserStatus | null;
  loading: boolean;
  refresh: () => Promise<void>;
}

const AcademyContext = createContext<AcademyContextType | undefined>(undefined);

export const AcademyProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuthContext();
  const [status, setStatus] = useState<AcademyUserStatus | null>(null);
  const [loading, setLoading] = useState(true);

  const loadStatus = async () => {
    setLoading(true);
    if (user?.id) {
      const data = await fetchUserStatus(user.id);
      setStatus(data);
    } else {
      setStatus(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    loadStatus();
  }, [user]);

  return (
    <AcademyContext.Provider value={{ status, loading, refresh: loadStatus }}>
      {children}
    </AcademyContext.Provider>
  );
};

export const useAcademy = () => {
  const context = useContext(AcademyContext);
  if (!context) throw new Error('useAcademy must be used within AcademyProvider');
  return context;
};
