/**
 * Tests for ErrorHandler utility
 */

import { handleError, ErrorType, getErrorLogs, clearErrorLogs } from '../../utils/ErrorHandler';
import * as FileSystem from 'expo-file-system';

// Mock Alert
jest.mock('react-native', () => ({
  Alert: {
    alert: jest.fn(),
  },
}));

describe('ErrorHandler', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  test('handleError logs error to console', async () => {
    const consoleErrorSpy = jest.spyOn(console, 'error');
    const error = new Error('Test error');
    
    await handleError(error, ErrorType.NETWORK, 'TestContext');
    
    expect(consoleErrorSpy).toHaveBeenCalledWith(
      expect.stringContaining('[NETWORK]'),
      expect.any(Error)
    );
  });

  test('handleError writes error to log file', async () => {
    const error = new Error('Test error');
    
    await handleError(error, ErrorType.DATABASE, 'TestContext', false);
    
    expect(FileSystem.getInfoAsync).toHaveBeenCalled();
    expect(FileSystem.writeAsStringAsync).toHaveBeenCalledWith(
      expect.any(String),
      expect.stringContaining('DATABASE')
    );
  });

  test('handleError returns error object with metadata', async () => {
    const error = new Error('Test error');
    
    const result = await handleError(error, ErrorType.SYNC, 'TestContext', false);
    
    expect(result).toEqual(expect.objectContaining({
      type: ErrorType.SYNC,
      context: 'TestContext',
      message: 'Test error',
    }));
  });

  test('handleError executes callback if provided', async () => {
    const error = new Error('Test error');
    const callback = jest.fn();
    
    await handleError(error, ErrorType.UNKNOWN, 'TestContext', false, callback);
    
    expect(callback).toHaveBeenCalled();
    expect(callback).toHaveBeenCalledWith(expect.objectContaining({
      type: ErrorType.UNKNOWN,
      context: 'TestContext',
    }));
  });

  test('getErrorLogs returns error logs from file', async () => {
    await getErrorLogs();
    
    expect(FileSystem.getInfoAsync).toHaveBeenCalled();
    expect(FileSystem.readAsStringAsync).toHaveBeenCalled();
  });

  test('clearErrorLogs deletes error log file', async () => {
    FileSystem.getInfoAsync.mockImplementationOnce(() => Promise.resolve({ exists: true }));
    
    await clearErrorLogs();
    
    expect(FileSystem.getInfoAsync).toHaveBeenCalled();
    expect(FileSystem.deleteAsync).toHaveBeenCalled();
  });
});
