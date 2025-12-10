"use client";

import { useState } from 'react';
import { Star } from 'lucide-react';

interface PollOption {
  id: string;
  text: string;
  order: number;
}

interface Poll {
  id: string;
  type: 'SINGLE_CHOICE' | 'MULTIPLE_CHOICE' | 'RATING_SCALE' | 'TEXT_INPUT';
  minRating?: number | null;
  maxRating?: number | null;
  maxTextLength?: number | null;
  options?: PollOption[];
}

interface VoteData {
  optionId?: string;
  optionIds?: string[];
  ratingValue?: number;
  textValue?: string;
  comment?: string;
}

interface PollVotingInterfaceProps {
  poll: Poll;
  onVote: (data: VoteData) => Promise<void>;
  disabled?: boolean;
}

export default function PollVotingInterface({ poll, onVote, disabled }: PollVotingInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<string>('');
  const [selectedOptions, setSelectedOptions] = useState<string[]>([]);
  const [rating, setRating] = useState<number>(0);
  const [hoverRating, setHoverRating] = useState<number>(0);
  const [textValue, setTextValue] = useState<string>('');
  const [comment, setComment] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async () => {
    if (disabled || loading) return;

    setLoading(true);
    try {
      const voteData: VoteData = { comment };

      if (poll.type === 'SINGLE_CHOICE') {
        if (!selectedOption) {
          alert('لطفاً یک گزینه انتخاب کنید');
          setLoading(false);
          return;
        }
        voteData.optionId = selectedOption;
      } else if (poll.type === 'MULTIPLE_CHOICE') {
        if (selectedOptions.length === 0) {
          alert('لطفاً حداقل یک گزینه انتخاب کنید');
          setLoading(false);
          return;
        }
        voteData.optionIds = selectedOptions;
      } else if (poll.type === 'RATING_SCALE') {
        if (rating === 0) {
          alert('لطفاً امتیاز خود را انتخاب کنید');
          setLoading(false);
          return;
        }
        voteData.ratingValue = rating;
      } else if (poll.type === 'TEXT_INPUT') {
        if (!textValue.trim()) {
          alert('لطفاً پاسخ خود را وارد کنید');
          setLoading(false);
          return;
        }
        voteData.textValue = textValue;
      }

      await onVote(voteData);
    } catch (error) {
      console.error('Vote error:', error);
    } finally {
      setLoading(false);
    }
  };

  const toggleMultipleOption = (optionId: string) => {
    if (selectedOptions.includes(optionId)) {
      setSelectedOptions(selectedOptions.filter(id => id !== optionId));
    } else {
      setSelectedOptions([...selectedOptions, optionId]);
    }
  };

  return (
    <div className="space-y-4">
      {/* Single Choice */}
      {poll.type === 'SINGLE_CHOICE' && poll.options && (
        <div className="space-y-2">
          {poll.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedOption === option.id
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="radio"
                name="poll-option"
                value={option.id}
                checked={selectedOption === option.id}
                onChange={(e) => setSelectedOption(e.target.value)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600"
              />
              <span className="flex-1 text-gray-900 dark:text-white">{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {/* Multiple Choice */}
      {poll.type === 'MULTIPLE_CHOICE' && poll.options && (
        <div className="space-y-2">
          {poll.options.map((option) => (
            <label
              key={option.id}
              className={`flex items-center gap-3 p-4 border-2 rounded-lg cursor-pointer transition-all ${
                selectedOptions.includes(option.id)
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800'
              } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
            >
              <input
                type="checkbox"
                value={option.id}
                checked={selectedOptions.includes(option.id)}
                onChange={() => toggleMultipleOption(option.id)}
                disabled={disabled}
                className="w-4 h-4 text-blue-600 rounded"
              />
              <span className="flex-1 text-gray-900 dark:text-white">{option.text}</span>
            </label>
          ))}
        </div>
      )}

      {/* Rating Scale */}
      {poll.type === 'RATING_SCALE' && (
        <div className="space-y-4">
          <div className="flex justify-center gap-2">
            {Array.from(
              { length: (poll.maxRating || 5) - (poll.minRating || 1) + 1 },
              (_, i) => {
                const value = (poll.minRating || 1) + i;
                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setRating(value)}
                    onMouseEnter={() => setHoverRating(value)}
                    onMouseLeave={() => setHoverRating(0)}
                    disabled={disabled}
                    className={`w-12 h-12 rounded-lg border-2 font-semibold transition-all ${
                      disabled
                        ? 'opacity-50 cursor-not-allowed'
                        : 'hover:scale-110'
                    } ${
                      rating >= value || hoverRating >= value
                        ? 'bg-yellow-400 border-yellow-500 text-white'
                        : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
                    }`}
                  >
                    {value}
                  </button>
                );
              }
            )}
          </div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 px-2">
            <span>حداقل: {poll.minRating || 1}</span>
            <span>حداکثر: {poll.maxRating || 5}</span>
          </div>
          {rating > 0 && (
            <div className="text-center">
              <div className="inline-flex items-center gap-2 bg-yellow-50 dark:bg-yellow-900/20 px-4 py-2 rounded-lg">
                <Star size={20} className="text-yellow-500 fill-yellow-500" />
                <span className="font-semibold text-gray-900 dark:text-white">
                  امتیاز شما: {rating}
                </span>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Text Input */}
      {poll.type === 'TEXT_INPUT' && (
        <div className="space-y-2">
          <textarea
            value={textValue}
            onChange={(e) => setTextValue(e.target.value)}
            disabled={disabled}
            placeholder="پاسخ خود را بنویسید..."
            maxLength={poll.maxTextLength || undefined}
            className="w-full p-4 border-2 border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
            rows={4}
          />
          {poll.maxTextLength && (
            <div className="text-sm text-gray-500 dark:text-gray-400 text-left">
              {textValue.length} / {poll.maxTextLength}
            </div>
          )}
        </div>
      )}

      {/* Optional Comment */}
      <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          نظر (اختیاری)
        </label>
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          disabled={disabled}
          placeholder="نظر یا توضیحات اضافی..."
          className="w-full p-3 border border-gray-200 dark:border-gray-700 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
          rows={2}
        />
      </div>

      {/* Submit Button */}
      <button
        onClick={handleSubmit}
        disabled={disabled || loading}
        className="w-full py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
      >
        {loading ? 'در حال ارسال...' : 'ثبت رای'}
      </button>
    </div>
  );
}
