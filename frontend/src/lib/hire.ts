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

