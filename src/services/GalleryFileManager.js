import * as FileSystem from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import * as ImageManipulator from 'expo-image-manipulator';
import { Platform } from 'react-native';
import { v4 as uuidv4 } from 'uuid';

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
    }
  }

  async pickImageFromLibrary() {
    try {
      const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
      
      if (!permissionResult.granted) {
        throw new Error('Permission to access media library was denied');
      }
      
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: true
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }
      
      const asset = result.assets[0];
      return await this.processPickedImage(asset.uri, 'library');
    } catch (error) {
      console.error('Error picking image from library:', error);
      throw error;
    }
  }

  async takePhoto() {
    try {
      const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
      
      if (!permissionResult.granted) {
        throw new Error('Permission to access camera was denied');
      }
      
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: false,
        quality: 0.8,
        exif: true
      });
      
      if (result.canceled || !result.assets || result.assets.length === 0) {
        return null;
      }
      
      const asset = result.assets[0];
      return await this.processPickedImage(asset.uri, 'camera');
    } catch (error) {
      console.error('Error taking photo:', error);
      throw error;
    }
  }

  async processPickedImage(uri, sourceType) {
    try {
      const id = uuidv4();
      const extension = uri.split('.').pop() || 'jpg';
      const fileName = `${id}.${extension}`;
      const localUri = `${this.localImageDirectory}${fileName}`;
      
      // Copy the image to our app's directory
      await FileSystem.copyAsync({
        from: uri,
        to: localUri
      });
      
      // Create thumbnail
      const thumbnailFileName = `${id}_thumb.${extension}`;
      const thumbnailUri = `${this.localThumbnailDirectory}${thumbnailFileName}`;
      
      const thumbnailResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: 300 } }],
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
          image.name = `Image ${new Date().toLocaleDateString()}`;
          image.sourceType = sourceType;
          image.isPublic = false;
          image.viewCount = 0;
          image.syncStatus = 'created';
          image.metadata = JSON.stringify({
            width: thumbnailResult.width,
            height: thumbnailResult.height,
            size: fileInfo.size,
            createdAt: new Date().toISOString()
          });
        });
      });
      
      return imageRecord;
    } catch (error) {
      console.error('Error processing picked image:', error);
      throw error;
    }
  }

  async importImageFromUrl(url, sourceType, sourceAuthor = null, sourceName = null) {
    try {
      const id = uuidv4();
      const fileName = `${id}.jpg`;
      const localUri = `${this.localImageDirectory}${fileName}`;
      
      // Download the image
      const downloadResult = await FileSystem.downloadAsync(url, localUri);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }
      
      // Create thumbnail
      const thumbnailFileName = `${id}_thumb.jpg`;
      const thumbnailUri = `${this.localThumbnailDirectory}${thumbnailFileName}`;
      
      const thumbnailResult = await ImageManipulator.manipulateAsync(
        localUri,
        [{ resize: { width: 300 } }],
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
          image.sourceType = sourceType;
          image.sourceUrl = url;
          image.sourceAuthor = sourceAuthor;
          image.isPublic = false;
          image.viewCount = 0;
          image.syncStatus = 'created';
          image.metadata = JSON.stringify({
            width: thumbnailResult.width,
            height: thumbnailResult.height,
            size: fileInfo.size,
            createdAt: new Date().toISOString()
          });
        });
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
}
