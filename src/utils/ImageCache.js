/**
 * ImageCache utility
 * Provides advanced image caching, prefetching and management
 * 
 * @module utils/ImageCache
 */

import * as FileSystem from 'expo-file-system';
import * as Crypto from 'expo-crypto';
import { Platform } from 'react-native';
import { handleError, ErrorType } from './ErrorHandler';

// Constants
const IMAGE_CACHE_DIR = `${FileSystem.cacheDirectory}image-cache/`;
const MAX_CACHE_SIZE = 200 * 1024 * 1024; // 200MB
const CACHE_INFO_FILE = `${IMAGE_CACHE_DIR}cache-info.json`;

/**
 * Image cache class
 */
class ImageCacheManager {
  constructor() {
    this.initialized = false;
    this.cacheInfo = {
      size: 0,
      lastCleaned: 0,
      images: {}
    };
    
    // Initialize cache
    this.initCache();
  }
  
  /**
   * Initialize cache directory and load cache info
   */
  async initCache() {
    try {
      // Create cache directory if it doesn't exist
      const dirInfo = await FileSystem.getInfoAsync(IMAGE_CACHE_DIR);
      if (!dirInfo.exists) {
        await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
      }
      
      // Load cache info
      const cacheInfoExists = await FileSystem.getInfoAsync(CACHE_INFO_FILE);
      if (cacheInfoExists.exists) {
        const cacheInfoStr = await FileSystem.readAsStringAsync(CACHE_INFO_FILE);
        this.cacheInfo = JSON.parse(cacheInfoStr);
      }
      
      this.initialized = true;
      
      // Clean cache if needed
      if (Date.now() - this.cacheInfo.lastCleaned > 24 * 60 * 60 * 1000) { // 24 hours
        this.cleanCache();
      }
    } catch (error) {
      handleError(error, ErrorType.FILE_SYSTEM, 'ImageCache.initCache', false);
    }
  }
  
  /**
   * Wait for cache to be initialized
   */
  async ensureInitialized() {
    if (!this.initialized) {
      await new Promise(resolve => {
        const checkInitialized = () => {
          if (this.initialized) {
            resolve();
          } else {
            setTimeout(checkInitialized, 100);
          }
        };
        checkInitialized();
      });
    }
  }
  
  /**
   * Generate cache key from URL
   * @param {string} url - Image URL
   * @returns {Promise<string>} Cache key
   */
  async getCacheKey(url) {
    try {
      const hash = await Crypto.digestStringAsync(
        Crypto.CryptoDigestAlgorithm.SHA256,
        url
      );
      return hash;
    } catch (error) {
      handleError(error, ErrorType.UNKNOWN, 'ImageCache.getCacheKey', false);
      // Fallback to simpler hash if crypto fails
      return url
        .replace(/[^a-zA-Z0-9]/g, '_')
        .toLowerCase()
        .substring(0, 200);
    }
  }
  
  /**
   * Get cached image path
   * @param {string} url - Image URL
   * @returns {Promise<string|null>} Cached image path or null
   */
  async getCachedImagePath(url) {
    try {
      await this.ensureInitialized();
      
      const cacheKey = await this.getCacheKey(url);
      const imagePath = `${IMAGE_CACHE_DIR}${cacheKey}`;
      
      const imageInfo = await FileSystem.getInfoAsync(imagePath);
      if (imageInfo.exists) {
        // Update last accessed time
        if (this.cacheInfo.images[cacheKey]) {
          this.cacheInfo.images[cacheKey].lastAccessed = Date.now();
          await this.saveCacheInfo();
        }
        return imagePath;
      }
      
      return null;
    } catch (error) {
      handleError(error, ErrorType.FILE_SYSTEM, 'ImageCache.getCachedImagePath', false);
      return null;
    }
  }
  
  /**
   * Cache image from URL
   * @param {string} url - Image URL
   * @returns {Promise<string|null>} Cached image path or null
   */
  async cacheImage(url) {
    try {
      await this.ensureInitialized();
      
      // Check if already cached
      const cachedPath = await this.getCachedImagePath(url);
      if (cachedPath) {
        return cachedPath;
      }
      
      // Download and cache image
      const cacheKey = await this.getCacheKey(url);
      const imagePath = `${IMAGE_CACHE_DIR}${cacheKey}`;
      
      const downloadResult = await FileSystem.downloadAsync(url, imagePath);
      
      if (downloadResult.status !== 200) {
        throw new Error(`Failed to download image: ${downloadResult.status}`);
      }
      
      // Update cache info
      const fileInfo = await FileSystem.getInfoAsync(imagePath);
      this.cacheInfo.images[cacheKey] = {
        url,
        size: fileInfo.size,
        createdAt: Date.now(),
        lastAccessed: Date.now()
      };
      this.cacheInfo.size += fileInfo.size;
      
      await this.saveCacheInfo();
      
      // Clean cache if it's too large
      if (this.cacheInfo.size > MAX_CACHE_SIZE) {
        this.cleanCache();
      }
      
      return imagePath;
    } catch (error) {
      handleError(error, ErrorType.FILE_SYSTEM, 'ImageCache.cacheImage', false);
      return null;
    }
  }
  
