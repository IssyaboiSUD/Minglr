
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { storage } from './firebaseConfig';

/**
 * Upload a profile picture to Firebase Storage
 */
export const uploadProfilePicture = async (file: File, userId: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storageRef = ref(storage, `profile-pictures/${userId}/${timestamp}_${fileName}`);
    
    console.log('Uploading profile picture...', storageRef.fullPath);
    const snapshot = await uploadBytes(storageRef, file);
    const url = await getDownloadURL(snapshot.ref);
    console.log('Upload successful:', url);
    return url;
  } catch (error: any) {
    console.error('Error uploading profile picture:', error);
    if (error.code === 'storage/unauthorized') {
      throw new Error('Permission denied. Please check your Firebase Storage rules.');
    }
    throw new Error(error.message || 'Failed to upload profile picture');
  }
};

/**
 * Upload a post image to Firebase Storage
 */
export const uploadPostImage = async (file: File, userId: string): Promise<string> => {
  try {
    const timestamp = Date.now();
    const fileName = file.name.replace(/[^a-zA-Z0-9.]/g, '_');
    const storageRef = ref(storage, `post-images/${userId}/${timestamp}_${fileName}`);
    
    const snapshot = await uploadBytes(storageRef, file);
    return await getDownloadURL(snapshot.ref);
  } catch (error: any) {
    console.error('Error uploading post image:', error);
    throw new Error(error.message || 'Failed to upload post image');
  }
};

/**
 * Validate if a file is a valid image
 */
export const validateImageFile = (file: File): boolean => {
  const validTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp'];
  const maxSize = 5 * 1024 * 1024; // 5MB
  
  if (!validTypes.includes(file.type)) {
    throw new Error('Please upload a valid image file (JPEG, PNG, GIF, or WebP)');
  }
  
  if (file.size > maxSize) {
    throw new Error('Image size must be less than 5MB');
  }
  
  return true;
};