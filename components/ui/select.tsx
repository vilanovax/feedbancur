"use client";

import * as React from "react";

interface SelectProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const Select = ({ value, onValueChange, children }: SelectProps) => {
  const [isOpen, setIsOpen] = React.useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Close on outside click
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    }

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  // Find SelectTrigger and SelectContent
  const processedChildren = React.Children.map(children, (child) => {
    if (React.isValidElement(child)) {
      if ((child.type as any)?.displayName === "SelectTrigger") {
        return React.cloneElement(child, {
          isOpen,
          setIsOpen,
          value,
          onValueChange,
        } as any);
      } else if ((child.type as any)?.displayName === "SelectContent") {
        return React.cloneElement(child, {
          isOpen,
          setIsOpen,
          value,
          onValueChange,
        } as any);
      }
      return React.cloneElement(child, { value, onValueChange } as any);
    }
    return child;
  });

  return (
    <div ref={containerRef} className="relative">
      {processedChildren}
    </div>
  );
};

const SelectTrigger = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & {
    value?: string;
    onValueChange?: (value: string) => void;
    isOpen?: boolean;
    setIsOpen?: (open: boolean) => void;
  }
>(({ className, children, isOpen, setIsOpen, value, onValueChange, ...props }, ref) => {
  const open = isOpen ?? false;
  const setOpen = setIsOpen ?? (() => {});

  return (
    <button
      ref={ref}
      type="button"
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-300 bg-white dark:bg-gray-800 px-3 py-2 text-sm text-gray-900 dark:text-white ring-offset-white placeholder:text-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 ${className || ""}`}
      onClick={(e) => {
        e.stopPropagation();
        setOpen(!open);
      }}
      {...props}
    >
      {children}
      <svg
        className={`h-4 w-4 opacity-50 text-gray-900 dark:text-white transition-transform ${open ? "rotate-180" : ""}`}
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
  );
});
SelectTrigger.displayName = "SelectTrigger";

const SelectValue = ({ placeholder, value, children }: { placeholder?: string; value?: string; children?: React.ReactNode }) => {
  if (children) {
    return <span className="block truncate text-gray-900 dark:text-white">{children}</span>;
  }
  
  const displayValue = value || placeholder;
  return <span className="block truncate text-gray-900 dark:text-white">{displayValue || ""}</span>;
};

const SelectContent = ({
  children,
  onValueChange,
  isOpen,
  setIsOpen,
}: {
  children: React.ReactNode;
  onValueChange?: (value: string) => void;
  isOpen?: boolean;
  setIsOpen?: (open: boolean) => void;
}) => {
  const open = isOpen ?? false;
  const setOpen = setIsOpen ?? (() => {});

  if (!open) return null;

  return (
    <>
      <div
        className="fixed inset-0 z-40"
        onClick={() => setOpen(false)}
      />
      <div
        className="absolute z-50 mt-1 max-h-60 w-full overflow-auto rounded-md border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 py-1 text-base shadow-lg"
        onClick={(e) => e.stopPropagation()}
      >
        {React.Children.map(children, (child) => {
          if (React.isValidElement(child)) {
            return React.cloneElement(child, {
              onValueChange: (newValue: string) => {
                onValueChange?.(newValue);
                setOpen(false);
              },
            } as any);
          }
          return child;
        })}
      </div>
    </>
  );
};
SelectContent.displayName = "SelectContent";

const SelectItem = ({ value, children, onValueChange }: { value: string; children: React.ReactNode; onValueChange?: (value: string) => void }) => {
  return (
    <div
      className="relative cursor-pointer select-none py-2 px-3 text-gray-900 dark:text-white hover:bg-gray-100 dark:hover:bg-gray-700"
      onClick={() => onValueChange?.(value)}
    >
      {children}
    </div>
  );
};

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
