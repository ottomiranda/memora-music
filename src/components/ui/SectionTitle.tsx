import React from 'react';
import { cn } from '@/lib/utils';

interface SectionTitleProps {
  children: React.ReactNode;
  className?: string;
}

const SectionTitle: React.FC<SectionTitleProps> = ({ children, className }) => {
  return (
    <h2 className={cn(
      'text-3xl sm:text-4xl lg:text-5xl font-heading font-bold text-white mb-4',
      className
    )}>
      {children}
    </h2>
  );
};

export { SectionTitle };
export default SectionTitle;