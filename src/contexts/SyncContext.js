import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import NetInfo from '@react-native-community/netinfo';
import { Alert } from 'react-native';
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
  const [syncError, setSyncError] = useState(null);
  const [syncHandler, setSyncHandler] = useState(null);
  const [autoSyncEnabled, setAutoSyncEnabled] = useState(true);
  const [backgroundSyncInProgress, setBackgroundSyncInProgress] = useState(false);

  // Initialize sync handler
  useEffect(() => {
    if (!database || !supabase) return;
    
    const handler = new GallerySyncHandler(database, supabase);
    setSyncHandler(handler);
    
    return () => {
      // Cleanup if needed
    };
  }, [database, supabase]);

  // Monitor network connectivity
  useEffect(() => {
    const unsubscribe = NetInfo.addEventListener(state => {
      const wasConnected = isConnected;
      const isNowConnected = state.isConnected && state.isInternetReachable;
      
      setIsConnected(isNowConnected);
      
      // If connection was restored and there are pending changes, trigger sync
      if (!wasConnected && isNowConnected && pendingChanges > 0 && autoSyncEnabled) {
        // Delay sync to ensure connection is stable
        setTimeout(() => {
          synchronize(true);
        }, 2000);
      }
    });

    return () => unsubscribe();
  }, [isConnected, pendingChanges, autoSyncEnabled]);

  // Setup periodic check for pending changes
  useEffect(() => {
    if (!syncHandler) return;
    
    const checkPendingChanges = async () => {
      try {
        const count = await syncHandler.countPendingChanges();
        setPendingChanges(count);
      } catch (error) {
        console.error('Error checking pending changes:', error);
      }
    };

    checkPendingChanges();
    
    // Check every minute
    const intervalId = setInterval(checkPendingChanges, 60000);
    
    return () => clearInterval(intervalId);
  }, [syncHandler]);

  // Periodic background sync (if enabled)
  useEffect(() => {
    if (!autoSyncEnabled || !syncHandler || !isConnected) return;
    
    const backgroundSync = async () => {
      // Only sync if there are pending changes and we're not already syncing
      if (pendingChanges > 0 && !backgroundSyncInProgress) {
        setBackgroundSyncInProgress(true);
        
        try {
          await syncHandler.sync();
          setLastSynced(new Date());
          setSyncStatus('synced');
          setSyncError(null);
          
          // Recount pending changes
          const count = await syncHandler.countPendingChanges();
          setPendingChanges(count);
        } catch (error) {
          console.error('Background sync error:', error);
          setSyncError(error);
          setSyncStatus('error');
        } finally {
          setBackgroundSyncInProgress(false);
        }
      }
    };
    
    // Run background sync every 5 minutes
    const intervalId = setInterval(backgroundSync, 300000);
    
    return () => clearInterval(intervalId);
  }, [syncHandler, pendingChanges, autoSyncEnabled, isConnected, backgroundSyncInProgress]);

  // Manual sync function
  const synchronize = useCallback(async (silent = false) => {
    if (!isConnected) {
      if (!silent) {
        Alert.alert(
          'Немає з\'єднання',
          'Ви знаходитесь в офлайн-режимі. Синхронізація буде виконана автоматично, коли з\'єднання буде відновлено.'
        );
      }
      return false;
    }

    if (syncStatus === 'syncing' || !syncHandler) {
      return false;
    }

    setSyncStatus('syncing');
    setSyncError(null);
    
    try {
      await syncHandler.sync();
      
      setLastSynced(new Date());
      setSyncStatus('synced');
      
      // Recount pending changes
      const count = await syncHandler.countPendingChanges();
      setPendingChanges(count);
      
      return true;
    } catch (error) {
      console.error('Sync error:', error);
      setSyncError(error);
      setSyncStatus('error');
      
      if (!silent) {
        Alert.alert(
          'Помилка синхронізації',
          `Не вдалося синхронізувати дані: ${error.message}`
        );
      }
      
      return false;
    }
  }, [isConnected, syncStatus, syncHandler]);

  // Toggle auto-sync
  const toggleAutoSync = useCallback(() => {
    setAutoSyncEnabled(prev => !prev);
  }, []);

  // Reset sync error
  const resetSyncError = useCallback(() => {
    setSyncError(null);
    setSyncStatus(pendingChanges > 0 ? 'idle' : 'synced');
  }, [pendingChanges]);

  // Format last synced time
  const getFormattedLastSyncTime = useCallback(() => {
    if (!lastSynced) return 'Ніколи';
    
    // Format to local date and time
    return lastSynced.toLocaleString();
  }, [lastSynced]);

  return (
    <SyncContext.Provider 
      value={{ 
        isConnected, 
        syncStatus, 
        lastSynced,
        getFormattedLastSyncTime,
        pendingChanges, 
        synchronize,
        syncError,
        resetSyncError,
        autoSyncEnabled,
        toggleAutoSync
      }}
    >
      {children}
    </SyncContext.Provider>
  );
};
