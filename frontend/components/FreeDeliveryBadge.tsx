import deliveryIcon from '@/assets/delivery_symbol.svg';

const FreeDeliveryBadge = ({ className = '' }: { className?: string }) => (
    <div className={`inline-flex items-center gap-3 bg-[var(--bg-light-secondary)] border border-[var(--highlight)] rounded-xl px-4 py-2.5 ${className}`}>
        <img
            src={deliveryIcon}
            alt=""
            className="h-6 w-6 shrink-0 animate-bounce"
            style={{ animationDuration: '2s' }}
        />
        <div className="leading-tight">
            <p className="text-sm font-bold text-[var(--highlight)]">Free Delivery</p>
            <p className="text-xs text-[var(--text-dark-secondary)]">Included on all E-Scooters</p>
        </div>
    </div>
);

export default FreeDeliveryBadge;
