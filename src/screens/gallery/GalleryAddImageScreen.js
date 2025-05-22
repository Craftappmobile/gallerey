import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import * as ImagePicker from 'expo-image-picker';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { useNavigation } from '@react-navigation/native';

import GalleryHeader from '../../components/gallery/GalleryHeader';
import GalleryFileManager from '../../services/GalleryFileManager';

const GalleryAddImageScreen = ({ route, database }) => {
  const navigation = useNavigation();
  const initialTab = route.params?.initialTab || 'camera';
  const categoryId = route.params?.categoryId;
  const [activeTab, setActiveTab] = useState(initialTab);

  useEffect(() => {
    (async () => {
      // Request permissions on component mount
      if (Platform.OS !== 'web') {
        const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
        const galleryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
        
        if (cameraPermission.status !== 'granted' || galleryPermission.status !== 'granted') {
          Alert.alert(
            'Потрібні дозволи',
            'Для додавання зображень потрібен доступ до камери та галереї.',
            [{ text: 'OK' }]
          );
        }
      }
    })();
  }, []);

  const handleTabPress = (tab) => {
    setActiveTab(tab);
  };

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleTakePhoto = async () => {
    try {
      const fileManager = new GalleryFileManager(database);
      const result = await fileManager.takePhoto();
      
      if (result) {
        // If category is specified, add image to category
        if (categoryId) {
          await database.write(async () => {
            await database.get('gallery_image_categories').create(relation => {
              relation.imageId = result.id;
              relation.categoryId = categoryId;
              relation.syncStatus = 'created';
            });
          });
        }
        
        // Navigate to image detail
        navigation.replace('GalleryImageDetail', { imageId: result.id });
      }
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Помилка', 'Не вдалося зробити фото');
    }
  };

  const handlePickImage = async () => {
    try {
      const fileManager = new GalleryFileManager(database);
      const result = await fileManager.pickImageFromLibrary();
      
      if (result) {
        // If category is specified, add image to category
        if (categoryId) {
          await database.write(async () => {
            await database.get('gallery_image_categories').create(relation => {
              relation.imageId = result.id;
              relation.categoryId = categoryId;
              relation.syncStatus = 'created';
            });
          });
        }
        
        // Navigate to image detail
        navigation.replace('GalleryImageDetail', { imageId: result.id });
      }
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Помилка', 'Не вдалося вибрати зображення');
    }
  };

  const handleImportFromPinterest = () => {
    navigation.navigate('GalleryImportPinterest', { categoryId });
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Скасувати</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Додати в галерею</Text>
        <TouchableOpacity>
          <Text style={styles.doneText}>Готово</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ДОДАТИ З:</Text>
          <View style={styles.optionsGrid}>
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'camera' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('camera')}
            >
              <Ionicons 
                name="camera-outline" 
                size={24} 
                color={activeTab === 'camera' ? "#007AFF" : "#666"} 
              />
              <Text style={[
                styles.optionText,
                activeTab === 'camera' && styles.activeOptionText
              ]}>Камера</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'gallery' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('gallery')}
            >
              <Ionicons 
                name="images-outline" 
                size={24} 
                color={activeTab === 'gallery' ? "#007AFF" : "#666"} 
              />
              <Text style={[
                styles.optionText,
                activeTab === 'gallery' && styles.activeOptionText
              ]}>Галерея</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'screenshots' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('screenshots')}
            >
              <Ionicons 
                name="phone-portrait-outline" 
                size={24} 
                color={activeTab === 'screenshots' ? "#007AFF" : "#666"} 
              />
              <Text style={[
                styles.optionText,
                activeTab === 'screenshots' && styles.activeOptionText
              ]}>Скриншоти</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'files' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('files')}
            >
              <Ionicons 
                name="document-outline" 
                size={24} 
                color={activeTab === 'files' ? "#007AFF" : "#666"} 
              />
              <Text style={[
                styles.optionText,
                activeTab === 'files' && styles.activeOptionText
              ]}>Файли</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ІМПОРТ З:</Text>
          <View style={styles.optionsGrid}>
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'pinterest' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('pinterest')}
            >
              <Ionicons 
                name="logo-pinterest" 
                size={24} 
                color={activeTab === 'pinterest' ? "#E60023" : "#666"} 
              />
              <Text style={[
                styles.optionText,
                activeTab === 'pinterest' && { color: "#E60023" }
              ]}>Pinterest</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'instagram' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('instagram')}
            >
              <Ionicons 
                name="logo-instagram" 
                size={24} 
                color={activeTab === 'instagram' ? "#C13584" : "#666"} 
              />
              <Text style={[
                styles.optionText,
                activeTab === 'instagram' && { color: "#C13584" }
              ]}>Instagram</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'ravelry' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('ravelry')}
            >
              <Text style={[
                styles.optionLetterIcon,
                activeTab === 'ravelry' && { backgroundColor: "#EE6E62", color: "#fff" }
              ]}>R</Text>
              <Text style={[
                styles.optionText,
                activeTab === 'ravelry' && { color: "#EE6E62" }
              ]}>Ravelry</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[
                styles.optionButton,
                activeTab === 'etsy' && styles.activeOptionButton
              ]}
              onPress={() => handleTabPress('etsy')}
            >
              <Text style={[
                styles.optionLetterIcon,
                activeTab === 'etsy' && { backgroundColor: "#F56400", color: "#fff" }
              ]}>E</Text>
              <Text style={[
                styles.optionText,
                activeTab === 'etsy' && { color: "#F56400" }
              ]}>Etsy</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.tabContent}>
          {activeTab === 'camera' && (
            <View style={styles.tabSection}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handleTakePhoto}
              >
                <Ionicons name="camera" size={32} color="#fff" />
                <Text style={styles.actionButtonText}>Зробити фото</Text>
              </TouchableOpacity>
              <Text style={styles.tabDescription}>
                Сфотографуйте візерунок, готову роботу або схему прямо зараз
              </Text>
            </View>
          )}
          
          {activeTab === 'gallery' && (
            <View style={styles.tabSection}>
              <TouchableOpacity 
                style={styles.actionButton}
                onPress={handlePickImage}
              >
                <Ionicons name="images" size={32} color="#fff" />
                <Text style={styles.actionButtonText}>Вибрати з галереї</Text>
              </TouchableOpacity>
              <Text style={styles.tabDescription}>
                Виберіть зображення з галереї вашого пристрою
              </Text>
            </View>
          )}
          
          {activeTab === 'pinterest' && (
            <View style={styles.tabSection}>
              <TouchableOpacity 
                style={[styles.actionButton, { backgroundColor: '#E60023' }]}
                onPress={handleImportFromPinterest}
              >
                <Ionicons name="logo-pinterest" size={32} color="#fff" />
                <Text style={styles.actionButtonText}>Імпортувати з Pinterest</Text>
              </TouchableOpacity>
              <Text style={styles.tabDescription}>
                Вставте посилання на пін або оберіть кілька пінів одночасно
              </Text>
            </View>
          )}
          
          {/* Other tab contents would go here */}
        </View>

        <View style={styles.recentSection}>
          <Text style={styles.sectionTitle}>НЕЩОДАВНО ДОДАНІ:</Text>
          <Text style={styles.emptyText}>Немає нещодавно доданих зображень</Text>
        </View>

        <View style={styles.tipContainer}>
          <Text style={styles.tipText}>
            ПОРАДА: Для швидкого додавання фото з Pinterest просто вставте посилання на пін, а система витягне зображення
          </Text>
        </View>
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
  optionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  optionButton: {
    width: '23%',
    alignItems: 'center',
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f0f0f0',
  },
  activeOptionButton: {
    backgroundColor: '#E3F2FD',
  },
  optionText: {
    marginTop: 8,
    fontSize: 12,
    color: '#666',
  },
  activeOptionText: {
    color: '#007AFF',
  },
  optionLetterIcon: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#ddd',
    textAlign: 'center',
    textAlignVertical: 'center',
    fontSize: 14,
    fontWeight: 'bold',
    color: '#666',
  },
  tabContent: {
    padding: 16,
  },
  tabSection: {
    alignItems: 'center',
  },
  actionButton: {
    backgroundColor: '#007AFF',
    borderRadius: 12,
    paddingVertical: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
    marginBottom: 16,
    width: '70%',
  },
  actionButtonText: {
    color: '#fff',
    marginTop: 8,
    fontWeight: '600',
  },
  tabDescription: {
    textAlign: 'center',
    color: '#666',
    fontSize: 14,
  },
  recentSection: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  emptyText: {
    color: '#999',
    fontStyle: 'italic',
    textAlign: 'center',
    marginTop: 12,
  },
  tipContainer: {
    backgroundColor: '#f8f8f8',
    padding: 16,
    borderRadius: 8,
    margin: 16,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
  },
  tipText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});

export default withDatabase(GalleryAddImageScreen);
