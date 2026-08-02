import rawSpecs from './modelSpecs.json';

// Keys present on an entry when the underlying manual data is doubtful
// (model-code mismatch, contradictory engine-type text, etc). Entries
// carrying any of these are treated as "unverified" and are not shown.
const UNCERTAIN_FLAG_KEYS = [
  'manual_model_code_mismatch',
  'manual_note',
  'engine_type_note',
  'top_speed_kmh_note',
] as const;

export interface ModelSpec {
  name?: string;
  engine_type?: string;
  displacement_cc?: number | string;
  bore_mm?: number | string;
  stroke_mm?: number | string;
  compression_ratio?: string;
  max_power?: string;
  max_torque?: string;
  fuel?: string;
  fuel_tank_l?: number | string;
  ignition?: string;
  starting_system?: string;
  transmission?: string;
  clutch?: string;
  length_mm?: number | string;
  width_mm?: number | string;
  height_mm?: number | string;
  wheelbase_mm?: number | string;
  curb_weight_kg?: number | string;
  dry_weight_kg?: number | string;
  top_speed_kmh?: string | number;
  tire_front?: string;
  tire_rear?: string;
  brake_front?: string;
  brake_rear?: string;
  suspension_front?: string;
  suspension_rear?: string;
  [key: string]: unknown;
}

const SPECS = rawSpecs as Record<string, ModelSpec>;

/** Returns the spec entry for a model code, or null if there is none or its data is flagged as unverified. */
export function getModelSpec(modelCode: string): ModelSpec | null {
  const spec = SPECS[modelCode.toUpperCase()];
  if (!spec) return null;
  if (UNCERTAIN_FLAG_KEYS.some((key) => key in spec)) return null;
  return spec;
}

export interface SpecRow {
  label: string;
  value: string;
}

/** Ordered, human-readable rows for a spec table. Rows with no data are omitted. */
export function buildSpecRows(spec: ModelSpec): SpecRow[] {
  const rows: SpecRow[] = [];
  const add = (label: string, value: unknown, suffix = '') => {
    if (value === undefined || value === null || value === '') return;
    rows.push({ label, value: `${value}${suffix}` });
  };

  add('Engine', spec.engine_type);
  add('Displacement', spec.displacement_cc, ' cc');
  if (spec.bore_mm && spec.stroke_mm) {
    rows.push({ label: 'Bore x stroke', value: `${spec.bore_mm} x ${spec.stroke_mm} mm` });
  }
  add('Compression ratio', spec.compression_ratio);
  add('Max power', spec.max_power);
  add('Max torque', spec.max_torque);
  add('Fuel', spec.fuel);
  add('Fuel tank capacity', spec.fuel_tank_l, ' L');
  add('Ignition', spec.ignition);
  add('Starting system', spec.starting_system);
  add('Transmission', spec.transmission);
  add('Clutch', spec.clutch);
  if (spec.length_mm && spec.width_mm && spec.height_mm) {
    rows.push({ label: 'Length x width x height', value: `${spec.length_mm} x ${spec.width_mm} x ${spec.height_mm} mm` });
  }
  add('Wheelbase', spec.wheelbase_mm, ' mm');
  add('Curb weight', spec.curb_weight_kg ?? spec.dry_weight_kg, ' kg');
  add('Top speed', spec.top_speed_kmh, typeof spec.top_speed_kmh === 'number' ? ' km/h' : '');
  add('Front tire', spec.tire_front);
  add('Rear tire', spec.tire_rear);
  add('Front brake', spec.brake_front);
  add('Rear brake', spec.brake_rear);
  add('Front suspension', spec.suspension_front);
  add('Rear suspension', spec.suspension_rear);

  return rows;
}

/** A short natural-language summary of the same data, for use as page subtext. */
export function buildSpecSummary(modelName: string, modelCode: string, spec: ModelSpec): string {
  const sentences: string[] = [];

  if (spec.engine_type && spec.displacement_cc) {
    let engineSentence = `The ${modelName} (${modelCode}) is powered by a ${spec.engine_type} engine displacing ${spec.displacement_cc}cc`;
    if (spec.max_power) engineSentence += `, producing ${spec.max_power}`;
    sentences.push(`${engineSentence}.`);
  }

  if (spec.transmission) {
    sentences.push(`Drive goes through a ${spec.transmission}${spec.clutch ? ` with a ${spec.clutch}` : ''}.`);
  }

  if (spec.length_mm && spec.width_mm && spec.height_mm) {
    let dims = `It measures ${spec.length_mm}mm long, ${spec.width_mm}mm wide and ${spec.height_mm}mm tall`;
    if (spec.wheelbase_mm) dims += `, with a ${spec.wheelbase_mm}mm wheelbase`;
    const weight = spec.curb_weight_kg ?? spec.dry_weight_kg;
    if (weight) dims += ` and a curb weight of ${weight}kg`;
    sentences.push(`${dims}.`);
  }

  if (spec.top_speed_kmh) {
    sentences.push(`Top speed is ${spec.top_speed_kmh}${typeof spec.top_speed_kmh === 'number' ? ' km/h' : ''}.`);
  }

  if (spec.tire_front && spec.tire_rear) {
    let tires = `It rides on a ${spec.tire_front} front tire and ${spec.tire_rear} rear tire`;
    if (spec.brake_front && spec.brake_rear) tires += `, with ${spec.brake_front} front and ${spec.brake_rear} rear brakes`;
    sentences.push(`${tires}.`);
  }

  return sentences.join(' ');
}
