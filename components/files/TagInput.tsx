"use client";

import { useState, useRef, useEffect } from "react";
import { X } from "lucide-react";

interface TagInputProps {
  tags: string[];
  onChange: (tags: string[]) => void;
  suggestions?: string[];
  placeholder?: string;
  maxTags?: number;
  className?: string;
}

/**
 * کامپوننت ورودی تگ با قابلیت auto-complete
 */
export default function TagInput({
  tags,
  onChange,
  suggestions = [],
  placeholder = "افزودن تگ...",
  maxTags,
  className = "",
}: TagInputProps) {
  const [inputValue, setInputValue] = useState("");
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [filteredSuggestions, setFilteredSuggestions] = useState<string[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const inputRef = useRef<HTMLInputElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // فیلتر پیشنهادات
  useEffect(() => {
    if (inputValue.trim()) {
      const filtered = suggestions.filter(
        (suggestion) =>
          suggestion.toLowerCase().includes(inputValue.toLowerCase()) &&
          !tags.includes(suggestion)
      );
      setFilteredSuggestions(filtered);
      setShowSuggestions(filtered.length > 0);
    } else {
      setFilteredSuggestions([]);
      setShowSuggestions(false);
    }
  }, [inputValue, suggestions, tags]);

  // بستن suggestions با کلیک خارج
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        suggestionsRef.current &&
        !suggestionsRef.current.contains(event.target as Node) &&
        !inputRef.current?.contains(event.target as Node)
      ) {
        setShowSuggestions(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const addTag = (tag: string) => {
    const trimmedTag = tag.trim();
    if (!trimmedTag) return;
    if (tags.includes(trimmedTag)) return;
    if (maxTags && tags.length >= maxTags) return;

    onChange([...tags, trimmedTag]);
    setInputValue("");
    setShowSuggestions(false);
    setSelectedIndex(-1);
  };

  const removeTag = (index: number) => {
    onChange(tags.filter((_, i) => i !== index));
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (selectedIndex >= 0 && filteredSuggestions[selectedIndex]) {
        addTag(filteredSuggestions[selectedIndex]);
      } else if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      removeTag(tags.length - 1);
    } else if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < filteredSuggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
    } else if (e.key === "Escape") {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  return (
    <div className={`relative ${className}`}>
      {/* Tags Container */}
      <div
        className="flex flex-wrap items-center gap-2 p-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 focus-within:ring-2 focus-within:ring-blue-500 focus-within:border-blue-500 min-h-[42px]"
        onClick={() => inputRef.current?.focus()}
      >
        {tags.map((tag, index) => (
          <span
            key={index}
            className="inline-flex items-center gap-1 px-2 py-1 text-sm bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded-md"
          >
            {tag}
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeTag(index);
              }}
              className="hover:bg-blue-200 dark:hover:bg-blue-800 rounded-full p-0.5"
            >
              <X size={14} />
            </button>
          </span>
        ))}

        <input
          ref={inputRef}
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (filteredSuggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={tags.length === 0 ? placeholder : ""}
          disabled={maxTags ? tags.length >= maxTags : false}
          className="flex-1 min-w-[120px] outline-none bg-transparent text-sm"
        />
      </div>

      {/* Suggestions Dropdown */}
      {showSuggestions && filteredSuggestions.length > 0 && (
        <div
          ref={suggestionsRef}
          className="absolute z-10 w-full mt-1 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg max-h-48 overflow-y-auto"
        >
          {filteredSuggestions.map((suggestion, index) => (
            <button
              key={index}
              type="button"
              onClick={() => addTag(suggestion)}
              className={`w-full text-right px-4 py-2 text-sm hover:bg-gray-100 dark:hover:bg-gray-700 ${
                index === selectedIndex
                  ? "bg-blue-50 dark:bg-blue-900"
                  : ""
              }`}
            >
              {suggestion}
            </button>
          ))}
        </div>
      )}

      {/* Max tags indicator */}
      {maxTags && (
        <div className="text-xs text-gray-500 mt-1">
          {tags.length} / {maxTags} تگ
        </div>
      )}
    </div>
  );
}
