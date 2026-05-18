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
      return new URL(apiUrl).origin;
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

  const baseUrl = getApiOrigin();
  return `${baseUrl}${path.startsWith('/') ? '' : '/'}${path}`;
};
