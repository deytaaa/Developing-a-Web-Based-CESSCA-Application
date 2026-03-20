import { createContext, useContext, useState, useEffect } from 'react';
import { adminService } from '../services/adminService';
import { useAuth } from './AuthContext';

const SettingsContext = createContext();

export const useSettings = () => {
  return useContext(SettingsContext);
};


export const SettingsProvider = ({ children }) => {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { isAuthenticated, loading: authLoading, user } = useAuth();

  useEffect(() => {
    if (!authLoading && isAuthenticated && user?.role === 'admin') {
      loadSettings();
    } else if (!isAuthenticated || user?.role !== 'admin') {
      setSettings({});
      setLoading(false);
    }
  }, [isAuthenticated, authLoading, user]);

  const loadSettings = async () => {
    try {
      setLoading(true);
      const response = await adminService.getSettings();
      const settingsArray = response.settings || [];
      
      // Convert array to object for easy access
      const settingsObj = {};
      settingsArray.forEach(setting => {
        settingsObj[setting.setting_key] = setting.setting_value;
      });
      
      setSettings(settingsObj);
      setError(null);
    } catch (err) {
      console.error('Failed to load settings:', err);
      // Set default values if fetch fails
      setSettings({
        site_name: 'CESSCA - Pateros Technological College',
        site_email: 'cessca@ptc.edu.ph',
        academic_year: '2025-2026',
        semester: 'Second Semester',
        max_upload_size: '5242880'
      });
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getSetting = (key, defaultValue = '') => {
    return settings[key] !== undefined ? settings[key] : defaultValue;
  };

  const value = {
    settings,
    loading,
    error,
    getSetting,
    reloadSettings: loadSettings
  };

  return (
    <SettingsContext.Provider value={value}>
      {children}
    </SettingsContext.Provider>
  );
};
