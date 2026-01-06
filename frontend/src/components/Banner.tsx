import React from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const Banner: React.FC = () => {
  const { settings, loading } = useSiteSettings();

  if (loading || !settings || !settings.enable_banner) {
    return null;
  }

  return (
    <div className="bg-primary text-white font-semibold text-center p-2">
      <p>{settings.banner_text}</p>
    </div>
  );
};

export default Banner;
