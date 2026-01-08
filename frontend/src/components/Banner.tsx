import React from 'react';
import { siteSettings } from '@/config/siteSettings';

const Banner: React.FC = () => {
  const isVisible = siteSettings.enable_banner;
  const bannerText = siteSettings.banner_text;

  if (!isVisible || !bannerText) {
    return null;
  }

  return (
    <div className="bg-primary text-white font-semibold text-center p-2">
      <p>{bannerText}</p>
    </div>
  );
};

export default Banner;
