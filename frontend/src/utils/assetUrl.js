const apiUrl = import.meta.env.VITE_API_URL || '/api';

const getApiOrigin = () => {
  if (typeof window === 'undefined') {
    return '';
  }

  if (!apiUrl) {
    return window.location.origin;
  }

  if (apiUrl.startsWith('http://') || apiUrl.startsWith('https://')) {
    try {
      const origin = new URL(apiUrl).origin;
      // If the configured origin points to localhost but the app is running
      // in a non-localhost host (production), avoid returning a localhost origin
      // which would make asset URLs point to the developer machine.
      if (
        origin.includes('localhost') &&
        typeof window !== 'undefined' &&
        window.location.hostname !== 'localhost' &&
        import.meta.env &&
        import.meta.env.PROD
      ) {
        return window.location.origin;
      }

      return origin;
    } catch {
      return window.location.origin;
    }
  }

  if (apiUrl.startsWith('//')) {
    try {
      return new URL(`${window.location.protocol}${apiUrl}`).origin;
    } catch {
      return window.location.origin;
    }
  }

  return window.location.origin;
};

export const getAssetUrl = (path) => {
  if (!path) {
    return '';
  }

  if (path.startsWith('http://') || path.startsWith('https://') || path.startsWith('data:')) {
    return path;
  }

  // In development with a relative apiUrl (like '/api'), return relative paths
  // so they work with the Vite proxy (which routes /api and /uploads to localhost:5000).
  // In production, use the configured API origin.
  if (!apiUrl.startsWith('http://') && !apiUrl.startsWith('https://') && !apiUrl.startsWith('//')) {
    // apiUrl is relative (e.g., '/api')
    // Return the path as-is so Vite proxy or production static serving handles it
    return path.startsWith('/') ? path : `/${path}`;
  }

  const baseUrl = getApiOrigin();
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
