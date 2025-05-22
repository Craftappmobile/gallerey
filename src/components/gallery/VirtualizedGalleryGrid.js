/**
 * VirtualizedGalleryGrid component
 * Optimized gallery grid that uses FlatList virtualization for better performance with large datasets
 * 
 * @module components/gallery/VirtualizedGalleryGrid
 */

import React, { useState, useCallback, useMemo } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  TouchableOpacity, 
  Dimensions, 
  ActivityIndicator, 
  RefreshControl 
} from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSyncStatus } from '../../contexts/SyncContext';
import { handleError, ErrorType } from '../../utils/ErrorHandler';

// Constants for optimization
const WINDOW_WIDTH = Dimensions.get('window').width;
const DEFAULT_NUM_COLUMNS = 2;
const ITEMS_PER_PAGE = 20;
const THUMBNAIL_PLACEHOLDER = require('../../../assets/image-placeholder.png');
const DEFAULT_WINDOW_SIZE = 5; // Number of items to render in each batch

/**
 * VirtualizedGalleryGrid component
 * 
 * @param {Object} props - Component props
 * @param {Array} props.images - Array of image objects to display
 * @param {number} props.numColumns - Number of columns in the grid
 * @param {Function} props.onImagePress - Callback when an image is pressed
 * @param {Function} props.onImageLongPress - Callback when an image is long-pressed
 * @param {boolean} props.showSource - Whether to show the image source icon
 * @param {boolean} props.showFavorite - Whether to show favorite indicator
 * @param {boolean} props.enablePagination - Whether to enable pagination
 * @param {Function} props.onRefresh - Callback for pull-to-refresh
 * @param {boolean} props.isRefreshing - Control refreshing state externally
 * @param {Object} props.style - Additional style for the grid container
 * @param {number} props.windowSize - Number of items to render in each direction
 * @returns {JSX.Element} VirtualizedGalleryGrid component
 */
