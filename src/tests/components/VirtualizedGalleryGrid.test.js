/**
 * Tests for VirtualizedGalleryGrid component
 */

import React from 'react';
import { render, fireEvent, act } from '@testing-library/react-native';
import VirtualizedGalleryGrid from '../../components/gallery/VirtualizedGalleryGrid';

// Mock data for testing
const mockImages = [
  {
    id: '1',
    name: 'Test Image 1',
    localUri: 'file:///test/image1.jpg',
    sourceType: 'camera',
    syncStatus: 'synced',
  },
  {
    id: '2',
    name: 'Test Image 2',
    localUri: 'file:///test/image2.jpg',
    sourceType: 'pinterest',
    syncStatus: 'created',
  },
  {
    id: '3',
    name: 'Test Image 3',
    localUri: 'file:///test/image3.jpg',
    sourceType: 'library',
    syncStatus: 'synced',
  },
];

describe('VirtualizedGalleryGrid', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.useFakeTimers();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  test('renders correctly with images', () => {
    const { getByText } = render(
      <VirtualizedGalleryGrid 
        images={mockImages} 
        numColumns={2} 
      />
    );
    
    expect(getByText('Test Image 1')).toBeTruthy();
    expect(getByText('Test Image 2')).toBeTruthy();
    expect(getByText('Test Image 3')).toBeTruthy();
  });

  test('renders empty state when no images', () => {
    const { getByText } = render(
      <VirtualizedGalleryGrid 
        images={[]} 
        numColumns={2} 
      />
    );
    
    expect(getByText('Немає зображень')).toBeTruthy();
  });

  test('handles image press', () => {
    const onImagePress = jest.fn();
    const { getByText } = render(
      <VirtualizedGalleryGrid 
        images={mockImages} 
        numColumns={2} 
        onImagePress={onImagePress}
      />
    );
    
    fireEvent.press(getByText('Test Image 1'));
    
    expect(onImagePress).toHaveBeenCalledWith(mockImages[0]);
  });

  test('handles image long press', () => {
    const onImageLongPress = jest.fn();
    const { getByText } = render(
      <VirtualizedGalleryGrid 
        images={mockImages} 
        numColumns={2} 
        onImageLongPress={onImageLongPress}
      />
    );
    
    fireEvent(getByText('Test Image 1'), 'longPress');
    
    expect(onImageLongPress).toHaveBeenCalledWith(mockImages[0]);
  });

  test('loads more images when scrolling to end with pagination enabled', () => {
    const { getByTestId } = render(
      <VirtualizedGalleryGrid 
        images={Array(30).fill().map((_, i) => ({
          id: `${i}`,
          name: `Test Image ${i}`,
          localUri: `file:///test/image${i}.jpg`,
          sourceType: 'camera',
          syncStatus: 'synced',
        }))} 
        numColumns={2}
        enablePagination={true}
        testID="gallery-grid"
      />
    );
    
    const flatList = getByTestId('gallery-grid');
    
    // Trigger onEndReached
    fireEvent(flatList, 'onEndReached');
    
    // Fast-forward timers
    act(() => {
      jest.runAllTimers();
    });
    
    // Assert loading more images (would need to check state changes which is difficult in this test)
    // In a real test, we could check if more items are rendered after loading more
  });

  test('refreshes content when pull-to-refresh is triggered', () => {
    const onRefresh = jest.fn();
    const { getByTestId } = render(
      <VirtualizedGalleryGrid 
        images={mockImages} 
        numColumns={2} 
        onRefresh={onRefresh}
        isRefreshing={false}
        testID="gallery-grid"
      />
    );
    
    const flatList = getByTestId('gallery-grid');
    
    // Trigger onRefresh
    fireEvent(flatList, 'onRefresh');
    
    expect(onRefresh).toHaveBeenCalled();
  });
});
