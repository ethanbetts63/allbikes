import type { StaticImageData } from 'next/image';
// scoota.com.au (current AU range)
import crox50 from '@/assets/models/crox50.jpg';
import ute125 from '@/assets/models/ute-125.jpg';
import echs125 from '@/assets/models/echs-125.jpg';
import classic125sport from '@/assets/models/classic-125-sport.jpg';
import joymaxz from '@/assets/models/joymax-z.jpg';
// sym-global.com (transparent PNGs; AU "Classic" = SYM "Fiddle")
import fiddle from '@/assets/models/fiddle-ii.png';
import mio from '@/assets/models/mio.png';
import orbit from '@/assets/models/orbit-iii.png';
import symphonySt from '@/assets/models/symphony-st.png';
import symphony from '@/assets/models/symphony.png';
import symphonySr from '@/assets/models/symphony-sr.png';
import maxsym from '@/assets/models/maxsym-400.png';

/**
 * Model slug -> product photo. Sourced from scoota.com.au and sym-global.com.
 * Discontinued / AU-only models with no equivalent on either site have no photo
 * and fall back to a placeholder on the card.
 */
export const MODEL_IMAGES: Record<string, StaticImageData> = {
  // CROX
  'crox50-ae05w6-ru': crox50,
  'crox50-e5-ae05wb-eu': crox50,
  // ECHS / Ute / Classic Sport / JoyMax
  'echs-125-fda12d1cn-eu': echs125,
  'ute-scoot-125-ae12w4-eu': ute125,
  'classic-125-sport-xg12w1-it': classic125sport,
  'joymax-z-lw30w2-eu': joymaxz,
  // Classic = Fiddle
  'classic-50-aw05w-8': fiddle,
  'classic-125-aw12w-6': fiddle,
  'classic-150-ax15w2-6': fiddle,
  'classic200i-xa20w1-eu': fiddle,
  // Mio
  'mio-50-hu05w2-8': mio,
  'mio-50i-fs05w1-eu': mio,
  'mio-100-hu10w1-8': mio,
  // Orbit family
  'orbit-iii-125-xe12w1-it': orbit,
  'orbit-125-av12w-8': orbit,
  'orbit-ii-125-ae12w1-6': orbit,
  'orbit-50-av05w-8': orbit,
  // Symphony family
  'symphonyst200i-xb20w1-eu': symphonySt,
  'symphony-st2-2022-xl20w1-it': symphonySt,
  'symphony-ay15w4-8': symphony,
  'symphonysr-az15w2-6': symphonySr,
  // Maxsym 400
  '2022-maxsym400i-lz40w1-eu': maxsym,
  'lx40a2-6-l4c-lx40a2-6': maxsym,
  'lx40a4-eu-lx40a4-eu': maxsym,
};
