import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

import type { BreadcrumbProps } from '@/types/BreadcrumbProps';

const Breadcrumb = ({ items }: BreadcrumbProps) => {
  return (
    <nav className="flex justify-end pt-2 px-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        {items.map((item, index) => (
          <li key={item.name} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="h-5 w-5 text-[var(--text-dark-secondary)] mx-1" />
            )}
            {index < items.length - 1 ? (
              <Link
                to={item.href}
                className="inline-flex items-center text-sm font-medium text-[var(--text-light-primary)] hover:text-[var(--text-light-secondary)]"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-sm font-medium text-[var(--text-light-primary)]">
                {item.name}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
};

export default Breadcrumb;
