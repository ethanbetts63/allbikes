"use client";

import { useEffect, useState, type ReactNode } from 'react';

interface DesktopOnlyProps {
  children: ReactNode;
}

const DesktopOnly = ({ children }: DesktopOnlyProps) => {
  const [isDesktop, setIsDesktop] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(min-width: 768px)');
    const updateIsDesktop = () => setIsDesktop(mediaQuery.matches);

    updateIsDesktop();
    mediaQuery.addEventListener('change', updateIsDesktop);
    return () => mediaQuery.removeEventListener('change', updateIsDesktop);
  }, []);

  if (!isDesktop) return null;

  return <>{children}</>;
};

export default DesktopOnly;
