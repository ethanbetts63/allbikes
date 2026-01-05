import React from 'react';
import Seo from '@/components/Seo';

const SecurityPolicyPage: React.FC = () => {
  return (
    <>
      <Seo
        title="Security Policy | Allbikes"
        description="Our security policy outlines the steps we take to protect your information, including electronic and hard-copy data protection."
        canonicalPath="/security"
      />
      <div className="container mx-auto p-4 py-8">
        <h1 className="text-4xl font-bold mb-6 text-[var(--text-primary)]">Security Policy</h1>
        <div className="prose max-w-none text-[var(--text-primary)]">
          <p>
            We take all reasonable steps to keep secure any information which we hold about you. Personal information may be stored both electronically on our computer system, and in hard-copy form. Firewalls, 2048 Bit v3 SSL encryption, passwords, anti-virus software and email filters act to protect all our electronic information.
          </p>
          <p>
            We do not store credit card information, we securely submit credit card information to our bank for processing.
          </p>
        </div>
      </div>
    </>
  );
};

export default SecurityPolicyPage;
