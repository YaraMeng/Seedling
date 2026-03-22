import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { KnowledgeNode } from '../types';
import { 
  FileText, 
  Link as LinkIcon, 
  PenTool, 
  Image as ImageIcon, 
  Star, 
  MessageSquare, 
  CheckCircle2,
  ArrowUp
} from 'lucide-react';
import { cn } from '../lib/utils';

interface FocusKnowledgeCardProps {
  node: KnowledgeNode;
  onUnfocus: () => void;
  onInternalize: () => void;
  onUpdateNotes: (notes: string) => void;
  onClick?: () => void;
}

export function FocusKnowledgeCard({ 
  node, 
  onUnfocus, 
  onInternalize, 
  onUpdateNotes,
  onClick 
}: FocusKnowledgeCardProps) {
  const [isInternalizing, setIsInternalizing] = useState(false);
  const [notes, setNotes] = useState(node.content.user_notes || '');

  const SourceIcon = {
    url: LinkIcon,
    pdf: FileText,
    text: PenTool,
    image: ImageIcon,
  }[node.type];

  const sourceLabel = {
    url: 'via Link',
    pdf: 'PDF Document',
    text: 'Note',
    image: 'Image Asset',
  }[node.type];

  const handleInternalize = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsInternalizing(true);
    // Wait for animation to finish before calling the parent handler
    setTimeout(() => {
      onInternalize();
    }, 500);
  };

  const handleNotesBlur = () => {
    if (notes !== node.content.user_notes) {
      onUpdateNotes(notes);
    }
  };

  return (
    <AnimatePresence>
      {!isInternalizing && (
        <motion.div
          layout
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -100, transition: { duration: 0.5, ease: "easeInOut" } }}
          whileHover={{ y: -4 }}
          onClick={onClick}
          className={cn(
            "w-full max-w-md bg-white rounded-3xl p-6 cursor-pointer relative transition-all duration-300",
            "border border-neutral-100 shadow-[0_10px_40px_-10px_rgba(0,193,163,0.15)] hover:shadow-[0_20px_50px_-10px_rgba(0,193,163,0.25)]"
          )}
        >
          {/* Top: Type Icon and Source Title */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2 text-neutral-400">
              <SourceIcon className="w-4 h-4" />
              <span className="text-[10px] font-bold uppercase tracking-widest">{sourceLabel}</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); onUnfocus(); }}
              className="p-2 bg-emerald-50 text-emerald-500 rounded-full hover:bg-emerald-100 transition-colors"
              title="Unfocus"
            >
              <Star className="w-4 h-4 fill-current" />
            </button>
          </div>

          {/* Middle: Large Title and AI Summary */}
          <div className="space-y-4 mb-8">
            <h2 className="text-2xl font-bold text-neutral-900 leading-tight">
              {node.content.title}
            </h2>
            <div className="space-y-3">
              {node.content.ai_summary.map((point, i) => (
                <div key={i} className="flex items-start gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 mt-2.5 shrink-0" />
                  <p className="text-neutral-600 text-sm leading-[1.6]">
                    {point}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom: Add Reflection Input */}
          <div className="space-y-6">
            <div className="relative group/input">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 text-neutral-300 group-focus-within/input:text-emerald-500 transition-colors">
                <MessageSquare className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                onBlur={handleNotesBlur}
                onClick={(e) => e.stopPropagation()}
                placeholder="Add Reflection..."
                className="w-full bg-neutral-50 border border-neutral-100 rounded-2xl py-3 pl-11 pr-4 text-sm outline-none focus:ring-2 focus:ring-emerald-100 focus:border-emerald-200 transition-all"
              />
            </div>

            {/* Core Action: Archive & Inscribe */}
            <button
              onClick={handleInternalize}
              className="w-full bg-neutral-900 text-white rounded-2xl py-4 font-bold text-sm flex items-center justify-center gap-2 hover:bg-neutral-800 transition-all active:scale-[0.98] group/btn"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              <span>Archive & Inscribe</span>
              <ArrowUp className="w-4 h-4 opacity-0 -translate-y-1 group-hover:opacity-100 group-hover:translate-y-0 transition-all" />
            </button>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
