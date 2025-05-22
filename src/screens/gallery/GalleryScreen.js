import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, RefreshControl, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { Q } from '@nozbe/watermelondb';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

import GalleryHeader from '../../components/gallery/GalleryHeader';
import GalleryImageGrid from '../../components/gallery/GalleryImageGrid';
import CategoryList from '../../components/gallery/CategoryList';
import EmptyGalleryView from '../../components/gallery/EmptyGalleryView';
import SyncStatusIndicator from '../../components/gallery/SyncStatusIndicator';
import { useSyncStatus } from '../../contexts/SyncContext';

const GalleryScreen = ({ database, recentImages, categories }) => {
  const navigation = useNavigation();
  const { synchronize, syncStatus, isConnected, pendingChanges } = useSyncStatus();
  const [searchQuery, setSearchQuery] = useState('');
  const [imageCount, setImageCount] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [categoriesWithCount, setCategoriesWithCount] = useState([]);

  useEffect(() => {
    const loadImageCount = async () => {
      const count = await database.get('gallery_images').query().fetchCount();
      setImageCount(count);
    };

    loadImageCount();
  }, [database, recentImages]);

  useEffect(() => {
    if (!categories) return;

    const loadCategoryCounts = async () => {
      const withCounts = await Promise.all(
        categories.map(async (category) => {
          const count = await database.get('gallery_image_categories')
            .query(Q.where('category_id', category.id))
            .fetchCount();
          
          return {
            ...category,
            imageCount: count
          };
        })
      );
      
      setCategoriesWithCount(withCounts);
    };

    loadCategoryCounts();
  }, [categories, database]);

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

  const handleCategoryPress = (category) => {
    navigation.navigate('GalleryCategory', { categoryId: category.id });
  };

  const handleShowAllImages = () => {
    navigation.navigate('GalleryCategory', { title: 'Всі зображення' });
  };

  const handleShowFavorites = () => {
    navigation.navigate('GalleryCategory', { title: 'Улюблене', isFavorites: true });
  };

  const handleShowIdeas = () => {
    navigation.navigate('GalleryCategory', { title: 'Ідеї', collectionType: 'ideas' });
  };

  const handleShowInProgress = () => {
    navigation.navigate('GalleryCategory', { title: 'В роботі', collectionType: 'in_progress' });
  };

  const handleCreateCollection = () => {
    Alert.alert(
      'Створити колекцію',
      'Ця функція буде доступна в наступній версії.',
      [{ text: 'OK' }]
    );
  };

  if (imageCount === 0) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <GalleryHeader title="Галерея" showBackButton={false} />
        <EmptyGalleryView />
        {(syncStatus !== 'synced' || pendingChanges > 0) && (
          <View style={styles.syncIndicatorContainer}>
            <SyncStatusIndicator />
          </View>
        )}
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

      <ScrollView 
        style={styles.scrollView}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            colors={['#007AFF']}
            tintColor="#007AFF"
          />
        }
      >
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

        {(syncStatus !== 'synced' || pendingChanges > 0 || !isConnected) && (
          <SyncStatusIndicator showDetails={true} />
        )}

        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Нещодавні</Text>
            <TouchableOpacity onPress={handleShowAllImages}>
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
              <TouchableOpacity 
                style={styles.collectionItem}
                onPress={handleShowFavorites}
              >
                <View style={[styles.collectionIcon, { backgroundColor: '#E3F2FD' }]}>
                  <Ionicons name="star" size={24} color="#2196F3" />
                </View>
                <Text style={styles.collectionName}>Улюблене</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.collectionItem}
                onPress={handleShowIdeas}
              >
                <View style={[styles.collectionIcon, { backgroundColor: '#E8F5E9' }]}>
                  <Ionicons name="bulb" size={24} color="#4CAF50" />
                </View>
                <Text style={styles.collectionName}>Ідеї</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.collectionItem}
                onPress={handleShowInProgress}
              >
                <View style={[styles.collectionIcon, { backgroundColor: '#FFF3E0' }]}>
                  <Ionicons name="construct" size={24} color="#FF9800" />
                </View>
                <Text style={styles.collectionName}>В роботі</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.collectionItem}
                onPress={handleCreateCollection}
              >
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
          
          <CategoryList 
            categories={categoriesWithCount} 
            onCategoryPress={handleCategoryPress}
            onManageCategories={() => navigation.navigate('GalleryManageCategories')}
          />
        </View>
      </ScrollView>

      {!isConnected && pendingChanges > 0 && (
        <View style={styles.offlineIndicator}>
          <Ionicons name="cloud-offline" size={16} color="#fff" />
          <Text style={styles.offlineText}>
            Офлайн режим: {pendingChanges} змін очікують на синхронізацію
          </Text>
        </View>
      )}

      {isConnected && pendingChanges > 0 && syncStatus !== 'syncing' && (
        <TouchableOpacity style={styles.syncButton} onPress={handleSync}>
          <Ionicons name="sync" size={20} color="#fff" />
          <Text style={styles.syncButtonText}>
            Синхронізувати зміни ({pendingChanges})
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
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 3,
  },
  syncButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  offlineIndicator: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FF9800',
    paddingVertical: 8,
    paddingHorizontal: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
  },
  offlineText: {
    color: '#fff',
    marginLeft: 8,
  },
  syncIndicatorContainer: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
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
