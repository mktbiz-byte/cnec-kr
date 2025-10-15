import React from 'react';

export const Section = ({ children, className = '', id, ...props }) => {
  const baseStyles = 'w-full';
  
  const mergedClassName = `${baseStyles} ${className}`.trim();
  
  return (
    <section id={id} className={mergedClassName} {...props}>
      {children}
    </section>
  );
};

export default Section;
