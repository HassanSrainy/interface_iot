import React from 'react';
import { ChevronDown } from 'lucide-react';
import { cn } from './utils';

interface CustomSelectProps {
  value: string;
  onValueChange: (value: string) => void;
  children: React.ReactNode;
  placeholder?: string;
  className?: string;
  disabled?: boolean;
}

interface CustomSelectItemProps {
  value: string;
  children: React.ReactNode;
}

export function CustomSelect({ 
  value, 
  onValueChange, 
  children, 
  placeholder = "Sélectionner...",
  className,
  disabled = false
}: CustomSelectProps) {
  const [isOpen, setIsOpen] = React.useState(false);
  const selectRef = React.useRef<HTMLDivElement>(null);

  // Extraire les options des enfants
  const options = React.Children.toArray(children).filter(
    (child): child is React.ReactElement<CustomSelectItemProps> => 
      React.isValidElement(child)
  );

  const selectedOption = options.find(option => option.props.value === value);
  const displayValue = selectedOption?.props.children || placeholder;

  // Fermer le menu si on clique en dehors
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (selectRef.current && !selectRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = (optionValue: string) => {
    onValueChange(optionValue);
    setIsOpen(false);
  };

  return (
    <div ref={selectRef} className={cn("relative", className)}>
      {/* Trigger Button */}
      <button
        type="button"
        onClick={() => !disabled && setIsOpen(!isOpen)}
        disabled={disabled}
        className={cn(
          "flex w-full items-center justify-between gap-2 rounded-md border px-3 py-2 text-sm",
          "transition-colors outline-none",
          disabled 
            ? "cursor-not-allowed opacity-50" 
            : "cursor-pointer hover:bg-slate-50"
        )}
        style={{
          backgroundColor: disabled ? '#f3f3f5' : '#ffffff',
          color: '#0f172a',
          borderColor: '#e2e8f0'
        }}
      >
        <span style={{ color: value ? '#0f172a' : '#64748b' }}>
          {displayValue}
        </span>
        <ChevronDown 
          className={cn(
            "h-4 w-4 transition-transform",
            isOpen && "rotate-180"
          )} 
          style={{ color: '#64748b' }}
        />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div
          className="absolute z-50 mt-1 w-full rounded-md border shadow-lg overflow-hidden"
          style={{
            backgroundColor: '#ffffff',
            borderColor: '#e2e8f0',
            maxHeight: '300px',
            overflowY: 'auto'
          }}
        >
          <div className="py-1">
            {options.map((option) => {
              const isSelected = option.props.value === value;
              return (
                <button
                  key={option.props.value}
                  type="button"
                  onClick={() => handleSelect(option.props.value)}
                  className={cn(
                    "w-full text-left px-3 py-2 text-sm transition-colors",
                    "hover:bg-blue-50"
                  )}
                  style={{
                    backgroundColor: isSelected ? '#eff6ff' : 'transparent',
                    color: '#0f172a'
                  }}
                >
                  {option.props.children}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

export function CustomSelectItem({ value, children }: CustomSelectItemProps) {
  // Ce composant est juste un placeholder pour la structure
  // Il ne rend rien directement, il est utilisé par CustomSelect
  return null;
}
