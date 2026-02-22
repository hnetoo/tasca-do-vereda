
export const normalizeDishImage = (imagePath?: string): string => {
  // Use a reliable fallback that exists in public folder
  const DEFAULT_IMAGE = '/logo.png'; 
  
  if (!imagePath || imagePath.trim() === '') return DEFAULT_IMAGE; 
  
  // Keep Data URLs, HTTP URLs, and Blob URLs
  if (imagePath.startsWith('data:') || imagePath.startsWith('http') || imagePath.startsWith('blob:')) {
    return imagePath;
  }

  // Handle Windows paths - extract filename
  if (imagePath.includes('\\')) {
     const filename = imagePath.split('\\').pop();
     // If the file is expected to be in /images/, we should ensure that folder exists or map to root
     // For now, let's assume images are at root or we map them to a placeholder if missing
     // But best effort:
     return filename ? `/images/${filename}` : DEFAULT_IMAGE;
  }
  
  // Handle simple filenames (assume they might be in /images/ if that folder existed, but let's point to root for now if valid)
  // Actually, if the user uploads images, where do they go? 
  // If they are local file paths, they won't work in browser unless served.
  // If they are not http/data, we return them as relative paths.
  
  if (!imagePath.includes('/')) {
     return `/images/${imagePath}`;
  }

  // Ensure starts with / if it looks like a relative path
  if (!imagePath.startsWith('/')) {
     return `/${imagePath}`;
  }
  
  return imagePath;
};
