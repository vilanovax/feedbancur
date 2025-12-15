"use client";

import * as React from "react";

interface RadioGroupContextValue {
  value?: string;
  onValueChange?: (value: string) => void;
}

const RadioGroupContext = React.createContext<RadioGroupContextValue>({});

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const RadioGroup = ({ value, onValueChange, children }: RadioGroupProps) => {
  return (
    <RadioGroupContext.Provider value={{ value, onValueChange }}>
      <div role="radiogroup">
        {children}
      </div>
    </RadioGroupContext.Provider>
  );
};

interface RadioGroupItemProps {
  value: string;
  id: string;
  className?: string;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, id, className }, ref) => {
    const context = React.useContext(RadioGroupContext);
    const checkedValue = context.value;
    const handleChange = context.onValueChange;
    const isChecked = checkedValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        id={id}
        aria-checked={isChecked}
        onClick={() => handleChange?.(value)}
        className={`
          h-4 w-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
          ${isChecked ? "border-blue-600" : ""}
          ${className || ""}
        `}
      >
        {isChecked && (
          <div className="h-2 w-2 rounded-full bg-blue-600 m-auto" />
        )}
      </button>
    );
  }
);
RadioGroupItem.displayName = "RadioGroupItem";

export { RadioGroup, RadioGroupItem };
