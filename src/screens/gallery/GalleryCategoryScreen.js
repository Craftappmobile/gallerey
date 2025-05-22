import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatus } from '../../contexts/SyncContext';

import GalleryHeader from '../../components/gallery/GalleryHeader';
import GalleryImageGrid from '../../components/gallery/GalleryImageGrid';
import SyncStatusIndicator from '../../components/gallery/SyncStatusIndicator';

const GalleryCategoryScreen = ({ navigation, route, database, category, images, favorites }) => {
  const { isConnected, syncStatus, pendingChanges, synchronize } = useSyncStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
  const [viewMode, setViewMode] = useState('grid'); // 'grid' or 'list'
  const [sortBy, setSortBy] = useState('date'); // 'date', 'name', 'views'
  const [showSortOptions, setShowSortOptions] = useState(false);
  
  // Special category cases
  const isFavorites = route.params?.isFavorites || false;
  const customTitle = route.params?.title;
  const collectionType = route.params?.collectionType;

  useEffect(() => {
    setFilteredImages(images || []);
  }, [images]);

  useEffect(() => {
    // Sort images when sort option changes
    if (!images) return;
    
    const sorted = [...images];
    
    if (sortBy === 'date') {
      sorted.sort((a, b) => b.createdAt - a.createdAt);
    } else if (sortBy === 'name') {
      sorted.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sortBy === 'views') {
      sorted.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
    }
    
    setFilteredImages(sorted);
  }, [images, sortBy]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredImages(images || []);
    } else {
      const filtered = (images || []).filter(image => 
        image.name.toLowerCase().includes(text.toLowerCase()) ||
        (image.description && image.description.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredImages(filtered);
    }
  };

  const handleRefresh = async () => {
    setRefreshing(true);
    
    try {
      await synchronize();
    } catch (error) {
      console.error('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddImage = () => {
    navigation.navigate('GalleryAddImage', { 
      categoryId: category?.id,
      isFavorites,
      collectionType
    });
  };

  const handleShareCategory = () => {
    Alert.alert(
      'Поділитися категорією',
      'Ця функція буде доступна в наступній версії додатку.',
      [{ text: 'OK' }]
    );
  };

  const handleGroupImages = () => {
    Alert.alert(
      'Групувати зображення',
      'Виберіть спосіб групування:',
      [
        { text: 'За датою', onPress: () => setSortBy('date') },
        { text: 'За назвою', onPress: () => setSortBy('name') },
        { text: 'За переглядами', onPress: () => setSortBy('views') },
        { text: 'Скасувати', style: 'cancel' }
      ]
    );
  };

  const handleSaveImages = () => {
    Alert.alert(
      'Зберегти зображення',
      'Ця функція буде доступна в наступній версії додатку.',
      [{ text: 'OK' }]
    );
  };

  const handleImagePress = (image) => {
    navigation.navigate('GalleryImageDetail', { imageId: image.id });
  };

  const handleToggleViewMode = () => {
    setViewMode(viewMode === 'grid' ? 'list' : 'grid');
  };

  const handleToggleSortOptions = () => {
    setShowSortOptions(!showSortOptions);
  };

  const handleSelectSortOption = (option) => {
    setSortBy(option);
    setShowSortOptions(false);
  };

  // Get the title
  const screenTitle = customTitle || (category ? category.name : 'Категорія');

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GalleryHeader 
        title={screenTitle} 
        showBackButton={true}
        showAddButton={true}
        onAddPress={handleAddImage}
      />

      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder={`Пошук у ${category ? category.name.toLowerCase() : 'категорії'}...`}
            value={searchQuery}
            onChangeText={handleSearch}
            returnKeyType="search"
          />
        </View>
        
        <View style={styles.viewOptionsContainer}>
          <TouchableOpacity 
            style={styles.viewOptionButton}
            onPress={handleToggleViewMode}
          >
            <Ionicons 
              name={viewMode === 'grid' ? 'grid-outline' : 'list-outline'} 
              size={24} 
              color="#666" 
            />
          </TouchableOpacity>
          
          <TouchableOpacity 
            style={styles.viewOptionButton}
            onPress={handleToggleSortOptions}
          >
            <Ionicons name="options-outline" size={24} color="#666" />
          </TouchableOpacity>
        </View>
      </View>

      {showSortOptions && (
        <View style={styles.sortOptionsContainer}>
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === 'date' && styles.activeSortOption
            ]}
            onPress={() => handleSelectSortOption('date')}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === 'date' && styles.activeSortOptionText
            ]}>За датою</Text>
            {sortBy === 'date' && (
              <Ionicons name="checkmark" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === 'name' && styles.activeSortOption
            ]}
            onPress={() => handleSelectSortOption('name')}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === 'name' && styles.activeSortOptionText
            ]}>За назвою</Text>
            {sortBy === 'name' && (
              <Ionicons name="checkmark" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.sortOption,
              sortBy === 'views' && styles.activeSortOption
            ]}
            onPress={() => handleSelectSortOption('views')}
          >
            <Text style={[
              styles.sortOptionText,
              sortBy === 'views' && styles.activeSortOptionText
            ]}>За переглядами</Text>
            {sortBy === 'views' && (
              <Ionicons name="checkmark" size={20} color="#007AFF" />
            )}
          </TouchableOpacity>
        </View>
      )}

      {(syncStatus !== 'synced' || pendingChanges > 0 || !isConnected) && (
        <SyncStatusIndicator />
      )}

      <GalleryImageGrid
        images={filteredImages}
        numColumns={viewMode === 'grid' ? 2 : 1}
        onImagePress={handleImagePress}
        onRefresh={handleRefresh}
        isRefreshing={refreshing}
        enablePagination={true}
      />

      <View style={styles.actionBar}>
        <TouchableOpacity style={styles.actionButton} onPress={handleAddImage}>
          <Ionicons name="camera" size={20} color="#666" />
          <Text style={styles.actionButtonText}>Додати</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleShareCategory}>
          <Ionicons name="share-outline" size={20} color="#666" />
          <Text style={styles.actionButtonText}>Поділитися</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleGroupImages}>
          <Ionicons name="folder-outline" size={20} color="#666" />
          <Text style={styles.actionButtonText}>Групувати</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.actionButton} onPress={handleSaveImages}>
          <Ionicons name="download-outline" size={20} color="#666" />
          <Text style={styles.actionButtonText}>Зберегти</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    flexDirection: 'row',
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 10,
    paddingHorizontal: 12,
  },
  searchIcon: {
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    height: 40,
    fontSize: 16,
  },
  viewOptionsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  viewOptionButton: {
    padding: 8,
    marginLeft: 4,
  },
  sortOptionsContainer: {
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sortOption: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  activeSortOption: {
    backgroundColor: '#f0f8ff',
  },
  sortOptionText: {
    fontSize: 16,
  },
  activeSortOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  actionBar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    backgroundColor: '#fff',
    paddingVertical: 8,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
  },
  actionButtonText: {
    fontSize: 12,
    marginTop: 4,
    color: '#666',
  },
});

