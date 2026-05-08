import type { Bike } from '@/types/Bike';

export const formatRate = (bike: Bike, monthlyDiscountPercent?: number | null): string => {
    if (!bike.daily_rate || parseFloat(bike.daily_rate) <= 0) return 'Contact for rates';
    const daily = parseFloat(bike.daily_rate);
    if (monthlyDiscountPercent && monthlyDiscountPercent > 0) {
        const discounted = Math.ceil(daily * (1 - monthlyDiscountPercent / 100));
        return `From $${discounted}/day`;
    }
    return `From $${daily.toFixed(0)}/day`;
};

export const formatDate = (dateStr: string): string =>
    new Date(dateStr + 'T00:00:00').toLocaleDateString('en-AU', {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

