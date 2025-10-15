import React from 'react';
import { Link } from 'react-router-dom';
import { twMerge } from 'tailwind-merge';

export const Button = ({
  children,
  variant = 'primary',
  size = 'md',
  className = '',
  as = 'button',
  disabled = false,
  ...props
}) => {
  const baseStyles = 'inline-flex items-center justify-center font-medium rounded-md transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';
  
  const variantStyles = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-500',
    success: 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500',
    warning: 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-500',
    white: 'bg-white text-gray-800 hover:bg-gray-100 focus:ring-gray-500',
    outline: 'bg-transparent border border-current hover:bg-opacity-10 focus:ring-current',
    link: 'bg-transparent text-blue-600 hover:underline focus:ring-blue-500 p-0',
  };
  
  const sizeStyles = {
    sm: 'text-sm px-3 py-1.5',
    md: 'text-base px-4 py-2',
    lg: 'text-lg px-6 py-3',
  };
  
  const disabledStyles = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';
  
  const mergedClassName = twMerge(
    baseStyles,
    variantStyles[variant],
    sizeStyles[size],
    disabledStyles,
    className
  );

  const Component = as === 'link' ? Link : as;
  
  return (
    <Component
      className={mergedClassName}
      disabled={disabled && as === 'button'}
      {...props}
    >
      {children}
    </Component>
  );
};

export default Button;
