/**
 * Centralized styling constants for consistent UI across all management pages
 */

// Page-level styles
export const pageStyles = {
  // Main container
  container: "min-h-screen bg-slate-50 p-4 md:p-6",
  
  // Content wrapper
  wrapper: "max-w-7xl mx-auto space-y-6",
  
  // Section spacing
  section: "space-y-4",
} as const;

// Typography styles
export const textStyles = {
  // Page titles (main heading)
  pageTitle: "text-3xl font-bold text-slate-900",
  
  // Page subtitle/description
  pageSubtitle: "text-slate-600 mt-1",
  
  // Section headings
  sectionTitle: "text-xl font-semibold text-slate-900",
  
  // Card titles
  cardTitle: "text-lg font-semibold text-slate-900",
  
  // Body text
  bodyText: "text-sm text-slate-700",
  
  // Muted text (hints, secondary info)
  mutedText: "text-sm text-slate-500",
  
  // Small text
  smallText: "text-xs text-slate-500",
  
  // Error messages
  errorText: "text-sm text-red-600",
  
  // Success messages
  successText: "text-sm text-green-600",
  
  // Labels
  label: "text-sm font-medium text-slate-700",
} as const;

// Loading states
export const loadingStyles = {
  // Spinner container
  container: "w-full flex items-center justify-center py-12",
  
  // Loading text
  text: "text-sm text-slate-500 flex items-center gap-2",
  
  // Spinner icon
  spinner: "w-5 h-5 animate-spin text-slate-400",
  
  // Overlay (for full-page loading)
  overlay: "fixed inset-0 bg-black/20 backdrop-blur-sm flex items-center justify-center z-50",
} as const;

// Empty states
export const emptyStateStyles = {
  // Container
  container: "text-center py-16",
  
  // Icon
  icon: "w-16 h-16 mx-auto text-slate-300 mb-4",
  
  // Title
  title: "text-lg font-medium text-slate-700",
  
  // Description
  description: "text-sm text-slate-500 mt-1",
} as const;

// Card styles
export const cardStyles = {
  // Standard card
  card: "bg-white shadow-md hover:shadow-lg transition-all border-slate-200",
  
  // Card header with border
  headerWithBorder: "bg-slate-50 border-b border-slate-100",
  
  // Card content padding
  content: "p-6",
  
  // Compact card
  compact: "bg-white border border-slate-200 rounded-lg",
} as const;

// Filter/Search bar styles
export const filterStyles = {
  // Filter container
  container: "bg-white rounded-lg shadow-sm border border-slate-200 p-4",
  
  // Filter row
  row: "flex flex-wrap gap-3 items-center",
  
  // Filter label
  label: "text-sm font-medium text-slate-700 shrink-0",
  
  // Input field
  input: "flex-1 min-w-[200px]",
  
  // Select field
  select: "w-full md:w-auto min-w-[150px]",
} as const;

// Table styles
export const tableStyles = {
  // Table wrapper
  wrapper: "rounded-lg border border-slate-200 overflow-hidden",
  
  // Table header
  header: "bg-slate-50 border-b border-slate-200",
  
  // Table header cell
  headerCell: "px-4 py-3 text-left text-xs font-semibold text-slate-700 uppercase tracking-wider",
  
  // Table body
  body: "bg-white divide-y divide-slate-100",
  
  // Table row
  row: "hover:bg-slate-50 transition-colors",
  
  // Table cell
  cell: "px-4 py-3 text-sm text-slate-700",
  
  // Action cell (for buttons)
  actionCell: "px-4 py-3 text-sm text-right",
} as const;

