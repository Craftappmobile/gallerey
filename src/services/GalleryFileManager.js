import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';
import { Q } from '@nozbe/watermelondb';

const THUMBNAIL_SIZE = 300;
const MAX_IMAGE_SIZE = 1200; // Maximum width/height for stored images to save space

export default class GalleryFileManager {
  constructor(database) {
    this.database = database;
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
      throw new Error(`Failed to create local directories: ${error.message}`);
    }
  }

  async pickImageFromLibrary(options = {}) {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        throw new Error('Permission to access media library was denied');
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        quality: options.quality || 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection || false,
        exif: true
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }
      
      // Process single or multiple images
      if (options.allowsMultipleSelection && result.assets.length > 1) {
        const processedImages = [];
        for (const asset of result.assets) {
          const processedImage = await this.processPickedImage(asset.uri, 'library', options);
          processedImages.push(processedImage);
        }
        return processedImages;
      } else {
        const asset = result.assets[0];
        return await this.processPickedImage(asset.uri, 'library', options);
      }
    } catch (error) {
      console.error('Error picking image from library:', error);
      throw error;
    }
  }

  async takePhoto(options = {}) {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        throw new Error('Permission to access camera was denied');
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        quality: options.quality || 0.8,
        exif: true
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }
      
      const asset = result.assets[0];
      return await this.processPickedImage(asset.uri, 'camera', options);
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  async processPickedImage(uri, sourceType, options = {}) {
    try {
      const id = options.id || uuidv4();
      const extension = uri.split('.').pop() || 'jpg';
      
      // Resize and optimize the image to save storage space
      const optimizedResult = await ImageManipulator.manipulateAsync(
        uri,
        [{ resize: { width: MAX_IMAGE_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );
      
      const fileName = `${id}.${extension}`;
      const localUri = `${this.localImageDirectory}${fileName}`;
      
      // Copy the optimized image to our app's directory
      await FileSystem.copyAsync({
        from: optimizedResult.uri,
        to: localUri
      });
      
      // Create thumbnail
      const thumbnailFileName = `${id}_thumb.${extension}`;
      const thumbnailUri = `${this.localThumbnailDirectory}${thumbnailFileName}`;
      
      const thumbnailResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: THUMBNAIL_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
      );
      
      await FileSystem.copyAsync({
        from: thumbnailResult.uri,
        to: thumbnailUri
      });
      
      // Get image dimensions and other metadata
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      
      // Extract EXIF data if available
      let exifData = {};
      if (options.exif) {
        exifData = options.exif;
      }
      
      // Create a record in the database
      let imageRecord;
      await this.database.write(async () => {
        imageRecord = await this.database.get('gallery_images').create(image => {
          image.localUri = localUri;
          image.name = options.name || `Image ${new Date().toLocaleDateString()}`;
          image.description = options.description || '';
          image.sourceType = sourceType;
          image.sourceUrl = options.sourceUrl || null;
          image.sourceAuthor = options.sourceAuthor || null;
          image.isPublic = options.isPublic || false;
          image.viewCount = 0;
          image.userId = options.userId || 'current-user-id'; // This would come from auth context
          image.syncStatus = 'created';
          
          // Create JSON metadata
          const metadata = {
            width: thumbnailResult.width,
            height: thumbnailResult.height,
            size: fileInfo.size,
            createdAt: new Date().toISOString(),
            exif: exifData
          };
          
          image.metadata = JSON.stringify(metadata);
        });
        
        // Add to categories if specified
        if (options.categories && options.categories.length > 0) {
          for (const categoryId of options.categories) {
            await this.database.get('gallery_image_categories').create(relation => {
              relation.imageId = imageRecord.id;
              relation.categoryId = categoryId;
              relation.syncStatus = 'created';
            });
          }
        }
        
        // Add tags if specified
        if (options.tags && options.tags.length > 0) {
          for (const tagName of options.tags) {
            // Find or create tag
            let tag = await this.database.get('gallery_tags')
              .query(Q.where('name', tagName))
              .fetch()
              .then(tags => tags[0]);
            
            if (!tag) {
              tag = await this.database.get('gallery_tags').create(t => {
                t.name = tagName;
                t.syncStatus = 'created';
              });
            }
            
            // Create relation
            await this.database.get('gallery_image_tags').create(relation => {
              relation.imageId = imageRecord.id;
              relation.tagId = tag.id;
              relation.syncStatus = 'created';
            });
          }
        }
      });
      
      return imageRecord;
    } catch (error) {
      console.error('Error processing picked image:', error);
      throw error;
    }
  }

  async importImageFromUrl(url, sourceType, sourceAuthor = null, sourceName = null, options = {}) {
    try {
      const id = options.id || uuidv4();
      const fileName = `${id}.jpg`;
      const localUri = `${this.localImageDirectory}${fileName}`;
      
      // Download the image
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }
      
      // Optimize the downloaded image
      const optimizedResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: MAX_IMAGE_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.8 }
      );
      
      // Replace the downloaded file with the optimized version
      await FileSystem.deleteAsync(localUri);
      await FileSystem.copyAsync({
        from: optimizedResult.uri,
        to: localUri
      });
      
      // Create thumbnail
      const thumbnailFileName = `${id}_thumb.jpg`;
      const thumbnailUri = `${this.localThumbnailDirectory}${thumbnailFileName}`;
      
      const thumbnailResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: THUMBNAIL_SIZE } }],
        { format: ImageManipulator.SaveFormat.JPEG, compress: 0.7 }
      );
      
      await FileSystem.copyAsync({
        from: thumbnailResult.uri,
        to: thumbnailUri
      });
      
      // Get image dimensions and other metadata
      const fileInfo = await FileSystem.getInfoAsync(localUri);
      
      // Create a record in the database
      let imageRecord;
      await this.database.write(async () => {
        imageRecord = await this.database.get('gallery_images').create(image => {
          image.localUri = localUri;
          image.name = sourceName || `Image from ${sourceType}`;
          image.description = options.description || '';
          image.sourceType = sourceType;
          image.sourceUrl = url;
          image.sourceAuthor = sourceAuthor;
          image.isPublic = options.isPublic || false;
          image.viewCount = 0;
          image.userId = options.userId || 'current-user-id'; // This would come from auth context
          image.syncStatus = 'created';
          
          // Create JSON metadata
          const metadata = {
            width: optimizedResult.width,
            height: optimizedResult.height,
            size: fileInfo.size,
            createdAt: new Date().toISOString(),
            importDate: new Date().toISOString(),
            sourceType,
            sourceUrl: url
          };
          
          image.metadata = JSON.stringify(metadata);
        });
        
        // Add to categories if specified
        if (options.categories && options.categories.length > 0) {
          for (const categoryId of options.categories) {
            await this.database.get('gallery_image_categories').create(relation => {
              relation.imageId = imageRecord.id;
              relation.categoryId = categoryId;
              relation.syncStatus = 'created';
            });
          }
        }
        
        // Add to favorites if specified
        if (options.addToFavorites) {
          await this.database.get('gallery_favorites').create(favorite => {
            favorite.imageId = imageRecord.id;
            favorite.userId = options.userId || 'current-user-id';
            favorite.syncStatus = 'created';
          });
        }
      });
      
      return imageRecord;
    } catch (error) {
      console.error('Error importing image from URL:', error);
      throw error;
    }
  }

  async deleteImage(imageId) {
    try {
      const imageRecord = await this.database.get('gallery_images').find(imageId);
      
      // Delete the local files if they exist
      if (imageRecord.localUri) {
        const fileInfo = await FileSystem.getInfoAsync(imageRecord.localUri);
        if (fileInfo.exists) {
          await FileSystem.deleteAsync(imageRecord.localUri);
        }
        
        // Also delete thumbnail if it exists
        const thumbnailPath = imageRecord.localUri.replace('images', 'thumbnails').replace('.jpg', '_thumb.jpg');
        const thumbnailInfo = await FileSystem.getInfoAsync(thumbnailPath);
        if (thumbnailInfo.exists) {
          await FileSystem.deleteAsync(thumbnailPath);
        }
      }
      
      // Delete related records (cascade delete isn't automatic in WatermelonDB)
      await this.database.write(async () => {
        // Delete image tags
        const imageTags = await this.database.get('gallery_image_tags')
          .query(Q.where('image_id', imageId))
          .fetch();
        
        for (const tag of imageTags) {
          await tag.destroyPermanently();
        }
        
        // Delete image categories
        const imageCategories = await this.database.get('gallery_image_categories')
          .query(Q.where('image_id', imageId))
          .fetch();
        
        for (const category of imageCategories) {
          await category.destroyPermanently();
        }
        
        // Delete notes
        const notes = await this.database.get('gallery_notes')
          .query(Q.where('image_id', imageId))
          .fetch();
        
        for (const note of notes) {
          await note.destroyPermanently();
        }
        
        // Delete favorites
        const favorites = await this.database.get('gallery_favorites')
          .query(Q.where('image_id', imageId))
          .fetch();
        
        for (const favorite of favorites) {
          await favorite.destroyPermanently();
        }
        
        // Delete project relations
        const projectRelations = await this.database.get('gallery_image_projects')
          .query(Q.where('image_id', imageId))
          .fetch();
        
        for (const relation of projectRelations) {
          await relation.destroyPermanently();
        }
        
        // Finally, delete the image record
        await imageRecord.destroyPermanently();
      });
      
      return true;
    } catch (error) {
      console.error('Error deleting image:', error);
      throw error;
    }
  }

  // Get free space information
  async getStorageInfo() {
    try {
      const info = await FileSystem.getFreeDiskStorageAsync();
      const totalSpace = await FileSystem.getTotalDiskCapacityAsync();
      
      // Get total size of gallery files
      const gallerySize = await this.calculateGallerySize();
      
      return {
        freeSpace: info,
        totalSpace,
        gallerySize,
        freeSpaceFormatted: this.formatBytes(info),
        totalSpaceFormatted: this.formatBytes(totalSpace),
        gallerySizeFormatted: this.formatBytes(gallerySize)
      };
    } catch (error) {
      console.error('Error getting storage info:', error);
      return {
        freeSpace: 0,
        totalSpace: 0,
        gallerySize: 0,
        freeSpaceFormatted: '0 B',
        totalSpaceFormatted: '0 B',
        gallerySizeFormatted: '0 B'
      };
    }
  }

  // Calculate total gallery size
  async calculateGallerySize() {
    try {
      let totalSize = 0;
      
      // Get images directory size
      const imagesDirInfo = await FileSystem.getInfoAsync(this.localImageDirectory);
      if (imagesDirInfo.exists && imagesDirInfo.isDirectory) {
        const imageFiles = await FileSystem.readDirectoryAsync(this.localImageDirectory);
        
        for (const file of imageFiles) {
          const fileInfo = await FileSystem.getInfoAsync(`${this.localImageDirectory}${file}`);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            totalSize += fileInfo.size;
          }
        }
      }
      
      // Get thumbnails directory size
      const thumbnailsDirInfo = await FileSystem.getInfoAsync(this.localThumbnailDirectory);
      if (thumbnailsDirInfo.exists && thumbnailsDirInfo.isDirectory) {
        const thumbnailFiles = await FileSystem.readDirectoryAsync(this.localThumbnailDirectory);
        
        for (const file of thumbnailFiles) {
          const fileInfo = await FileSystem.getInfoAsync(`${this.localThumbnailDirectory}${file}`);
          if (fileInfo.exists && !fileInfo.isDirectory) {
            totalSize += fileInfo.size;
          }
        }
      }
      
      return totalSize;
    } catch (error) {
      console.error('Error calculating gallery size:', error);
      return 0;
    }
  }

  // Format bytes to human-readable format
  formatBytes(bytes, decimals = 2) {
    if (bytes === 0) return '0 B';
    
    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    
    return parseFloat((bytes / Math.pow(k, i)).toFixed(dm)) + ' ' + sizes[i];
  }
}
