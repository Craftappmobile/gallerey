import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image as RNImage, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Image } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';
import { withDatabase } from '@nozbe/watermelondb/DatabaseProvider';

const GalleryCommunityScreen = ({ navigation, route, database }) => {
  const imageId = route.params?.imageId;
  const initialTab = route.params?.initialTab || 'overview';
  const [image, setImage] = useState(null);
  const [activeTab, setActiveTab] = useState(initialTab);
  const [commentText, setCommentText] = useState('');

  // Mock data
  const communityProjects = [
    { id: '1', username: 'marina_k', imageUrl: 'https://via.placeholder.com/150' },
    { id: '2', username: 'knitpro', imageUrl: 'https://via.placeholder.com/150' },
    { id: '3', username: 'svetr_ua', imageUrl: 'https://via.placeholder.com/150' },
    { id: '4', username: 'irina', imageUrl: 'https://via.placeholder.com/150' },
  ];

  const variations = [
    { id: '1', type: 'Шапка', icon: '🧣', imageUrl: 'https://via.placeholder.com/150' },
    { id: '2', type: 'Рукавиці', icon: '🧤', imageUrl: 'https://via.placeholder.com/150' },
    { id: '3', type: 'Шкарпетки', icon: '🧦', imageUrl: 'https://via.placeholder.com/150' },
    { id: '4', type: 'Дитячий', icon: '👶', imageUrl: 'https://via.placeholder.com/150' },
  ];

  const questions = [
    {
      id: '1',
      question: 'Чи підійде пряжа Drops Nepal для цього візерунка?',
      answer: 'Так, це ідеальний варіант для цього візерунка. Drops Nepal має хорошу структуру і відмінно підкреслює рельєф.',
    },
    {
      id: '2',
      question: 'Як адаптувати візерунок для розміру XL?',
      answer: 'Потрібно збільшити кількість петель, зберігаючи пропорції візерунка. Рекомендую додати по 10% з кожного боку.',
    },
  ];

  useEffect(() => {
    const loadImage = async () => {
      if (imageId) {
        try {
          const imageRecord = await database.get('gallery_images').find(imageId);
          setImage(imageRecord);
        } catch (error) {
          console.error('Error loading image:', error);
        }
      }
    };

    loadImage();
  }, [imageId, database]);

  const handleBack = () => {
    navigation.goBack();
  };

  const handleTabChange = (tab) => {
    setActiveTab(tab);
  };

  const handleShare = () => {
    // Implement share functionality
  };

  const handleFindMentor = () => {
    // Implement find mentor functionality
  };

  const handleAskQuestion = () => {
    // Implement ask question functionality
  };

  const handleShareResult = () => {
    // Implement share result functionality
  };

  const handleDiscuss = () => {
    // Implement discuss functionality
  };

  const handleSubmitComment = () => {
    if (commentText.trim()) {
      // In a real app, save the comment to the database
      setCommentText('');
    }
  };

  if (!image) {
    return (
      <SafeAreaView style={styles.container} edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backButton}>
            <Ionicons name="arrow-back" size={24} color="#000" />
            <Text style={styles.backText}>Назад</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Спільнота</Text>
          <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
            <Ionicons name="share-outline" size={24} color="#000" />
          </TouchableOpacity>
        </View>
        
        <View style={styles.loadingContainer}>
          <Text>Завантаження...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color="#000" />
          <Text style={styles.backText}>Назад</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Спільнота: {image.name}</Text>
        <TouchableOpacity onPress={handleShare} style={styles.shareButton}>
          <Ionicons name="share-outline" size={24} color="#000" />
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

        <View style={styles.tabsContainer}>
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'overview' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('overview')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'overview' && styles.activeTabButtonText
            ]}>Огляд</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'projects' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('projects')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'projects' && styles.activeTabButtonText
            ]}>Проекти</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'questions' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('questions')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'questions' && styles.activeTabButtonText
            ]}>Питання</Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.tabButton,
              activeTab === 'discuss' && styles.activeTabButton
            ]}
            onPress={() => handleTabChange('discuss')}
          >
            <Text style={[
              styles.tabButtonText,
              activeTab === 'discuss' && styles.activeTabButtonText
            ]}>Обговорення</Text>
          </TouchableOpacity>
        </View>

        {activeTab === 'overview' && (
          <>
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ПРОЕКТИ СПІЛЬНОТИ З ЦИМ ВІЗЕРУНКОМ (32)</Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.projectsScrollContent}
              >
                {communityProjects.map(project => (
                  <View key={project.id} style={styles.communityProjectItem}>
                    <View style={styles.communityProjectImageContainer}>
                      <Image
                        source={{ uri: project.imageUrl }}
                        style={styles.communityProjectImage}
                        contentFit="cover"
                      />
                      <View style={styles.communityProjectIconContainer}>
                        <Ionicons name="person" size={16} color="#fff" />
                      </View>
                    </View>
                    <Text style={styles.communityProjectUsername}>@{project.username}</Text>
                  </View>
                ))}
                
                <TouchableOpacity style={styles.viewAllButton}>
                  <Text style={styles.viewAllText}>Переглянути всі</Text>
                </TouchableOpacity>
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>АДАПТАЦІЇ ТА ВАРІАЦІЇ</Text>
              
              <ScrollView 
                horizontal 
                showsHorizontalScrollIndicator={false}
                contentContainerStyle={styles.variationsScrollContent}
              >
                {variations.map(variation => (
                  <View key={variation.id} style={styles.variationItem}>
                    <View style={styles.variationImageContainer}>
                      <Image
                        source={{ uri: variation.imageUrl }}
                        style={styles.variationImage}
                        contentFit="cover"
                      />
                      <View style={styles.variationIconContainer}>
                        <Text style={styles.variationIconText}>{variation.icon}</Text>
                      </View>
                    </View>
                    <Text style={styles.variationType}>{variation.type}</Text>
                  </View>
                ))}
              </ScrollView>
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ПОШИРЕНІ ЗАПИТАННЯ</Text>
              
              {questions.map(item => (
                <View key={item.id} style={styles.questionItem}>
                  <View style={styles.questionHeader}>
                    <Ionicons name="help-circle" size={20} color="#007AFF" />
                    <Text style={styles.questionText}>{item.question}</Text>
                  </View>
                  
                  <View style={styles.answerContainer}>
                    <Ionicons name="arrow-forward" size={16} color="#666" style={styles.answerIcon} />
                    <Text style={styles.answerText}>
                      {item.answer.length > 80 
                        ? item.answer.substring(0, 80) + '... (Читати далі)' 
                        : item.answer}
                    </Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.section}>
              <Text style={styles.sectionTitle}>ЗНАЙТИ ДОПОМОГУ:</Text>
              
              <View style={styles.helpButtonsContainer}>
                <TouchableOpacity 
                  style={styles.helpButton}
                  onPress={handleFindMentor}
                >
                  <Ionicons name="people" size={20} color="#007AFF" />
                  <Text style={styles.helpButtonText}>Знайти наставника</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.helpButton}
                  onPress={handleAskQuestion}
                >
                  <Ionicons name="help-circle" size={20} color="#4CAF50" />
                  <Text style={styles.helpButtonText}>Поставити питання</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.helpButton}
                  onPress={handleShareResult}
                >
                  <Ionicons name="stats-chart" size={20} color="#FF9800" />
                  <Text style={styles.helpButtonText}>Поділитися моїм результатом</Text>
                </TouchableOpacity>
                
                <TouchableOpacity 
                  style={styles.helpButton}
                  onPress={handleDiscuss}
                >
                  <Ionicons name="chatbubbles" size={20} color="#9C27B0" />
                  <Text style={styles.helpButtonText}>Обговорити</Text>
                </TouchableOpacity>
              </View>
            </View>
          </>
        )}

        {activeTab === 'projects' && (
          <View style={styles.projectsTabContent}>
            <Text style={styles.projectsTabTitle}>Проекти спільноти з цим візерунком (32)</Text>
            
            <View style={styles.projectsGrid}>
              {[...communityProjects, ...communityProjects].map((project, index) => (
                <View key={`${project.id}-${index}`} style={styles.projectGridItem}>
                  <Image
                    source={{ uri: project.imageUrl }}
                    style={styles.projectGridImage}
                    contentFit="cover"
                  />
                  <View style={styles.projectGridInfo}>
                    <Text style={styles.projectGridUsername}>@{project.username}</Text>
                    <Text style={styles.projectGridDate}>15.03.2025</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {activeTab === 'questions' && (
          <View style={styles.questionsTabContent}>
            <Text style={styles.questionsTabTitle}>Питання спільноти</Text>
            
            {questions.map(item => (
              <View key={item.id} style={styles.questionDetailItem}>
                <View style={styles.questionDetailHeader}>
                  <Ionicons name="help-circle" size={24} color="#007AFF" />
                  <Text style={styles.questionDetailText}>{item.question}</Text>
                </View>
                
                <View style={styles.answerDetailContainer}>
                  <Text style={styles.answerDetailText}>{item.answer}</Text>
                  
                  <View style={styles.answerMeta}>
                    <Text style={styles.answerAuthor}>Відповідь від @expert_knitter</Text>
                    <Text style={styles.answerDate}>12.03.2025</Text>
                  </View>
                  
                  <View style={styles.answerActions}>
                    <TouchableOpacity style={styles.answerActionButton}>
                      <Ionicons name="thumbs-up" size={16} color="#666" />
                      <Text style={styles.answerActionText}>15</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.answerActionButton}>
                      <Ionicons name="chatbubble" size={16} color="#666" />
                      <Text style={styles.answerActionText}>3</Text>
                    </TouchableOpacity>
                    
                    <TouchableOpacity style={styles.answerActionButton}>
                      <Text style={styles.replyText}>Відповісти</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))}
            
            <TouchableOpacity style={styles.askQuestionButton}>
              <Ionicons name="add-circle" size={20} color="#fff" />
              <Text style={styles.askQuestionButtonText}>Поставити своє питання</Text>
            </TouchableOpacity>
          </View>
        )}

        {activeTab === 'discuss' && (
          <View style={styles.discussTabContent}>
            <Text style={styles.discussTabTitle}>Обговорення</Text>
            
            <View style={styles.discussionThread}>
              <View style={styles.discussionComment}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthorContainer}>
                    <View style={styles.commentAvatar}>
                      <Text style={styles.commentAvatarText}>AK</Text>
                    </View>
                    <Text style={styles.commentAuthor}>@anna_knits</Text>
                  </View>
                  <Text style={styles.commentDate}>10.03.2025</Text>
                </View>
                
                <Text style={styles.commentText}>
                  Дуже гарний візерунок! Я спробувала зв'язати шапку за цією схемою, але трохи змінила кольори.
                </Text>
                
                <View style={styles.commentActions}>
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Ionicons name="heart-outline" size={16} color="#666" />
                    <Text style={styles.commentActionText}>12</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Ionicons name="chatbubble-outline" size={16} color="#666" />
                    <Text style={styles.commentActionText}>3</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Text style={styles.replyActionText}>Відповісти</Text>
                  </TouchableOpacity>
                </View>
              </View>
              
              <View style={styles.discussionReply}>
                <View style={styles.commentHeader}>
                  <View style={styles.commentAuthorContainer}>
                    <View style={[styles.commentAvatar, styles.replyAvatar]}>
                      <Text style={styles.commentAvatarText}>MK</Text>
                    </View>
                    <Text style={styles.commentAuthor}>@maria_knitter</Text>
                  </View>
                  <Text style={styles.commentDate}>11.03.2025</Text>
                </View>
                
                <Text style={styles.commentText}>
                  @anna_knits це чудово! Які кольори ви використали? Я теж хочу спробувати з іншими кольорами.
                </Text>
                
                <View style={styles.commentActions}>
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Ionicons name="heart-outline" size={16} color="#666" />
                    <Text style={styles.commentActionText}>5</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Ionicons name="chatbubble-outline" size={16} color="#666" />
                    <Text style={styles.commentActionText}>1</Text>
                  </TouchableOpacity>
                  
                  <TouchableOpacity style={styles.commentActionButton}>
                    <Text style={styles.replyActionText}>Відповісти</Text>
                  </TouchableOpacity>
                </View>
              </View>
            </View>
            
            <View style={styles.addCommentContainer}>
              <TextInput
                style={styles.commentInput}
                placeholder="Додайте коментар..."
                value={commentText}
                onChangeText={setCommentText}
                multiline
              />
              
              <TouchableOpacity 
                style={[
                  styles.submitCommentButton,
                  !commentText.trim() && styles.disabledSubmitButton
                ]}
                onPress={handleSubmitComment}
                disabled={!commentText.trim()}
              >
                <Ionicons 
                  name="send" 
                  size={20} 
                  color={commentText.trim() ? "#fff" : "#ccc"} 
                />
              </TouchableOpacity>
            </View>
          </View>
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
  backButton: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  backText: {
    marginLeft: 4,
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    flex: 1,
    textAlign: 'center',
  },
  shareButton: {
    width: 30,
    alignItems: 'center',
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
    backgroundColor: '#f0f0f0',
  },
  imagePreview: {
    width: '100%',
    height: '100%',
  },
  tabsContainer: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  tabButton: {
    flex: 1,
    paddingVertical: 12,
    alignItems: 'center',
  },
  activeTabButton: {
    borderBottomWidth: 2,
    borderBottomColor: '#007AFF',
  },
  tabButtonText: {
    color: '#666',
  },
  activeTabButtonText: {
    color: '#007AFF',
    fontWeight: '600',
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
  projectsScrollContent: {
    paddingRight: 16,
  },
  communityProjectItem: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  communityProjectImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  communityProjectImage: {
    width: '100%',
    height: '100%',
  },
  communityProjectIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(0, 0, 0, 0.6)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  communityProjectUsername: {
    fontSize: 12,
    textAlign: 'center',
  },
  viewAllButton: {
    width: 100,
    height: 80,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: '#ddd',
    borderStyle: 'dashed',
    justifyContent: 'center',
    alignItems: 'center',
  },
  viewAllText: {
    color: '#007AFF',
    textAlign: 'center',
  },
  variationsScrollContent: {
    paddingRight: 16,
  },
  variationItem: {
    width: 100,
    marginRight: 12,
    alignItems: 'center',
  },
  variationImageContainer: {
    width: 80,
    height: 80,
    borderRadius: 8,
    overflow: 'hidden',
    marginBottom: 8,
    position: 'relative',
  },
  variationImage: {
    width: '100%',
    height: '100%',
  },
  variationIconContainer: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
    borderRadius: 12,
    width: 24,
    height: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  variationIconText: {
    fontSize: 16,
  },
  variationType: {
    fontSize: 12,
    textAlign: 'center',
  },
  questionItem: {
    marginBottom: 16,
  },
  questionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  questionText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  answerContainer: {
    flexDirection: 'row',
    marginLeft: 28,
  },
  answerIcon: {
    marginRight: 8,
    marginTop: 2,
  },
  answerText: {
    fontSize: 14,
    color: '#666',
    flex: 1,
  },
  helpButtonsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  helpButton: {
    width: '48%',
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  helpButtonText: {
    marginLeft: 8,
    fontSize: 14,
  },
  projectsTabContent: {
    padding: 16,
  },
  projectsTabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  projectsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
  },
  projectGridItem: {
    width: '48%',
    marginBottom: 16,
  },
  projectGridImage: {
    width: '100%',
    height: 150,
    borderRadius: 8,
    marginBottom: 8,
  },
  projectGridInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  projectGridUsername: {
    fontSize: 14,
    fontWeight: '500',
  },
  projectGridDate: {
    fontSize: 12,
    color: '#666',
  },
  questionsTabContent: {
    padding: 16,
  },
  questionsTabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  questionDetailItem: {
    marginBottom: 24,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    paddingBottom: 16,
  },
  questionDetailHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 12,
  },
  questionDetailText: {
    fontSize: 16,
    fontWeight: '500',
    marginLeft: 8,
    flex: 1,
  },
  answerDetailContainer: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginLeft: 32,
  },
  answerDetailText: {
    fontSize: 14,
    marginBottom: 12,
  },
  answerMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  answerAuthor: {
    fontSize: 12,
    color: '#007AFF',
  },
  answerDate: {
    fontSize: 12,
    color: '#666',
  },
  answerActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  answerActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  answerActionText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#666',
  },
  replyText: {
    fontSize: 14,
    color: '#007AFF',
  },
  askQuestionButton: {
    backgroundColor: '#007AFF',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: 8,
    marginTop: 16,
  },
  askQuestionButtonText: {
    color: '#fff',
    fontWeight: '600',
    marginLeft: 8,
  },
  discussTabContent: {
    padding: 16,
  },
  discussTabTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 16,
  },
  discussionThread: {
    marginBottom: 16,
  },
  discussionComment: {
    backgroundColor: '#f9f9f9',
    borderRadius: 8,
    padding: 12,
    marginBottom: 12,
  },
  discussionReply: {
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 12,
    marginLeft: 24,
    marginBottom: 12,
    borderLeftWidth: 2,
    borderLeftColor: '#ddd',
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  commentAuthorContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  commentAvatar: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: '#007AFF',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 8,
  },
  replyAvatar: {
    backgroundColor: '#4CAF50',
  },
  commentAvatarText: {
    color: '#fff',
    fontWeight: '600',
  },
  commentAuthor: {
    fontSize: 14,
    fontWeight: '500',
  },
  commentDate: {
    fontSize: 12,
    color: '#666',
  },
  commentText: {
    fontSize: 14,
    marginBottom: 12,
  },
  commentActions: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: '#eee',
    paddingTop: 8,
  },
  commentActionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    marginRight: 16,
  },
  commentActionText: {
    fontSize: 14,
    marginLeft: 4,
    color: '#666',
  },
  replyActionText: {
    fontSize: 14,
    color: '#007AFF',
  },
  addCommentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f0f0',
    borderRadius: 8,
    padding: 8,
  },
  commentInput: {
    flex: 1,
    minHeight: 40,
    maxHeight: 100,
    paddingHorizontal: 8,
  },
  submitCommentButton: {
    backgroundColor: '#007AFF',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
  },
  disabledSubmitButton: {
    backgroundColor: '#ddd',
  },
});

export default withDatabase(GalleryCommunityScreen);
