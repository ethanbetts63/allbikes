import type { PriceDisplayProps } from '@/types/PriceDisplayProps';

const PriceDisplay = ({ price, discount_price, subtitle }: PriceDisplayProps) => (
    <div className="mb-6 pb-4 border-b border-border-light">
        {discount_price && parseFloat(discount_price) > 0 ? (
            <div className="flex items-baseline gap-3">
                <span className="text-4xl font-semibold text-[var(--highlight)]">
                    ${parseFloat(discount_price).toLocaleString()}
                </span>
                <span className="text-xl text-[var(--text-dark-secondary)] line-through">
                    ${parseFloat(price).toLocaleString()}
                </span>
            </div>
        ) : (
            <span className="text-4xl font-semibold text-[var(--text-dark-primary)]">
                ${parseFloat(price).toLocaleString()}
            </span>
        )}
        {subtitle && <div className="mt-1">{subtitle}</div>}
    </div>
);

export default PriceDisplay;
