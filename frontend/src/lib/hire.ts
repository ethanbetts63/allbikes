import type { Bike } from '@/types/Bike';

export const formatRate = (bike: Bike): string => {
    const candidates: number[] = [];
    if (bike.daily_rate && parseFloat(bike.daily_rate) > 0) candidates.push(parseFloat(bike.daily_rate));
    if (bike.weekly_rate && parseFloat(bike.weekly_rate) > 0) candidates.push(parseFloat(bike.weekly_rate) / 7);
    if (bike.monthly_rate && parseFloat(bike.monthly_rate) > 0) candidates.push(parseFloat(bike.monthly_rate) / 30);
    if (candidates.length === 0) return 'Contact for rates';
    return `From $${Math.min(...candidates).toFixed(0)}/day`;
};

export const formatDate = (dateStr: string): string =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

export const hireFaqData = [
    {
        question: 'Do I need a motorcycle licence to hire a bike?',
        answer: 'No. You only need a motorcycle licence to ride bikes larger than 50cc. We have a range of scooters and small bikes that can be hired with a car licence. Please check the specific requirements for each bike on our hire page.',
    },
    {
        question: 'How does the bond work?',
        answer: 'A refundable bond is charged at the time of payment along with your hire total. It is returned in full once the bike is back with us in good condition.',
    },
    {
        question: 'What is included in the hire?',
        answer: 'The hire fee covers the use of the motorcycle for your chosen period. The bike comes serviced and ready to ride. Fuel is not included — you return the bike with the same amount of fuel as when you collected it.',
    },
    {
        question: 'Can I extend my hire period?',
        answer: 'Extensions are subject to availability. Contact us as early as possible if you need to extend and we\'ll do our best to accommodate you.',
    },
    {
        question: 'What happens if I damage the bike?',
        answer: 'Any damage beyond normal wear and tear will be assessed and deducted from your bond. Significant damage may incur additional costs. Our hire terms and conditions cover this in detail.',
    },
];
