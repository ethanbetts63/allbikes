import React from 'react';
import Hero from '../components/Hero';
import ContactDetails from '../components/ContactDetails';

const ContactPage: React.FC = () => {
    return (
        <div>
            <Hero
                title="Contact Us"
                paragraph="We'd love to hear from you. Please feel free to reach out with any questions or comments."
            />
            <ContactDetails />
        </div>
    );
};

export default ContactPage;
