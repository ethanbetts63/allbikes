import type { StaticImageData } from 'next/image';
import crox50 from '@/assets/models/crox50-ae05w6-ru.webp';
import croxE5 from '@/assets/models/crox-e5-ae05wb-eu.webp';
import jet4rNaked from '@/assets/models/jet4r-naked-jd05w1-8.webp';
import jetsportx from '@/assets/models/jetsportx-bk05w2-8.webp';
import jolie from '@/assets/models/jolie-ft05v-8.webp';
import mio50 from '@/assets/models/mio-50-hu05w2-8.webp';
import mio50i from '@/assets/models/mio-50i-fs05w1-eu.webp';
import mio100 from '@/assets/models/mio-100-hu10w1-8.webp';
import orbit50 from '@/assets/models/orbit-50-av05w-8.webp';
import redDevil from '@/assets/models/red-devil-bl05w5-8.webp';
import retro50 from '@/assets/models/retro-fa05u1-8.webp';
import shark50 from '@/assets/models/shark-50-bs05w-8.webp';
import shark150 from '@/assets/models/shark-150-hs15w-8.webp';
import symba from '@/assets/models/symba-mb10a7-8.webp';
import classic50 from '@/assets/models/classic-50-aw05w-8.webp';
import classic125 from '@/assets/models/classic-125-aw12w-6.webp';
import classic125Sport from '@/assets/models/classic-125-sport-xg12w1-it.webp';
import classic150 from '@/assets/models/classic-150-ax15w2-6.webp';
import classic200i from '@/assets/models/classic-200i-xa20w1-eu.webp';
import orbit125 from '@/assets/models/orbit-125-av12w-8.webp';
import orbit125iii from '@/assets/models/orbit-125-iii-xe12w1-it.webp';
import euromx150 from '@/assets/models/euromx-150-hf15w-8.webp';
import symphonySr from '@/assets/models/symphonysr-150-az15w2-6.webp';
import vs125 from '@/assets/models/vs-125-ha12a6-8+ha12wa-8.webp';
import vs150 from '@/assets/models/vs-150-hv15wc-8.webp';
import drgbt160 from '@/assets/models/drgbt-160-tb16w3-eu.webp';
import symphonySt200iE5 from '@/assets/models/symphonyst200i-e5-xl20w1-it.webp';
import symphonySt200i from '@/assets/models/symphonyst200i-xb20w1-eu.webp';
import echs125 from '@/assets/models/echs-125-fda12d1cn-eu.webp';
import firenze300i from '@/assets/models/firenze-300i-lm30w-8.webp';
import firenze250 from '@/assets/models/firenze-250-lm25w-8.webp';
import legrande200 from '@/assets/models/legrande-200-la18w1-8.webp';
import citycom300i from '@/assets/models/citycom-300i-lh30w-8.webp';
import hd2 from '@/assets/models/hd2-lc18w1-6.webp';
import hd200ievo from '@/assets/models/hd200ievo-lh18w7-6+lh18w7-8.webp';
import maxsym400i from '@/assets/models/maxsym400i-lx40a2-6+lx40a4-eu.webp';
import maxsym400i2022 from '@/assets/models/maxsym400i-2022-lz40w1-eu.webp';
import hd300i from '@/assets/models/hd300i-ls30w1-eu.webp';
import joymaxz from '@/assets/models/joymax-z-lw30w2-eu.webp';
import quadlander300 from '@/assets/models/quadlander-300-ua30a-a.webp';
import quadlander600 from '@/assets/models/quadlander-600-ua60a-8.webp';
import quadlander600le from '@/assets/models/quadlander-600le-ua60a2-6.webp';
import legrande125 from '@/assets/models/legrande-125-la12w-8.webp';
import uteScoot125 from '@/assets/models/ute-scoot-125-ae12w4-eu.webp';
import symphony from '@/assets/models/symphony-ay15w4-8.webp';
import hd200 from '@/assets/models/hd200-lh18w-8+lh18w5-8.webp';
import orbitII125 from '@/assets/models/orbit-ii-125-ae12w1-6.webp';

/**
 * Stable SYM model code -> product photo. Most photos are sourced from the
 * official Select Portal service-manual listing (one press photo per
 * model); a handful of models with no photo on that page (Symphony,
 * Ute Scoot 125, LeGrande 125, HD200 non-evo, Quadlander 600LE) use the
 * legacy photo from assets/old_photos instead. Codes with no photo from
 * either source are omitted; ModelCard falls back to a text placeholder.
 */
export const MODEL_IMAGES: Record<string, StaticImageData> = {
  // 50cc
  'AE05W6-RU': crox50,
  'AE05WB-EU': croxE5,
  'BK05W2-8': jetsportx,
  'JD05W1-8': jet4rNaked,
  'FT05V-8': jolie,
  'HU05W2-8': mio50,
  'FS05W1-EU': mio50i,
  'AV05W-8': orbit50,
  'BL05W5-8': redDevil,
  'FA05U1-8': retro50,
  'BS05W-8': shark50,
  'AW05W-8': classic50,

  // 100-165cc
  'AW12W-6': classic125,
  'XG12W1-IT': classic125Sport,
  'AX15W2-6': classic150,
  'TB16W3-EU': drgbt160,
  'FDA12D1CN-EU': echs125,
  'HF15W-8': euromx150,
  'HU10W1-8': mio100,
  'AV12W-8': orbit125,
  'XE12W1-IT': orbit125iii,
  'HS15W-8': shark150,
  'MB10A7-8': symba,
  'AZ15W2-6': symphonySr,
  'HA12A6-8': vs125,
  'HA12WA-8': vs125,
  'HV15WC-8': vs150,
  'AY15W4-8': symphony,
  'AE12W4-EU': uteScoot125,
  'LA12W-8': legrande125,
  'AE12W1-6': orbitII125,

  // 200-400cc
  'LZ40W1-EU': maxsym400i2022,
  'LX40A2-6': maxsym400i,
  'LX40A4-EU': maxsym400i,
  'XA20W1-EU': classic200i,
  'LM25W-8': firenze250,
  'LM30W-8': firenze300i,
  'LH30W-8': citycom300i,
  'LC18W1-6': hd2,
  'LH18W7-6': hd200ievo,
  'LH18W7-8': hd200ievo,
  'LH18W-8': hd200,
  'LH18W5-8': hd200,
  'LS30W1-EU': hd300i,
  'LW30W2-EU': joymaxz,
  'LA18W1-8': legrande200,
  'XL20W1-IT': symphonySt200iE5,
  'XB20W1-EU': symphonySt200i,

  // ATV
  'UA30A-A': quadlander300,
  'UA60A-8': quadlander600,
  'UA60A2-6': quadlander600le,
};
