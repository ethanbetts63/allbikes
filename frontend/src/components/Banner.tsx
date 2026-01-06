import React, { useState, useEffect } from 'react';
import { useSiteSettings } from '@/context/SiteSettingsContext';

const Banner: React.FC = () => {
  const { settings, loading } = useSiteSettings();
  
  const defaultBannerText = "Formerly known as Scootershop Fremantle. Same expert, new location! Unit 5 / 6 Cleveland Street, Dianella, 6059.";

  const [isVisible, setIsVisible] = useState(true);
  const [bannerText, setBannerText] = useState(defaultBannerText);

  useEffect(() => {
    if (!loading) {
      if (settings && settings.enable_banner) {
        setIsVisible(true);
        setBannerText(settings.banner_text || defaultBannerText);
      } else {
        setIsVisible(false);
      }
    }
  }, [settings, loading]);

  if (!isVisible) {
    return null;
  }

  return (
    <div className="bg-primary text-white font-semibold text-center p-2">
      <p>{bannerText}</p>
    </div>
  );
};

export default Banner;
