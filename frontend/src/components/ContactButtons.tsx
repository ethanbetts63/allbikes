import { Phone, Mail } from 'lucide-react';
import type { ContactButtonsProps } from '@/types/ContactButtonsProps';

const ContactButtons = ({ phoneNumber, mobileNumber, emailAddress }: ContactButtonsProps) => {
  if (!phoneNumber && !mobileNumber && !emailAddress) {
    return null;
  }

  const primaryPhoneNumber = phoneNumber || mobileNumber;
  let displayedPhoneNumbers = '';

  if (phoneNumber && mobileNumber) {
    displayedPhoneNumbers = `${phoneNumber} / ${mobileNumber}`;
  } else if (phoneNumber) {
    displayedPhoneNumbers = phoneNumber;
  } else if (mobileNumber) {
    displayedPhoneNumbers = mobileNumber;
  }

  return (
    <div className="bg-foreground py-8">
      <div className="container mx-auto px-4 flex flex-col sm:flex-row items-center justify-center gap-4">
        {primaryPhoneNumber && (
          <>
            {/* Clickable on mobile */}
            <a
              href={`tel:${primaryPhoneNumber}`}
              className="md:hidden w-full sm:w-auto flex items-center justify-center gap-2.5 bg-amber-400 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-full hover:bg-amber-300 transition-colors"
            >
              <Phone className="h-4 w-4" />
              {displayedPhoneNumbers}
            </a>
            {/* Static on desktop */}
            <div className="hidden md:flex items-center justify-center gap-2.5 bg-amber-400 text-[var(--text-dark-primary)] font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-full cursor-default">
              <Phone className="h-4 w-4" />
              {displayedPhoneNumbers}
            </div>
          </>
        )}
        {emailAddress && (
          <a
            href={`mailto:${emailAddress}`}
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto flex items-center justify-center gap-2.5 bg-stone-700 text-[var(--text-light-primary)] font-bold text-sm uppercase tracking-widest px-6 py-3 rounded-full hover:bg-stone-600 transition-colors"
          >
            <Mail className="h-4 w-4" />
            {emailAddress}
          </a>
        )}
      </div>
    </div>
  );
};

export default ContactButtons;
