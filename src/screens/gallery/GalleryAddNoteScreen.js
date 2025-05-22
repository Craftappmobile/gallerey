import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, Modal, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import DateTimePicker from '@react-native-community/datetimepicker';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';

const GalleryAddNoteScreen = ({ navigation, route, database }) => {
  const imageId = route.params?.imageId;
  const [image, setImage] = useState(null);
  const [noteText, setNoteText] = useState('');
  const [showReminder, setShowReminder] = useState(false);
  const [reminderDate, setReminderDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [attachToProject, setAttachToProject] = useState(false);
  const [selectedProject, setSelectedProject] = useState(null);
  const [showProjectSelector, setShowProjectSelector] = useState(false);
  const [projects, setProjects] = useState([]);
  const [showShareModal, setShowShareModal] = useState(false);

  useEffect(() => {
    const loadImage = async () => {
      if (imageId) {
        const imageRecord = await database.get('gallery_images').find(imageId);
        setImage(imageRecord);
      }
    };

    const loadProjects = async () => {
      // This would need actual projects model
      // const projectRecords = await database.get('projects')
      //   .query(Q.where('status', Q.notEq('completed')))
      //   .fetch();
      
      // setProjects(projectRecords);
      
      // Placeholder for demo
      setProjects([
        { id: 'project1', name: 'Светр "Осінь"', status: 'in_progress' },
        { id: 'project2', name: 'Кардиган', status: 'not_started' },
      ]);
    };

    loadImage();
    loadProjects();
  }, [imageId, database]);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    if (!noteText.trim()) {
      Alert.alert('Помилка', 'Будь ласка, введіть текст нотатки.');
      return;
    }

    try {
      await database.write(async () => {
        await database.get('gallery_notes').create(note => {
          note.imageId = imageId;
          note.userId = 'current-user-id'; // This would come from auth context
          note.text = noteText;
          note.reminderDate = showReminder ? reminderDate.getTime() : null;
          note.attachedProjectId = attachToProject && selectedProject ? selectedProject.id : null;
          note.isPublic = false;
          note.syncStatus = 'created';
        });
      });

      // Show share modal after saving
      setShowShareModal(true);
    } catch (error) {
      console.error('Error saving note:', error);
      Alert.alert('Помилка', 'Не вдалося зберегти нотатку.');
    }
  };

  const handleToggleReminder = () => {
    setShowReminder(!showReminder);
  };

  const handleToggleProject = () => {
    setAttachToProject(!attachToProject);
    if (!attachToProject && projects.length > 0) {
      setSelectedProject(projects[0]);
    } else {
      setSelectedProject(null);
    }
  };

  const handleDateChange = (event, date) => {
    setShowDatePicker(false);
    if (date) {
      setReminderDate(date);
    }
  };

  const handleSelectProject = (project) => {
    setSelectedProject(project);
    setShowProjectSelector(false);
  };

  const handleShareInCommunity = () => {
    // Implement share in community logic
    setShowShareModal(false);
    navigation.goBack();
  };

  const handleSaveWithoutSharing = () => {
    setShowShareModal(false);
    navigation.goBack();
  };

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <KeyboardAvoidingView 
        style={styles.keyboardAvoidingContainer}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={100}
      >
        <View style={styles.modal}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Додати нотатку до фото</Text>
          </View>
          
          {image && (
            <View style={styles.imagePreviewContainer}>
              <Image
                source={{ uri: image.localUri }}
                style={styles.imagePreview}
                contentFit="cover"
              />
              <Text style={styles.imageName}>{image.name}</Text>
            </View>
          )}
          
          <View style={styles.formContainer}>
            <Text style={styles.formLabel}>Текст нотатки:</Text>
            <TextInput
              style={styles.noteInput}
              placeholder="Напишіть свою нотатку тут..."
              value={noteText}
              onChangeText={setNoteText}
              multiline
              textAlignVertical="top"
            />
            
            <View style={styles.optionsContainer}>
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleToggleReminder}
              >
                <Ionicons 
                  name={showReminder ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={showReminder ? "#007AFF" : "#666"} 
                />
                <Text style={styles.optionText}>Створити нагадування</Text>
              </TouchableOpacity>
              
              {showReminder && (
                <TouchableOpacity 
                  style={styles.datePickerButton}
                  onPress={() => setShowDatePicker(true)}
                >
                  <Ionicons name="calendar-outline" size={20} color="#007AFF" />
                  <Text style={styles.dateText}>
                    {reminderDate.toLocaleDateString()}
                  </Text>
                </TouchableOpacity>
              )}
              
              <TouchableOpacity 
                style={styles.optionItem}
                onPress={handleToggleProject}
              >
                <Ionicons 
                  name={attachToProject ? "checkbox" : "square-outline"} 
                  size={24} 
                  color={attachToProject ? "#007AFF" : "#666"} 
                />
                <Text style={styles.optionText}>Прикріпити до проекту</Text>
              </TouchableOpacity>
              
              {attachToProject && (
                <TouchableOpacity 
                  style={styles.projectSelector}
                  onPress={() => setShowProjectSelector(true)}
                >
                  <Text style={styles.projectText}>
                    {selectedProject ? selectedProject.name : 'Виберіть проект'}
                  </Text>
                  <Ionicons name="chevron-down" size={20} color="#666" />
                </TouchableOpacity>
              )}
            </View>
          </View>
          
          <View style={styles.buttonContainer}>
            <TouchableOpacity 
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <Text style={styles.cancelButtonText}>СКАСУВАТИ</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={styles.saveButton}
              onPress={handleSave}
            >
              <Text style={styles.saveButtonText}>ЗБЕРЕГТИ</Text>
            </TouchableOpacity>
          </View>
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={reminderDate}
            mode="date"
            display="default"
            onChange={handleDateChange}
          />
        )}

        <Modal
          visible={showProjectSelector}
          transparent={true}
          animationType="slide"
          onRequestClose={() => setShowProjectSelector(false)}
        >
          <TouchableOpacity 
            style={styles.modalOverlay}
            activeOpacity={1}
            onPress={() => setShowProjectSelector(false)}
          >
            <View style={styles.projectSelectorModal}>
              <Text style={styles.projectSelectorTitle}>Виберіть проект</Text>
              
              <ScrollView style={styles.projectList}>
                {projects.map(project => (
                  <TouchableOpacity
                    key={project.id}
                    style={[
                      styles.projectItem,
                      selectedProject && selectedProject.id === project.id && styles.selectedProjectItem
                    ]}
                    onPress={() => handleSelectProject(project)}
                  >
                    <Text style={styles.projectItemText}>{project.name}</Text>
                    {selectedProject && selectedProject.id === project.id && (
                      <Ionicons name="checkmark" size={20} color="#007AFF" />
                    )}
                  </TouchableOpacity>
                ))}
              </ScrollView>
              
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={() => setShowProjectSelector(false)}
              >
                <Text style={styles.closeButtonText}>Закрити</Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </Modal>

        <Modal
          visible={showShareModal}
          transparent={true}
          animationType="fade"
          onRequestClose={() => setShowShareModal(false)}
        >
          <View style={styles.shareModalOverlay}>
            <View style={styles.shareModal}>
              <Ionicons name="checkmark-circle" size={48} color="#4CAF50" style={styles.successIcon} />
              <Text style={styles.successText}>Нотатку збережено!</Text>
              <Text style={styles.sharePromptText}>Бажаєте поширити цю нотатку у спільноті?</Text>
              
              <View style={styles.shareButtonsContainer}>
                <TouchableOpacity 
                  style={styles.shareButton}
                  onPress={handleShareInCommunity}
                >
                  <Ionicons name="share-social" size={20} color="#fff" />
                  <Text style={styles.shareButtonText}>Поширити</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.notNowButton}
                  onPress={handleSaveWithoutSharing}
                >
                  <Text style={styles.notNowButtonText}>Не зараз</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </Modal>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  keyboardAvoidingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  modal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '100%',
    maxHeight: '80%',
    padding: 20,
  },
  modalHeader: {
    alignItems: 'center',
    marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  imagePreviewContainer: {
    alignItems: 'center',
    marginBottom: 16,
  },
  imagePreview: {
    width: 100,
    height: 100,
    borderRadius: 8,
  },
  imageName: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '500',
  },
  formContainer: {
    marginBottom: 20,
  },
  formLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 8,
  },
  noteInput: {
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    padding: 12,
    height: 100,
    marginBottom: 16,
  },
  optionsContainer: {
    marginBottom: 16,
  },
  optionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  optionText: {
    marginLeft: 8,
    fontSize: 16,
  },
  datePickerButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 32,
    marginBottom: 12,
  },
  dateText: {
    marginLeft: 8,
    color: '#007AFF',
  },
  projectSelector: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 8,
    marginLeft: 32,
    marginBottom: 12,
  },
  projectText: {
    color: '#007AFF',
  },
  buttonContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  cancelButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  cancelButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  saveButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  saveButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  projectSelectorModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    padding: 20,
    maxHeight: '80%',
  },
  projectSelectorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
    textAlign: 'center',
  },
  projectList: {
    maxHeight: 300,
  },
  projectItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  selectedProjectItem: {
    backgroundColor: '#E3F2FD',
  },
  projectItemText: {
    fontSize: 16,
  },
  closeButton: {
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  closeButtonText: {
    fontWeight: '600',
  },
  shareModalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  shareModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    width: '80%',
    padding: 20,
    alignItems: 'center',
  },
  successIcon: {
    marginBottom: 16,
  },
  successText: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  sharePromptText: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  shareButtonsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
  },
  shareButton: {
    flex: 1,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'center',
    marginRight: 8,
  },
  shareButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  notNowButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  notNowButtonText: {
    fontWeight: '600',
  },
});

export default withDatabase(GalleryAddNoteScreen);
