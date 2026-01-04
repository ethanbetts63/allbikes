import React, { useState } from 'react';
import { Card, CardContent } from "./ui/card";
import { ChevronDown } from 'lucide-react';
import type { FooterSettings } from '@/types';

// Define the FAQ item type locally
interface FaqItem {
  question: string;
  answer: string;
}

interface FaqSectionProps {
  title: string;
  siteSettings: FooterSettings | null;
}

export const FaqSection: React.FC<FaqSectionProps> = ({ title, siteSettings }) => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  // Hardcoded FAQ data with placeholders
  const faqData: FaqItem[] = [
    {
      "question": "How can I contact you?",
      "answer": `You can contact us by phone on ${siteSettings?.phone_number || '{phone}'}, by email at ${siteSettings?.email_address || '{email}'}, or via our Contact Us page.`
    },
    {
      "question": "What types of motorcycles and scooters do you service?",
      "answer": "We service all motorcycles and most scooters. For scooters, we specialise in Italian brands and mid to upper-end Asian brands. Some brands are excluded due to parts availability and build quality concerns, allowing us to maintain reliable, long-lasting repairs. Full details are listed on our service page."
    },
    {
      "question": "What areas of Perth do you service?",
      "answer": `Our workshop is based in Dianella at ${siteSettings?.street_address || '{address}'}. While we service surrounding suburbs, many customers visit us from across Greater Perth. We can recommend a motorcycle mover service, so distance is not an issue. More information is available on our service page.`
    },
    {
      "question": "Do you service electric motorcycles and scooters?",
      "answer": "Yes, we service electric motorcycles and electric mopeds."
    },
    {
      "question": "Do you sell or service electric kick scooters?",
      "answer": "No. We sell and service electric mopeds and electric motorcycles, but we do not work on electric kick scooters. The term “electric scooter” is often used for both, despite being very different vehicles."
    }
  ];

  const toggleFaq = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  const generateJsonLd = () => {
    if (!faqData.length) {
      return null;
    }

    const faqItems = faqData.map(faq => ({
      "@type": "Question",
      "name": faq.question,
      "acceptedAnswer": {
        "@type": "Answer",
        "text": faq.answer
      }
    }));

    const jsonLd = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqItems
    };

    return (
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    );
  };

  return (
    <>
      {generateJsonLd()}
      <div className="py-8 bg-background">
        <div className="container mx-auto px-4">
          <h2 className="text-4xl font-bold text-center text-[var(--text-primary)] mb-8">{title}</h2>
          <div className="flex flex-col items-center gap-4">
            {faqData.map((faq, index) => (
              <div key={index} className="w-full md:w-2/3 lg:w-2/3">
                <Card className="bg-white text-black rounded-lg shadow-md">
                  <CardContent className="p-0">
                    <div
                      className="flex justify-between items-center p-6 cursor-pointer"
                      onClick={() => toggleFaq(index)}
                    >
                      <h3 className="text-2xl font-semibold text-black">{faq.question}</h3>
                      <ChevronDown
                        className={`h-6 w-6 text-gray-500 transition-transform duration-300 ${openIndex === index ? 'transform rotate-180' : ''
                          }`}
                      />
                    </div>
                    <div
                      className={`overflow-hidden transition-all ease-in-out duration-500 ${
                        openIndex === index ? 'max-h-96' : 'max-h-0'
                      }`}
                    >
                      <div className="px-6 pb-6 pt-2">
                        <p className="text-gray-700 text-lg">{faq.answer}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            ))}
          </div>
        </div>
      </div>
    </>
  );
};
