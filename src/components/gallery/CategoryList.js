import React from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useNavigation } from '@react-navigation/native';

const CategoryList = ({ categories, onCategoryPress, onManageCategories }) => {
  const navigation = useNavigation();

  const handleCategoryPress = (category) => {
    if (onCategoryPress) {
      onCategoryPress(category);
    } else {
      navigation.navigate('GalleryCategory', { categoryId: category.id });
    }
  };

  const handleManagePress = () => {
    if (onManageCategories) {
      onManageCategories();
    } else {
      navigation.navigate('GalleryManageCategories');
    }
  };

  const getIconForCategory = (icon) => {
    // Default icons if not provided
    const defaultIcons = {
      'Светри': 'shirt-outline',
      'Шапки': 'glasses-outline',
      'Шкарпетки': 'footsteps-outline',
      'Схеми': 'grid-outline',
      'Візерунки': 'color-palette-outline',
      'Пряжа': 'infinite-outline',
      'Pinterest': 'logo-pinterest',
      'Instagram': 'logo-instagram',
    };

    if (icon && icon.startsWith('ion-')) {
      return icon.replace('ion-', '');
    }

    // Return icon based on category name or a default
    return defaultIcons[icon] || 'images-outline';
  };

  const renderCategoryItem = ({ item }) => {
    const iconName = getIconForCategory(item.icon || item.name);
    
    return (
      <TouchableOpacity
        style={styles.categoryItem}
        onPress={() => handleCategoryPress(item)}
        activeOpacity={0.7}
      >
        <View style={styles.iconContainer}>
          <Ionicons name={iconName} size={24} color="#007AFF" />
        </View>
        <Text style={styles.categoryName}>{item.name}</Text>
        <Text style={styles.itemCount}>({item.imageCount || 0})</Text>
        <Ionicons name="chevron-forward" size={20} color="#aaa" />
      </TouchableOpacity>
    );
  };

  const renderFooter = () => (
    <TouchableOpacity style={styles.manageButton} onPress={handleManagePress}>
      <Ionicons name="settings-outline" size={20} color="#666" />
      <Text style={styles.manageButtonText}>Керувати категоріями</Text>
    </TouchableOpacity>
  );

  if (!categories || categories.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Ionicons name="folder-open-outline" size={48} color="#ccc" />
        <Text style={styles.emptyText}>Немає категорій</Text>
        <TouchableOpacity style={styles.createButton} onPress={handleManagePress}>
          <Text style={styles.createButtonText}>Створити категорію</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <FlatList
        data={categories}
        renderItem={renderCategoryItem}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContainer}
        ListFooterComponent={renderFooter}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContainer: {
    padding: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  iconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#f0f0f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    flex: 1,
  },
  itemCount: {
    color: '#666',
    marginRight: 8,
  },
  manageButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 10,
    padding: 12,
    marginTop: 8,
  },
  manageButtonText: {
    marginLeft: 8,
    color: '#666',
    fontWeight: '500',
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
    marginBottom: 20,
  },
  createButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 20,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default CategoryList;
