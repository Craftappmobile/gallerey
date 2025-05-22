import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSyncStatus } from '../../contexts/SyncContext';

const SyncStatusIndicator = ({ showDetails = false, onPress }) => {
  const { 
    isConnected, 
    syncStatus, 
    lastSynced,
    getFormattedLastSyncTime,
    pendingChanges, 
    synchronize,
    syncError,
    resetSyncError,
    autoSyncEnabled
  } = useSyncStatus();

  const handlePress = () => {
    if (onPress) {
      onPress();
    } else if (syncStatus === 'error') {
      resetSyncError();
    } else if (syncStatus !== 'syncing') {
      synchronize();
    }
  };

  if (syncStatus === 'synced' && pendingChanges === 0 && !showDetails) {
    // Don't show anything if everything is synced and we don't want details
    return null;
  }

  return (
    <TouchableOpacity 
      style={[
        styles.container,
        syncStatus === 'error' ? styles.errorContainer : 
        syncStatus === 'syncing' ? styles.syncingContainer : 
        !isConnected ? styles.offlineContainer : 
        pendingChanges > 0 ? styles.pendingContainer : 
        styles.syncedContainer
      ]}
      onPress={handlePress}
      disabled={syncStatus === 'syncing'}
    >
      {syncStatus === 'syncing' ? (
        <ActivityIndicator size="small" color="#fff" style={styles.icon} />
      ) : (
        <Ionicons 
          name={
            syncStatus === 'error' ? 'warning-outline' :
            !isConnected ? 'cloud-offline-outline' :
            pendingChanges > 0 ? 'cloud-upload-outline' :
            'checkmark-circle-outline'
          }
          size={16}
          color="#fff"
          style={styles.icon}
        />
      )}
      
      <Text style={styles.text}>
        {syncStatus === 'error' ? 'Помилка синхронізації' :
         syncStatus === 'syncing' ? 'Синхронізація...' :
         !isConnected ? 'Офлайн режим' :
         pendingChanges > 0 ? `Очікують синхронізації: ${pendingChanges}` :
         'Синхронізовано'}
      </Text>
      
      {showDetails && (
        <View style={styles.detailsContainer}>
          <Text style={styles.detailText}>
            Остання синхронізація: {getFormattedLastSyncTime()}
          </Text>
          
          {pendingChanges > 0 && isConnected && (
            <Text style={styles.detailText}>
              Зміни будуть синхронізовані {autoSyncEnabled ? 'автоматично' : 'при ручній синхронізації'}
            </Text>
          )}
          
          {syncStatus === 'error' && syncError && (
            <Text style={styles.errorText}>
              {syncError.message}
            </Text>
          )}
        </View>
      )}
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 8,
    borderRadius: 4,
    margin: 8,
  },
  syncingContainer: {
    backgroundColor: '#2196F3',
  },
  errorContainer: {
    backgroundColor: '#F44336',
  },
  offlineContainer: {
    backgroundColor: '#FF9800',
  },
  pendingContainer: {
    backgroundColor: '#9C27B0',
  },
  syncedContainer: {
    backgroundColor: '#4CAF50',
  },
  icon: {
    marginRight: 8,
  },
  text: {
    color: '#fff',
    fontWeight: '500',
  },
  detailsContainer: {
    marginTop: 8,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.3)',
    width: '100%',
  },
  detailText: {
    color: '#fff',
    fontSize: 12,
    marginBottom: 4,
  },
  errorText: {
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    marginTop: 4,
  },
});

export default SyncStatusIndicator;
