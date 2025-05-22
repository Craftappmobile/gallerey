import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { Ionicons } from '@expo/vector-icons';

import GalleryHeader from '../../components/gallery/GalleryHeader';
import GalleryImageGrid from '../../components/gallery/GalleryImageGrid';

const GalleryCategoryScreen = ({ navigation, route, database, category, images }) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredImages, setFilteredImages] = useState([]);

  useEffect(() => {
    setFilteredImages(images);
  }, [images]);

  const handleSearch = (text) => {
    setSearchQuery(text);
    if (text.trim() === '') {
      setFilteredImages(images);
    } else {
      const filtered = images.filter(image => 
        image.name.toLowerCase().includes(text.toLowerCase()) ||
        (image.description && image.description.toLowerCase().includes(text.toLowerCase()))
      );
      setFilteredImages(filtered);
    }
  };

  const handleAddImage = () => {
    navigation.navigate('GalleryAddImage', { categoryId: category.id });
  };

  const handleShareCategory = () => {
    // Implement share functionality
  };

  const handleGroupImages = () => {
    // Implement grouping functionality
  };

  const handleSaveImages = () => {
    // Implement save functionality
  };

  const handleImagePress = (image) => {
    navigation.navigate('GalleryImageDetail', { imageId: image.id });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GalleryHeader 
        title={category ? category.name : 'Категорія'} 
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
      </View>

      <GalleryImageGrid
        images={filteredImages}
        numColumns={2}
        onImagePress={handleImagePress}
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
  },
  searchInputContainer: {
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
  
  return {
    category: categoryId 
      ? database.get('gallery_categories').findAndObserve(categoryId)
      : null,
    images: categoryId
      ? database.get('gallery_image_categories')
          .query(Q.where('category_id', categoryId))
          .observeWithColumns(['image_id'])
          .pipe(
            switchMap(relations => 
              observableOf(relations).pipe(
                combineLatestObject(
                  relations.reduce(
                    (acc, relation) => ({
                      ...acc,
                      [relation.id]: database
                        .get('gallery_images')
                        .findAndObserve(relation.image_id)
                    }),
                    {}
                  )
                ),
                map(related => Object.values(related))
              )
            )
          )
      : database.get('gallery_images').query().observe(),
  };
});

export default withDatabase(enhance(GalleryCategoryScreen));
