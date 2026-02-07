import * as React from "react";
import { inputVariants } from "@/lib/design-tokens";

export interface InputProps
  extends React.InputHTMLAttributes<HTMLInputElement> {
  error?: boolean;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, type, error, ...props }, ref) => {
    const baseClasses = "flex h-10 w-full px-3 py-2 text-sm ring-offset-white file:border-0 file:bg-transparent file:text-sm file:font-medium focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50";
    const variantClasses = error ? inputVariants.error : inputVariants.default;

    return (
      <input
        type={type}
        className={`${baseClasses} ${variantClasses} ${className || ""}`}
        ref={ref}
        {...props}
      />
    );
  }
);
Input.displayName = "Input";

export { Input };
