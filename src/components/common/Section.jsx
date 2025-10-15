import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Section = ({ children, className = '', id, ...props }) => {
  const baseStyles = 'w-full';
  
  const mergedClassName = twMerge(
    baseStyles,
    className
  );
  
  return (
    <section id={id} className={mergedClassName} {...props}>
      {children}
    </section>
  );
};

export default Section;
