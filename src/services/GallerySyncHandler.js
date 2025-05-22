import { synchronize } from '@nozbe/watermelondb/sync';
import { Q } from '@nozbe/watermelondb';
import * as FileSystem from 'expo-file-system';

export default class GallerySyncHandler {
  constructor(database, supabase) {
    this.database = database;
    this.supabase = supabase;
    this.localImageDirectory = `${FileSystem.documentDirectory}gallery/images/`;
    this.localThumbnailDirectory = `${FileSystem.documentDirectory}gallery/thumbnails/`;
    
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
    }
  }

  async sync() {
    const userId = (await this.supabase.auth.getUser()).data.user?.id;
    if (!userId) {
      throw new Error('User not authenticated');
    }

    return synchronize({
      database: this.database,
      pullChanges: async ({ lastPulledAt }) => {
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
          
          for (const image of newImages) {
            if (image.storage_path && !image.local_uri) {
              try {
                await this.downloadImageFromStorage(image);
              } catch (e) {
                console.error('Error downloading image:', e);
              }
            }
          }
        }
        
        return { changes: data.changes, timestamp: data.timestamp };
      },
      pushChanges: async ({ changes, lastPulledAt }) => {
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
      },
    });
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
      const count = await this.database
        .get(table)
        .query(Q.where('sync_status', Q.notEq('synced')))
        .fetchCount();
      
      totalCount += count;
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
    
    for (const image of toUpload) {
      try {
        await this.uploadImageToStorage(image);
      } catch (e) {
        console.error('Error uploading image:', e);
      }
    }
  }

  async uploadImageToStorage(image) {
    try {
      const userId = (await this.supabase.auth.getUser()).data.user?.id;
      if (!userId) throw new Error('User not authenticated');
      
      const localUri = image.local_uri;
      if (!localUri) throw new Error('No local URI found for image');
      
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      if (!fileInfo.exists) throw new Error('Local file does not exist');
      
      const fileExtension = localUri.split('.').pop() || 'jpg';
      const fileName = `${image.id}.${fileExtension}`;
      const storagePath = `user_${userId}/gallery/images/${fileName}`;
      
      // Upload original image
      const fileBase64 = await FileSystem.readAsStringAsync(localUri, { encoding: FileSystem.EncodingType.Base64 });
      
      const { error: uploadError } = await this.supabase.storage
        .from('gallery')
        .upload(storagePath, fileBase64, {
          contentType: `image/${fileExtension}`,
          upsert: true
        });
      
      if (uploadError) throw uploadError;
      
      // Generate and upload thumbnail
      const thumbnailFileName = `${image.id}_thumb.${fileExtension}`;
      const thumbnailPath = `user_${userId}/gallery/thumbnails/${thumbnailFileName}`;
      
      // Here you would typically resize the image for thumbnail
      // For simplicity, we're using the same image
      const { error: thumbnailError } = await this.supabase.storage
        .from('gallery')
        .upload(thumbnailPath, fileBase64, {
          contentType: `image/${fileExtension}`,
          upsert: true
        });
      
      if (thumbnailError) throw thumbnailError;
      
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
      
      const publicUrl = data.publicUrl;
      
      // Download file
      const downloadResult = await FileSystem.downloadAsync(
        publicUrl,
        localPath
      );
      
      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
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
}
