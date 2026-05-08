import { Flame } from 'lucide-react';

const PopularBadge = ({ className = '' }: { className?: string }) => (
    <div className={`inline-flex items-center gap-3 bg-[var(--bg-light-secondary)] border border-[var(--highlight)] rounded-xl px-4 py-2.5 ${className}`}>
        <Flame
            className="h-6 w-6 shrink-0 text-[var(--highlight)] animate-bounce"
            style={{ animationDuration: '2s' }}
        />
        <div className="leading-tight">
            <p className="text-sm font-bold text-[var(--highlight)]">Popular</p>
            <p className="text-xs text-[var(--text-dark-secondary)]">Highly sought after</p>
        </div>
    </div>
);

export default PopularBadge;
