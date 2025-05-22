import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import NetInfo from '@react-native-community/netinfo';

const THUMBNAIL_SIZE = 300;
const SYNC_BATCH_SIZE = 20; // Process images in batches to avoid memory issues

export default class GallerySyncHandler {
  constructor(database, supabase) {
    this.database = database;
    this.supabase = supabase;
    this.localImageDirectory = `${FileSystem.documentDirectory}gallery/images/`;
    this.localThumbnailDirectory = `${FileSystem.documentDirectory}gallery/thumbnails/`;
    this.isSyncing = false;
    this.syncQueue = [];
    this.lastSyncError = null;
    
    this.ensureDirectoriesExist();
  }
  
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
      console.error('Error creating directories:', error);
      throw new Error(`Failed to create local directories: ${error.message}`);
    }
  }

  async sync() {
    // Check if sync is already in progress
    if (this.isSyncing) {
      console.log('Sync already in progress, adding to queue');
      return new Promise((resolve, reject) => {
        this.syncQueue.push({ resolve, reject });
      });
    }
    
    // Check network connectivity
    const netInfo = await NetInfo.fetch();
    if (!netInfo.isConnected) {
      const error = new Error('Cannot sync: No network connection');
      this.lastSyncError = error;
      return Promise.reject(error);
    }
    
    // Check authentication
    const userId = await this.getUserId();
    if (!userId) {
      const error = new Error('Cannot sync: User not authenticated');
      this.lastSyncError = error;
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
                await Promise.all(
                  batch.map(async (image) => {
                    if (image.storage_path && !image.local_uri) {
                      try {
                        await this.downloadImageFromStorage(image);
                      } catch (e) {
                        console.error(`Error downloading image ${image.id}:`, e);
                        // Continue with other images even if one fails
                      }
                    }
                  })
                );
              }
            }
            
            return { changes: data.changes, timestamp: data.timestamp };
          } catch (error) {
            console.error('Error in pullChanges:', error);
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
            console.error('Error in pushChanges:', error);
            throw error;
          }
        },
        migrationsEnabledAtVersion: 1,
      });
      
      this.isSyncing = false;
      
      // Process queue if there are pending sync requests
      if (this.syncQueue.length > 0) {
        const { resolve } = this.syncQueue.shift();
        this.sync().then(resolve).catch(reject);
      }
      
      return result;
    } catch (error) {
      console.error('Sync error:', error);
      this.lastSyncError = error;
      this.isSyncing = false;
      
      // Process queue with error
      if (this.syncQueue.length > 0) {
        const { reject } = this.syncQueue.shift();
        reject(error);
      }
      
      throw error;
    }
  }

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
        console.error(`Error counting pending changes for ${table}:`, error);
        // Continue counting other tables even if one fails
      }
    }
    
    return totalCount;
  }

  async uploadLocalImages(images) {
    if (!images) return;
    
    const toUpload = [
      ...(images.created || []),
      ...(images.updated || [])
    ].filter(image => 
      image.local_uri && 
      (!image.storage_path || image.sync_status !== 'synced')
    );
    
    // Process images in batches to avoid memory issues
    for (let i = 0; i < toUpload.length; i += SYNC_BATCH_SIZE) {
      const batch = toUpload.slice(i, i + SYNC_BATCH_SIZE);
      await Promise.all(
        batch.map(async (image) => {
          try {
            await this.uploadImageToStorage(image);
          } catch (e) {
            console.error(`Error uploading image ${image.id}:`, e);
            // Continue with other images even if one fails
          }
        })
      );
    }
  }

  async uploadImageToStorage(image) {
    try {
      const userId = await this.getUserId();
      if (!userId) throw new Error('User not authenticated');
      
      const localUri = image.local_uri;
      if (!localUri) throw new Error('No local URI found for image');
      
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) throw new Error('Local file does not exist');
      
      const fileExtension = localUri.split('.').pop() || 'jpg';
      const fileName = `${image.id}.${fileExtension}`;
      const storagePath = `user_${userId}/gallery/images/${fileName}`;
      
      // Upload original image
      const fileContent = await FileSystem.readAsStringAsync(localUri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      const { error: uploadError } = await this.supabase.storage
        .from('gallery')
        .upload(storagePath, this.decodeBase64(fileContent), {
          contentType: `image/${fileExtension}`,
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Generate and upload thumbnail (optimized to be much smaller)
      const thumbnailFileName = `${image.id}_thumb.${fileExtension}`;
      const thumbnailPath = `user_${userId}/gallery/thumbnails/${thumbnailFileName}`;
      
      // Create thumbnail locally first
      const thumbnailResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: THUMBNAIL_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
      );
      
      const thumbnailContent = await FileSystem.readAsStringAsync(thumbnailResult.uri, { 
        encoding: FileSystem.EncodingType.Base64 
      });
      
      // Upload the optimized thumbnail
      const { error: thumbnailError } = await this.supabase.storage
        .from('gallery')
        .upload(thumbnailPath, this.decodeBase64(thumbnailContent), {
          contentType: `image/${fileExtension}`,
          upsert: true
        });
      
      if (thumbnailError) throw thumbnailError;
      
      // Create local thumbnail file if it doesn't exist
      const localThumbPath = `${this.localThumbnailDirectory}${image.id}_thumb.${fileExtension}`;
      const thumbInfo = await FileSystem.getInfoAsync(localThumbPath);
      
      if (!thumbInfo.exists) {
        await FileSystem.copyAsync({
          from: thumbnailResult.uri,
          to: localThumbPath
        });
      }
      
      // Update the database record
      await this.database.write(async () => {
        const imageRecord = await this.database.get('gallery_images').find(image.id);
        await imageRecord.update(record => {
          record.storagePath = storagePath;
          record.thumbnailPath = thumbnailPath;
          record.syncStatus = 'synced';
        });
      });
      
      return { storagePath, thumbnailPath };
    } catch (error) {
      console.error('Error uploading image to storage:', error);
      throw error;
    }
  }

  async downloadImageFromStorage(image) {
    try {
      const storagePath = image.storage_path;
      if (!storagePath) throw new Error('No storage path provided');
      
      const fileName = storagePath.split('/').pop();
      const localPath = `${this.localImageDirectory}${fileName}`;
      
      // Check if file already exists
      const fileInfo = await FileSystem.getInfoAsync(localPath);
      if (fileInfo.exists) return localPath;
      
      // Get public URL for the file
      const { data } = this.supabase.storage
        .from('gallery')
        .getPublicUrl(storagePath);
      
      if (!data || !data.publicUrl) {
        throw new Error('Failed to get public URL for image');
      }
      
      const publicUrl = data.publicUrl;
      
      // Download file with progress tracking and timeout
      const downloadResumable = FileSystem.createDownloadResumable(
        publicUrl,
        localPath,
        {},
        (downloadProgress) => {
          const progress = downloadProgress.totalBytesWritten / downloadProgress.totalBytesExpectedToWrite;
          // Here you could update a progress indicator if needed
        }
      );
      
      const downloadResult = await downloadResumable.downloadAsync();
      
      if (!downloadResult || downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult ? downloadResult.status : 'unknown error'}`);
      }
      
      // Also download thumbnail if available
      const thumbnailPath = storagePath.replace('images', 'thumbnails').replace('.jpg', '_thumb.jpg');
      const localThumbPath = `${this.localThumbnailDirectory}${fileName.replace('.jpg', '_thumb.jpg')}`;
      
      try {
        const { data: thumbData } = this.supabase.storage
          .from('gallery')
          .getPublicUrl(thumbnailPath);
        
        if (thumbData && thumbData.publicUrl) {
          await FileSystem.downloadAsync(thumbData.publicUrl, localThumbPath);
        }
      } catch (thumbError) {
        console.warn('Error downloading thumbnail, will generate locally:', thumbError);
        
        // If thumbnail download fails, generate it locally
        const thumbnailResult = await ImageManipulator.manipulateAsync(
          localPath,
          [{ resize: { width: THUMBNAIL_SIZE } }],
          { format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
        );
        
        await FileSystem.copyAsync({
          from: thumbnailResult.uri,
          to: localThumbPath
        });
      }
      
      // Update the database record
      await this.database.write(async () => {
        const imageRecord = await this.database.get('gallery_images').find(image.id);
        await imageRecord.update(record => {
          record.localUri = localPath;
        });
      });
      
      return localPath;
    } catch (error) {
      console.error('Error downloading image from storage:', error);
      throw error;
    }
  }

  async getUserId() {
    try {
      const { data, error } = await this.supabase.auth.getUser();
      if (error) throw error;
      return data.user?.id;
    } catch (error) {
      console.error('Error getting user ID:', error);
      return null;
    }
  }

  // Utility method to decode base64 string to blob
  decodeBase64(base64String) {
    if (Platform.OS === 'web') {
      const byteCharacters = atob(base64String);
      const byteArrays = [];
      
      for (let offset = 0; offset < byteCharacters.length; offset += 1024) {
        const slice = byteCharacters.slice(offset, offset + 1024);
        
        const byteNumbers = new Array(slice.length);
        for (let i = 0; i < slice.length; i++) {
          byteNumbers[i] = slice.charCodeAt(i);
        }
        
        const byteArray = new Uint8Array(byteNumbers);
        byteArrays.push(byteArray);
      }
      
      return new Blob(byteArrays, { type: 'image/jpeg' });
    } else {
      // For React Native, just return the base64 string
      return base64String;
    }
  }

  // Get the last sync error
  getLastSyncError() {
    return this.lastSyncError;
  }

  // Check if sync is in progress
  isSyncInProgress() {
    return this.isSyncing;
  }
}
