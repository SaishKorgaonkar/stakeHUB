import { InputHTMLAttributes, forwardRef } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, className = '', ...props }, ref) => {
    return (
      <div className="w-full">
        {label && (
          <label className="block mb-2 font-bold text-sm uppercase">
            {label}
          </label>
        )}
        <input
          ref={ref}
          className={`
            w-full px-4 py-3 bg-white border-3 border-black
            brutal-shadow focus:shadow-brutal-sm
            focus:translate-x-[1px] focus:translate-y-[1px]
            transition-all duration-100
            font-sans text-base
            ${error ? 'border-coral' : ''}
            ${className}
          `}
          {...props}
        />
        {error && (
          <p className="mt-2 text-sm text-coral font-medium">{error}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';