// Connect to WatermelonDB
const enhance = withObservables(['route'], ({ route, database }) => {
  const categoryId = route.params?.categoryId;
  const isFavorites = route.params?.isFavorites || false;
  const collectionType = route.params?.collectionType;
  
  let imagesObservable;
  
  if (categoryId) {
    // Images for specific category
    imagesObservable = database.get('gallery_image_categories')
      .query(Q.where('category_id', categoryId))
      .observe()
      .pipe(
        switchMap(relations => 
          Promise.all(relations.map(relation => 
            database.get('gallery_images').find(relation.imageId)
          ))
        )
      );
  } else if (isFavorites) {
    // Favorite images
    imagesObservable = database.get('gallery_favorites')
      .query()
      .observe()
      .pipe(
        switchMap(favorites => 
          Promise.all(favorites.map(favorite => 
            database.get('gallery_images').find(favorite.imageId)
          ))
        )
      );
  } else if (collectionType) {
    // Collection type is not implemented yet, return all images
    imagesObservable = database.get('gallery_images')
      .query(Q.sortBy('created_at', 'desc'))
      .observe();
  } else {
    // All images
    imagesObservable = database.get('gallery_images')
      .query(Q.sortBy('created_at', 'desc'))
      .observe();
  }
  
  return {
    category: categoryId 
      ? database.get('gallery_categories').findAndObserve(categoryId)
      : null,
    images: imagesObservable,
    favorites: database.get('gallery_favorites').query().observe(),
  };
});

export default withDatabase(enhance(GalleryCategoryScreen));