  /**
   * Prefetch images
   * @param {Array<string>} urls - Array of image URLs to prefetch
   * @returns {Promise<Object>} Result with succeeded and failed counts
   */
  async prefetchImages(urls) {
    await this.ensureInitialized();
    
    const result = {
      succeeded: 0,
      failed: 0
    };
    
    const promises = urls.map(async (url) => {
      try {
        await this.cacheImage(url);
        result.succeeded++;
      } catch (error) {
        result.failed++;
      }
    });
    
    await Promise.allSettled(promises);
    return result;
  }
  
  /**
   * Delete cached image
   * @param {string} url - Image URL
   * @returns {Promise<boolean>} Success status
   */
  async deleteFromCache(url) {
    try {
      await this.ensureInitialized();
      
      const cacheKey = await this.getCacheKey(url);
      const imagePath = `${IMAGE_CACHE_DIR}${cacheKey}`;
      
      const imageInfo = await FileSystem.getInfoAsync(imagePath);
      if (imageInfo.exists) {
        await FileSystem.deleteAsync(imagePath);
        
        // Update cache info
        if (this.cacheInfo.images[cacheKey]) {
          this.cacheInfo.size -= this.cacheInfo.images[cacheKey].size;
          delete this.cacheInfo.images[cacheKey];
          await this.saveCacheInfo();
        }
        
        return true;
      }
      
      return false;
    } catch (error) {
      handleError(error, ErrorType.FILE_SYSTEM, 'ImageCache.deleteFromCache', false);
      return false;
    }
  }
  
  /**
   * Clean cache by removing least recently used images
   * @returns {Promise<Object>} Result with freed space and removed count
   */
  async cleanCache() {
    try {
      await this.ensureInitialized();
      
      if (this.cacheInfo.size <= MAX_CACHE_SIZE) {
        return { freedSpace: 0, removedCount: 0 };
      }
      
      // Sort images by last accessed time
      const images = Object.entries(this.cacheInfo.images)
        .map(([key, info]) => ({ key, ...info }))
        .sort((a, b) => a.lastAccessed - b.lastAccessed);
      
      let freedSpace = 0;
      let removedCount = 0;
      let currentSize = this.cacheInfo.size;
      
      // Remove images until cache size is below threshold
      for (const image of images) {
        if (currentSize <= MAX_CACHE_SIZE * 0.8) { // Clean until 80% of max size
          break;
        }
        
        const imagePath = `${IMAGE_CACHE_DIR}${image.key}`;
        try {
          await FileSystem.deleteAsync(imagePath);
          currentSize -= image.size;
          freedSpace += image.size;
          removedCount++;
          delete this.cacheInfo.images[image.key];
        } catch (error) {
          // Skip if delete fails
          console.warn(`Failed to delete cached image: ${error.message}`);
        }
      }
      
      // Update cache info
      this.cacheInfo.size = currentSize;
      this.cacheInfo.lastCleaned = Date.now();
      await this.saveCacheInfo();
      
      return { freedSpace, removedCount };
    } catch (error) {
      handleError(error, ErrorType.FILE_SYSTEM, 'ImageCache.cleanCache', false);
      return { freedSpace: 0, removedCount: 0 };
    }
  }
  
  /**
   * Clear entire cache
   * @returns {Promise<boolean>} Success status
   */
  async clearCache() {
    try {
      await this.ensureInitialized();
      
      await FileSystem.deleteAsync(IMAGE_CACHE_DIR, { idempotent: true });
      await FileSystem.makeDirectoryAsync(IMAGE_CACHE_DIR, { intermediates: true });
      
      this.cacheInfo = {
        size: 0,
        lastCleaned: Date.now(),
        images: {}
      };
      
      await this.saveCacheInfo();
      return true;
    } catch (error) {
      handleError(error, ErrorType.FILE_SYSTEM, 'ImageCache.clearCache', false);
      return false;
    }
  }
  
  /**
   * Get cache statistics
   * @returns {Promise<Object>} Cache statistics
   */
  async getCacheStats() {
    await this.ensureInitialized();
    
    return {
      size: this.cacheInfo.size,
      count: Object.keys(this.cacheInfo.images).length,
      lastCleaned: this.cacheInfo.lastCleaned,
      maxSize: MAX_CACHE_SIZE,
      utilization: this.cacheInfo.size / MAX_CACHE_SIZE
    };
  }
  
  /**
   * Save cache info to file
   * @returns {Promise<void>}
   */
  async saveCacheInfo() {
    try {
      await FileSystem.writeAsStringAsync(
        CACHE_INFO_FILE,
        JSON.stringify(this.cacheInfo)
      );
    } catch (error) {
      handleError(error, ErrorType.FILE_SYSTEM, 'ImageCache.saveCacheInfo', false);
    }
  }
}

// Create singleton instance
const ImageCache = new ImageCacheManager();
export default ImageCache;