const VirtualizedGalleryGrid = ({ 
  images = [],
  numColumns = DEFAULT_NUM_COLUMNS, 
  onImagePress, 
  onImageLongPress,
  showSource = true,
  showFavorite = true,
  enablePagination = true,
  onRefresh = null,
  isRefreshing = false,
  style = {},
  windowSize = DEFAULT_WINDOW_SIZE
}) => {
  const navigation = useNavigation();
  const { isConnected } = useSyncStatus();
  
  // Calculate image dimensions based on screen width and number of columns
  const imageWidth = useMemo(() => {
    const padding = 16 * 2; // Container padding
    const gap = 8 * (numColumns - 1); // Gap between items
    return (WINDOW_WIDTH - padding - gap) / numColumns;
  }, [numColumns, WINDOW_WIDTH]);
  
  // State for pagination
  const [displayedImages, setDisplayedImages] = useState(
    enablePagination ? images.slice(0, ITEMS_PER_PAGE) : images
  );
  const [page, setPage] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [hasMore, setHasMore] = useState(images.length > ITEMS_PER_PAGE);

  // Calculate data for FlatList
  const flatListData = useMemo(() => {
    return enablePagination ? displayedImages : images;
  }, [enablePagination, displayedImages, images]);

  // Update displayed images when images prop changes
  React.useEffect(() => {
    if (!enablePagination) {
      return;
    }

    setDisplayedImages(images.slice(0, ITEMS_PER_PAGE));
    setPage(1);
    setHasMore(images.length > ITEMS_PER_PAGE);
  }, [images, enablePagination]);

  /**
   * Load more images for pagination
   */
  const loadMoreImages = useCallback(() => {
    if (!hasMore || isLoading || !enablePagination) return;
    
    setIsLoading(true);
    
    // Use setTimeout to prevent UI blocking
    setTimeout(() => {
      try {
        const nextPage = page + 1;
        const startIndex = (nextPage - 1) * ITEMS_PER_PAGE;
        const endIndex = startIndex + ITEMS_PER_PAGE;
        const newImages = images.slice(startIndex, endIndex);
        
        if (newImages.length > 0) {
          setDisplayedImages(prev => [...prev, ...newImages]);
          setPage(nextPage);
          setHasMore(endIndex < images.length);
        } else {
          setHasMore(false);
        }
      } catch (error) {
        handleError(error, ErrorType.UNKNOWN, 'VirtualizedGalleryGrid.loadMoreImages', false);
      } finally {
        setIsLoading(false);
      }
    }, 100);
  }, [hasMore, isLoading, page, images, enablePagination]);

  /**
   * Handle image press
   * @param {Object} image - Image object
   */
  const handleImagePress = useCallback((image) => {
    try {
      if (onImagePress) {
        onImagePress(image);
      } else {
        navigation.navigate('GalleryImageDetail', { imageId: image.id });
      }
    } catch (error) {
      handleError(error, ErrorType.UNKNOWN, 'VirtualizedGalleryGrid.handleImagePress', true);
    }
  }, [onImagePress, navigation]);

  /**
   * Handle image long press
   * @param {Object} image - Image object
   */
  const handleImageLongPress = useCallback((image) => {
    try {
      if (onImageLongPress) {
        onImageLongPress(image);
      }
    } catch (error) {
      handleError(error, ErrorType.UNKNOWN, 'VirtualizedGalleryGrid.handleImageLongPress', true);
    }
  }, [onImageLongPress]);

  /**
   * Get appropriate source icon based on image source type
   * @param {string} sourceType - Source type of the image
   * @returns {JSX.Element} Icon component
   */
  const getSourceIcon = useCallback((sourceType) => {
    switch (sourceType) {
      case 'pinterest':
        return <Ionicons name="logo-pinterest" size={16} color="#E60023" />;
      case 'instagram':
        return <Ionicons name="logo-instagram" size={16} color="#C13584" />;
      case 'camera':
        return <Ionicons name="camera" size={16} color="#4CAF50" />;
      default:
        return <Ionicons name="image" size={16} color="#2196F3" />;
    }
  }, []);

  /**
   * Render individual image item
   * @param {Object} params - Render item params from FlatList
   * @returns {JSX.Element} Rendered image item
   */
  const renderImageItem = useCallback(({ item }) => {
    const isFavorite = false; // This would come from a favorites context or prop
    
    return (
      <TouchableOpacity
        style={[
          styles.imageContainer, 
          { 
            width: imageWidth, 
            height: imageWidth * 1.2,
            margin: numColumns > 1 ? 4 : 0,
            marginBottom: 8
          }
        ]}
        onPress={() => handleImagePress(item)}
        onLongPress={() => handleImageLongPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.localUri }}
          style={styles.image}
          contentFit="cover"
          transition={150}
          placeholderContentFit="cover"
          placeholder={THUMBNAIL_PLACEHOLDER}
          recyclingKey={item.id}
          cachePolicy="memory-disk"
        />
        
        <View style={styles.imageOverlay}>
          <Text style={styles.imageName} numberOfLines={1}>
            {item.name}
          </Text>
          
          {showSource && (
            <View style={styles.sourceContainer}>
              {getSourceIcon(item.sourceType)}
            </View>
          )}
          
          {!isConnected && item.syncStatus !== 'synced' && (
            <View style={styles.syncStatusIndicator}>
              <Ionicons name="cloud-offline" size={16} color="#FFA000" />
            </View>
          )}
          
          {showFavorite && isFavorite && (
            <View style={styles.favoriteIndicator}>
              <Ionicons name="heart" size={16} color="#FF4081" />
            </View>
          )}
        </View>
      </TouchableOpacity>
    );
  }, [imageWidth, numColumns, isConnected, showSource, showFavorite, handleImagePress, handleImageLongPress, getSourceIcon]);

  /**
   * Render footer component for FlatList
   * @returns {JSX.Element|null} Footer component or null
   */
  const renderFooter = useCallback(() => {
    if (!isLoading || !hasMore) return null;
    
    return (
      <View style={styles.loaderContainer}>
        <ActivityIndicator size="small" color="#007AFF" />
        <Text style={styles.loaderText}>Завантаження...</Text>
      </View>
    );
  }, [isLoading, hasMore]);

  /**
   * Render empty component when there are no images
   * @returns {JSX.Element|null} Empty component or null
   */
  const renderEmptyComponent = useCallback(() => {
    if (images.length === 0) {
      return (
        <View style={styles.emptyContainer}>
          <Ionicons name="images-outline" size={48} color="#ccc" />
          <Text style={styles.emptyText}>Немає зображень</Text>
        </View>
      );
    }
    return null;
  }, [images.length]);

  /**
   * Get key for FlatList items
   * @param {Object} item - Item object
   * @returns {string} Key string
   */
  const keyExtractor = useCallback((item) => `gallery-image-${item.id}`, []);

  /**
   * Create columnWrapperStyle for FlatList based on numColumns
   * @returns {Object|null} Style object or null
   */
  const getColumnWrapperStyle = useCallback(() => {
    return numColumns > 1 ? styles.columnWrapper : null;
  }, [numColumns]);

  return (
    <FlatList
      data={flatListData}
      renderItem={renderImageItem}
      keyExtractor={keyExtractor}
      numColumns={numColumns}
      windowSize={windowSize}
      maxToRenderPerBatch={ITEMS_PER_PAGE / 2}
      initialNumToRender={ITEMS_PER_PAGE / 2}
      removeClippedSubviews={true}
      contentContainerStyle={[
        styles.gridContainer, 
        flatListData.length === 0 && styles.emptyGridContainer,
        style
      ]}
      columnWrapperStyle={getColumnWrapperStyle()}
      onEndReached={loadMoreImages}
      onEndReachedThreshold={0.5}
      ListFooterComponent={renderFooter}
      ListEmptyComponent={renderEmptyComponent}
      refreshControl={
        onRefresh ? (
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        ) : null
      }
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    padding: 16,
    flexGrow: 1,
  },
  emptyGridContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    flex: 1,
  },
  columnWrapper: {
    justifyContent: 'space-between',
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#f0f0f0',
    position: 'relative',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
  },
  image: {
    width: '100%',
    height: '100%',
    backgroundColor: '#e1e1e1',
  },
  imageOverlay: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    padding: 8,
  },
  imageName: {
    color: '#fff',
    fontSize: 14,
    fontWeight: '500',
  },
  sourceContainer: {
    position: 'absolute',
    top: 8,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  syncStatusIndicator: {
    position: 'absolute',
    top: 8,
    left: 8,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    padding: 4,
  },
  favoriteIndicator: {
    position: 'absolute',
    top: 40,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    padding: 4,
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  emptyText: {
    marginTop: 10,
    fontSize: 16,
    color: '#666',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    flexDirection: 'row',
  },
  loaderText: {
    marginLeft: 8,
    color: '#666',
  },
});

export default React.memo(VirtualizedGalleryGrid);
