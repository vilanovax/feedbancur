"use client";

import * as React from "react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  return (
    <div className="relative">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { value, onValueChange } as any);
        }
        return child;
      })}
    </div>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { value?: string; onValueChange?: (value: string) => void }
>(({ className, children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = React.useState(false);

  return (
    <>
      <button
        ref={ref}
        type="button"
        className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white px-3 py-2 text-sm ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
        onClick={() => setIsOpen(!isOpen)}
        {...props}
      >
        {children}
        <svg
          className="h-4 w-4 opacity-50"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M19 9l-7 7-7-7"
          />
        </svg>
      </button>
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40"
            onClick={() => setIsOpen(false)}
          />
          <div className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 bg-white py-1 text-base shadow-lg">
            {React.Children.map(props.children, (child) => {
              if (React.isValidElement(child) && child.type === SelectContent) {
                return React.cloneElement(child, {
                  onValueChange: (newValue: string) => {
                    onValueChange?.(newValue);
                    setIsOpen(false);
                  },
                } as any);
              }
              return null;
            })}
          </div>
        </>
      )}
    </>
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder }: { placeholder?: string }) => {
  return <span className="block truncate">{placeholder}</span>;
};

const SelectContent = ({ children, onValueChange }: { children: React.ReactNode; onValueChange?: (value: string) => void }) => {
  return (
    <>
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { onValueChange } as any);
        }
        return child;
      })}
    </>
  );
};

const SelectItem = ({ value, children, onValueChange }: { value: string; children: React.ReactNode; onValueChange?: (value: string) => void }) => {
  return (
    <div
      className="relative cursor-pointer select-none py-2 px-3 hover:bg-gray-100"
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
