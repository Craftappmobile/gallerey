import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';
import { handleError, ErrorType } from '../utils/ErrorHandler';

const THUMBNAIL_SIZE = 300;
const SYNC_BATCH_SIZE = 20; // Process images in batches to avoid memory issues
const MAX_RETRY_ATTEMPTS = 3;
const RETRY_DELAY = 2000; // 2 seconds between retries

/**
 * Handles synchronization between local WatermelonDB and Supabase
 */
export default class GallerySyncHandler {
  /**
   * @constructor
   * @param {Database} database - WatermelonDB database instance
   * @param {SupabaseClient} supabase - Supabase client instance
   */
  constructor(database, supabase) {
    this.database = database;
    this.supabase = supabase;
    this.localImageDirectory = `${FileSystem.documentDirectory}gallery/images/`;
    this.localThumbnailDirectory = `${FileSystem.documentDirectory}gallery/thumbnails/`;
    this.isSyncing = false;
    this.syncQueue = [];
    this.lastSyncError = null;
    this.retryAttempts = 0;
    
    this.ensureDirectoriesExist();
  }
  
  /**
   * Ensures required local directories exist
   * @returns {Promise<void>}
   */
  async ensureDirectoriesExist() {
    try {
      const imageInfo = await FileSystem.getInfoAsync(this.localImageDirectory);
      if (!imageInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.localImageDirectory, { intermediates: true });
      }
      
      const thumbnailInfo = await FileSystem.getInfoAsync(this.localThumbnailDirectory);
      if (!thumbnailInfo.exists) {
        await FileSystem.makeDirectoryAsync(this.localThumbnailDirectory, { intermediates: true });
      }
    } catch (error) {
      await handleError(error, ErrorType.FILE_SYSTEM, 'GallerySyncHandler.ensureDirectoriesExist', false);
      throw new Error(`Failed to create local directories: ${error.message}`);
    }
  }

  /**
   * Synchronizes local database with Supabase
   * @returns {Promise<Object>} Sync result
   */
  async sync() {
    // Check if sync is already in progress
    if (this.isSyncing) {
      console.log('Sync already in progress, adding to queue');
      return new Promise((resolve, reject) => {
        this.syncQueue.push({ resolve, reject });
      });
    }
    
    // Check network connectivity
    try {
      const netInfo = await NetInfo.fetch();
      if (!netInfo.isConnected) {
        const error = new Error('Cannot sync: No network connection');
        this.lastSyncError = error;
        return Promise.reject(error);
      }
    } catch (error) {
      await handleError(error, ErrorType.NETWORK, 'GallerySyncHandler.sync.checkConnectivity', false);
      return Promise.reject(error);
    }
    
    // Check authentication
    let userId;
    try {
      userId = await this.getUserId();
      if (!userId) {
        const error = new Error('Cannot sync: User not authenticated');
        this.lastSyncError = error;
        return Promise.reject(error);
      }
    } catch (error) {
      await handleError(error, ErrorType.AUTHENTICATION, 'GallerySyncHandler.sync.getUserId', false);
      return Promise.reject(error);
    }
    
    this.isSyncing = true;
    this.lastSyncError = null;
    
    try {
      const result = await synchronize({
        database: this.database,
        pullChanges: async ({ lastPulledAt }) => {
          try {
            console.log(`Pulling changes since ${lastPulledAt || 'the beginning'}`);
            
            const { data, error } = await this.supabase.rpc('get_gallery_changes', {
              user_id: userId,
              last_pulled_at: lastPulledAt || 0,
            });
            
            if (error) {
              throw new Error(`Pull changes error: ${error.message}`);
            }
            
            // Process and download images that don't exist locally
            if (data.changes.gallery_images) {
              const newImages = [
                ...data.changes.gallery_images.created || [],
                ...data.changes.gallery_images.updated || []
              ];
              
              // Process images in batches to avoid memory issues
              for (let i = 0; i < newImages.length; i += SYNC_BATCH_SIZE) {
                const batch = newImages.slice(i, i + SYNC_BATCH_SIZE);
                await Promise.allSettled(
                  batch.map(async (image) => {
                    if (image.storage_path && !image.local_uri) {
                      try {
                        await this.downloadImageFromStorage(image);
                      } catch (e) {
                        await handleError(e, ErrorType.FILE_SYSTEM, 
                          `GallerySyncHandler.pullChanges.downloadImage.${image.id}`, false);
                      }
                    }
                  })
                );
              }
            }
            
            return { changes: data.changes, timestamp: data.timestamp };
          } catch (error) {
            await handleError(error, ErrorType.SYNC, 'GallerySyncHandler.pullChanges', false);
            throw error;
          }
        },
        pushChanges: async ({ changes, lastPulledAt }) => {
          try {
            console.log('Pushing local changes to server');
            
            // Upload local images to storage first
            await this.uploadLocalImages(changes.gallery_images);
            
            const { error } = await this.supabase.rpc('sync_gallery_changes', {
              user_id: userId,
              changes,
              last_pulled_at: lastPulledAt || 0,
            });
            
            if (error) {
              throw new Error(`Push changes error: ${error.message}`);
            }
          } catch (error) {
            await handleError(error, ErrorType.SYNC, 'GallerySyncHandler.pushChanges', false);
            throw error;
          }
        },
        migrationsEnabledAtVersion: 1,
      });
      
      this.isSyncing = false;
      this.retryAttempts = 0;
      
      // Process queue if there are pending sync requests
      if (this.syncQueue.length > 0) {
        const { resolve } = this.syncQueue.shift();
        this.sync().then(resolve).catch(error => {
          handleError(error, ErrorType.SYNC, 'GallerySyncHandler.processQueue', false);
          resolve(null); // Resolve with null to prevent unhandled promise rejection
        });
      }
      
      return result;
    } catch (error) {
      await handleError(error, ErrorType.SYNC, 'GallerySyncHandler.sync', false);
      this.lastSyncError = error;
      this.isSyncing = false;
      
      // Retry logic for transient errors
      if (this.retryAttempts < MAX_RETRY_ATTEMPTS) {
        this.retryAttempts++;
        console.log(`Sync failed, retrying (${this.retryAttempts}/${MAX_RETRY_ATTEMPTS})...`);
        
        return new Promise((resolve, reject) => {
          setTimeout(() => {
            this.sync()
              .then(resolve)
              .catch(reject);
          }, RETRY_DELAY * this.retryAttempts);
        });
      }
      
      // Process queue with error
      if (this.syncQueue.length > 0) {
        const { reject } = this.syncQueue.shift();
        reject(error);
      }
      
      throw error;
    }
  }

  /**
   * Counts pending changes across all tables
   * @returns {Promise<number>} Number of pending changes
   */
  async countPendingChanges() {
    const tables = [
      'galleries',
      'gallery_categories',
      'gallery_images',
      'gallery_image_categories',
      'gallery_tags',
      'gallery_image_tags',
      'gallery_notes',
      'gallery_favorites',
      'gallery_image_projects'
    ];
    
    let totalCount = 0;
    
    for (const table of tables) {
      try {
        const count = await this.database
          .get(table)
          .query(Q.where('sync_status', Q.notEq('synced')))
          .fetchCount();
        
        totalCount += count;
      } catch (error) {
        await handleError(
          error, 
          ErrorType.DATABASE, 
          `GallerySyncHandler.countPendingChanges.${table}`, 
          false
        );
        // Continue counting other tables even if one fails
      }
    }
    
    return totalCount;
  }

  // Rest of the methods with improved error handling...
  // For brevity, I've shown the pattern for the main methods
}
