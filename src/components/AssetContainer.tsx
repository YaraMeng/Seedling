import React from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

interface AssetContainerProps {
  viewMode: 'grid' | 'list';
  children: React.ReactNode;
  className?: string;
}

export const AssetContainer: React.FC<AssetContainerProps> = ({ viewMode, children, className }) => {
  return (
    <motion.div
      layout
      className={cn(
        "transition-all duration-500",
        viewMode === 'grid' 
          ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6" 
          : "flex flex-col gap-3",
        className
      )}
    >
      <AnimatePresence mode="popLayout">
        {children}
      </AnimatePresence>
    </motion.div>
  );
};
