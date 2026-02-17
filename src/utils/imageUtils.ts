
export const normalizeDishImage = (imagePath?: string): string => {
  if (!imagePath || imagePath.trim() === '') return '/images/default-dish.png'; // Return a default image if none provided
  
  // Keep Data URLs, HTTP URLs, and Blob URLs
  if (imagePath.startsWith('data:') || imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // Handle Windows paths
  if (imagePath.includes('\\')) {
     const filename = imagePath.split('\\').pop();
     return filename ? `/images/${filename}` : imagePath;
  }
  
  // Handle simple filenames or existing relative paths
  if (!imagePath.includes('/')) {
     return `/images/${imagePath}`;
  }

  // Ensure starts with / if it looks like a relative path
  if (!imagePath.startsWith('/')) {
     return `/${imagePath}`;
  }
  
  return imagePath;
};
