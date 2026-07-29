export const AUSTRALIAN_STATES = [
  { value: 'ACT', label: 'Australian Capital Territory' },
  { value: 'NSW', label: 'New South Wales' },
  { value: 'NT', label: 'Northern Territory' },
  { value: 'QLD', label: 'Queensland' },
  { value: 'SA', label: 'South Australia' },
  { value: 'TAS', label: 'Tasmania' },
  { value: 'VIC', label: 'Victoria' },
  { value: 'WA', label: 'Western Australia' },
] as const;

type AustralianState = typeof AUSTRALIAN_STATES[number]['value'];
type PostcodeRange = readonly [number, number];

const STATE_POSTCODE_RANGES: Record<AustralianState, readonly PostcodeRange[]> = {
  ACT: [[200, 299], [2600, 2618], [2900, 2920]],
  NSW: [[1000, 2599], [2619, 2899], [2921, 2999]],
  NT: [[800, 999]],
  QLD: [[4000, 4999], [9000, 9999]],
  SA: [[5000, 5999]],
  TAS: [[7000, 7999]],
  VIC: [[3000, 3999], [8000, 8999]],
  WA: [[6000, 6999]],
};

const isAustralianState = (state: string): state is AustralianState =>
  Object.prototype.hasOwnProperty.call(STATE_POSTCODE_RANGES, state);

/** Broad state compatibility, including state-specific PO-box postcode ranges. */
export const postcodeMatchesState = (postcode: string, state: string): boolean => {
  if (!/^\d{4}$/.test(postcode) || !isAustralianState(state)) return false;
  const number = Number(postcode);
  return STATE_POSTCODE_RANGES[state].some(([start, end]) => number >= start && number <= end);
};

/** A single form-level error for an Australian state/postcode pair. */
export const australianAddressError = (
  stateValue: string | undefined,
  postcodeValue: string | undefined,
  required = false,
): string | null => {
  const state = stateValue?.trim().toUpperCase() ?? '';
  const postcode = postcodeValue?.trim() ?? '';
  if (!required && !state && !postcode) return null;
  if (!state) return 'Select an Australian state or territory.';
  if (!isAustralianState(state)) return 'Select a valid Australian state or territory.';
  if (!postcode) return 'Postcode is required when a state is provided.';
  if (!/^\d{4}$/.test(postcode)) return 'Enter a valid four-digit Australian postcode.';
  if (!postcodeMatchesState(postcode, state)) return `Postcode ${postcode} does not match ${state}.`;
  return null;
};
