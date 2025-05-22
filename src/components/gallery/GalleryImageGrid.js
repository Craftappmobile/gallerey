import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';
import { useSyncStatus } from '../../contexts/SyncContext';

const GalleryImageGrid = ({ 
  images, 
  numColumns = 2, 
  onImagePress, 
  onImageLongPress,
  showSource = true,
  showFavorite = true,
}) => {
  const navigation = useNavigation();
  const { isConnected } = useSyncStatus();
  const screenWidth = Dimensions.get('window').width;
  const imageWidth = (screenWidth - 48) / numColumns; // 48 = padding and gaps

  const handleImagePress = (image) => {
    if (onImagePress) {
      onImagePress(image);
    } else {
      navigation.navigate('GalleryImageDetail', { imageId: image.id });
    }
  };

  const handleImageLongPress = (image) => {
    if (onImageLongPress) {
      onImageLongPress(image);
    }
  };

  const getSourceIcon = (sourceType) => {
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
  };

  const renderImageItem = ({ item }) => {
    const isFavorite = false; // This would come from a favorites context or prop
    
    return (
      <TouchableOpacity
        style={[styles.imageContainer, { width: imageWidth, height: imageWidth * 1.2 }]}
        onPress={() => handleImagePress(item)}
        onLongPress={() => handleImageLongPress(item)}
        activeOpacity={0.8}
      >
        <Image
          source={{ uri: item.localUri }}
          style={styles.image}
          contentFit="cover"
          transition={200}
          placeholder={{ uri: item.thumbnailPath }}
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
  };

  if (!images || images.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="images-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Немає зображень</Text>
      </View>
    );
  }

  return (
    <FlatList
      data={images}
      renderItem={renderImageItem}
      keyExtractor={item => item.id}
      numColumns={numColumns}
      contentContainerStyle={styles.gridContainer}
      columnWrapperStyle={styles.columnWrapper}
    />
  );
};

const styles = StyleSheet.create({
  gridContainer: {
    padding: 16,
  },
  columnWrapper: {
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  imageContainer: {
    borderRadius: 12,
    overflow: 'hidden',
    elevation: 2,
    backgroundColor: '#f0f0f0',
    position: 'relative',
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
});

export default GalleryImageGrid;
