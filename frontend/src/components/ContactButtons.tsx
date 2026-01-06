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
              <a href={`tel:${phoneNumber}`} className="hidden sm:block">
                <Button size="lg">
                  <Phone className="mr-2 h-6 w-6" />
                  Call ({phoneNumber})
                </Button>
              </a>
            </>
          )}
          {emailAddress && (
            <a href={`mailto:${emailAddress}?`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                <Mail className="mr-2 h-6 w-6" />
                Email ({emailAddress})
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactButtons;
