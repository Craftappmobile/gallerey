/**
 * Centralized error handling utility for the application
 * Provides consistent error logging, reporting, and user notifications
 */

import { Alert } from 'react-native';
import * as FileSystem from 'expo-file-system';

// Error log file path
const ERROR_LOG_PATH = `${FileSystem.documentDirectory}error_logs.json`;

/**
 * Error types enum for categorizing different errors
 */
export const ErrorType = {
  NETWORK: 'NETWORK',
  DATABASE: 'DATABASE',
  FILE_SYSTEM: 'FILE_SYSTEM',
  SYNC: 'SYNC',
  AUTHENTICATION: 'AUTHENTICATION',
  UNKNOWN: 'UNKNOWN',
};

/**
 * Handle errors consistently throughout the application
 * @param {Error} error - The error object
 * @param {string} errorType - Type of error from ErrorType enum
 * @param {string} context - Where the error occurred
 * @param {boolean} showAlert - Whether to show an alert to the user
 * @param {Function} callback - Optional callback to execute after handling error
 */
export const handleError = async (
  error, 
  errorType = ErrorType.UNKNOWN, 
  context = 'Unknown context', 
  showAlert = true,
  callback = null
) => {
  // Create error object with additional metadata
  const errorObject = {
    type: errorType,
    context,
    message: error.message || 'An unknown error occurred',
    stack: error.stack,
    timestamp: new Date().toISOString(),
  };
  
  // Log error to console
  console.error(`[${errorType}] Error in ${context}:`, error);
  
  // Save error to log file
  try {
    await logErrorToFile(errorObject);
  } catch (logError) {
    console.error('Failed to log error to file:', logError);
  }
  
  // Show alert to user if specified
  if (showAlert) {
    showErrorAlert(errorType, context, error.message);
  }
  
  // Execute callback if provided
  if (callback && typeof callback === 'function') {
    callback(errorObject);
  }
  
  return errorObject;
};

/**
 * Log error to local file for later analysis
 * @param {Object} errorObject - Error object with metadata
 */
const logErrorToFile = async (errorObject) => {
  try {
    // Check if log file exists
    const fileInfo = await FileSystem.getInfoAsync(ERROR_LOG_PATH);
    
    let logs = [];
    if (fileInfo.exists) {
      // Read existing logs
      const content = await FileSystem.readAsStringAsync(ERROR_LOG_PATH);
      logs = JSON.parse(content);
    }
    
    // Add new error log
    logs.push(errorObject);
    
    // Keep only the last 100 logs to prevent the file from growing too large
    if (logs.length > 100) {
      logs = logs.slice(logs.length - 100);
    }
    
    // Write updated logs back to file
    await FileSystem.writeAsStringAsync(ERROR_LOG_PATH, JSON.stringify(logs));
  } catch (error) {
    console.error('Error logging to file:', error);
  }
};

/**
 * Show appropriate error alert to user based on error type
 * @param {string} errorType - Type of error from ErrorType enum
 * @param {string} context - Where the error occurred
 * @param {string} message - Error message
 */
const showErrorAlert = (errorType, context, message) => {
  let title = 'Error';
  let userMessage = message || 'An unknown error occurred';
  
  // Customize message based on error type
  switch (errorType) {
    case ErrorType.NETWORK:
      title = 'Network Error';
      userMessage = message || 'Failed to connect to the server. Please check your internet connection.';
      break;
    case ErrorType.DATABASE:
      title = 'Database Error';
      userMessage = 'There was a problem with the local database. Please restart the app.';
      break;
    case ErrorType.FILE_SYSTEM:
      title = 'Storage Error';
      userMessage = 'Failed to access device storage. Please check app permissions.';
      break;
    case ErrorType.SYNC:
      title = 'Sync Error';
      userMessage = message || 'Failed to synchronize data. Your changes will be saved locally and synced later.';
      break;
    case ErrorType.AUTHENTICATION:
      title = 'Authentication Error';
      userMessage = 'Your session has expired or is invalid. Please log in again.';
      break;
  }
  
  Alert.alert(
    title,
    userMessage,
    [{ text: 'OK' }]
  );
};

/**
 * Get error logs for debugging and reporting
 * @returns {Promise<Array>} Array of error log objects
 */
export const getErrorLogs = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(ERROR_LOG_PATH);
    
    if (fileInfo.exists) {
      const content = await FileSystem.readAsStringAsync(ERROR_LOG_PATH);
      return JSON.parse(content);
    }
    
    return [];
  } catch (error) {
    console.error('Error reading error logs:', error);
    return [];
  }
};

/**
 * Clear error logs
 * @returns {Promise<boolean>} Success status
 */
export const clearErrorLogs = async () => {
  try {
    const fileInfo = await FileSystem.getInfoAsync(ERROR_LOG_PATH);
    
    if (fileInfo.exists) {
      await FileSystem.deleteAsync(ERROR_LOG_PATH);
    }
    
    return true;
  } catch (error) {
    console.error('Error clearing error logs:', error);
    return false;
  }
};
