import React from 'react';
import { Link } from 'react-router-dom';
import { ChevronRight } from 'lucide-react';

export interface BreadcrumbItem {
  name: string;
  href: string;
}

interface BreadcrumbProps {
  items: BreadcrumbItem[];
}

const Breadcrumb: React.FC<BreadcrumbProps> = ({ items }) => {
  return (
    <nav className="flex justify-end pt-2 px-4 sm:px-6 lg:px-8" aria-label="Breadcrumb">
      <ol className="inline-flex items-center space-x-1 md:space-x-2 rtl:space-x-reverse">
        {items.map((item, index) => (
          <li key={item.name} className="inline-flex items-center">
            {index > 0 && (
              <ChevronRight className="h-5 w-5 text-gray-400 mx-1" />
            )}
            {index < items.length - 1 ? (
              <Link
                to={item.href}
                className="inline-flex items-center text-sm font-medium text-white hover:text-grey-300"
              >
                {item.name}
              </Link>
            ) : (
              <span className="text-sm font-medium text-white">
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
