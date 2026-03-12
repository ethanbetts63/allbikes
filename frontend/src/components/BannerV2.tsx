import { MapPin } from 'lucide-react';
import { siteSettings } from '@/config/siteSettings';

const BannerV2 = () => {
  if (!siteSettings.enable_banner || !siteSettings.banner_text) return null;

  return (
    <div className="bg-amber-400 text-stone-900 py-2 px-4">
      <div className="container mx-auto flex items-center justify-center gap-2">
        <MapPin className="h-3.5 w-3.5 shrink-0" strokeWidth={2.5} />
        <p className="text-xs sm:text-sm font-semibold text-center leading-snug">
          {siteSettings.banner_text}
        </p>
      </div>
    </div>
  );
};

export default BannerV2;
