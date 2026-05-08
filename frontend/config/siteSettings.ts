import type { SiteSettings } from '@/types/SiteSettings';

// This file serves as the single source of truth for all static site settings.
// The values are hardcoded from the last known database backup.
// To update these values, edit this file directly.

export const SITE_TIMEZONE = 'Australia/Perth';

export const siteSettings: SiteSettings = {
  id: 1,
  enable_motorcycle_mover: true,
  enable_banner: true,
  banner_text: "Shut for Easter from 2nd to 8th of April. Happy Easter!",
  phone_number: "94334613",
  mobile_number: "0477700005",
  email_address: "admin@scootershop.com.au",
  street_address: "Unit 5 / 6 Cleveland Street",
  address_locality: "Dianella",
  address_region: "WA",
  postal_code: "6059",
  google_places_place_id: "ChIJy_zrHmGhMioRisz6mis0SpQ",
  mrb_number: "MRB5092",
  abn_number: "46157594161",
  md_number: "28276",
  youtube_link: "", 
  instagram_link: "", 
  facebook_link: "", 
  opening_hours_monday: "9:00 AM - 5:00 PM",
  opening_hours_tuesday: "9:00 AM - 5:00 PM",
  opening_hours_wednesday: "9:00 AM - 5:00 PM",
  opening_hours_thursday: "9:00 AM - 5:00 PM",
  opening_hours_friday: "9:00 AM - 5:00 PM",
  opening_hours_saturday: "10:00 AM - 1:00 PM",
  opening_hours_sunday: "Closed",
  special_hours_note: "Closed on public holidays including Easter (April 2nd-8th) and Christmas.",
  hide_escooters: false,
  accept_online_payment: true,
  show_workshop_clearance: false,
  show_hire: true,
};
