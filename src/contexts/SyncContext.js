import React, { createContext, useContext, useEffect, useState } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { useDatabase } from './DatabaseContext';
import { useSupabase } from './SupabaseContext';
import GallerySyncHandler from '../services/GallerySyncHandler';

const SyncContext = createContext();

export const useSyncStatus = () => useContext(SyncContext);

export const SyncProvider = ({ children }) => {
  const database = useDatabase();
  const { supabase } = useSupabase();
  const [isConnected, setIsConnected] = useState(true);
  const [syncStatus, setSyncStatus] = useState('idle'); // idle, syncing, error, synced
  const [lastSynced, setLastSynced] = useState(null);
  const [pendingChanges, setPendingChanges] = useState(0);

  useEffect(() => {
    // Monitor network connectivity
    const unsubscribe = NetInfo.addEventListener(state => {
      setIsConnected(state.isConnected);
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (!database || !supabase) return;

    const syncHandler = new GallerySyncHandler(database, supabase);
    
    // Setup sync monitoring
    const checkPendingChanges = async () => {
      const count = await syncHandler.countPendingChanges();
      setPendingChanges(count);
    };

    checkPendingChanges();
    
    // Setup regular checks for pending changes
    const intervalId = setInterval(checkPendingChanges, 60000); // Check every minute
    
    return () => clearInterval(intervalId);
  }, [database, supabase]);

  const synchronize = async () => {
    if (!isConnected || syncStatus === 'syncing' || !database || !supabase) {
      return false;
    }

    try {
      setSyncStatus('syncing');
      
      const syncHandler = new GallerySyncHandler(database, supabase);
      await syncHandler.sync();
      
      setLastSynced(new Date());
      setPendingChanges(0);
      setSyncStatus('synced');
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      setSyncStatus('error');
      return false;
    }
  };

  // Auto-sync when connection is restored
  useEffect(() => {
    if (isConnected && pendingChanges > 0) {
      synchronize();
    }
  }, [isConnected]);

  return (
    <SyncContext.Provider 
      value={{ 
        isConnected, 
        syncStatus, 
        lastSynced, 
        pendingChanges, 
        synchronize 
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};
