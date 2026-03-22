import React from 'react';
import { LayoutGrid, List } from 'lucide-react';
import { cn } from '../lib/utils';
import { motion } from 'motion/react';

interface LayoutTogglerProps {
  viewMode: 'grid' | 'list';
  onViewChange: (mode: 'grid' | 'list') => void;
}

export const LayoutToggler: React.FC<LayoutTogglerProps> = ({ viewMode, onViewChange }) => {
  return (
    <div className="flex items-center p-1 bg-[#F3F4F6] rounded-xl border border-neutral-200/50">
      <button
        onClick={() => onViewChange('grid')}
        className={cn(
          "relative p-2 rounded-lg transition-all duration-200",
          viewMode === 'grid' ? "text-[#00C1A3]" : "text-neutral-400 hover:text-neutral-600"
        )}
      >
        {viewMode === 'grid' && (
          <motion.div
            layoutId="activeLayout"
            className="absolute inset-0 bg-white rounded-lg shadow-sm border border-neutral-100"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <LayoutGrid className="w-4 h-4 relative z-10" />
      </button>
      <button
        onClick={() => onViewChange('list')}
        className={cn(
          "relative p-2 rounded-lg transition-all duration-200",
          viewMode === 'list' ? "text-[#00C1A3]" : "text-neutral-400 hover:text-neutral-600"
        )}
      >
        {viewMode === 'list' && (
          <motion.div
            layoutId="activeLayout"
            className="absolute inset-0 bg-white rounded-lg shadow-sm border border-neutral-100"
            transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
          />
        )}
        <List className="w-4 h-4 relative z-10" />
      </button>
    </div>
  );
};
