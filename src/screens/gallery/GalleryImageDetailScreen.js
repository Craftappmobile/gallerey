import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, ScrollView, Modal, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import withObservables from '@nozbe/with-observables';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import * as Clipboard from 'expo-clipboard';

import GalleryHeader from '../../components/gallery/GalleryHeader';
import { useSyncStatus } from '../../contexts/SyncContext';

const GalleryImageDetailScreen = ({ navigation, route, database, image, notes }) => {
  const { isConnected } = useSyncStatus();
  const [isFavorite, setIsFavorite] = useState(false);
  const [tags, setTags] = useState([]);
  const [relatedProjects, setRelatedProjects] = useState([]);
  const [isOptionsModalVisible, setIsOptionsModalVisible] = useState(false);

  useEffect(() => {
    if (image) {
      // Increment view count
      database.write(async () => {
        await image.update(record => {
          record.viewCount = (record.viewCount || 0) + 1;
        });
      });

      // Load tags
      const loadTags = async () => {
        const imageTags = await database.get('gallery_image_tags')
          .query(Q.where('image_id', image.id))
          .fetch();
        
        const tagIds = imageTags.map(relation => relation.tagId);
        
        if (tagIds.length > 0) {
          const tagRecords = await database.get('gallery_tags')
            .query(Q.where('id', Q.oneOf(tagIds)))
            .fetch();
          
          setTags(tagRecords);
        }
      };

      // Load related projects
      const loadProjects = async () => {
        const projectRelations = await database.get('gallery_image_projects')
          .query(Q.where('image_id', image.id))
          .fetch();
        
        const projectIds = projectRelations.map(relation => relation.projectId);
        
        if (projectIds.length > 0) {
          // This would need an actual projects model to work
          // const projectRecords = await database.get('projects')
          //   .query(Q.where('id', Q.oneOf(projectIds)))
          //   .fetch();
          // 
          // setRelatedProjects(projectRecords);
        }
      };

      // Check if image is favorited
      const checkFavorite = async () => {
        const favorites = await database.get('gallery_favorites')
          .query(Q.where('image_id', image.id))
          .fetch();
        
        setIsFavorite(favorites.length > 0);
      };

      loadTags();
      loadProjects();
      checkFavorite();
    }
  }, [image, database]);

  const handleToggleFavorite = async () => {
    if (!image) return;

    try {
      await database.write(async () => {
        if (isFavorite) {
          // Remove from favorites
          const favorites = await database.get('gallery_favorites')
            .query(Q.where('image_id', image.id))
            .fetch();
          
          for (const favorite of favorites) {
            await favorite.destroyPermanently();
          }
        } else {
          // Add to favorites
          await database.get('gallery_favorites').create(record => {
            record.imageId = image.id;
            record.userId = 'current-user-id'; // This would come from auth context
            record.syncStatus = 'created';
          });
        }
      });

      setIsFavorite(!isFavorite);
    } catch (error) {
      console.error('Error toggling favorite:', error);
      Alert.alert('Помилка', 'Не вдалося змінити статус улюбленого');
    }
  };

  const handleAddNote = () => {
    navigation.navigate('GalleryAddNote', { imageId: image?.id });
  };

  const handleAddTag = () => {
    // Implement tag adding functionality
  };

  const handleUseInProject = () => {
    navigation.navigate('GalleryUseInProject', { imageId: image?.id });
  };

  const handleShareImage = async () => {
    // Implement share functionality
  };

  const handleAskCommunity = () => {
    navigation.navigate('GalleryCommunity', { imageId: image?.id });
  };

  const handleFindSimilar = () => {
    // Implement similar image search
  };

  const handleViewCommunityProjects = () => {
    navigation.navigate('GalleryCommunity', { imageId: image?.id, initialTab: 'projects' });
  };

  const handleOpenOptionsModal = () => {
    setIsOptionsModalVisible(true);
  };

  const handleCloseOptionsModal = () => {
    setIsOptionsModalVisible(false);
  };

  const handleDeleteImage = async () => {
    try {
      await database.write(async () => {
        await image.destroyPermanently();
      });
      navigation.goBack();
    } catch (error) {
      console.error('Error deleting image:', error);
      Alert.alert('Помилка', 'Не вдалося видалити зображення');
    }
  };

  const handleCopyOriginalLink = async () => {
    if (image?.sourceUrl) {
      await Clipboard.setStringAsync(image.sourceUrl);
      Alert.alert('Успішно', 'Посилання скопійовано в буфер обміну');
    }
  };

  const formatDate = (timestamp) => {
    if (!timestamp) return '';
    const date = new Date(timestamp);
    return date.toLocaleDateString();
  };

  if (!image) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <GalleryHeader title="Деталі зображення" showBackButton={true} showAddButton={false} />
        <View style={styles.loadingContainer}>
          <Text>Завантаження...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <GalleryHeader 
        title={image.name} 
        showBackButton={true} 
        showAddButton={false}
      />

      <ScrollView style={styles.scrollView}>
        <View style={styles.imageContainer}>
          <Image
            source={{ uri: image.localUri }}
            style={styles.image}
            contentFit="contain"
          />
          <TouchableOpacity 
            style={styles.favoriteButton} 
            onPress={handleToggleFavorite}
          >
            <Ionicons 
              name={isFavorite ? "heart" : "heart-outline"} 
              size={28} 
              color={isFavorite ? "#FF4081" : "#fff"} 
            />
          </TouchableOpacity>
        </View>

        <View style={styles.infoSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="information-circle-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>ІНФОРМАЦІЯ</Text>
          </View>
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Додано:</Text>
            <Text style={styles.infoValue}>{formatDate(image.createdAt)}</Text>
          </View>
          
          {image.sourceType && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Джерело:</Text>
              <Text style={styles.infoValue}>{image.displaySource}</Text>
            </View>
          )}
          
          {image.sourceAuthor && (
            <View style={styles.infoRow}>
              <Text style={styles.infoLabel}>Автор:</Text>
              <Text style={styles.infoValue}>@{image.sourceAuthor}</Text>
            </View>
          )}
          
          <View style={styles.infoRow}>
            <Text style={styles.infoLabel}>Переглянуто:</Text>
            <Text style={styles.infoValue}>{image.viewCount || 0} рази</Text>
          </View>
        </View>

        <View style={styles.tagsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="pricetag-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>МІТКИ</Text>
          </View>
          
          <View style={styles.tagsContainer}>
            {tags.length > 0 ? (
              <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                {tags.map(tag => (
                  <View key={tag.id} style={styles.tagItem}>
                    <Text style={styles.tagText}>#{tag.name}</Text>
                  </View>
                ))}
                <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                  <Text style={styles.addTagText}>+ Додати тег</Text>
                </TouchableOpacity>
              </ScrollView>
            ) : (
              <TouchableOpacity style={styles.addTagButton} onPress={handleAddTag}>
                <Text style={styles.addTagText}>+ Додати тег</Text>
              </TouchableOpacity>
            )}
          </View>
        </View>

        <View style={styles.notesSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="create-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>НОТАТКИ</Text>
          </View>
          
          {notes.length > 0 ? (
            notes.map(note => (
              <View key={note.id} style={styles.noteItem}>
                <Text style={styles.noteText}>{note.text}</Text>
                <Text style={styles.noteDate}>{formatDate(note.createdAt)}</Text>
              </View>
            ))
          ) : (
            <Text style={styles.emptyNotes}>Немає нотаток</Text>
          )}
          
          <TouchableOpacity style={styles.addNoteButton} onPress={handleAddNote}>
            <Text style={styles.addNoteText}>+ Додати нотатку</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.actionsSection}>
          <View style={styles.sectionHeader}>
            <Ionicons name="swap-horizontal-outline" size={20} color="#666" />
            <Text style={styles.sectionTitle}>ВИКОРИСТАТИ В:</Text>
          </View>
          
          <View style={styles.actionsGrid}>
            <TouchableOpacity style={styles.actionItem} onPress={handleUseInProject}>
              <Ionicons name="clipboard-outline" size={24} color="#2196F3" />
              <Text style={styles.actionText}>Проект</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="stats-chart-outline" size={24} color="#4CAF50" />
              <Text style={styles.actionText}>Розрахунок</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem}>
              <Ionicons name="color-palette-outline" size={24} color="#FF9800" />
              <Text style={styles.actionText}>Підібрати пряжу</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleShareImage}>
              <Ionicons name="share-social-outline" size={24} color="#9C27B0" />
              <Text style={styles.actionText}>Поділитися</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleAskCommunity}>
              <Ionicons name="chatbubbles-outline" size={24} color="#F44336" />
              <Text style={styles.actionText}>Запитати спільноту</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.actionItem} onPress={handleFindSimilar}>
              <Ionicons name="search-outline" size={24} color="#607D8B" />
              <Text style={styles.actionText}>Знайти схожі</Text>
            </TouchableOpacity>
          </View>
        </View>

        {image.isPublic && (
          <View style={styles.communitySection}>
            <View style={styles.sectionHeader}>
              <Ionicons name="people-outline" size={20} color="#666" />
              <Text style={styles.sectionTitle}>СПІЛЬНОТА</Text>
            </View>
            
            <View style={styles.communityStats}>
              <View style={styles.statItem}>
                <Text style={styles.statValue}>245</Text>
                <Text style={styles.statLabel}>Збережено</Text>
              </View>
              
              <View style={styles.statItem}>
                <Text style={styles.statValue}>32</Text>
                <Text style={styles.statLabel}>Виконано проектів</Text>
              </View>
              
              <View style={styles.statItem}>
                <View style={styles.difficultyContainer}>
                  <Ionicons name="star" size={16} color="#FFC107" />
                  <Ionicons name="star" size={16} color="#FFC107" />
                  <Ionicons name="star" size={16} color="#FFC107" />
                  <Ionicons name="star-outline" size={16} color="#FFC107" />
                  <Ionicons name="star-outline" size={16} color="#FFC107" />
                </View>
                <Text style={styles.statLabel}>Складність</Text>
              </View>
            </View>
            
            <TouchableOpacity 
              style={styles.viewCommunityButton}
              onPress={handleViewCommunityProjects}
            >
              <Ionicons name="eye-outline" size={20} color="#007AFF" />
              <Text style={styles.viewCommunityText}>Переглянути проекти спільноти</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={styles.socialFooter}>
          <TouchableOpacity style={styles.socialButton}>
            <Ionicons name="heart-outline" size={24} color="#666" />
            <Text style={styles.socialButtonText}>24</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton} onPress={handleAskCommunity}>
            <Ionicons name="chatbubble-outline" size={24} color="#666" />
            <Text style={styles.socialButtonText}>4</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton}>
            <Text style={styles.replyText}>відповісти</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton} onPress={handleCopyOriginalLink}>
            <Ionicons name="link-outline" size={24} color="#666" />
            <Text style={styles.socialButtonText}>Оригінал</Text>
          </TouchableOpacity>
          
          <TouchableOpacity style={styles.socialButton} onPress={handleShareImage}>
            <Ionicons name="arrow-redo-outline" size={24} color="#666" />
            <Text style={styles.socialButtonText}>Поширити</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.spacer} />
      </ScrollView>

      <TouchableOpacity 
        style={styles.optionsButton}
        onPress={handleOpenOptionsModal}
      >
        <Ionicons name="ellipsis-vertical" size={24} color="#000" />
      </TouchableOpacity>

      <Modal
        visible={isOptionsModalVisible}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseOptionsModal}
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCloseOptionsModal}
        >
          <View style={styles.modalContent}>
            <Text style={styles.modalTitle}>Опції зображення</Text>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => {
              handleCloseOptionsModal();
              handleAddTag();
            }}>
              <Ionicons name="pricetag-outline" size={24} color="#666" />
              <Text style={styles.modalOptionText}>Редагувати теги</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => {
              handleCloseOptionsModal();
              navigation.navigate('GalleryManageCategories', { imageId: image.id });
            }}>
              <Ionicons name="folder-outline" size={24} color="#666" />
              <Text style={styles.modalOptionText}>Перемістити в іншу категорію</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => {
              handleCloseOptionsModal();
              handleCopyOriginalLink();
            }}>
              <Ionicons name="link-outline" size={24} color="#666" />
              <Text style={styles.modalOptionText}>Копіювати посилання</Text>
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.modalOption} onPress={() => {
              handleCloseOptionsModal();
              // Navigate to edit image screen when implemented
            }}>
              <Ionicons name="create-outline" size={24} color="#666" />
              <Text style={styles.modalOptionText}>Редагувати інформацію</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.modalOption, styles.deleteOption]} 
              onPress={() => {
                handleCloseOptionsModal();
                Alert.alert(
                  'Видалити зображення',
                  'Ви впевнені, що хочете видалити це зображення?',
                  [
                    { text: 'Скасувати', style: 'cancel' },
                    { text: 'Видалити', onPress: handleDeleteImage, style: 'destructive' }
                  ]
                );
              }}
            >
              <Ionicons name="trash-outline" size={24} color="#F44336" />
              <Text style={styles.deleteOptionText}>Видалити зображення</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.closeButton}
              onPress={handleCloseOptionsModal}
            >
              <Text style={styles.closeButtonText}>Скасувати</Text>
            </TouchableOpacity>
          </View>
        </TouchableOpacity>
      </Modal>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f8f8',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  scrollView: {
    flex: 1,
  },
  imageContainer: {
    width: '100%',
    height: 300,
    backgroundColor: '#000',
    position: 'relative',
  },
  image: {
    width: '100%',
    height: '100%',
  },
  favoriteButton: {
    position: 'absolute',
    top: 16,
    right: 16,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    borderRadius: 20,
    padding: 8,
  },
  infoSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginLeft: 8,
    color: '#555',
  },
  infoRow: {
    flexDirection: 'row',
    marginBottom: 8,
  },
  infoLabel: {
    width: 120,
    fontSize: 14,
    color: '#666',
  },
  infoValue: {
    flex: 1,
    fontSize: 14,
  },
  tagsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
  },
  tagItem: {
    backgroundColor: '#E3F2FD',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
    marginRight: 8,
  },
  tagText: {
    color: '#2196F3',
    fontSize: 14,
  },
  addTagButton: {
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addTagText: {
    color: '#666',
    fontSize: 14,
  },
  notesSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  noteItem: {
    borderLeftWidth: 3,
    borderLeftColor: '#4CAF50',
    paddingLeft: 12,
    marginBottom: 12,
  },
  noteText: {
    fontSize: 14,
    marginBottom: 4,
  },
  noteDate: {
    fontSize: 12,
    color: '#666',
  },
  emptyNotes: {
    color: '#999',
    fontStyle: 'italic',
    marginBottom: 12,
  },
  addNoteButton: {
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: '#ccc',
    borderStyle: 'dashed',
    borderRadius: 16,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  addNoteText: {
    color: '#666',
    fontSize: 14,
  },
  actionsSection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  actionItem: {
    width: '30%',
    alignItems: 'center',
    marginBottom: 16,
  },
  actionText: {
    marginTop: 8,
    fontSize: 12,
    textAlign: 'center',
  },
  communitySection: {
    backgroundColor: '#fff',
    padding: 16,
    marginBottom: 8,
  },
  communityStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: 12,
    color: '#666',
  },
  difficultyContainer: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  viewCommunityButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  },
  viewCommunityText: {
    color: '#007AFF',
    marginLeft: 8,
    fontWeight: '500',
  },
  socialFooter: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 12,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  socialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  socialButtonText: {
    marginLeft: 4,
    fontSize: 14,
    color: '#666',
  },
  replyText: {
    color: '#007AFF',
    fontSize: 14,
  },
  spacer: {
    height: 20,
  },
  optionsButton: {
    position: 'absolute',
    top: 60,
    right: 16,
    padding: 8,
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    width: '80%',
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 20,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 20,
    textAlign: 'center',
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  modalOptionText: {
    marginLeft: 16,
    fontSize: 16,
  },
  deleteOption: {
    borderBottomWidth: 0,
  },
  deleteOptionText: {
    marginLeft: 16,
    fontSize: 16,
    color: '#F44336',
  },
  closeButton: {
    marginTop: 20,
    padding: 12,
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    alignItems: 'center',
  },
  closeButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
});

// Connect to WatermelonDB
const enhance = withObservables(['route'], ({ route, database }) => {
  const imageId = route.params?.imageId;
  
  return {
    image: imageId 
      ? database.get('gallery_images').findAndObserve(imageId)
      : null,
    notes: imageId
      ? database.get('gallery_notes')
          .query(Q.where('image_id', imageId), Q.sortBy('created_at', 'desc'))
          .observe()
      : [],
  };
});

export default withDatabase(enhance(GalleryImageDetailScreen));
