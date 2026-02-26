"use client";

import { useState, useEffect } from "react";
import { Check } from "lucide-react";

interface Tag {
  tag: string;
  count: number;
}

interface TagFilterProps {
  selectedTags: string[];
  onChange: (tags: string[]) => void;
  projectId?: string | null;
  className?: string;
}

/**
 * فیلتر چند انتخابی تگ‌ها
 */
export default function TagFilter({
  selectedTags,
  onChange,
  projectId,
  className = "",
}: TagFilterProps) {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAll, setShowAll] = useState(false);

  useEffect(() => {
    fetchTags();
  }, [projectId]);

  const fetchTags = async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (projectId) params.append("projectId", projectId);

      const res = await fetch(`/api/files/tags?${params.toString()}`);
      if (res.ok) {
        const data = await res.json();
        setTags(data.tags || []);
      }
    } catch (error) {
      console.error("Error fetching tags:", error);
    } finally {
      setLoading(false);
    }
  };

  const toggleTag = (tag: string) => {
    if (selectedTags.includes(tag)) {
      onChange(selectedTags.filter((t) => t !== tag));
    } else {
      onChange([...selectedTags, tag]);
    }
  };

  const clearAll = () => {
    onChange([]);
  };

  const displayTags = showAll ? tags : tags.slice(0, 10);
  const hasMore = tags.length > 10;

  if (loading) {
    return (
      <div className={`${className}`}>
        <div className="animate-pulse space-y-2">
          <div className="h-4 bg-gray-700 rounded w-24" />
          <div className="flex flex-wrap gap-2">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-8 bg-gray-700/60 rounded-xl w-20" />
            ))}
          </div>
        </div>
      </div>
    );
  }

  if (tags.length === 0) {
    return <p className={`text-sm text-gray-500 ${className}`}>تگی یافت نشد</p>;
  }

  return (
    <div className={`${className}`}>
      <div className="flex items-center justify-between mb-3">
        <h3 className="text-sm font-semibold text-gray-200">فیلتر با تگ</h3>
        {selectedTags.length > 0 && (
          <button
            onClick={clearAll}
            className="text-xs text-blue-400 hover:text-blue-300 transition-colors"
          >
            پاک کردن همه
          </button>
        )}
      </div>

      <div className="flex flex-wrap gap-2">
        {displayTags.map(({ tag, count }) => {
          const isSelected = selectedTags.includes(tag);
          return (
            <button
              key={tag}
              onClick={() => toggleTag(tag)}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-sm rounded-xl border transition-colors ${
                isSelected
                  ? "bg-blue-500/20 border-blue-500/50 text-blue-400"
                  : "bg-gray-700/50 border-gray-600 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
              }`}
            >
              {isSelected && <Check size={14} />}
              <span>{tag}</span>
              <span className="text-xs opacity-70">({count})</span>
            </button>
          );
        })}
      </div>

      {hasMore && (
        <button
          onClick={() => setShowAll(!showAll)}
          className="text-sm text-blue-400 hover:text-blue-300 mt-3 transition-colors"
        >
          {showAll ? "نمایش کمتر" : `نمایش ${tags.length - 10} تگ دیگر`}
        </button>
      )}

      {selectedTags.length > 0 && (
        <p className="mt-3 text-xs text-gray-500">{selectedTags.length} تگ انتخاب شده</p>
      )}
    </div>
  );
}
