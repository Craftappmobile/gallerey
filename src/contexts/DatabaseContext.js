import React, { createContext, useContext, useEffect, useState } from 'react';
import { Database } from '@nozbe/watermelondb';
import SQLiteAdapter from '@nozbe/watermelondb/adapters/sqlite';

import schema from '../database/schema';
import migrations from '../database/migrations';
import { Gallery, GalleryCategory, GalleryImage, GalleryNote, GalleryTag } from '../database/models';

const DatabaseContext = createContext();

export const useDatabase = () => useContext(DatabaseContext);

export const DatabaseProvider = ({ children }) => {
  const [database, setDatabase] = useState(null);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    const setupDatabase = async () => {
      try {
        const adapter = new SQLiteAdapter({
          schema,
          migrations,
          jsi: true,
          onSetUpError: error => {
            console.error('Database setup error:', error);
          }
        });

        const db = new Database({
          adapter,
          modelClasses: [
            Gallery,
            GalleryCategory,
            GalleryImage,
            GalleryNote,
            GalleryTag
          ]
        });

        setDatabase(db);
        setIsReady(true);
      } catch (error) {
        console.error('Failed to setup database:', error);
      }
    };

    setupDatabase();

    return () => {
      if (database) {
        database.cleanup();
      }
    };
  }, []);

  if (!isReady) {
    // Return a loading state here if desired
    return null;
  }

  return (
    <DatabaseContext.Provider value={database}>
      {children}
    </DatabaseContext.Provider>
  );
};
