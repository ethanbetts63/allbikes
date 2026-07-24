import type { StaticImageData } from 'next/image';
import crox50 from '@/assets/models/crox50.jpg';
import ute125 from '@/assets/models/ute-125.jpg';
import echs125 from '@/assets/models/echs-125.jpg';
import classic125sport from '@/assets/models/classic-125-sport.jpg';
import joymaxz from '@/assets/models/joymax-z.jpg';
import fiddle from '@/assets/models/fiddle-ii.png';
import mio from '@/assets/models/mio.png';
import orbit from '@/assets/models/orbit-iii.png';
import symphonySt from '@/assets/models/symphony-st.png';
import symphony from '@/assets/models/symphony.png';
import symphonySr from '@/assets/models/symphony-sr.png';
import maxsym from '@/assets/models/maxsym-400.png';
import drgbt from '@/assets/models/drgbt.jpg';
import euromx from '@/assets/models/euromx-150.webp';
import firenze250 from '@/assets/models/firenze-250.webp';
import firenze300i from '@/assets/models/firenze-300i.png';
import hd2 from '@/assets/models/hd2.jpg';
import hd200evo from '@/assets/models/hd200-evo.webp';
import hd300 from '@/assets/models/hd300.jpg';
import jetsportx from '@/assets/models/jetsportx-50.jpg';
import jolie from '@/assets/models/jolie.jpg';
import legrande125 from '@/assets/models/legrande-125.webp';
import legrande200 from '@/assets/models/legrande-200.jpg';
import quadlander300 from '@/assets/models/quadlander-300.jpg';
import quadlander600 from '@/assets/models/quadlander-600.png';
import redDevil from '@/assets/models/red-devil.webp';
import retro50 from '@/assets/models/retro-50.jpg';
import shark from '@/assets/models/shark-150.webp';
import symba from '@/assets/models/symba.webp';
import vs from '@/assets/models/vs-125.webp';

/**
 * Model slug -> product photo. Sourced from scoota.com.au, sym-global.com and
 * supplied SYM press images. Only Jet4R Naked lacks an image (shows the SYM
 * placeholder). Some photos are reused across a model family or across a
 * 50/150 (Shark) or 125/150 (VS) sibling pair.
 */
export const MODEL_IMAGES: Record<string, StaticImageData> = {
  // 50cc
  'crox50-ae05w6-ru': crox50,
  'crox50-e5-ae05wb-eu': crox50,
  'jetsportx-50-bk05w2-8': jetsportx,
  'jolie-ft05v-8': jolie,
  'mio-50-hu05w2-8': mio,
  'mio-50i-fs05w1-eu': mio,
  'orbit-50-av05w-8': orbit,
  'red-devil-bl05w5-8': redDevil,
  'retro-50-fa05u1-8': retro50,
  'shark-50-bs05w-8': shark,
  'classic-50-aw05w-8': fiddle,

  // 100–165cc
  'classic-125-aw12w-6': fiddle,
  'classic-125-sport-xg12w1-it': classic125sport,
  'classic-150-ax15w2-6': fiddle,
  'drgbt-tb16w3-eu': drgbt,
  'echs-125-fda12d1cn-eu': echs125,
  'euromx-150-hf15w-8': euromx,
  'legrande-125-la12w-8': legrande125,
  'mio-100-hu10w1-8': mio,
  'orbit-125-av12w-8': orbit,
  'orbit-ii-125-ae12w1-6': orbit,
  'orbit-iii-125-xe12w1-it': orbit,
  'shark-150-hs15w-8': shark,
  'symba-mb10a7-8': symba,
  'symphony-ay15w4-8': symphony,
  'symphonysr-az15w2-6': symphonySr,
  'ute-scoot-125-ae12w4-eu': ute125,
  'vs125-ha12a6-8': vs,
  'vs125-ha12wa-8': vs,
  'vs150-hv15wc-8': vs,

  // 200–400cc
  '2022-maxsym400i-lz40w1-eu': maxsym,
  'lx40a2-6-l4c-lx40a2-6': maxsym,
  'lx40a4-eu-lx40a4-eu': maxsym,
  'classic200i-xa20w1-eu': fiddle,
  'firenze250-lm25w-8': firenze250,
  'firenze300i-lm30w-8': firenze300i,
  'hd2-lc18w1-6': hd2,
  'hd200-evo-lh18w7-6': hd200evo,
  'hd200-evo-lh18w7-8': hd200evo,
  'hd200-lh18w-8': hd200evo,
  'hd200-lh18w5-8': hd200evo,
  'hd300-ls30w1-eu': hd300,
  'joymax-z-lw30w2-eu': joymaxz,
  'legrande-200-la18w1-8': legrande200,
  'symphony-st2-2022-xl20w1-it': symphonySt,
  'symphonyst200i-xb20w1-eu': symphonySt,

  // ATV
  'quadlander-300-ua30a-a': quadlander300,
  'quadlander-600-ua60a-8': quadlander600,
};
