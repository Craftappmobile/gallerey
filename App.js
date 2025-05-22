import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

// Import screens
import GalleryScreen from './src/screens/gallery/GalleryScreen';
import GalleryCategoryScreen from './src/screens/gallery/GalleryCategoryScreen';
import GalleryImageDetailScreen from './src/screens/gallery/GalleryImageDetailScreen';
import GalleryAddImageScreen from './src/screens/gallery/GalleryAddImageScreen';
import GalleryImportPinterestScreen from './src/screens/gallery/GalleryImportPinterestScreen';
import GalleryAddNoteScreen from './src/screens/gallery/GalleryAddNoteScreen';
import GallerySearchScreen from './src/screens/gallery/GallerySearchScreen';
import GalleryManageCategoriesScreen from './src/screens/gallery/GalleryManageCategoriesScreen';
import GalleryUseInProjectScreen from './src/screens/gallery/GalleryUseInProjectScreen';
import GalleryCommunityScreen from './src/screens/gallery/GalleryCommunityScreen';

// Import providers
import { DatabaseProvider } from './src/contexts/DatabaseContext';
import { SupabaseProvider } from './src/contexts/SupabaseContext';
import { SyncProvider } from './src/contexts/SyncContext';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

const GalleryStack = () => {
  return (
    <Stack.Navigator 
      initialRouteName="Gallery"
      screenOptions={{
        headerShown: false,
      }}
    >
      <Stack.Screen name="Gallery" component={GalleryScreen} />
      <Stack.Screen name="GalleryCategory" component={GalleryCategoryScreen} />
      <Stack.Screen name="GalleryImageDetail" component={GalleryImageDetailScreen} />
      <Stack.Screen name="GalleryAddImage" component={GalleryAddImageScreen} />
      <Stack.Screen name="GalleryImportPinterest" component={GalleryImportPinterestScreen} />
      <Stack.Screen name="GalleryAddNote" component={GalleryAddNoteScreen} />
      <Stack.Screen name="GallerySearch" component={GallerySearchScreen} />
      <Stack.Screen name="GalleryManageCategories" component={GalleryManageCategoriesScreen} />
      <Stack.Screen name="GalleryUseInProject" component={GalleryUseInProjectScreen} />
      <Stack.Screen name="GalleryCommunity" component={GalleryCommunityScreen} />
    </Stack.Navigator>
  );
};

export default function App() {
  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <DatabaseProvider>
          <SupabaseProvider>
            <SyncProvider>
              <NavigationContainer>
                <Stack.Navigator screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="GalleryRoot" component={GalleryStack} />
                </Stack.Navigator>
                <StatusBar style="auto" />
              </NavigationContainer>
            </SyncProvider>
          </SupabaseProvider>
        </DatabaseProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
