import React from 'react';
import { twMerge } from 'tailwind-merge';

export const Container = ({ children, className = '', size = 'default', ...props }) => {
  const baseStyles = 'mx-auto px-4 sm:px-6 lg:px-8';
  
  const sizeStyles = {
    sm: 'max-w-3xl',
    default: 'max-w-7xl',
    lg: 'max-w-screen-2xl',
    full: 'max-w-full',
  };
  
  const mergedClassName = twMerge(
    baseStyles,
    sizeStyles[size],
    className
  );
  
  return (
    <div className={mergedClassName} {...props}>
      {children}
    </div>
  );
};

export default Container;
