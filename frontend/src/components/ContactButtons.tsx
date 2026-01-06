import React from 'react';
import { Button } from '@/components/ui/button';
import { Phone, Mail } from 'lucide-react';

interface ContactButtonsProps {
  phoneNumber?: string;
  emailAddress?: string;
}

const ContactButtons: React.FC<ContactButtonsProps> = ({ phoneNumber, emailAddress }) => {
  if (!phoneNumber && !emailAddress) {
    return null; // Don't render anything if no contact info is provided
  }

  return (
    <div className="bg-background py-0">
      <div className="container mx-auto flex flex-col items-center justify-center text-center">
        <div className="mt-2 flex flex-col sm:flex-row items-center justify-center gap-6">
          {phoneNumber && (
            <>
              <a href={`tel:${phoneNumber}`} className="hidden sm:block">
                <Button size="lg">
                  <Phone className="mr-2 h-6 w-6" />
                  Call Us ({phoneNumber})
                </Button>
              </a>
              <a href={`tel:${phoneNumber}`} className="sm:hidden">
                <Button size="lg">
                  <Phone className="mr-2 h-6 w-6" />
                  Call Us
                </Button>
              </a>
            </>
          )}
          {emailAddress && (
            <a href={`mailto:${emailAddress}?`} target="_blank" rel="noopener noreferrer">
              <Button size="lg" className="bg-blue-600 text-white hover:bg-blue-700">
                <Mail className="mr-2 h-6 w-6" />
                Email Us ({emailAddress})
              </Button>
            </a>
          )}
        </div>
      </div>
    </div>
  );
};

export default ContactButtons;
