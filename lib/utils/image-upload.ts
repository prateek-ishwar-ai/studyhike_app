/**
 * Utility functions for uploading images to ImageBB
 */

// ImageBB API key
const IMAGEBB_API_KEY = '56e6b93d96288feb9baa20dd66cbed38';
const IMAGEBB_API_URL = 'https://api.imgbb.com/1/upload';

/**
 * Uploads an image to ImageBB and returns the URL
 * @param file The image file to upload
 * @returns The URL of the uploaded image
 */
export async function uploadImageToImageBB(file: File): Promise<string> {
  try {
    // Create a FormData object to send the file
    const formData = new FormData();
    formData.append('key', IMAGEBB_API_KEY);
    formData.append('image', file);

    // Send the request to ImageBB
    const response = await fetch(IMAGEBB_API_URL, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error(`Upload failed with status: ${response.status}`);
    }

    // Parse the response
    const data = await response.json();
    
    // Return the URL of the uploaded image
    if (data.success && data.data && data.data.url) {
      return data.data.url;
    } else {
      throw new Error('Failed to get image URL from response');
    }
  } catch (error) {
    console.error('Error uploading image:', error);
    throw error;
  }
}

/**
 * Uploads multiple images to ImageBB and returns an array of URLs
 * @param files Array of image files to upload
 * @returns Array of URLs of the uploaded images
 */
export async function uploadMultipleImages(files: File[]): Promise<string[]> {
  try {
    // Upload each file and collect the promises
    const uploadPromises = Array.from(files).map(file => uploadImageToImageBB(file));
    
    // Wait for all uploads to complete
    const urls = await Promise.all(uploadPromises);
    
    return urls;
  } catch (error) {
    console.error('Error uploading multiple images:', error);
    throw error;
  }
}