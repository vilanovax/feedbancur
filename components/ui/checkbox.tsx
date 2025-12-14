"use client";

import * as React from "react";
import { Check } from "lucide-react";

export interface CheckboxProps {
  id?: string;
  checked?: boolean;
  onCheckedChange?: (checked: boolean) => void;
  disabled?: boolean;
}

const Checkbox = React.forwardRef<HTMLButtonElement, CheckboxProps>(
  ({ id, checked = false, onCheckedChange, disabled = false }, ref) => {
    return (
      <button
        id={id}
        ref={ref}
        type="button"
        role="checkbox"
        aria-checked={checked}
        disabled={disabled}
        onClick={() => onCheckedChange?.(!checked)}
        className={`
          h-4 w-4 shrink-0 rounded-sm border border-gray-300 ring-offset-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50
          ${checked ? "bg-blue-600 border-blue-600 text-white" : "bg-white"}
        `}
      >
        {checked && <Check className="h-3 w-3" />}
      </button>
    );
  }
);
Checkbox.displayName = "Checkbox";

export { Checkbox };
