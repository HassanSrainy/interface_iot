import React from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "./button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./select";
import { paginationStyles, getPageRange } from "../../styles/common";
import { cn } from "./utils";

export interface ModernPaginationProps {
  currentPage: number;
  totalPages: number;
  pageSize: number;
  totalItems: number;
  onPageChange: (page: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  pageSizeOptions?: number[];
  itemLabel?: string;
  showPageSizeSelector?: boolean;
}

export function ModernPagination({
  currentPage,
  totalPages,
  pageSize,
  totalItems,
  onPageChange,
  onPageSizeChange,
  pageSizeOptions = [10, 20, 30, 50],
  itemLabel = "éléments",
  showPageSizeSelector = true,
}: ModernPaginationProps) {
  const startItem = Math.min((currentPage - 1) * pageSize + 1, totalItems);
  const endItem = Math.min(currentPage * pageSize, totalItems);
  
  const pageRange = getPageRange(currentPage, totalPages);
  
  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };
  
  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };
  
  if (totalPages <= 1 && !showPageSizeSelector) {
    return null;
  }
  
  return (
    <div className={paginationStyles.container}>
      <div className="flex items-center gap-4">
        {/* Info text */}
        <div className={paginationStyles.info}>
          Affichage {startItem}-{endItem} sur {totalItems} {itemLabel}
        </div>
        
        {/* Page size selector */}
        {showPageSizeSelector && onPageSizeChange && (
          <div className={paginationStyles.pageSizeWrapper}>
            <span className={paginationStyles.pageSizeLabel}>Par page:</span>
            <Select
              value={String(pageSize)}
              onValueChange={(value) => onPageSizeChange(Number(value))}
            >
              <SelectTrigger className="w-[80px] h-9">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {pageSizeOptions.map((size) => (
                  <SelectItem key={size} value={String(size)}>
                    {size}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
      
      {/* Navigation controls */}
      {totalPages > 1 && (
        <div className={paginationStyles.controls}>
          {/* Previous button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handlePrevious}
            disabled={currentPage === 1}
            className={paginationStyles.navButton}
          >
            <ChevronLeft className="w-4 h-4 mr-1" />
            <span className="hidden sm:inline">Précédent</span>
          </Button>
          
          {/* Page numbers */}
          <div className={paginationStyles.pageNumbers}>
            {pageRange.map((page, index) => {
              if (page === 'ellipsis') {
                return (
                  <span key={`ellipsis-${index}`} className={paginationStyles.ellipsis}>
                    ...
                  </span>
                );
              }
              
              const isActive = page === currentPage;
              
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={cn(
                    paginationStyles.pageButton,
                    isActive
                      ? paginationStyles.pageButtonActive
                      : paginationStyles.pageButtonInactive
                  )}
                  disabled={isActive}
                >
                  {page}
                </button>
              );
            })}
          </div>
          
          {/* Next button */}
          <Button
            variant="outline"
            size="sm"
            onClick={handleNext}
            disabled={currentPage === totalPages}
            className={paginationStyles.navButton}
          >
            <span className="hidden sm:inline">Suivant</span>
            <ChevronRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      )}
    </div>
  );
}

export default ModernPagination;
