import type { Bike } from '@/types/Bike';

export const formatRate = (bike: Bike): string => {
    if (!bike.daily_rate || parseFloat(bike.daily_rate) <= 0) return 'Contact for rates';
    return `From $${parseFloat(bike.daily_rate).toFixed(0)}/day`;
};

export const formatDate = (dateStr: string): string =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

