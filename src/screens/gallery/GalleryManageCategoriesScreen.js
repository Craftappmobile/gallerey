import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, FlatList, TouchableOpacity, TextInput, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';
import DraggableFlatList from 'react-native-draggable-flatlist';

import GalleryHeader from '../../components/gallery/GalleryHeader';

const GalleryManageCategoriesScreen = ({ navigation, database }) => {
  const [categories, setCategories] = useState([]);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('shirt-outline');
  const [isPrivate, setIsPrivate] = useState(true);
  const [editingCategory, setEditingCategory] = useState(null);

  useEffect(() => {
    loadCategories();
  }, [database]);

  const loadCategories = async () => {
    try {
      const categoryRecords = await database.get('gallery_categories')
        .query(Q.sortBy('order_index', 'asc'))
        .fetch();
      
      setCategories(categoryRecords);
    } catch (error) {
      console.error('Error loading categories:', error);
    }
  };

  const handleDone = () => {
    navigation.goBack();
  };

  const handleCreateCategory = () => {
    setNewCategoryName('');
    setSelectedIcon('shirt-outline');
    setIsPrivate(true);
    setEditingCategory(null);
    setShowCreateModal(true);
  };

  const handleEditCategory = (category) => {
    setNewCategoryName(category.name);
    setSelectedIcon(category.icon || 'shirt-outline');
    setIsPrivate(!category.isPublic);
    setEditingCategory(category);
    setShowCreateModal(true);
  };

  const handleSaveCategory = async () => {
    if (!newCategoryName.trim()) {
      Alert.alert('Помилка', 'Будь ласка, введіть назву категорії.');
      return;
    }

    try {
      await database.write(async () => {
        if (editingCategory) {
          // Update existing category
          await editingCategory.update(record => {
            record.name = newCategoryName;
            record.icon = selectedIcon;
            record.isPublic = !isPrivate;
            record.syncStatus = 'updated';
          });
        } else {
          // Create new category
          await database.get('gallery_categories').create(record => {
            record.name = newCategoryName;
            record.icon = selectedIcon;
            record.orderIndex = categories.length;
            record.isVisible = true;
            record.isPublic = !isPrivate;
            record.isSystem = false;
            record.userId = 'current-user-id'; // This would come from auth context
            record.syncStatus = 'created';
          });
        }
      });

      setShowCreateModal(false);
      loadCategories();
    } catch (error) {
      console.error('Error saving category:', error);
      Alert.alert('Помилка', 'Не вдалося зберегти категорію.');
    }
  };

  const handleDeleteCategory = async (category) => {
    Alert.alert(
      'Видалити категорію',
      `Ви впевнені, що хочете видалити категорію "${category.name}"?`,
      [
        { text: 'Скасувати', style: 'cancel' },
        { 
          text: 'Видалити', 
          style: 'destructive',
          onPress: async () => {
            try {
              await database.write(async () => {
                // First, get all image-category relations for this category
                const relations = await database.get('gallery_image_categories')
                  .query(Q.where('category_id', category.id))
                  .fetch();
                
                // Delete all relations
                for (const relation of relations) {
                  await relation.destroyPermanently();
                }
                
                // Then delete the category
                await category.destroyPermanently();
              });
              
              loadCategories();
            } catch (error) {
              console.error('Error deleting category:', error);
              Alert.alert('Помилка', 'Не вдалося видалити категорію.');
            }
          }
        }
      ]
    );
  };

  const handleToggleVisibility = async (category) => {
    try {
      await database.write(async () => {
        await category.update(record => {
          record.isVisible = !record.isVisible;
          record.syncStatus = 'updated';
        });
      });
      
      loadCategories();
    } catch (error) {
      console.error('Error toggling visibility:', error);
    }
  };

  const handleDragEnd = async ({ data }) => {
    setCategories(data);
    
    try {
      await database.write(async () => {
        for (let i = 0; i < data.length; i++) {
          await data[i].update(record => {
            record.orderIndex = i;
            record.syncStatus = 'updated';
          });
        }
      });
    } catch (error) {
      console.error('Error reordering categories:', error);
      loadCategories(); // Reload original order on error
    }
  };

  const renderCategoryItem = ({ item, drag, isActive }) => {
    const isSystemCategory = item.isSystem;
    
    return (
      <TouchableOpacity
        style={[
          styles.categoryItem,
          isActive && styles.activeItem
        ]}
        onLongPress={drag}
        disabled={isActive}
      >
        <View style={styles.dragHandle}>
          <Ionicons name="reorder-three" size={24} color="#ccc" />
        </View>
        
        <View style={styles.categoryIcon}>
          <Ionicons name={item.icon || 'images-outline'} size={24} color="#007AFF" />
        </View>
        
        <Text style={styles.categoryName}>{item.name}</Text>
        
        <TouchableOpacity
          style={styles.editButton}
          onPress={() => handleEditCategory(item)}
          disabled={isSystemCategory}
        >
          <Ionicons 
            name="create-outline" 
            size={24} 
            color={isSystemCategory ? "#ccc" : "#666"} 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.visibilityButton}
          onPress={() => handleToggleVisibility(item)}
        >
          <Ionicons 
            name={item.isVisible ? "eye-outline" : "eye-off-outline"} 
            size={24} 
            color="#666" 
          />
        </TouchableOpacity>
        
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={() => handleDeleteCategory(item)}
          disabled={isSystemCategory}
        >
          <Ionicons 
            name="trash-outline" 
            size={24} 
            color={isSystemCategory ? "#ccc" : "#F44336"} 
          />
        </TouchableOpacity>
      </TouchableOpacity>
    );
  };

  const iconOptions = [
    'shirt-outline',
    'glasses-outline',
    'footsteps-outline',
    'grid-outline',
    'color-palette-outline',
    'infinite-outline',
    'bookmark-outline',
    'heart-outline',
    'star-outline',
    'images-outline',
    'image-outline',
    'folder-outline',
    'pricetag-outline',
    'bulb-outline',
  ];

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GalleryHeader 
        title="Керування категоріями" 
        showBackButton={true}
        showAddButton={false}
      />

      <View style={styles.content}>
        <View style={styles.instructionContainer}>
          <Text style={styles.instructionText}>
            Перетягніть категорії для зміни порядку. Натисніть на іконки для редагування, приховування або видалення.
          </Text>
        </View>
        
        <Text style={styles.sectionTitle}>МОЇ КАТЕГОРІЇ:</Text>
        
        <DraggableFlatList
          data={categories}
          renderItem={renderCategoryItem}
          keyExtractor={item => item.id}
          onDragEnd={handleDragEnd}
          contentContainerStyle={styles.listContainer}
        />
        
        <View style={styles.createCategorySection}>
          <Text style={styles.createCategoryTitle}>СТВОРИТИ НОВУ КАТЕГОРІЮ</Text>
          
          <TouchableOpacity 
            style={styles.createCategoryButton}
            onPress={handleCreateCategory}
          >
            <Ionicons name="add-circle-outline" size={24} color="#007AFF" />
            <Text style={styles.createCategoryText}>Створити категорію</Text>
          </TouchableOpacity>
        </View>
      </View>

      <TouchableOpacity 
        style={styles.doneButton}
        onPress={handleDone}
      >
        <Text style={styles.doneButtonText}>Готово</Text>
      </TouchableOpacity>

      <Modal
        visible={showCreateModal}
        transparent={true}
        animationType="fade"
        onRequestClose={() => setShowCreateModal(false)}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={() => setShowCreateModal(false)}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>
              {editingCategory ? 'Редагувати категорію' : 'Створити нову категорію'}
            </Text>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Назва:</Text>
              <TextInput
                style={styles.textInput}
                value={newCategoryName}
                onChangeText={setNewCategoryName}
                placeholder="Введіть назву категорії"
              />
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Іконка:</Text>
              <View style={styles.iconGrid}>
                {iconOptions.map(icon => (
                  <TouchableOpacity
                    key={icon}
                    style={[
                      styles.iconOption,
                      selectedIcon === icon && styles.selectedIconOption
                    ]}
                    onPress={() => setSelectedIcon(icon)}
                  >
                    <Ionicons 
                      name={icon} 
                      size={24} 
                      color={selectedIcon === icon ? "#fff" : "#666"} 
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Вид:</Text>
              <View style={styles.visibilityOptions}>
                <TouchableOpacity
                  style={styles.visibilityOption}
                  onPress={() => setIsPrivate(true)}
                >
                  <View style={styles.radioButton}>
                    {isPrivate && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.visibilityOptionText}>приватна</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.visibilityOption}
                  onPress={() => setIsPrivate(false)}
                >
                  <View style={styles.radioButton}>
                    {!isPrivate && <View style={styles.radioButtonInner} />}
                  </View>
                  <Text style={styles.visibilityOptionText}>публічна</Text>
                </TouchableOpacity>
              </View>
            </View>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.cancelModalButton}
                onPress={() => setShowCreateModal(false)}
              >
                <Text style={styles.cancelModalButtonText}>СКАСУВАТИ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.createModalButton}
                onPress={handleSaveCategory}
              >
                <Text style={styles.createModalButtonText}>
                  {editingCategory ? 'ЗБЕРЕГТИ' : 'СТВОРИТИ'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  content: {
    flex: 1,
    padding: 16,
  },
  instructionContainer: {
    backgroundColor: '#f5f5f5',
    padding: 12,
    borderRadius: 8,
    marginBottom: 20,
  },
  instructionText: {
    color: '#666',
    fontSize: 14,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#555',
  },
  listContainer: {
    paddingBottom: 16,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 8,
    padding: 12,
    marginBottom: 8,
    elevation: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
  },
  activeItem: {
    backgroundColor: '#E3F2FD',
    elevation: 8,
  },
  dragHandle: {
    marginRight: 8,
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
  categoryName: {
    flex: 1,
    fontSize: 16,
  },
  editButton: {
    marginHorizontal: 4,
    padding: 4,
  },
  visibilityButton: {
    marginHorizontal: 4,
    padding: 4,
  },
  deleteButton: {
    marginHorizontal: 4,
    padding: 4,
  },
  createCategorySection: {
    marginTop: 20,
  },
  createCategoryTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 12,
    color: '#555',
  },
  createCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 16,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  createCategoryText: {
    marginLeft: 8,
    fontSize: 16,
    color: '#007AFF',
  },
  doneButton: {
    margin: 16,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  doneButtonText: {
    color: '#fff',
    fontWeight: '600',
    fontSize: 16,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
    width: '100%',
    maxWidth: 500,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    fontSize: 16,
  },
  iconGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: 8,
  },
  iconOption: {
    width: 50,
    height: 50,
    justifyContent: 'center',
    alignItems: 'center',
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
    margin: 4,
  },
  selectedIconOption: {
    backgroundColor: '#007AFF',
  },
  visibilityOptions: {
    flexDirection: 'row',
    marginTop: 8,
  },
  visibilityOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 24,
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  radioButtonInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: '#007AFF',
  },
  visibilityOptionText: {
    fontSize: 16,
  },
  modalButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 20,
  },
  cancelModalButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelModalButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  createModalButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  createModalButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default withDatabase(GalleryManageCategoriesScreen);
