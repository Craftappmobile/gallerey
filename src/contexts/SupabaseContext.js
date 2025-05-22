import React, { createContext, useContext, useEffect } from 'react';
import { createClient } from '@supabase/supabase-js';
import 'react-native-url-polyfill/auto';
import * as FileSystem from 'expo-file-system';

const SUPABASE_URL = 'https://your-supabase-url.supabase.co';
const SUPABASE_ANON_KEY = 'your-supabase-anon-key';

const SupabaseContext = createContext();

export const useSupabase = () => useContext(SupabaseContext);

export const SupabaseProvider = ({ children }) => {
  const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
    auth: {
      storage: {
        getItem: async (key) => {
          try {
            const path = `${FileSystem.documentDirectory}supabase/${key}`;
            const fileInfo = await FileSystem.getInfoAsync(path);
            if (fileInfo.exists) {
              const content = await FileSystem.readAsStringAsync(path);
              return content;
            }
            return null;
          } catch (error) {
            console.error('Error reading from storage:', error);
            return null;
          }
        },
        setItem: async (key, value) => {
          try {
            const directory = `${FileSystem.documentDirectory}supabase`;
            const dirInfo = await FileSystem.getInfoAsync(directory);
            if (!dirInfo.exists) {
              await FileSystem.makeDirectoryAsync(directory, { intermediates: true });
            }
            await FileSystem.writeAsStringAsync(`${directory}/${key}`, value);
          } catch (error) {
            console.error('Error writing to storage:', error);
          }
        },
        removeItem: async (key) => {
          try {
            const path = `${FileSystem.documentDirectory}supabase/${key}`;
            const fileInfo = await FileSystem.getInfoAsync(path);
            if (fileInfo.exists) {
              await FileSystem.deleteAsync(path);
            }
          } catch (error) {
            console.error('Error removing from storage:', error);
          }
        }
      }
    }
  });

  // Listen for auth state changes
  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      console.log('Supabase auth event:', event);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  return (
    <SupabaseContext.Provider value={{ supabase }}>
      {children}
    </SupabaseContext.Provider>
  );
};
