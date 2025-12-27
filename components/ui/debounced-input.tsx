"use client";

import { memo, useState, useEffect, useCallback, InputHTMLAttributes } from "react";
import { useDebounce } from "@/lib/hooks/useDebounce";
import { Search, X, Loader2 } from "lucide-react";

interface DebouncedInputProps
  extends Omit<InputHTMLAttributes<HTMLInputElement>, "onChange"> {
  value: string;
  onChange: (value: string) => void;
  debounceMs?: number;
  showSearchIcon?: boolean;
  showClearButton?: boolean;
  isLoading?: boolean;
}

function DebouncedInputComponent({
  value: externalValue,
  onChange,
  debounceMs = 300,
  showSearchIcon = true,
  showClearButton = true,
  isLoading = false,
  className = "",
  placeholder = "جستجو...",
  ...props
}: DebouncedInputProps) {
  const [internalValue, setInternalValue] = useState(externalValue);
  const debouncedValue = useDebounce(internalValue, debounceMs);

  // Sync internal value with external value
  useEffect(() => {
    setInternalValue(externalValue);
  }, [externalValue]);

  // Call onChange when debounced value changes
  useEffect(() => {
    if (debouncedValue !== externalValue) {
      onChange(debouncedValue);
    }
  }, [debouncedValue, externalValue, onChange]);

  const handleChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      setInternalValue(e.target.value);
    },
    []
  );

  const handleClear = useCallback(() => {
    setInternalValue("");
    onChange("");
  }, [onChange]);

  return (
    <div className="relative">
      {showSearchIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400">
          {isLoading ? (
            <Loader2 className="w-5 h-5 animate-spin" />
          ) : (
            <Search className="w-5 h-5" />
          )}
        </div>
      )}

      <input
        type="text"
        value={internalValue}
        onChange={handleChange}
        placeholder={placeholder}
        className={`w-full ${showSearchIcon ? "pr-10" : "pr-4"} ${
          showClearButton && internalValue ? "pl-10" : "pl-4"
        } py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-blue-500 focus:border-transparent transition ${className}`}
        {...props}
      />

      {showClearButton && internalValue && (
        <button
          type="button"
          onClick={handleClear}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
        >
          <X className="w-5 h-5" />
        </button>
      )}
    </div>
  );
}

export const DebouncedInput = memo(DebouncedInputComponent);
