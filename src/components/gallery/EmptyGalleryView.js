import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';

const EmptyGalleryView = () => {
  const navigation = useNavigation();

  const handleTakePhoto = () => {
    navigation.navigate('GalleryAddImage', { initialTab: 'camera' });
  };

  const handleChooseFromGallery = () => {
    navigation.navigate('GalleryAddImage', { initialTab: 'gallery' });
  };

  const handleImportFromPinterest = () => {
    navigation.navigate('GalleryImportPinterest');
  };

  const handleImportFile = () => {
    navigation.navigate('GalleryAddImage', { initialTab: 'file' });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Ваша галерея поки що порожня</Text>
      <Text style={styles.subtitle}>Додайте перші зображення одним із способів:</Text>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleTakePhoto}>
          <Ionicons name="camera-outline" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>ЗРОБИТИ ФОТО</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleChooseFromGallery}>
          <Ionicons name="images-outline" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>ВИБРАТИ З ГАЛЕРЕЇ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.buttonContainer}>
        <TouchableOpacity style={styles.button} onPress={handleImportFromPinterest}>
          <Ionicons name="logo-pinterest" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>ІМПОРТУВАТИ З PINTEREST</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.button} onPress={handleImportFile}>
          <Ionicons name="cloud-upload-outline" size={24} color="#007AFF" />
          <Text style={styles.buttonText}>ІМПОРТУВАТИ ФАЙЛ</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.categoriesSection}>
        <Text style={styles.categoriesTitle}>ЗАПРОПОНОВАНІ КАТЕГОРІЇ ДЛЯ ПОЧАТКУ:</Text>
        
        <TouchableOpacity style={styles.categoryInput}>
          <Ionicons name="create-outline" size={24} color="#666" />
          <Text style={styles.categoryInputText}>Створити категорію "Введіть назву.."</Text>
        </TouchableOpacity>
      </View>

      <View style={styles.tipContainer}>
        <Text style={styles.tipText}>
          ПОРАДА: Почніть з імпорту ваших улюблених ідей з Pinterest або додайте фото ваших завершених проектів з галереї телефону
        </Text>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#fff',
  },
  title: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    color: '#666',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 20,
  },
  button: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    padding: 15,
    borderRadius: 10,
    alignItems: 'center',
    margin: 5,
    flexDirection: 'column',
  },
  buttonText: {
    marginTop: 10,
    color: '#007AFF',
    fontWeight: '600',
    textAlign: 'center',
    fontSize: 12,
  },
  categoriesSection: {
    width: '100%',
    marginTop: 20,
    marginBottom: 20,
  },
  categoriesTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 15,
    color: '#555',
  },
  categoryInput: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    padding: 15,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
  },
  categoryInputText: {
    marginLeft: 10,
    color: '#666',
    flex: 1,
  },
  tipContainer: {
    backgroundColor: '#f8f8f8',
    padding: 15,
    borderRadius: 10,
    borderLeftWidth: 4,
    borderLeftColor: '#007AFF',
    marginTop: 20,
    width: '100%',
  },
  tipText: {
    fontSize: 13,
    color: '#555',
    lineHeight: 20,
  },
});

export default EmptyGalleryView;
