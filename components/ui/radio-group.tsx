"use client";

import * as React from "react";

interface RadioGroupProps {
  value?: string;
  onValueChange?: (value: string) => void;
  children: React.ReactNode;
}

const RadioGroup = ({ value, onValueChange, children }: RadioGroupProps) => {
  return (
    <div role="radiogroup">
      {React.Children.map(children, (child) => {
        if (React.isValidElement(child)) {
          return React.cloneElement(child, { groupValue: value, onGroupChange: onValueChange } as any);
        }
        return child;
      })}
    </div>
  );
};

interface RadioGroupItemProps {
  value: string;
  id: string;
  groupValue?: string;
  onGroupChange?: (value: string) => void;
}

const RadioGroupItem = React.forwardRef<HTMLButtonElement, RadioGroupItemProps>(
  ({ value, id, groupValue, onGroupChange }, ref) => {
    const isChecked = groupValue === value;

    return (
      <button
        ref={ref}
        type="button"
        role="radio"
        id={id}
        aria-checked={isChecked}
        onClick={() => onGroupChange?.(value)}
        className={`
          h-4 w-4 rounded-full border border-gray-300 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:ring-offset-2
          ${isChecked ? "border-blue-600" : ""}
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
