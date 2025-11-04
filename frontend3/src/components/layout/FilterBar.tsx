// frontend3/src/components/layout/FilterBar.tsx
import { ReactNode } from "react";
import { X } from "lucide-react";

interface FilterSection {
  label: string;
  content: ReactNode;
}

interface FilterBarProps {
  sections: FilterSection[];
  onReset?: () => void;
  stats?: ReactNode;
}

export function FilterBar({ sections, onReset, stats }: FilterBarProps) {
  return (
    <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
      <div className="p-6">
        {/* Filter Sections Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-4">
          {sections.map((section, index) => (
            <div key={index} className="space-y-2">
              <div className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-600" />
                <label className="text-sm font-medium text-slate-700">
                  {section.label}
                </label>
              </div>
              {section.content}
            </div>
          ))}
        </div>

        {/* Stats and Reset */}
        {(stats || onReset) && (
          <div className="flex items-center justify-between pt-4 border-t border-slate-100">
            <div className="text-sm text-slate-600">
              {stats}
            </div>
            {onReset && (
              <button
                onClick={onReset}
                className="inline-flex items-center gap-2 px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900 hover:bg-slate-50 rounded-md transition-colors"
              >
                <X className="w-4 h-4" />
                Réinitialiser
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
