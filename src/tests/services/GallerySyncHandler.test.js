/**
 * Tests for GallerySyncHandler service
 */

import GallerySyncHandler from '../../services/GallerySyncHandler';
import { synchronize } from '@nozbe/watermelondb/sync';
import NetInfo from '@react-native-community/netinfo';

// Mock dependencies
jest.mock('@nozbe/watermelondb/sync');
jest.mock('@react-native-community/netinfo');

describe('GallerySyncHandler', () => {
  let syncHandler;
  let mockDatabase;
  let mockSupabase;
  
  beforeEach(() => {
    // Reset mocks
    jest.clearAllMocks();
    
    // Mock database
    mockDatabase = {
      get: jest.fn(() => ({
        query: jest.fn(() => ({
          fetch: jest.fn(() => Promise.resolve([])),
          fetchCount: jest.fn(() => Promise.resolve(0)),
        })),
        find: jest.fn(() => Promise.resolve({
          id: 'test-image-id',
          update: jest.fn(() => Promise.resolve()),
        })),
        create: jest.fn(() => Promise.resolve()),
      })),
      write: jest.fn((callback) => Promise.resolve(callback())),
    };
    
    // Mock Supabase
    mockSupabase = {
      storage: {
        from: jest.fn(() => ({
          upload: jest.fn(() => Promise.resolve({ data: {}, error: null })),
          download: jest.fn(() => Promise.resolve({ data: new Blob(), error: null })),
          getPublicUrl: jest.fn(() => ({ data: { publicUrl: 'https://example.com/image.jpg' } })),
        })),
      },
      auth: {
        getUser: jest.fn(() => Promise.resolve({ 
          data: { user: { id: 'test-user-id' } }, 
          error: null 
        })),
      },
      rpc: jest.fn(() => Promise.resolve({ 
        data: {
          changes: {
            gallery_images: {
              created: [],
              updated: [],
              deleted: []
            }
          },
          timestamp: Date.now()
        },
        error: null
      })),
    };
    
    // Initialize handler
    syncHandler = new GallerySyncHandler(mockDatabase, mockSupabase);
    
    // Mock synchronize function
    synchronize.mockResolvedValue({
      created: [],
      updated: [],
      deleted: []
    });
    
    // Mock NetInfo
    NetInfo.fetch.mockResolvedValue({ isConnected: true });
  });
  
  test('constructor initializes properties correctly', () => {
    expect(syncHandler.database).toBe(mockDatabase);
    expect(syncHandler.supabase).toBe(mockSupabase);
    expect(syncHandler.isSyncing).toBe(false);
    expect(syncHandler.syncQueue).toEqual([]);
    expect(syncHandler.lastSyncError).toBe(null);
  });
  
  test('ensureDirectoriesExist creates directories if they do not exist', async () => {
    const FileSystem = require('expo-file-system');
    FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });
    FileSystem.getInfoAsync.mockResolvedValueOnce({ exists: false });
    
    await syncHandler.ensureDirectoriesExist();
    
    expect(FileSystem.makeDirectoryAsync).toHaveBeenCalledTimes(2);
  });
  
  test('sync calls synchronize with correct parameters', async () => {
    await syncHandler.sync();
    
    expect(synchronize).toHaveBeenCalledWith(expect.objectContaining({
      database: mockDatabase,
      pullChanges: expect.any(Function),
      pushChanges: expect.any(Function),
    }));
  });
  
  test('sync returns early if network is not connected', async () => {
    NetInfo.fetch.mockResolvedValueOnce({ isConnected: false });
    
    await expect(syncHandler.sync()).rejects.toThrow('Cannot sync: No network connection');
    
    expect(synchronize).not.toHaveBeenCalled();
  });
  
  test('sync returns early if user is not authenticated', async () => {
    mockSupabase.auth.getUser.mockResolvedValueOnce({ 
      data: { user: null }, 
      error: null 
    });
    
    await expect(syncHandler.sync()).rejects.toThrow('Cannot sync: User not authenticated');
    
    expect(synchronize).not.toHaveBeenCalled();
  });
  
  test('sync sets isSyncing flag during synchronization', async () => {
    const syncPromise = syncHandler.sync();
    
    expect(syncHandler.isSyncing).toBe(true);
    
    await syncPromise;
    
    expect(syncHandler.isSyncing).toBe(false);
  });
  
  test('sync handles errors correctly', async () => {
    synchronize.mockRejectedValueOnce(new Error('Sync error'));
    
    await expect(syncHandler.sync()).rejects.toThrow('Sync error');
    
    expect(syncHandler.lastSyncError).not.toBe(null);
    expect(syncHandler.isSyncing).toBe(false);
  });
  
  test('countPendingChanges counts changes across all tables', async () => {
    mockDatabase.get.mockImplementation((table) => ({
      query: jest.fn(() => ({
        fetchCount: jest.fn(() => Promise.resolve(table === 'gallery_images' ? 5 : 2)),
      })),
    }));
    
    const count = await syncHandler.countPendingChanges();
    
    // 9 tables × 2 changes each = 18, plus 3 extra for gallery_images (5 instead of 2) = 21
    expect(count).toBe(21);
  });
  
  test('getUserId returns user ID from Supabase', async () => {
    const userId = await syncHandler.getUserId();
    
    expect(userId).toBe('test-user-id');
    expect(mockSupabase.auth.getUser).toHaveBeenCalled();
  });
  
  test('getUserId returns null if error occurs', async () => {
    mockSupabase.auth.getUser.mockRejectedValueOnce(new Error('Auth error'));
    
    const userId = await syncHandler.getUserId();
    
    expect(userId).toBe(null);
  });
});
