import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatus } from '../../contexts/SyncContext';

const GalleryHeader = ({ title, showBackButton = false, showAddButton = true, onAddPress }) => {
  const navigation = useNavigation();
  const { isConnected, syncStatus } = useSyncStatus();

  const handleBackPress = () => {
    navigation.goBack();
  };

  const handleAddPress = () => {
    if (onAddPress) {
      onAddPress();
    } else {
      navigation.navigate('GalleryAddImage');
    }
  };

  const handleSearchPress = () => {
    navigation.navigate('GallerySearch');
  };

  const handleFavoritesPress = () => {
    // Navigate to favorites screen when implemented
    // navigation.navigate('GalleryFavorites');
  };

  const handleNotificationsPress = () => {
    // Navigate to notifications screen when implemented
    // navigation.navigate('Notifications');
  };

  return (
    <View style={styles.container}>
      <View style={styles.leftSection}>
        {showBackButton && (
          <TouchableOpacity onPress={handleBackPress} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
            <Text style={styles.backText}>Назад</Text>
          </TouchableOpacity>
        )}
        {!showBackButton && <View style={styles.placeholder} />}
        <Text style={styles.title}>{title}</Text>
      </View>

      <View style={styles.rightSection}>
        <TouchableOpacity onPress={handleSearchPress} style={styles.iconButton}>
          <Ionicons name="search-outline" size={24} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleFavoritesPress} style={styles.iconButton}>
          <Ionicons name="heart-outline" size={24} color="#000" />
        </TouchableOpacity>
        
        <TouchableOpacity onPress={handleNotificationsPress} style={styles.iconButton}>
          <Ionicons name="notifications-outline" size={24} color="#000" />
        </TouchableOpacity>
        
        {showAddButton && (
          <TouchableOpacity onPress={handleAddPress} style={styles.iconButton}>
            <Ionicons name="camera" size={24} color="#000" />
            <Text style={styles.addButtonText}>+</Text>
          </TouchableOpacity>
        )}
      </View>

      {syncStatus !== 'synced' && (
        <View style={styles.syncIndicator}>
          <View 
            style={[
              styles.syncDot, 
              { backgroundColor: isConnected ? '#FFA500' : '#FF0000' }
            ]} 
          />
          <Text style={styles.syncText}>
            {syncStatus === 'syncing' 
              ? 'Синхронізація...' 
              : isConnected 
                ? 'Очікування синхронізації' 
                : 'Оффлайн режим'}
          </Text>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    height: 60,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    backgroundColor: '#fff',
  },
  leftSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 8,
  },
  backText: {
    fontSize: 16,
    marginLeft: 4,
  },
  title: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  placeholder: {
    width: 8,
  },
  rightSection: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  iconButton: {
    marginLeft: 16,
    position: 'relative',
  },
  addButtonText: {
    position: 'absolute',
    top: -8,
    right: -8,
    backgroundColor: '#007AFF',
    color: '#fff',
    width: 18,
    height: 18,
    borderRadius: 9,
    textAlign: 'center',
    lineHeight: 18,
    fontSize: 14,
  },
  syncIndicator: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
    padding: 2,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
  },
  syncDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  syncText: {
    color: '#fff',
    fontSize: 10,
  },
});

export default GalleryHeader;
