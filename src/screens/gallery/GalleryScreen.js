import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { Ionicons } from '@expo/vector-icons';

import GalleryHeader from '../../components/gallery/GalleryHeader';
import GalleryImageGrid from '../../components/gallery/GalleryImageGrid';
import CategoryList from '../../components/gallery/CategoryList';
import EmptyGalleryView from '../../components/gallery/EmptyGalleryView';
import { useSyncStatus } from '../../contexts/SyncContext';

const GalleryScreen = ({ database, recentImages, categories }) => {
  const { synchronize, syncStatus, isConnected } = useSyncStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [imageCount, setImageCount] = useState(0);

  useEffect(() => {
    const loadImageCount = async () => {
      const count = await database.get('gallery_images').query().fetchCount();
      setImageCount(count);
    };

    loadImageCount();
  }, [database]);

  const handleSync = () => {
    synchronize();
  };

  const handleSearchSubmit = () => {
    if (searchQuery.trim()) {
      navigation.navigate('GallerySearch', { query: searchQuery });
    }
  };

  const handleAddImage = () => {
    navigation.navigate('GalleryAddImage');
  };

  if (imageCount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <GalleryHeader title="Галерея" showBackButton={false} />
        <EmptyGalleryView />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GalleryHeader 
        title="Галерея" 
        showBackButton={false} 
        showAddButton={true}
        onAddPress={handleAddImage}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.searchContainer}>
          <View style={styles.searchInputContainer}>
            <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
            <TextInput
              style={styles.searchInput}
              placeholder="Пошук у галереї..."
              value={searchQuery}
              onChangeText={setSearchQuery}
              onSubmitEditing={handleSearchSubmit}
              returnKeyType="search"
            />
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Нещодавні</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Всі</Text>
            </TouchableOpacity>
          </View>
          
          <GalleryImageGrid
            images={recentImages}
            numColumns={2}
            showSource={true}
          />
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Мої колекції</Text>
            <TouchableOpacity>
              <Text style={styles.seeAllText}>Керувати</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.collectionsContainer}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.collectionsScrollContent}
            >
              <TouchableOpacity style={styles.collectionItem}>
                <View style={[styles.collectionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="star" size={24} color="#2196F3" />
                </View>
                <Text style={styles.collectionName}>Улюблене</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.collectionItem}>
                <View style={[styles.collectionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="bulb" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.collectionName}>Ідеї</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.collectionItem}>
                <View style={[styles.collectionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="construct" size={24} color="#FF9800" />
                </View>
                <Text style={styles.collectionName}>В роботі</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.collectionItem}>
                <View style={[styles.collectionIcon, { backgroundColor: '#F3E5F5' }]}>
                  <Ionicons name="add-circle" size={24} color="#9C27B0" />
                </View>
                <Text style={styles.collectionName}>Створити</Text>
              </TouchableOpacity>
            </ScrollView>
          </View>
        </View>

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Категорії</Text>
          </View>
          
          <CategoryList categories={categories} />
        </View>
      </ScrollView>

      {syncStatus !== 'synced' && (
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Ionicons name="sync" size={20} color="#fff" />
          <Text style={styles.syncButtonText}>
            {syncStatus === 'syncing' ? 'Синхронізація...' : 'Синхронізувати'}
          </Text>
        </TouchableOpacity>
      )}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  scrollView: {
    flex: 1,
  },
  searchContainer: {
    padding: 16,
    backgroundColor: '#fff',
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
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  seeAllText: {
    color: '#007AFF',
    fontSize: 14,
  },
  collectionsContainer: {
    marginVertical: 10,
  },
  collectionsScrollContent: {
    paddingHorizontal: 16,
  },
  collectionItem: {
    alignItems: 'center',
    marginRight: 16,
    width: 80,
  },
  collectionIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 8,
  },
  collectionName: {
    fontSize: 13,
    textAlign: 'center',
  },
  syncButton: {
    position: 'absolute',
    bottom: 20,
    right: 20,
    backgroundColor: '#007AFF',
    borderRadius: 25,
    paddingVertical: 10,
    paddingHorizontal: 20,
    flexDirection: 'row',
    alignItems: 'center',
    elevation: 3,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
});

// Connect to WatermelonDB
const enhance = withObservables([], ({ database }) => ({
  recentImages: database.get('gallery_images')
    .query(
      Q.sortBy('created_at', 'desc'),
      Q.take(4)
    ),
  categories: database.get('gallery_categories')
    .query(
      Q.where('is_visible', true),
      Q.sortBy('order_index', 'asc')
    ),
}));

export default withDatabase(enhance(GalleryScreen));
