import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';

interface ContactButtonsProps {
  phoneNumber?: string;
  emailAddress?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ phoneNumber, emailAddress }) => {
  if (!phoneNumber && !emailAddress) {
    return null;
  }

  return (
    <div className="bg-background py-0">
      <div className="container mx-auto flex flex-col items-center justify-center text-center">
        <div className="mt-0 flex flex-col sm:flex-row items-center justify-center gap-6">
          {phoneNumber && (
            <>
              {/* This link is only active on small screens */}
              <a href={`tel:${phoneNumber}`} className="md:hidden">
                <Button size="lg" className="text-lg">
                  <Phone className="mr-2 h-6 w-6" />
                  {phoneNumber}
                </Button>
              </a>
              {/* This is a visual, non-clickable button on medium and larger screens */}
              <div className="hidden md:inline-flex">
                <Button size="lg" className="text-lg cursor-default hover:bg-primary">
                  <Phone className="mr-2 h-6 w-6" />
                  {phoneNumber}
                </Button>
              </div>
            </>
          )}
          {emailAddress && (
            <a href={`mailto:${emailAddress}?`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="text-lg bg-blue-600 text-white hover:bg-blue-700">
                <Mail className="mr-2 h-6 w-6" />
                {emailAddress}
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactButtons;
