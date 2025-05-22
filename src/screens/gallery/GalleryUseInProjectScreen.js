import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, Alert, Modal } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';
import { Q } from '@nozbe/watermelondb';

const GalleryUseInProjectScreen = ({ navigation, route, database }) => {
  const imageId = route.params?.imageId;
  const [image, setImage] = useState(null);
  const [selectedProject, setSelectedProject] = useState('new');
  const [newProjectName, setNewProjectName] = useState('');
  const [usageTypes, setUsageTypes] = useState({
    main_image: true,
    reference: true,
    pattern: false,
    moodboard: false,
  });
  const [stage, setStage] = useState('pattern_selection');
  const [description, setDescription] = useState('');
  const [useReminder, setUseReminder] = useState(false);
  const [saveOriginalLink, setSaveOriginalLink] = useState(true);
  const [setupYarnCalculator, setSetupYarnCalculator] = useState(false);
  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [projects, setProjects] = useState([
    { id: 'in_progress_1', name: 'Светр "Осінь"', status: 'in_progress' },
    { id: 'not_started_1', name: 'Кардиган', status: 'not_started' },
  ]);

  useEffect(() => {
    const loadImage = async () => {
      if (imageId) {
        try {
          const imageRecord = await database.get('gallery_images').find(imageId);
          setImage(imageRecord);
          
          // Set default project name based on image name
          if (imageRecord && imageRecord.name) {
            setNewProjectName(`Проект: ${imageRecord.name}`);
          }
        } catch (error) {
          console.error('Error loading image:', error);
        }
      }
    };

    loadImage();
    
    // In a real app, load projects from database
    // const loadProjects = async () => {
    //   try {
    //     const projectRecords = await database.get('projects')
    //       .query(Q.or(
    //         Q.where('status', 'in_progress'),
    //         Q.where('status', 'not_started')
    //       ))
    //       .fetch();
    //     
    //     setProjects(projectRecords);
    //   } catch (error) {
    //     console.error('Error loading projects:', error);
    //   }
    // };
    // 
    // loadProjects();
  }, [imageId, database]);

  const handleCancel = () => {
    navigation.goBack();
  };

  const handleSave = async () => {
    try {
      if (selectedProject === 'new') {
        if (!newProjectName.trim()) {
          Alert.alert('Помилка', 'Будь ласка, введіть назву проекту.');
          return;
        }
        
        // In a real app, create a new project in the database
        // await database.write(async () => {
        //   const newProject = await database.get('projects').create(project => {
        //     project.name = newProjectName;
        //     project.status = 'not_started';
        //     project.userId = 'current-user-id'; // This would come from auth context
        //     project.syncStatus = 'created';
        //   });
        //   
        //   // Add image to project
        //   await database.get('gallery_image_projects').create(relation => {
        //     relation.imageId = imageId;
        //     relation.projectId = newProject.id;
        //     relation.usageType = Object.keys(usageTypes).find(key => usageTypes[key]) || 'reference';
        //     relation.syncStatus = 'created';
        //   });
        // });
      } else {
        // In a real app, add image to existing project
        // await database.write(async () => {
        //   await database.get('gallery_image_projects').create(relation => {
        //     relation.imageId = imageId;
        //     relation.projectId = selectedProject;
        //     relation.usageType = Object.keys(usageTypes).find(key => usageTypes[key]) || 'reference';
        //     relation.syncStatus = 'created';
        //   });
        // });
      }
      
      // Show success modal
      setShowSuccessModal(true);
    } catch (error) {
      console.error('Error creating project:', error);
      Alert.alert('Помилка', 'Не вдалося створити проект або додати зображення до проекту.');
    }
  };

  const handleToggleUsageType = (type) => {
    setUsageTypes({
      ...usageTypes,
      [type]: !usageTypes[type]
    });
  };

  const handleProjectSelect = (projectId) => {
    setSelectedProject(projectId);
  };

  const handleCloseSuccessModal = () => {
    setShowSuccessModal(false);
    navigation.goBack();
  };

  const handleGoToProject = () => {
    setShowSuccessModal(false);
    // Navigate to project details
    // navigation.navigate('ProjectDetails', { projectId: selectedProject });
    navigation.goBack();
  };

  if (!image) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelText}>Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Використати в проекті</Text>
          <TouchableOpacity disabled={true}>
            <Text style={[styles.saveText, { color: '#ccc' }]}>Зберегти</Text>
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <Text>Завантаження зображення...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleCancel}>
          <Text style={styles.cancelText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Використати в проекті</Text>
        <TouchableOpacity onPress={handleSave}>
          <Text style={styles.saveText}>Зберегти</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={styles.content}>
        <View style={styles.imagePreviewContainer}>
          <Image
            source={{ uri: image.localUri }}
            style={styles.imagePreview}
            contentFit="cover"
          />
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ОБРАТИ ПРОЕКТ:</Text>
          
          <TouchableOpacity
            style={[
              styles.projectOption,
              selectedProject === 'new' && styles.selectedProjectOption
            ]}
            onPress={() => handleProjectSelect('new')}
          >
            <View style={styles.radioButton}>
              {selectedProject === 'new' && <View style={styles.radioButtonInner} />}
            </View>
            <View style={styles.projectOptionContent}>
              <Text style={styles.projectOptionTitle}>Новий проект "{newProjectName}"</Text>
              {selectedProject === 'new' && (
                <TextInput
                  style={styles.projectNameInput}
                  value={newProjectName}
                  onChangeText={setNewProjectName}
                  placeholder="Введіть назву проекту"
                />
              )}
            </View>
          </TouchableOpacity>
          
          {projects.map(project => (
            <TouchableOpacity
              key={project.id}
              style={[
                styles.projectOption,
                selectedProject === project.id && styles.selectedProjectOption
              ]}
              onPress={() => handleProjectSelect(project.id)}
            >
              <View style={styles.radioButton}>
                {selectedProject === project.id && <View style={styles.radioButtonInner} />}
              </View>
              <View style={styles.projectOptionContent}>
                <Text style={styles.projectOptionTitle}>{project.name}</Text>
                <Text style={styles.projectOptionStatus}>
                  {project.status === 'in_progress' ? '(у процесі)' : '(не розпочато)'}
                </Text>
              </View>
            </TouchableOpacity>
          ))}
          
          <TouchableOpacity style={styles.otherProjectOption}>
            <Text style={styles.otherProjectText}>Інший проект...</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ЯК ВИКОРИСТАТИ:</Text>
          
          <View style={styles.usageOptionsContainer}>
            <TouchableOpacity
              style={styles.usageOption}
              onPress={() => handleToggleUsageType('main_image')}
            >
              <View style={styles.checkboxContainer}>
                {usageTypes.main_image ? (
                  <Ionicons name="checkbox" size={24} color="#007AFF" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#666" />
                )}
              </View>
              <Text style={styles.usageOptionText}>Основне фото проекту</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.usageOption}
              onPress={() => handleToggleUsageType('reference')}
            >
              <View style={styles.checkboxContainer}>
                {usageTypes.reference ? (
                  <Ionicons name="checkbox" size={24} color="#007AFF" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#666" />
                )}
              </View>
              <Text style={styles.usageOptionText}>Референс/натхнення</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.usageOption}
              onPress={() => handleToggleUsageType('pattern')}
            >
              <View style={styles.checkboxContainer}>
                {usageTypes.pattern ? (
                  <Ionicons name="checkbox" size={24} color="#007AFF" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#666" />
                )}
              </View>
              <Text style={styles.usageOptionText}>Схема</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.usageOption}
              onPress={() => handleToggleUsageType('moodboard')}
            >
              <View style={styles.checkboxContainer}>
                {usageTypes.moodboard ? (
                  <Ionicons name="checkbox" size={24} color="#007AFF" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#666" />
                )}
              </View>
              <Text style={styles.usageOptionText}>Moodboard</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>ДЕТАЛІ:</Text>
          
          <View style={styles.detailsForm}>
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Додати до етапу:</Text>
              <View style={styles.selectContainer}>
                <Text style={styles.selectText}>{stage === 'pattern_selection' ? 'Вибір візерунка' : stage}</Text>
                <Ionicons name="chevron-down" size={20} color="#666" />
              </View>
            </View>
            
            <View style={styles.formGroup}>
              <Text style={styles.formLabel}>Додати опис:</Text>
              <TextInput
                style={styles.descriptionInput}
                value={description}
                onChangeText={setDescription}
                placeholder="Опис використання зображення"
                multiline
              />
            </View>
            
            <TouchableOpacity
              style={styles.detailOption}
              onPress={() => setUseReminder(!useReminder)}
            >
              <View style={styles.checkboxContainer}>
                {useReminder ? (
                  <Ionicons name="checkbox" size={24} color="#007AFF" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#666" />
                )}
              </View>
              <Text style={styles.detailOptionText}>Додати нагадування щодо цього зображення</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.detailOption}
              onPress={() => setSaveOriginalLink(!saveOriginalLink)}
            >
              <View style={styles.checkboxContainer}>
                {saveOriginalLink ? (
                  <Ionicons name="checkbox" size={24} color="#007AFF" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#666" />
                )}
              </View>
              <Text style={styles.detailOptionText}>Зберегти посилання на оригінал</Text>
            </TouchableOpacity>
            
            <TouchableOpacity
              style={styles.detailOption}
              onPress={() => setSetupYarnCalculator(!setupYarnCalculator)}
            >
              <View style={styles.checkboxContainer}>
                {setupYarnCalculator ? (
                  <Ionicons name="checkbox" size={24} color="#007AFF" />
                ) : (
                  <Ionicons name="square-outline" size={24} color="#666" />
                )}
              </View>
              <Text style={styles.detailOptionText}>Налаштувати калькулятор пряжі на основі цього візерунка</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.actionButtonsContainer}>
          <TouchableOpacity 
            style={styles.cancelButton}
            onPress={handleCancel}
          >
            <Text style={styles.cancelButtonText}>СКАСУВАТИ</Text>
          </TouchableOpacity>
          
          {selectedProject === 'new' ? (
            <TouchableOpacity 
              style={styles.createButton}
              onPress={handleSave}
            >
              <Text style={styles.createButtonText}>СТВОРИТИ ПРОЕКТ</Text>
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={styles.addButton}
              onPress={handleSave}
            >
              <Text style={styles.addButtonText}>ДОДАТИ ДО ПРОЕКТУ</Text>
            </TouchableOpacity>
          )}
        </View>
      </ScrollView>

      <Modal
        visible={showSuccessModal}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCloseSuccessModal}
      >
        <View style={styles.modalOverlay}>
          <View style={styles.successModal}>
            <Ionicons name="checkmark-circle" size={60} color="#4CAF50" style={styles.successIcon} />
            
            <Text style={styles.successTitle}>
              {selectedProject === 'new' 
                ? 'Проект створено!' 
                : 'Додано до проекту!'}
            </Text>
            
            <Text style={styles.successMessage}>
              {selectedProject === 'new'
                ? `Зображення додано до нового проекту "${newProjectName}".`
                : `Зображення додано до проекту "${projects.find(p => p.id === selectedProject)?.name || 'Вибраний проект'}".`}
            </Text>
            
            <View style={styles.modalButtons}>
              <TouchableOpacity 
                style={styles.modalSecondaryButton}
                onPress={handleCloseSuccessModal}
              >
                <Text style={styles.modalSecondaryButtonText}>Закрити</Text>
              </TouchableOpacity>
              
              <TouchableOpacity 
                style={styles.modalPrimaryButton}
                onPress={handleGoToProject}
              >
                <Text style={styles.modalPrimaryButtonText}>Перейти до проекту</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
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
  saveText: {
    fontSize: 16,
    color: '#007AFF',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    flex: 1,
  },
  imagePreviewContainer: {
    height: 200,
    margin: 16,
    borderRadius: 8,
    overflow: 'hidden',
    backgroundColor: '#f0f0f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  section: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  sectionTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    marginBottom: 16,
    color: '#555',
  },
  projectOption: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: 16,
    padding: 12,
    borderRadius: 8,
    backgroundColor: '#f9f9f9',
  },
  selectedProjectOption: {
    backgroundColor: '#E3F2FD',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
    marginTop: 2,
  },
  radioButtonInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: '#007AFF',
  },
  projectOptionContent: {
    flex: 1,
  },
  projectOptionTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 4,
  },
  projectOptionStatus: {
    fontSize: 14,
    color: '#666',
    fontStyle: 'italic',
  },
  projectNameInput: {
    backgroundColor: '#fff',
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  otherProjectOption: {
    padding: 12,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    alignItems: 'center',
  },
  otherProjectText: {
    color: '#007AFF',
  },
  usageOptionsContainer: {
    marginBottom: 8,
  },
  usageOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  checkboxContainer: {
    marginRight: 12,
  },
  usageOptionText: {
    fontSize: 16,
  },
  detailsForm: {
    marginBottom: 8,
  },
  formGroup: {
    marginBottom: 16,
  },
  formLabel: {
    fontSize: 16,
    marginBottom: 8,
  },
  selectContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
  },
  selectText: {
    fontSize: 16,
  },
  descriptionInput: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    height: 80,
    textAlignVertical: 'top',
  },
  detailOption: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  detailOptionText: {
    fontSize: 16,
    flex: 1,
  },
  actionButtonsContainer: {
    flexDirection: 'row',
    padding: 16,
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
  createButton: {
    flex: 2,
    backgroundColor: '#4CAF50',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  createButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  addButton: {
    flex: 2,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  addButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  successModal: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 24,
    alignItems: 'center',
    width: '80%',
  },
  successIcon: {
    marginBottom: 16,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 12,
    textAlign: 'center',
  },
  successMessage: {
    fontSize: 16,
    textAlign: 'center',
    marginBottom: 24,
    color: '#666',
  },
  modalButtons: {
    flexDirection: 'row',
    width: '100%',
  },
  modalSecondaryButton: {
    flex: 1,
    backgroundColor: '#f0f0f0',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginRight: 8,
  },
  modalSecondaryButtonText: {
    color: '#666',
    fontWeight: '600',
  },
  modalPrimaryButton: {
    flex: 1,
    backgroundColor: '#007AFF',
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginLeft: 8,
  },
  modalPrimaryButtonText: {
    color: '#fff',
    fontWeight: '600',
  },
});

export default withDatabase(GalleryUseInProjectScreen);
