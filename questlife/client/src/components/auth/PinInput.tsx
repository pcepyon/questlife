import { useState, useRef, useEffect } from 'react';
import { cn } from '@/lib/utils';

interface PinInputProps {
  length?: number;
  value: string;
  onChange: (value: string) => void;
  onComplete?: (value: string) => void;
  disabled?: boolean;
  error?: boolean;
  className?: string;
}

export function PinInput({
  length = 4,
  value,
  onChange,
  onComplete,
  disabled = false,
  error = false,
  className
}: PinInputProps) {
  const [focusedIndex, setFocusedIndex] = useState<number>(0);
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  useEffect(() => {
    if (value.length === length && onComplete) {
      onComplete(value);
    }
  }, [value, length, onComplete]);

  useEffect(() => {
    // Focus first empty input
    const firstEmptyIndex = value.length < length ? value.length : length - 1;
    if (inputRefs.current[firstEmptyIndex] && !disabled) {
      inputRefs.current[firstEmptyIndex]?.focus();
      setFocusedIndex(firstEmptyIndex);
    }
  }, [value, length, disabled]);

  const handleInputChange = (index: number, inputValue: string) => {
    // Only allow digits
    const digit = inputValue.replace(/\D/g, '').slice(-1);

    const newValue = value.split('');
    newValue[index] = digit;

    // Remove empty trailing characters
    const cleanValue = newValue.join('').slice(0, length);
    onChange(cleanValue);

    // Auto-focus next input
    if (digit && index < length - 1) {
      const nextInput = inputRefs.current[index + 1];
      if (nextInput) {
        nextInput.focus();
        setFocusedIndex(index + 1);
      }
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        // If current input is empty, move to previous and clear it
        const prevInput = inputRefs.current[index - 1];
        if (prevInput) {
          prevInput.focus();
          setFocusedIndex(index - 1);
          const newValue = value.slice(0, index - 1) + value.slice(index);
          onChange(newValue);
        }
      } else {
        // Clear current input
        const newValue = value.slice(0, index) + value.slice(index + 1);
        onChange(newValue);
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs.current[index - 1]?.focus();
      setFocusedIndex(index - 1);
    } else if (e.key === 'ArrowRight' && index < length - 1) {
      inputRefs.current[index + 1]?.focus();
      setFocusedIndex(index + 1);
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const paste = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);
    onChange(paste);
  };

  return (
    <div className={cn("flex gap-2", className)}>
      {Array.from({ length }, (_, index) => (
        <input
          key={index}
          ref={(el) => (inputRefs.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="\d*"
          maxLength={1}
          value={value[index] || ''}
          onChange={(e) => handleInputChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          onFocus={() => setFocusedIndex(index)}
          disabled={disabled}
          className={cn(
            "w-12 h-12 text-center text-lg font-bold border rounded-md",
            "focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent",
            "transition-colors",
            error
              ? "border-destructive bg-destructive/5"
              : "border-input bg-background",
            disabled && "opacity-50 cursor-not-allowed",
            focusedIndex === index && !disabled && "ring-2 ring-primary border-transparent"
          )}
          aria-label={`PIN digit ${index + 1}`}
        />
      ))}
    </div>
  );
}