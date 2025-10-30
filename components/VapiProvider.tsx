import React, { createContext, useContext, useEffect, useState } from 'react';
import Vapi from '@vapi-ai/web';

// Create a context for Vapi
interface VapiContextType {
  vapi: Vapi | null;
  isInitialized: boolean;
}

const VapiContext = createContext<VapiContextType>({
  vapi: null,
  isInitialized: false,
});

// Custom hook to use Vapi
export const useVapi = () => useContext(VapiContext);

interface VapiProviderProps {
  children: React.ReactNode;
}

export const VapiProvider: React.FC<VapiProviderProps> = ({ children }) => {
  const [vapiInstance, setVapiInstance] = useState<Vapi | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);

  useEffect(() => {
    // Initialize Vapi only on the client side
    if (typeof window !== 'undefined') {
      const publicKey = process.env.NEXT_PUBLIC_VAPI_PUBLIC_KEY;
      
      if (!publicKey) {
        console.error('Vapi public key is not defined in environment variables');
        return;
      }

      try {
        const vapi = new Vapi(publicKey);
        setVapiInstance(vapi);
        setIsInitialized(true);
      } catch (error) {
        console.error('Failed to initialize Vapi:', error);
      }
    }

    // Cleanup function
    return () => {
      if (vapiInstance) {
        vapiInstance.stop();
      }
    };
  }, []);

  return (
    <VapiContext.Provider value={{ vapi: vapiInstance, isInitialized }}>
      {children}
    </VapiContext.Provider>
  );
};

export default VapiProvider; 