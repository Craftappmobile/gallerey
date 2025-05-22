import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Image, Alert, Linking } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { useSupabase } from '../../contexts/SupabaseContext';
import GalleryFileManager from '../../services/GalleryFileManager';

const GalleryImportPinterestScreen = ({ navigation, route, database }) => {
  const { supabase } = useSupabase();
  const categoryId = route.params?.categoryId;
  const [pinUrl, setPinUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [imageData, setImageData] = useState(null);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [options, setOptions] = useState({
    saveOriginalLink: true,
    addAttribution: true,
    addToFavorites: false,
    anonymous: false
  });

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleFetchImage = async () => {
    if (!pinUrl.trim()) {
      Alert.alert('Помилка', 'Будь ласка, введіть посилання на пін.');
      return;
    }

    if (!pinUrl.includes('pin.it') && !pinUrl.includes('pinterest.com')) {
      Alert.alert('Помилка', 'Будь ласка, введіть коректне посилання на Pinterest.');
      return;
    }

    setIsLoading(true);

    try {
      // Call the Pinterest import edge function
      const { data, error } = await supabase.functions.invoke('pinterest-import', {
        body: { url: pinUrl }
      });

      if (error) {
        throw new Error(`Помилка імпорту: ${error.message}`);
      }

      if (!data || !data.imageUrl) {
        throw new Error('Не вдалося отримати зображення з цього посилання.');
      }

      setImageData(data);
      
      // Auto-select the category if provided in route params
      if (categoryId) {
        setSelectedCategories([categoryId]);
      }
    } catch (error) {
      console.error('Error fetching image:', error);
      Alert.alert('Помилка', error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleCategory = (categoryId) => {
    if (selectedCategories.includes(categoryId)) {
      setSelectedCategories(selectedCategories.filter(id => id !== categoryId));
    } else {
      setSelectedCategories([...selectedCategories, categoryId]);
    }
  };

  const handleToggleOption = (option) => {
    setOptions({
      ...options,
      [option]: !options[option]
    });
  };

  const handleOpenPinterest = () => {
    Linking.openURL('https://pinterest.com');
  };

  const handleSave = async () => {
    if (!imageData || !imageData.imageUrl) {
      Alert.alert('Помилка', 'Немає зображення для збереження.');
      return;
    }

    if (selectedCategories.length === 0) {
      Alert.alert('Помилка', 'Будь ласка, виберіть хоча б одну категорію.');
      return;
    }

    setIsLoading(true);

    try {
      const fileManager = new GalleryFileManager(database);
      
      // Import image from URL
      const importedImage = await fileManager.importImageFromUrl(
        imageData.imageUrl,
        'pinterest',
        imageData.authorName,
        imageData.title
      );
      
      // Add additional metadata
      await database.write(async () => {
        await importedImage.update(image => {
          image.sourceUrl = options.saveOriginalLink ? pinUrl : null;
          image.description = imageData.description || '';
          
          // Create JSON metadata
          const metadata = {
            importDate: new Date().toISOString(),
            sourceType: 'pinterest',
            attribution: options.addAttribution ? imageData.authorName : null,
            anonymous: options.anonymous,
            ...imageData
          };
          
          image.metadata = JSON.stringify(metadata);
        });
        
        // Add to selected categories
        for (const catId of selectedCategories) {
          await database.get('gallery_image_categories').create(relation => {
            relation.imageId = importedImage.id;
            relation.categoryId = catId;
            relation.syncStatus = 'created';
          });
        }
        
        // Add to favorites if selected
        if (options.addToFavorites) {
          await database.get('gallery_favorites').create(favorite => {
            favorite.imageId = importedImage.id;
            favorite.userId = 'current-user-id'; // This would come from auth context
            favorite.syncStatus = 'created';
          });
        }
      });
      
      navigation.replace('GalleryImageDetail', { imageId: importedImage.id });
    } catch (error) {
      console.error('Error saving image:', error);
      Alert.alert('Помилка', 'Не вдалося зберегти зображення.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddMore = () => {
    // Reset state for adding another image
    setPinUrl('');
    setImageData(null);
    setSelectedCategories(categoryId ? [categoryId] : []);
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Скасувати</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Імпорт з Pinterest</Text>
        <TouchableOpacity onPress={handleSave} disabled={!imageData || isLoading}>
          <Text style={[
            styles.doneText,
            (!imageData || isLoading) && styles.disabledText
          ]}>Готово</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>СПОСІБ 1: ВСТАВТЕ ПОСИЛАННЯ НА ПІН</Text>
          <View style={styles.urlInputContainer}>
            <TextInput
              style={styles.urlInput}
              placeholder="https://pin.it/abc123def456"
              value={pinUrl}
              onChangeText={setPinUrl}
              autoCapitalize="none"
              autoCorrect={false}
              keyboardType="url"
            />
          </View>
          
          <TouchableOpacity 
            style={[
              styles.fetchButton,
              isLoading && styles.disabledButton
            ]}
            onPress={handleFetchImage}
            disabled={isLoading}
          >
            {isLoading ? (
              <Text style={styles.fetchButtonText}>ОТРИМУЮ ЗОБРАЖЕННЯ...</Text>
            ) : (
              <Text style={styles.fetchButtonText}>ОТРИМАТИ ЗОБРАЖЕННЯ</Text>
            )}
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>СПОСІБ 2: ВИБЕРІТЬ КІЛЬКА ПІНІВ ОДНОЧАСНО</Text>
          
          <View style={styles.stepsContainer}>
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>1.</Text>
              <Text style={styles.stepText}>Відкрийте дошку в додатку Pinterest</Text>
            </View>
            
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>2.</Text>
              <Text style={styles.stepText}>Оберіть піни (довге натискання → вибір)</Text>
            </View>
            
            <View style={styles.stepItem}>
              <Text style={styles.stepNumber}>3.</Text>
              <Text style={styles.stepText}>Натисніть "Поділитися" → "В'язальний асистент"</Text>
            </View>
          </View>
          
          <TouchableOpacity 
            style={styles.openPinterestButton}
            onPress={handleOpenPinterest}
          >
            <Ionicons name="logo-pinterest" size={20} color="#fff" />
            <Text style={styles.openPinterestText}>ВІДКРИТИ PINTEREST</Text>
          </TouchableOpacity>
        </View>

        {imageData && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ВИЯВЛЕНО ЗОБРАЖЕННЯ:</Text>
              
              <View style={styles.imagePreviewContainer}>
                <Image
                  source={{ uri: imageData.imageUrl }}
                  style={styles.imagePreview}
                  resizeMode="cover"
                />
              </View>
              
              <View style={styles.imageInfoContainer}>
                <Text style={styles.imageTitle}>✓ {imageData.title || 'Зображення з Pinterest'}</Text>
                {imageData.authorName && (
                  <Text style={styles.imageAuthor}>Автор: @{imageData.authorName}</Text>
                )}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ВИБЕРІТЬ КАТЕГОРІЇ:</Text>
              
              <View style={styles.categoriesContainer}>
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategories.includes('sweaters') && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleToggleCategory('sweaters')}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategories.includes('sweaters') && styles.selectedCategoryText
                  ]}>Светри</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategories.includes('patterns') && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleToggleCategory('patterns')}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategories.includes('patterns') && styles.selectedCategoryText
                  ]}>Схеми</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategories.includes('designs') && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleToggleCategory('designs')}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategories.includes('designs') && styles.selectedCategoryText
                  ]}>Візерунки</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategories.includes('hats') && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleToggleCategory('hats')}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategories.includes('hats') && styles.selectedCategoryText
                  ]}>Шапки</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={[
                    styles.categoryItem,
                    selectedCategories.includes('yarn') && styles.selectedCategoryItem
                  ]}
                  onPress={() => handleToggleCategory('yarn')}
                >
                  <Text style={[
                    styles.categoryText,
                    selectedCategories.includes('yarn') && styles.selectedCategoryText
                  ]}>Пряжа</Text>
                </TouchableOpacity>
                
                <TouchableOpacity style={styles.createCategoryItem}>
                  <Text style={styles.createCategoryText}>Створити: [________]</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ДОДАТКОВІ ОПЦІЇ:</Text>
              
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleToggleOption('saveOriginalLink')}
                >
                  <View style={styles.checkboxContainer}>
                    {options.saveOriginalLink ? (
                      <Ionicons name="checkbox" size={24} color="#007AFF" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#666" />
                    )}
                  </View>
                  <Text style={styles.optionText}>Зберегти посилання на оригінал</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleToggleOption('addAttribution')}
                >
                  <View style={styles.checkboxContainer}>
                    {options.addAttribution ? (
                      <Ionicons name="checkbox" size={24} color="#007AFF" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#666" />
                    )}
                  </View>
                  <Text style={styles.optionText}>Додати атрибуцію автора</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleToggleOption('addToFavorites')}
                >
                  <View style={styles.checkboxContainer}>
                    {options.addToFavorites ? (
                      <Ionicons name="checkbox" size={24} color="#007AFF" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#666" />
                    )}
                  </View>
                  <Text style={styles.optionText}>Додати до колекції "Улюблене"</Text>
                </TouchableOpacity>
                
                <TouchableOpacity
                  style={styles.optionItem}
                  onPress={() => handleToggleOption('anonymous')}
                >
                  <View style={styles.checkboxContainer}>
                    {options.anonymous ? (
                      <Ionicons name="checkbox" size={24} color="#007AFF" />
                    ) : (
                      <Ionicons name="square-outline" size={24} color="#666" />
                    )}
                  </View>
                  <Text style={styles.optionText}>Анонімне зберігання (не показувати в соціальних функціях)</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.actionButtonsContainer}>
              <TouchableOpacity 
                style={styles.saveButton}
                onPress={handleSave}
                disabled={isLoading}
              >
                <Text style={styles.saveButtonText}>ЗБЕРЕГТИ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.addMoreButton}
                onPress={handleAddMore}
                disabled={isLoading}
              >
                <Text style={styles.addMoreButtonText}>ДОДАТИ ЩЕ</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.cancelButton}
                onPress={handleCancel}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>СКАСУВАТИ</Text>
              </TouchableOpacity>
            </View>
          </>
        )}
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
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  cancelText: {
    fontSize: 16,
    color: '#666',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  doneText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  disabledText: {
    color: '#ccc',
  },
  content: {
    flex: 1,
  },
  section: {
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
  urlInputContainer: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    marginBottom: 16,
  },
  urlInput: {
    fontSize: 16,
  },
  fetchButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
  },
  disabledButton: {
    backgroundColor: '#ccc',
  },
  fetchButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  stepsContainer: {
    marginBottom: 16,
  },
  stepItem: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  stepNumber: {
    fontWeight: 'bold',
    marginRight: 8,
    width: 20,
  },
  stepText: {
    flex: 1,
  },
  openPinterestButton: {
    backgroundColor: '#E60023',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
  },
  openPinterestText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  imagePreviewContainer: {
    height: 200,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 12,
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  imageInfoContainer: {
    marginBottom: 8,
  },
  imageTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  imageAuthor: {
    fontSize: 14,
    color: '#666',
  },
  categoriesContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
  },
  categoryItem: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
  },
  selectedCategoryItem: {
    backgroundColor: '#E3F2FD',
  },
  categoryText: {
    color: '#666',
  },
  selectedCategoryText: {
    color: '#007AFF',
  },
  createCategoryItem: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 16,
    marginRight: 8,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  createCategoryText: {
    color: '#666',
  },
  optionsContainer: {
    marginBottom: 8,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  checkboxContainer: {
    marginRight: 8,
  },
  optionText: {
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
    justifyContent: 'space-between',
  },
  saveButton: {
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addMoreButton: {
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  addMoreButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
});

export default withDatabase(GalleryImportPinterestScreen);
