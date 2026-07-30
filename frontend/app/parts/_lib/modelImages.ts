import type { StaticImageData } from 'next/image';
import crox50 from '@/assets/models/crox50.jpg';
import citycom300i from '@/assets/models/citycom300i.jpg';
import jet4rNaked from '@/assets/models/jet4rnaked.jpg';
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
import legrande200 from '@/assets/models/legrande-200.png';
import quadlander300 from '@/assets/models/quadlander-300.jpg';
import quadlander600 from '@/assets/models/quadlander-600.png';
import redDevil from '@/assets/models/red-devil.webp';
import retro50 from '@/assets/models/retro-50.jpg';
import shark from '@/assets/models/shark-150.webp';
import symba from '@/assets/models/symba.webp';
import vs from '@/assets/models/vs-125.webp';

/**
 * Stable SYM model code -> product photo. Sourced from scoota.com.au, sym-global.com and
 * supplied SYM press images. Some photos are reused across a model family or
 * across a 50/150 (Shark) or 125/150 (VS) sibling pair.
 */
export const MODEL_IMAGES: Record<string, StaticImageData> = {
  // 50cc
  'AE05W6-RU': crox50,
  'AE05WB-EU': crox50,
  'BK05W2-8': jetsportx,
  'JD05W1-8': jet4rNaked,
  'FT05V-8': jolie,
  'HU05W2-8': mio,
  'FS05W1-EU': mio,
  'AV05W-8': orbit,
  'BL05W5-8': redDevil,
  'FA05U1-8': retro50,
  'BS05W-8': shark,
  'AW05W-8': fiddle,

  // 100–165cc
  'AW12W-6': fiddle,
  'XG12W1-IT': classic125sport,
  'AX15W2-6': fiddle,
  'TB16W3-EU': drgbt,
  'FDA12D1CN-EU': echs125,
  'HF15W-8': euromx,
  'LA12W-8': legrande125,
  'HU10W1-8': mio,
  'AV12W-8': orbit,
  'AE12W1-6': orbit,
  'XE12W1-IT': orbit,
  'HS15W-8': shark,
  'MB10A7-8': symba,
  'AY15W4-8': symphony,
  'AZ15W2-6': symphonySr,
  'AE12W4-EU': ute125,
  'HA12A6-8': vs,
  'HA12WA-8': vs,
  'HV15WC-8': vs,

  // 200–400cc
  'LZ40W1-EU': maxsym,
  'LX40A2-6': maxsym,
  'LX40A4-EU': maxsym,
  'XA20W1-EU': fiddle,
  'LM25W-8': firenze250,
  'LM30W-8': firenze300i,
  'LH30W-8': citycom300i,
  'LC18W1-6': hd2,
  'LH18W7-6': hd200evo,
  'LH18W7-8': hd200evo,
  'LH18W-8': hd200evo,
  'LH18W5-8': hd200evo,
  'LS30W1-EU': hd300,
  'LW30W2-EU': joymaxz,
  'LA18W1-8': legrande200,
  'XL20W1-IT': symphonySt,
  'XB20W1-EU': symphonySt,

  // ATV
  'UA30A-A': quadlander300,
  'UA60A-8': quadlander600,
  'UA60A2-6': quadlander600,
};
