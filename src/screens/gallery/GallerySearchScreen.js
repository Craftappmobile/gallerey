import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';

import GalleryImageGrid from '../../components/gallery/GalleryImageGrid';

const GallerySearchScreen = ({ navigation, route, database }) => {
  const initialQuery = route.params?.query || '';
  const [searchQuery, setSearchQuery] = useState(initialQuery);
  const [searchResults, setSearchResults] = useState({
    images: [],
    tags: [],
    categories: [],
    projects: []
  });
  const [activeFilter, setActiveFilter] = useState('all');
  const [recentSearches, setRecentSearches] = useState([]);
  const [showFilterOptions, setShowFilterOptions] = useState(false);
  const [sortBy, setSortBy] = useState('date');
  const [isSearching, setIsSearching] = useState(false);

  useEffect(() => {
    loadRecentSearches();
    
    if (initialQuery) {
      handleSearch(initialQuery);
    }
  }, [initialQuery]);

  const loadRecentSearches = async () => {
    // In a real app, load from AsyncStorage or similar
    setRecentSearches([
      'норвезький',
      'светр',
      'шапка',
      'візерунок'
    ]);
  };

  const handleSearch = async (query = searchQuery) => {
    if (!query.trim()) {
      setSearchResults({
        images: [],
        tags: [],
        categories: [],
        projects: []
      });
      return;
    }
    
    setIsSearching(true);
    
    try {
      // Search in images
      const imageResults = await database.get('gallery_images')
        .query(
          Q.or(
            Q.where('name', Q.like(`%${query}%`)),
            Q.where('description', Q.like(`%${query}%`))
          )
        )
        .fetch();
      
      // Search in tags
      const tagResults = await database.get('gallery_tags')
        .query(
          Q.where('name', Q.like(`%${query}%`))
        )
        .fetch();
      
      // Search in categories
      const categoryResults = await database.get('gallery_categories')
        .query(
          Q.where('name', Q.like(`%${query}%`))
        )
        .fetch();
      
      // Set search results
      setSearchResults({
        images: imageResults,
        tags: tagResults,
        categories: categoryResults,
        projects: [] // This would require a projects model
      });
      
      // Save to recent searches
      if (query.trim() && !recentSearches.includes(query.trim())) {
        const newRecentSearches = [query.trim(), ...recentSearches.slice(0, 4)];
        setRecentSearches(newRecentSearches);
        // In a real app, save to AsyncStorage or similar
      }
    } catch (error) {
      console.error('Error searching:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleFilterChange = (filter) => {
    setActiveFilter(filter);
    setShowFilterOptions(false);
  };

  const handleSortByChange = (sort) => {
    setSortBy(sort);
    
    // Re-sort the results
    setSearchResults(prev => {
      const sortedImages = [...prev.images];
      
      if (sort === 'date') {
        sortedImages.sort((a, b) => b.createdAt - a.createdAt);
      } else if (sort === 'name') {
        sortedImages.sort((a, b) => a.name.localeCompare(b.name));
      } else if (sort === 'views') {
        sortedImages.sort((a, b) => (b.viewCount || 0) - (a.viewCount || 0));
      }
      
      return {
        ...prev,
        images: sortedImages
      };
    });
  };

  const handleRecentSearchPress = (query) => {
    setSearchQuery(query);
    handleSearch(query);
  };

  const handleImagePress = (image) => {
    navigation.navigate('GalleryImageDetail', { imageId: image.id });
  };

  const handleTagPress = (tag) => {
    // Navigate to tag search results
    setSearchQuery(`#${tag.name}`);
    handleSearch(`#${tag.name}`);
  };

  const handleCategoryPress = (category) => {
    navigation.navigate('GalleryCategory', { categoryId: category.id });
  };

  const handleClearSearch = () => {
    setSearchQuery('');
    setSearchResults({
      images: [],
      tags: [],
      categories: [],
      projects: []
    });
  };

  const handleBackPress = () => {
    navigation.goBack();
  };

  const getTotalResultsCount = () => {
    return (
      searchResults.images.length + 
      searchResults.tags.length + 
      searchResults.categories.length + 
      searchResults.projects.length
    );
  };

  const getFilteredResults = () => {
    if (activeFilter === 'all') {
      return searchResults.images;
    } else if (activeFilter === 'images') {
      return searchResults.images;
    } else if (activeFilter === 'patterns') {
      return searchResults.images.filter(image => 
        image.metadata && 
        JSON.parse(image.metadata).type === 'pattern'
      );
    } else if (activeFilter === 'sweaters') {
      // This would require categories to be attached to images
      return searchResults.images.filter(image => 
        image.metadata && 
        JSON.parse(image.metadata).category === 'sweater'
      );
    } else if (activeFilter === 'hats') {
      return searchResults.images.filter(image => 
        image.metadata && 
        JSON.parse(image.metadata).category === 'hat'
      );
    }
    
    return searchResults.images;
  };

  const renderSearchContent = () => {
    const totalResults = getTotalResultsCount();
    
    if (isSearching) {
      return (
        <View style={styles.loadingContainer}>
          <Text>Пошук...</Text>
        </View>
      );
    }
    
    if (searchQuery.trim() && totalResults === 0) {
      return (
        <View style={styles.noResultsContainer}>
          <Ionicons name="search" size={64} color="#ddd" />
          <Text style={styles.noResultsText}>
            Нічого не знайдено за запитом "{searchQuery}"
          </Text>
          <Text style={styles.noResultsSuggestion}>
            Спробуйте змінити пошуковий запит або використайте інші ключові слова.
          </Text>
        </View>
      );
    }
    
    if (!searchQuery.trim()) {
      return (
        <View style={styles.recentSearchesContainer}>
          <Text style={styles.recentSearchesTitle}>Нещодавні пошуки</Text>
          
          {recentSearches.map((query, index) => (
            <TouchableOpacity 
              key={index} 
              style={styles.recentSearchItem}
              onPress={() => handleRecentSearchPress(query)}
            >
              <Ionicons name="time-outline" size={20} color="#666" />
              <Text style={styles.recentSearchText}>{query}</Text>
              <Ionicons name="arrow-forward" size={20} color="#ccc" />
            </TouchableOpacity>
          ))}
          
          <Text style={styles.popularSearchesTitle}>Популярні пошуки</Text>
          
          <View style={styles.popularTagsContainer}>
            <TouchableOpacity style={styles.popularTag}>
              <Text style={styles.popularTagText}>#норвезький_візерунок</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.popularTag}>
              <Text style={styles.popularTagText}>#светр</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.popularTag}>
              <Text style={styles.popularTagText}>#шапка</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.popularTag}>
              <Text style={styles.popularTagText}>#схема</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.popularTag}>
              <Text style={styles.popularTagText}>#мериносова_пряжа</Text>
            </TouchableOpacity>
          </View>
        </View>
      );
    }
    
    return (
      <View style={styles.searchResultsContainer}>
        <View style={styles.searchResultsHeader}>
          <Text style={styles.searchResultsTitle}>
            Знайдено: {totalResults} результатів
          </Text>
          
          <View style={styles.filtersContainer}>
            <TouchableOpacity 
              style={styles.filterButton}
              onPress={() => setShowFilterOptions(!showFilterOptions)}
            >
              <Text style={styles.filterButtonText}>
                {activeFilter === 'all' ? 'Всі' : 
                 activeFilter === 'images' ? 'Зображення' :
                 activeFilter === 'patterns' ? 'Схеми' :
                 activeFilter === 'sweaters' ? 'Светри' :
                 activeFilter === 'hats' ? 'Шапки' : 'Фільтр'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.sortButton}>
              <Text style={styles.sortButtonText}>
                {sortBy === 'date' ? 'За датою' :
                 sortBy === 'name' ? 'За назвою' :
                 sortBy === 'views' ? 'За переглядами' : 'Сортувати'}
              </Text>
              <Ionicons name="chevron-down" size={16} color="#666" />
            </TouchableOpacity>
          </View>
          
          {showFilterOptions && (
            <View style={styles.filterOptionsContainer}>
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === 'all' && styles.activeFilterOption
                ]}
                onPress={() => handleFilterChange('all')}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilter === 'all' && styles.activeFilterOptionText
                ]}>Всі</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === 'images' && styles.activeFilterOption
                ]}
                onPress={() => handleFilterChange('images')}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilter === 'images' && styles.activeFilterOptionText
                ]}>Зображення</Text>
                <Text style={styles.filterOptionCount}>({searchResults.images.length})</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === 'patterns' && styles.activeFilterOption
                ]}
                onPress={() => handleFilterChange('patterns')}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilter === 'patterns' && styles.activeFilterOptionText
                ]}>Схеми</Text>
                <Text style={styles.filterOptionCount}>(0)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === 'sweaters' && styles.activeFilterOption
                ]}
                onPress={() => handleFilterChange('sweaters')}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilter === 'sweaters' && styles.activeFilterOptionText
                ]}>Светри</Text>
                <Text style={styles.filterOptionCount}>(0)</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.filterOption,
                  activeFilter === 'hats' && styles.activeFilterOption
                ]}
                onPress={() => handleFilterChange('hats')}
              >
                <Text style={[
                  styles.filterOptionText,
                  activeFilter === 'hats' && styles.activeFilterOptionText
                ]}>Шапки</Text>
                <Text style={styles.filterOptionCount}>(0)</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>
        
        {searchResults.tags.length > 0 && (
          <View style={styles.tagsSection}>
            <Text style={styles.sectionTitle}>ТЕГИ ({searchResults.tags.length})</Text>
            
            <ScrollView 
              horizontal 
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.tagsScrollContent}
            >
              {searchResults.tags.map(tag => (
                <TouchableOpacity 
                  key={tag.id} 
                  style={styles.tagItem}
                  onPress={() => handleTagPress(tag)}
                >
                  <Text style={styles.tagText}>#{tag.name}</Text>
                  <Text style={styles.tagCount}>(27)</Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
        
        {searchResults.categories.length > 0 && (
          <View style={styles.categoriesSection}>
            <Text style={styles.sectionTitle}>КАТЕГОРІЇ ({searchResults.categories.length})</Text>
            
            {searchResults.categories.map(category => (
              <TouchableOpacity 
                key={category.id} 
                style={styles.categoryItem}
                onPress={() => handleCategoryPress(category)}
              >
                <View style={styles.categoryIcon}>
                  <Ionicons name={category.icon || 'folder-outline'} size={24} color="#007AFF" />
                </View>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryItemCount}>15 зображень</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
        
        {searchResults.images.length > 0 && (
          <View style={styles.imagesSection}>
            <Text style={styles.sectionTitle}>ЗОБРАЖЕННЯ ({searchResults.images.length})</Text>
            
            <GalleryImageGrid
              images={getFilteredResults()}
              numColumns={2}
              onImagePress={handleImagePress}
            />
          </View>
        )}
        
        {searchResults.projects.length > 0 && (
          <View style={styles.projectsSection}>
            <Text style={styles.sectionTitle}>ПРОЕКТИ ({searchResults.projects.length})</Text>
            
            {searchResults.projects.map(project => (
              <TouchableOpacity 
                key={project.id} 
                style={styles.projectItem}
              >
                <View style={styles.projectInfo}>
                  <Text style={styles.projectName}>{project.name}</Text>
                  <Text style={styles.projectStatus}>
                    {project.status === 'in_progress' ? 'У процесі' : 'Не розпочато'}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#ccc" />
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
        </TouchableOpacity>
        
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#666" style={styles.searchIcon} />
          <TextInput
            style={styles.searchInput}
            placeholder="Пошук у галереї..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={() => handleSearch()}
            returnKeyType="search"
            autoFocus={!initialQuery}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={handleClearSearch} style={styles.clearButton}>
              <Ionicons name="close-circle" size={18} color="#999" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content}>
        {renderSearchContent()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  backButton: {
    marginRight: 12,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
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
  clearButton: {
    padding: 4,
  },
  content: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  noResultsContainer: {
    padding: 40,
    alignItems: 'center',
  },
  noResultsText: {
    fontSize: 16,
    fontWeight: '500',
    marginTop: 16,
    marginBottom: 8,
  },
  noResultsSuggestion: {
    fontSize: 14,
    color: '#666',
    textAlign: 'center',
  },
  recentSearchesContainer: {
    padding: 16,
  },
  recentSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  recentSearchItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  recentSearchText: {
    flex: 1,
    fontSize: 16,
    marginLeft: 12,
  },
  popularSearchesTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginTop: 24,
    marginBottom: 12,
  },
  popularTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  popularTag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  popularTagText: {
    color: '#007AFF',
  },
  searchResultsContainer: {
    flex: 1,
  },
  searchResultsHeader: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  searchResultsTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginBottom: 12,
  },
  filtersContainer: {
    flexDirection: 'row',
  },
  filterButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  filterButtonText: {
    marginRight: 4,
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
  },
  sortButtonText: {
    marginRight: 4,
  },
  filterOptionsContainer: {
    backgroundColor: '#fff',
    marginTop: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#eee',
  },
  filterOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  activeFilterOption: {
    backgroundColor: '#E3F2FD',
  },
  filterOptionText: {
    fontSize: 16,
  },
  activeFilterOptionText: {
    color: '#007AFF',
    fontWeight: '500',
  },
  filterOptionCount: {
    color: '#666',
  },
  tagsSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#555',
  },
  tagsScrollContent: {
    paddingBottom: 8,
  },
  tagItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#E3F2FD',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 16,
    marginRight: 8,
  },
  tagText: {
    color: '#2196F3',
  },
  tagCount: {
    color: '#666',
    marginLeft: 4,
    fontSize: 12,
  },
  categoriesSection: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
  },
  categoryItemCount: {
    color: '#666',
    fontSize: 12,
  },
  imagesSection: {
    padding: 16,
  },
  projectsSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  projectItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  projectInfo: {
    flex: 1,
  },
  projectName: {
    fontSize: 16,
    fontWeight: '500',
  },
  projectStatus: {
    color: '#666',
    fontSize: 12,
  },
});

export default withDatabase(GallerySearchScreen);
