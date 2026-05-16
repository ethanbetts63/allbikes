import { siteSettings } from '@/config/siteSettings';
import type { FaqItem } from '@/types/FaqItem';

export const contactFaqData: FaqItem[] = [
  {
    question: 'How can I contact you?',
    answer: `You can contact us by phone on ${siteSettings.phone_number || '{phone}'}, by email at ${siteSettings.email_address || '{email}'}, or via our Contact Us page.`,
  },
  {
    question: 'What types of motorcycles and scooters do you service?',
    answer: 'We service almost all motorcycles and scooters.',
  },
  {
    question: 'What areas of Perth do you service?',
    answer: `Our workshop is based in Dianella at ${siteSettings.street_address || '{address}'}. If you are looking for "motorcycle mechanics near me" or "scooter mechanics near me", ScooterShop frequently services the areas of Dianella, Morley, Fremantle, Yokine, CBD, Menora, Cottesloe, Mount Lawley, North Perth, Northbridge, Inglewood and many other Perth suburbs. If you are more distant, or are unable to move your bike, we work closely with and can recommend Perth Motorcycle and Scooter Movers. More information is available on our service page.`,
  },
  {
    question: 'Do you service electric motorcycles and scooters?',
    answer: 'Yes, we service electric motorcycles and electric mopeds.',
  },
];
