import * as ImagePicker from 'expo-image-picker';
import * as MediaLibrary from 'expo-media-library';
import { Alert, Platform } from 'react-native';

export interface ImageMessage {
  id: string;
  uri: string;
  type: 'image';
  fileName: string;
  fileSize: number;
  width?: number;
  height?: number;
  timestamp: Date;
  senderId: string;
  receiverId: string;
}

export interface ImagePickerOptions {
  allowsEditing?: boolean;
  quality?: number;
  allowsMultipleSelection?: boolean;
  mediaTypes?: 'Images' | 'Videos' | 'All';
}

class ImageService {
  /**
   * Request permissions for camera and media library
   */
  async requestPermissions(): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        return true; // Web doesn't need explicit permissions for file picker
      }

      // Request camera permissions
      const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
      if (cameraPermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Camera permission is required to take photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      // Request media library permissions
      const mediaPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
      if (mediaPermission.status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to select photos.',
          [{ text: 'OK' }]
        );
        return false;
      }

      console.log('✅ Image permissions granted');
      return true;
    } catch (error) {
      console.error('Error requesting image permissions:', error);
      return false;
    }
  }

  /**
   * Take a photo using camera
   */
  async takePhoto(options: ImagePickerOptions = {}): Promise<ImageMessage | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission) {
        return null;
      }

      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || true,
        quality: options.quality || 0.8,
        aspect: [4, 3],
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return this.createImageMessage(asset);
      }

      return null;
    } catch (error) {
      console.error('Error taking photo:', error);
      Alert.alert('Error', 'Failed to take photo. Please try again.');
      return null;
    }
  }

  /**
   * Pick image from gallery
   */
  async pickImage(options: ImagePickerOptions = {}): Promise<ImageMessage | null> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission && Platform.OS !== 'web') {
        return null;
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || true,
        quality: options.quality || 0.8,
        allowsMultipleSelection: options.allowsMultipleSelection || false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        const asset = result.assets[0];
        return this.createImageMessage(asset);
      }

      return null;
    } catch (error) {
      console.error('Error picking image:', error);
      Alert.alert('Error', 'Failed to select image. Please try again.');
      return null;
    }
  }

  /**
   * Pick multiple images from gallery
   */
  async pickMultipleImages(options: ImagePickerOptions = {}): Promise<ImageMessage[]> {
    try {
      const hasPermission = await this.requestPermissions();
      if (!hasPermission && Platform.OS !== 'web') {
        return [];
      }

      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: options.allowsEditing || false,
        quality: options.quality || 0.8,
        allowsMultipleSelection: true,
      });

      if (!result.canceled && result.assets) {
        return result.assets.map(asset => this.createImageMessage(asset));
      }

      return [];
    } catch (error) {
      console.error('Error picking multiple images:', error);
      Alert.alert('Error', 'Failed to select images. Please try again.');
      return [];
    }
  }

  /**
   * Create image message object from picker asset
   */
  private createImageMessage(asset: ImagePicker.ImagePickerAsset): ImageMessage {
    return {
      id: Math.random().toString(36).substr(2, 9),
      uri: asset.uri,
      type: 'image',
      fileName: asset.fileName || `image_${Date.now()}.jpg`,
      fileSize: asset.fileSize || 0,
      width: asset.width,
      height: asset.height,
      timestamp: new Date(),
      senderId: '', // Will be set when sending
      receiverId: '', // Will be set when sending
    };
  }

  /**
   * Compress image for faster uploading
   */
  async compressImage(imageUri: string, quality: number = 0.6): Promise<string> {
    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        quality: quality,
        allowsEditing: false,
      });

      if (!result.canceled && result.assets && result.assets[0]) {
        return result.assets[0].uri;
      }

      return imageUri; // Return original if compression fails
    } catch (error) {
      console.error('Error compressing image:', error);
      return imageUri;
    }
  }

  /**
   * Upload image to server
   */
  async uploadImage(imageMessage: ImageMessage): Promise<string | null> {
    try {
      const formData = new FormData();
      
      // Create file object for upload
      const fileExtension = imageMessage.fileName.split('.').pop() || 'jpg';
      const fileName = `${imageMessage.id}.${fileExtension}`;

      if (Platform.OS === 'web') {
        // For web, we need to fetch the blob first
        const response = await fetch(imageMessage.uri);
        const blob = await response.blob();
        formData.append('image', blob, fileName);
      } else {
        // For mobile
        formData.append('image', {
          uri: imageMessage.uri,
          type: `image/${fileExtension}`,
          name: fileName,
        } as any);
      }

      formData.append('senderId', imageMessage.senderId);
      formData.append('receiverId', imageMessage.receiverId);
      formData.append('messageId', imageMessage.id);

      const response = await fetch('http://localhost:3004/api/upload/image', {
        method: 'POST',
        body: formData,
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });

      if (response.ok) {
        const result = await response.json();
        console.log('✅ Image uploaded successfully:', result.imageUrl);
        return result.imageUrl;
      } else {
        throw new Error('Upload failed');
      }
    } catch (error) {
      console.error('Error uploading image:', error);
      Alert.alert('Upload Failed', 'Failed to upload image. Please try again.');
      return null;
    }
  }

  /**
   * Save image to device gallery
   */
  async saveImageToGallery(imageUri: string): Promise<boolean> {
    try {
      if (Platform.OS === 'web') {
        // For web, download the image
        const link = document.createElement('a');
        link.href = imageUri;
        link.download = `lynq_image_${Date.now()}.jpg`;
        link.click();
        return true;
      }

      // Request media library write permissions
      const { status } = await MediaLibrary.requestPermissionsAsync();
      if (status !== 'granted') {
        Alert.alert(
          'Permission Required',
          'Media library permission is required to save images.'
        );
        return false;
      }

      // Save to gallery
      const asset = await MediaLibrary.createAssetAsync(imageUri);
      const album = await MediaLibrary.getAlbumAsync('Lynq Chat');
      
      if (album) {
        await MediaLibrary.addAssetsToAlbumAsync([asset], album, false);
      } else {
        await MediaLibrary.createAlbumAsync('Lynq Chat', asset, false);
      }

      Alert.alert('Success', 'Image saved to gallery');
      return true;
    } catch (error) {
      console.error('Error saving image to gallery:', error);
      Alert.alert('Error', 'Failed to save image to gallery');
      return false;
    }
  }

  /**
   * Get image dimensions
   */
  async getImageDimensions(imageUri: string): Promise<{ width: number; height: number } | null> {
    try {
      return new Promise((resolve) => {
        if (Platform.OS === 'web') {
          const img = new Image();
          img.onload = () => {
            resolve({ width: img.width, height: img.height });
          };
          img.onerror = () => resolve(null);
          img.src = imageUri;
        } else {
          // For mobile, we'll use the dimensions from the picker result
          resolve(null);
        }
      });
    } catch (error) {
      console.error('Error getting image dimensions:', error);
      return null;
    }
  }

  /**
   * Create image preview/thumbnail
   */
  async createThumbnail(imageUri: string): Promise<string> {
    try {
      // Compress image to create thumbnail
      const thumbnail = await this.compressImage(imageUri, 0.3);
      return thumbnail;
    } catch (error) {
      console.error('Error creating thumbnail:', error);
      return imageUri; // Return original if thumbnail creation fails
    }
  }

  /**
   * Validate image file
   */
  validateImage(asset: ImagePicker.ImagePickerAsset): { valid: boolean; error?: string } {
    const maxSize = 10 * 1024 * 1024; // 10MB
    const allowedTypes = ['jpg', 'jpeg', 'png', 'gif', 'webp'];
    
    if (asset.fileSize && asset.fileSize > maxSize) {
      return { valid: false, error: 'Image size should be less than 10MB' };
    }

    const extension = asset.fileName?.split('.').pop()?.toLowerCase();
    if (extension && !allowedTypes.includes(extension)) {
      return { valid: false, error: 'Unsupported image format' };
    }

    return { valid: true };
  }
}

export const imageService = new ImageService();