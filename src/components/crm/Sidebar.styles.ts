import { cva } from "class-variance-authority";
import type { VariantProps } from "class-variance-authority";

export const sidebarStyles = {
  root: "flex flex-col h-full bg-slate-900 text-white glass-effect shadow-xl border border-white/20 rounded-2xl overflow-hidden min-w-[260px] max-w-[320px]",
  header: "flex items-center justify-between p-4 border-b border-slate-800 bg-white/10 backdrop-blur-md border-b border-white/20",
  userContainer: "flex items-center space-x-3",
  userAvatar: "relative bg-gradient-to-br from-blue-500 to-slate-700 shadow-lg rounded-full p-1",
  userIcon: "h-8 w-8 text-blue-400",
  userName: "text-sm font-medium text-slate-100",
  userStatus: "text-xs text-slate-400 flex items-center gap-1",
  
  scrollArea: "flex-1 custom-scrollbar",
  departmentList: "space-y-3 p-4",
  
  departmentItem: "flex items-center justify-between p-3 rounded-lg bg-slate-800 hover:bg-slate-700 cursor-pointer border border-transparent hover:border-blue-400/40 shadow-sm transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-blue-400",
  activeDepartment: "bg-slate-700 text-white border-blue-500",
  departmentContent: "flex items-center gap-3",
  departmentIcon: (color: string) => `flex items-center justify-center h-10 w-10 rounded-lg ${color} shadow-md`,
  departmentInfo: "flex flex-col",
  departmentName: "text-base font-medium",
  departmentMeta: "flex items-center gap-2 mt-1",
  priorityBadge: "text-xs",
  ticketCount: "text-xs rounded-full px-2 py-0.5 bg-white/20 text-white",
  departmentActions: "text-slate-400 hover:text-white ml-auto",
  departmentButton: cva(
    "flex items-center w-full p-3 rounded-lg transition-colors border border-transparent hover:border-blue-400/40 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400 cursor-pointer",
    {
      variants: {
        active: {
          true: "bg-slate-700 text-white border-blue-500",
          false: "bg-slate-800 text-slate-300 hover:bg-slate-700 hover:text-white"
        }
      },
      defaultVariants: {
        active: false
      }
    }
  ),
  
  badge: cva(
    "text-xs font-medium rounded-full px-2 py-0.5",
    {
      variants: {
        priority: {
          high: "bg-red-500/10 text-red-500 border-red-500/20",
          normal: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
          low: "bg-green-500/10 text-green-500 border-green-500/20"
        }
      },
      defaultVariants: {
        priority: "normal"
      }
    }
  ),

  // Estados
  errorContainer: "w-64 glass-effect p-4 flex flex-col gap-4 min-h-screen animate-fade-in",
  errorMessage: "flex items-center gap-2 text-red-500 p-3 rounded-lg bg-red-500/10",
  errorIcon: "h-5 w-5",
  errorText: "text-sm",
  
  loadingContainer: "w-64 glass-effect p-4 flex flex-col gap-4 min-h-screen animate-fade-in",
  loadingHeader: "flex items-center gap-2 mb-4",
  loadingSkeleton: "h-16 w-full rounded-lg",
  
  emptyContainer: "w-64 glass-effect p-4 flex flex-col items-center justify-center gap-4 min-h-screen animate-fade-in",
  emptyMessage: "text-center text-slate-400",
  emptyTitle: "text-lg font-medium text-slate-300 mb-2",
  emptySubtitle: "text-sm text-slate-400",
  emptyState: "flex flex-col items-center justify-center h-full p-4 text-center",
  emptyIcon: "h-12 w-12 text-slate-400 mb-4",

  // Custom scrollbar
  customScrollbar: `
    &::-webkit-scrollbar {
      width: 8px;
      background: transparent;
    }
    &::-webkit-scrollbar-thumb {
      background: rgba(59, 130, 246, 0.2);
      border-radius: 8px;
    }
  `
}; 