// Pagination styles
export const paginationStyles = {
  // Pagination container
  container: "flex items-center justify-between mt-6 pt-4 border-t border-slate-200",
  
  // Info text (showing X of Y items)
  info: "text-sm text-slate-600",
  
  // Controls wrapper
  controls: "flex items-center gap-2",
  
  // Page size selector wrapper
  pageSizeWrapper: "flex items-center gap-2",
  
  // Page size label
  pageSizeLabel: "text-sm text-slate-600 hidden sm:block",
  
  // Page numbers container
  pageNumbers: "flex items-center gap-1",
  
  // Page button (numbered)
  pageButton: "min-w-[36px] h-9 px-3 rounded-md text-sm font-medium transition-all border",
  
  // Page button - active state
  pageButtonActive: "bg-blue-600 text-white border-blue-600 hover:bg-blue-700",
  
  // Page button - inactive state
  pageButtonInactive: "bg-white text-slate-700 border-slate-200 hover:bg-slate-50 hover:border-slate-300",
  
  // Page button - disabled state
  pageButtonDisabled: "opacity-50 cursor-not-allowed",
  
  // Navigation button (prev/next)
  navButton: "h-9 px-4 rounded-md text-sm font-medium transition-all border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 hover:border-slate-300 disabled:opacity-50 disabled:cursor-not-allowed",
  
  // Ellipsis for page numbers
  ellipsis: "px-2 text-slate-400",
} as const;

// Button styles (in addition to shadcn defaults)
export const buttonStyles = {
  // Icon button
  iconButton: "p-2 hover:bg-slate-100 rounded-md transition-colors",
  
  // Action button (edit, delete, etc.)
  actionButton: "h-8 w-8 p-0 flex items-center justify-center",
  
  // Refresh button
  refreshButton: "p-2 hover:bg-slate-100 rounded-md transition-colors",
} as const;

// Badge/Status styles
export const statusStyles = {
  // Online/Active status
  online: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-700",
  
  // Offline/Inactive status
  offline: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-600",
  
  // Warning status
  warning: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-yellow-100 text-yellow-700",
  
  // Error/Alert status
  error: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-red-100 text-red-700",
  
  // Info status
  info: "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700",
} as const;

// Grouped list styles (for group-by display)
export const groupStyles = {
  // Group container
  container: "space-y-6",
  
  // Group header
  header: "flex items-center gap-2 px-4 py-2 bg-slate-100 rounded-t-lg border-b border-slate-200",
  
  // Group title
  title: "text-sm font-semibold text-slate-900",
  
  // Group badge (count)
  badge: "px-2 py-0.5 rounded-full text-xs font-medium bg-slate-200 text-slate-700",
  
  // Group content
  content: "border-x border-b border-slate-200 rounded-b-lg overflow-hidden",
} as const;

// Header/Toolbar styles
export const headerStyles = {
  // Page header wrapper
  wrapper: "flex items-center justify-between pb-4 border-b border-slate-200",
  
  // Title section
  titleSection: "space-y-1",
  
  // Actions section
  actionsSection: "flex items-center gap-3",
} as const;

// Utility: Generate page range for pagination
export function getPageRange(currentPage: number, totalPages: number, maxVisible: number = 7): (number | 'ellipsis')[] {
  if (totalPages <= maxVisible) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }
  
  const pages: (number | 'ellipsis')[] = [];
  const halfVisible = Math.floor(maxVisible / 2);
  
  // Always show first page
  pages.push(1);
  
  let startPage = Math.max(2, currentPage - halfVisible);
  let endPage = Math.min(totalPages - 1, currentPage + halfVisible);
  
  // Adjust if we're near the start
  if (currentPage <= halfVisible + 1) {
    endPage = Math.min(totalPages - 1, maxVisible - 1);
  }
  
  // Adjust if we're near the end
  if (currentPage >= totalPages - halfVisible) {
    startPage = Math.max(2, totalPages - maxVisible + 2);
  }
  
  // Add ellipsis after first page if needed
  if (startPage > 2) {
    pages.push('ellipsis');
  }
  
  // Add middle pages
  for (let i = startPage; i <= endPage; i++) {
    pages.push(i);
  }
  
  // Add ellipsis before last page if needed
  if (endPage < totalPages - 1) {
    pages.push('ellipsis');
  }
  
  // Always show last page
  if (totalPages > 1) {
    pages.push(totalPages);
  }
  
  return pages;
}
