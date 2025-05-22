/**
 * Test setup file
 */

import 'react-native-gesture-handler/jestSetup';

// Mock expo modules
jest.mock('expo-file-system', () => ({
  documentDirectory: '/mock/document/directory/',
  cacheDirectory: '/mock/cache/directory/',
  downloadAsync: jest.fn(() => Promise.resolve({ status: 200 })),
  getInfoAsync: jest.fn(() => Promise.resolve({ exists: true, size: 1000 })),
  readAsStringAsync: jest.fn(() => Promise.resolve('{"test":"data"}')),
  writeAsStringAsync: jest.fn(() => Promise.resolve()),
  deleteAsync: jest.fn(() => Promise.resolve()),
  makeDirectoryAsync: jest.fn(() => Promise.resolve()),
  readDirectoryAsync: jest.fn(() => Promise.resolve([])),
  copyAsync: jest.fn(() => Promise.resolve()),
  moveAsync: jest.fn(() => Promise.resolve()),
}));

jest.mock('expo-image-manipulator', () => ({
  manipulateAsync: jest.fn(() => Promise.resolve({ 
    uri: '/mock/manipulated/image.jpg',
    width: 300,
    height: 400
  })),
  SaveFormat: {
    JPEG: 'jpeg',
    PNG: 'png'
  }
}));

jest.mock('expo-image-picker', () => ({
  launchImageLibraryAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: '/mock/picked/image.jpg' }]
  })),
  launchCameraAsync: jest.fn(() => Promise.resolve({
    canceled: false,
    assets: [{ uri: '/mock/camera/image.jpg' }]
  })),
  MediaTypeOptions: {
    Images: 'images'
  },
  requestMediaLibraryPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
  requestCameraPermissionsAsync: jest.fn(() => Promise.resolve({ granted: true })),
}));

jest.mock('@react-native-community/netinfo', () => ({
  addEventListener: jest.fn(() => jest.fn()),
  fetch: jest.fn(() => Promise.resolve({ isConnected: true })),
}));

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn(() => ({
    storage: {
      from: jest.fn(() => ({
        upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
        download: jest.fn(() => Promise.resolve({ data: new Blob(), error: null })),
        getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
      })),
    },
    auth: {
      getUser: jest.fn(() => Promise.resolve({ data: { user: { id: 'test-user-id' } }, error: null })),
      onAuthStateChange: jest.fn(() => ({ data: { subscription: { unsubscribe: jest.fn() } } })),
    },
    rpc: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    functions: {
      invoke: jest.fn(() => Promise.resolve({ data: {}, error: null })),
    },
  })),
}));

jest.mock('@nozbe/watermelondb', () => ({
  Database: jest.fn(),
  Model: class Model {
    update() { return Promise.resolve(this); }
    destroyPermanently() { return Promise.resolve(); }
  },
  Q: {
    where: jest.fn(),
    eq: jest.fn(),
    notEq: jest.fn(),
    gt: jest.fn(),
    gte: jest.fn(),
    lt: jest.fn(),
    lte: jest.fn(),
    between: jest.fn(),
    oneOf: jest.fn(),
    on: jest.fn(),
    like: jest.fn(),
    sortBy: jest.fn(),
    take: jest.fn(),
    skip: jest.fn(),
  },
}));

jest.mock('@nozbe/watermelondb/sync', () => ({
  synchronize: jest.fn(() => Promise.resolve({ 
    created: [], 
    updated: [], 
    deleted: [] 
  })),
}));

// Mock navigation
jest.mock('@react-navigation/native', () => ({
  useNavigation: () => ({
    navigate: jest.fn(),
    goBack: jest.fn(),
    setOptions: jest.fn(),
  }),
  useRoute: () => ({
    params: {}
  }),
}));

// Mock Context Providers
jest.mock('../../contexts/SyncContext', () => ({
  useSyncStatus: () => ({
    isConnected: true,
    syncStatus: 'synced',
    lastSynced: new Date(),
    pendingChanges: 0,
    synchronize: jest.fn(() => Promise.resolve(true)),
    getFormattedLastSyncTime: jest.fn(() => '2023-01-01 12:00:00'),
  }),
}));

jest.mock('../../contexts/DatabaseContext', () => ({
  useDatabase: () => ({
    get: jest.fn(() => ({
      query: jest.fn(() => ({
        fetch: jest.fn(() => Promise.resolve([])),
        fetchCount: jest.fn(() => Promise.resolve(0)),
        observe: jest.fn(() => ({ subscribe: jest.fn() })),
      })),
      create: jest.fn(() => Promise.resolve({})),
      find: jest.fn(() => Promise.resolve({})),
      findAndObserve: jest.fn(() => ({ subscribe: jest.fn() })),
    })),
    write: jest.fn((callback) => Promise.resolve(callback())),
  }),
}));

// Mock React Native components
jest.mock('react-native/Libraries/Animated/NativeAnimatedHelper');

// Suppress specific console messages
const originalConsoleError = console.error;
console.error = (...args) => {
  if (
    args[0].includes('Warning:') &&
    (args[0].includes('React.createClass') || args[0].includes('componentWillMount'))
  ) {
    return;
  }
  originalConsoleError(...args);
};
