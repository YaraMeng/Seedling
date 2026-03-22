import React from 'react';
import { motion } from 'motion/react';
import { cn } from '../lib/utils';
import { FileText, Link as LinkIcon, PenTool, Image as ImageIcon, Star, CheckCircle2, Trash2, RotateCcw } from 'lucide-react';

export interface SeedCardProps {
  title: string;
  summary: string[];
  tags: string[];
  sourceType: 'link' | 'pdf' | 'note' | 'image';
  status: 'inbox' | 'asset' | 'focus' | 'trash' | 'deleted';
  themeColor: string;
  icon: string;
  isInternalized?: boolean;
  onClick?: () => void;
  onFocusToggle?: (e: React.MouseEvent) => void;
  onInternalize?: (e: React.MouseEvent) => void;
  onDelete?: (e: React.MouseEvent) => void;
  onRestore?: (e: React.MouseEvent) => void;
  onPermanentDelete?: (e: React.MouseEvent) => void;
  className?: string;
  viewMode?: 'grid' | 'list';
  createdAt?: number;
}

export function SeedCard({ 
  title, 
  summary, 
  tags, 
  sourceType, 
  status, 
  themeColor, 
  icon, 
  isInternalized,
  onClick,
  onFocusToggle,
  onInternalize,
  onDelete,
  onRestore,
  onPermanentDelete,
  className,
  viewMode = 'grid',
  createdAt
}: SeedCardProps) {
  const isFocus = status === 'focus';
  const isInbox = status === 'inbox';
  const isTrash = status === 'trash';
  const isList = viewMode === 'list';

  const SourceIcon = {
    link: LinkIcon,
    pdf: FileText,
    note: PenTool,
    image: ImageIcon,
  }[sourceType];

  const sourceLabel = {
    link: 'via Link',
    pdf: 'PDF',
    note: 'Note',
    image: 'Image',
  }[sourceType];

  const formattedDate = createdAt ? new Date(createdAt).toLocaleDateString() : '';

  if (isList) {
    return (
      <motion.div
        layout
        initial={{ opacity: 0, x: -10 }}
        animate={{ opacity: 1, x: 0 }}
        exit={{ opacity: 0, scale: 0.98 }}
        whileHover={{ x: 4 }}
        onClick={onClick}
        className={cn(
          "w-full h-14 bg-white dark:bg-neutral-900 rounded-xl cursor-pointer relative transition-all duration-300 border border-neutral-100 dark:border-neutral-800 flex items-center px-4 gap-4 group/list overflow-hidden",
          isFocus && "border-emerald-200 shadow-[0_0_15px_rgba(16,185,129,0.1)]",
          className
        )}
      >
        <div 
          className="absolute left-0 top-0 bottom-0 w-1" 
          style={{ backgroundColor: themeColor }} 
        />
        
        <span className="text-xl shrink-0" role="img" aria-label="node-icon">
          {icon}
        </span>

        <div className="flex-1 min-w-0 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0 flex-1">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-tight truncate max-w-[40%]">
              {title}
            </h3>
            <div className="h-3 w-px bg-neutral-200 dark:bg-neutral-700" />
            <p className="text-xs text-neutral-400 truncate flex-1 italic">
              {summary[0] || 'No summary available'}
            </p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <div className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-neutral-300 mr-2">
              <SourceIcon className="w-3 h-3" />
              <span>{sourceLabel}</span>
            </div>

            {/* Slide-out Actions */}
            <div className="flex items-center gap-1 translate-x-12 group-hover/list:translate-x-0 transition-transform duration-300 ease-out">
              {!isInbox && onFocusToggle && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onFocusToggle(e); }}
                  className={cn(
                    "p-1.5 rounded-lg transition-colors",
                    isFocus ? "bg-amber-50 text-amber-500" : "bg-neutral-50 text-neutral-400 hover:text-amber-500 hover:bg-amber-50"
                  )}
                >
                  <Star className={cn("w-3.5 h-3.5", isFocus && "fill-current")} />
                </button>
              )}
              {onDelete && !isTrash && (
                <button 
                  onClick={(e) => { e.stopPropagation(); onDelete(e); }}
                  className="p-1.5 rounded-lg text-neutral-400 hover:text-red-500 hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.95, transition: { duration: 0.2 } }}
      whileHover={{ y: -4, boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)' }}
      onClick={onClick}
      className={cn(
        "w-full h-auto bg-white dark:bg-neutral-900 rounded-xl overflow-hidden cursor-pointer relative transition-all duration-300 border border-neutral-100 dark:border-neutral-800 group",
        isInbox && "opacity-80 grayscale-[0.3] hover:grayscale-0 hover:opacity-100",
        isFocus && "shadow-[0_0_25px_rgba(16,185,129,0.3)]",
        className
      )}
    >
      {/* Top Color Bar */}
      <div 
        className="h-0.5 w-full" 
        style={{ backgroundColor: themeColor }} 
      />

      {/* Hover Actions - Grid Mode */}
      <div className="absolute top-3 right-3 flex items-center gap-1.5 z-30 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        {!isInbox && onFocusToggle && (
          <button 
            onClick={onFocusToggle}
            className={cn(
              "p-2 rounded-full backdrop-blur-md transition-all shadow-sm border",
              isFocus 
                ? "bg-amber-400/90 text-white border-amber-300" 
                : "bg-white/80 text-neutral-400 hover:text-amber-500 border-neutral-100"
            )}
          >
            <Star className={cn("w-4 h-4", isFocus && "fill-current")} />
          </button>
        )}
        {onDelete && !isTrash && (
          <button 
            onClick={onDelete}
            className="p-2 rounded-full bg-white/80 backdrop-blur-md text-neutral-400 hover:text-red-500 border border-neutral-100 shadow-sm transition-all"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        )}
        {isTrash && (
          <div className="flex items-center gap-1.5">
            {onRestore && (
              <button 
                onClick={onRestore}
                className="p-2 rounded-full bg-white/80 backdrop-blur-md text-neutral-400 hover:text-emerald-600 border border-neutral-100 shadow-sm transition-all"
                title="Restore"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
            {onPermanentDelete && (
              <button 
                onClick={onPermanentDelete}
                className="p-2 rounded-full bg-white/80 backdrop-blur-md text-neutral-400 hover:text-red-600 border border-neutral-100 shadow-sm transition-all"
                title="Delete Permanently"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Focus Mode Flowing Border */}
      {isFocus && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute inset-0 border-2 border-transparent rounded-xl overflow-hidden">
            <div className="absolute -inset-[2px] flow-gradient opacity-40" />
          </div>
        </div>
      )}

      {/* Internalized Medal */}
      {isInternalized && (
        <div className="absolute top-2 right-2 z-20">
          <div className="bg-amber-100 text-amber-600 p-1 rounded-full shadow-sm border border-amber-200" title="Internalized Knowledge">
            <CheckCircle2 className="w-3 h-3" />
          </div>
        </div>
      )}

      <div className="p-5 space-y-4 relative z-10">
        {/* Header */}
        <div className="flex items-start gap-3">
          <span className="text-4xl shrink-0" role="img" aria-label="node-icon">
            {icon}
          </span>
          <div className="flex-1 min-w-0">
            <h3 className="font-bold text-neutral-900 dark:text-neutral-100 leading-tight line-clamp-2 pt-1">
              {title}
            </h3>
          </div>
          
          {/* Focus Toggle Button - Removed from header, now in overlay */}
        </div>

        {/* Body (AI Summary) - Library Variant */}
        <div className="bg-neutral-50/50 dark:bg-neutral-800/30 p-3 rounded-lg border border-neutral-100/30 dark:border-neutral-700/20 group/summary relative">
          <ul className="space-y-1.5 grayscale opacity-70 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-300">
            {summary.slice(0, 1).map((point, i) => (
              <li key={i} className="flex items-start gap-2 text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                <span className="w-1 h-1 rounded-full bg-neutral-300 dark:bg-neutral-600 mt-1.5 shrink-0" />
                <span className="line-clamp-2">{point}</span>
              </li>
            ))}
          </ul>
        </div>

        {/* Footer */}
        <div className="flex flex-col gap-3 pt-1">
          {/* Tags */}
          <div className="flex flex-wrap gap-1.5">
            {tags.map((tag, i) => (
              <span 
                key={i} 
                className="px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 text-[10px] font-medium rounded-full border border-neutral-200/50 dark:border-neutral-700/50"
              >
                {tag}
              </span>
            ))}
          </div>

          {/* Source Type */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
              <SourceIcon className="w-3 h-3" />
              <span>{sourceLabel}</span>
            </div>
            
            {isFocus && onInternalize && (
              <button 
                onClick={onInternalize}
                className="flex items-center gap-1 text-[10px] font-bold text-emerald-500 hover:text-emerald-600 uppercase tracking-widest transition-colors"
              >
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Internalize
              </button>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
