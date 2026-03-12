import { MapPin, Phone, Mail, Clock } from 'lucide-react';

const backupContactDetails = {
    id: 0,
    enable_motorcycle_mover: false,
    enable_banner: false,
    banner_text: "",
    phone_number: "94334613",
    mobile_number: "0477700005",
    email_address: "admin@scootershop.com.au",
    street_address: "Unit 5 / 6 Cleveland Street",
    address_locality: "Dianella",
    address_region: "WA",
    postal_code: "6059",
    google_places_place_id: "",
    mrb_number: "",
    abn_number: "",
    md_number: "",
    youtube_link: "",
    instagram_link: "",
    facebook_link: "",
    opening_hours_monday: "9:00 AM - 5:00 PM",
    opening_hours_tuesday: "9:00 AM - 5:00 PM",
    opening_hours_wednesday: "9:00 AM - 5:00 PM",
    opening_hours_thursday: "9:00 AM - 5:00 PM",
    opening_hours_friday: "9:00 AM - 5:00 PM",
    opening_hours_saturday: "Closed",
    opening_hours_sunday: "Closed",
    last_updated: new Date().toISOString(),
};

const days = [
    { label: 'Monday',    key: 'opening_hours_monday' },
    { label: 'Tuesday',   key: 'opening_hours_tuesday' },
    { label: 'Wednesday', key: 'opening_hours_wednesday' },
    { label: 'Thursday',  key: 'opening_hours_thursday' },
    { label: 'Friday',    key: 'opening_hours_friday' },
    { label: 'Saturday',  key: 'opening_hours_saturday' },
    { label: 'Sunday',    key: 'opening_hours_sunday' },
] as const;

const ContactDetails = () => {
    const s = backupContactDetails;
    const fullAddress = `${s.street_address}, ${s.address_locality} ${s.address_region} ${s.postal_code}`;
    const primaryPhone = s.phone_number || s.mobile_number;
    const displayPhone = s.phone_number && s.mobile_number
        ? `${s.phone_number} / ${s.mobile_number}`
        : primaryPhone;

    return (
        <div className="container mx-auto px-4 py-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">

                {/* Location & Contact */}
                <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <MapPin className="h-5 w-5 text-amber-400 shrink-0" />
                        <h2 className="text-lg font-black text-stone-900 uppercase tracking-wide">Our Location</h2>
                    </div>
                    <p className="text-stone-600 text-sm mb-4">{fullAddress}</p>
                    <div className="space-y-3">
                        {primaryPhone && (
                            <div className="flex items-center gap-2.5">
                                <Phone className="h-4 w-4 text-stone-400 shrink-0" />
                                <a href={`tel:${primaryPhone}`} className="text-stone-700 text-sm font-semibold hover:text-amber-500 transition-colors">
                                    {displayPhone}
                                </a>
                            </div>
                        )}
                        {s.email_address && (
                            <div className="flex items-center gap-2.5">
                                <Mail className="h-4 w-4 text-stone-400 shrink-0" />
                                <a href={`mailto:${s.email_address}`} className="text-stone-700 text-sm font-semibold hover:text-amber-500 transition-colors">
                                    {s.email_address}
                                </a>
                            </div>
                        )}
                    </div>
                </div>

                {/* Opening Hours */}
                <div className="bg-white border border-stone-200 rounded-lg shadow-sm p-6">
                    <div className="flex items-center gap-2 mb-4">
                        <Clock className="h-5 w-5 text-amber-400 shrink-0" />
                        <h2 className="text-lg font-black text-stone-900 uppercase tracking-wide">Opening Hours</h2>
                    </div>
                    <ul className="divide-y divide-stone-100">
                        {days.map(({ label, key }) => {
                            const hours = s[key] || 'N/A';
                            const closed = hours.toLowerCase() === 'closed';
                            return (
                                <li key={label} className="flex justify-between items-center py-2 text-sm">
                                    <span className="text-stone-500 font-medium">{label}</span>
                                    <span className={closed ? 'text-stone-400' : 'text-stone-900 font-semibold'}>
                                        {hours}
                                    </span>
                                </li>
                            );
                        })}
                    </ul>
                </div>

            </div>
        </div>
    );
};

export default ContactDetails;
