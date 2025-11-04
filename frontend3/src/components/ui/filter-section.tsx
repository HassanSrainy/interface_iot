// src/components/ui/filter-section.tsx
import { ReactNode } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "./card";
import { Badge } from "./badge";
import { Filter } from "lucide-react";

interface FilterSectionProps {
  title?: string;
  description?: string;
  resultCount?: number;
  resultLabel?: string;
  children: ReactNode;
  className?: string;
}

export function FilterSection({
  title = "Filtres et Recherche",
  description = "Affinez la liste selon vos critères",
  resultCount,
  resultLabel = "résultat",
  children,
  className = "",
}: FilterSectionProps) {
  return (
    <Card className={`border-2 ${className}`}>
      <CardHeader className="border-b bg-slate-50">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle className="flex items-center gap-2 text-xl">
              <Filter className="h-5 w-5" />
              {title}
            </CardTitle>
            <CardDescription className="mt-1">{description}</CardDescription>
          </div>
          {resultCount !== undefined && (
            <Badge variant="secondary" className="bg-blue-100 text-blue-700 w-fit">
              {resultCount} {resultLabel}
              {resultCount > 1 ? "s" : ""}
            </Badge>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-5 pt-6">{children}</CardContent>
    </Card>
  );
}
