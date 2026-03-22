import React, { useState, useEffect, useRef } from 'react';
import { KnowledgeNode, Category } from '../types';
import { motion, AnimatePresence } from 'motion/react';
import { 
  FolderOpen, 
  Plus, 
  X, 
  Check, 
  Sparkles, 
  ChevronDown, 
  ChevronRight,
  FileText,
  Link as LinkIcon,
  Image as ImageIcon,
  PenTool
} from 'lucide-react';
import { cn } from '../lib/utils';
import { generateMetadata } from '../services/ai';

interface InboxCardProps {
  key?: string;
  node: KnowledgeNode;
  categories: Category[];
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onArchive: (id: string) => void;
  onNodeClick: (node: KnowledgeNode) => void;
}

export function InboxCard({ node, categories, onUpdate, onArchive, onNodeClick }: InboxCardProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [showCategoryMenu, setShowCategoryMenu] = useState(false);
  const [newTag, setNewTag] = useState('');
  const [isAddingTag, setIsAddingTag] = useState(false);
  const [suggestedCategoryId, setSuggestedCategoryId] = useState<string | null>(null);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (node.tags.length === 0 && !isGenerating) {
      handleAutoTag();
    }
  }, []);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowCategoryMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleAutoTag = async () => {
    if (isGenerating) return;
    setIsGenerating(true);
    try {
      const metadata = await generateMetadata(
        { text: node.content.raw_input || node.content.user_notes },
        categories
      );
      if (metadata) {
        setSuggestedCategoryId(metadata.suggested_category_id);
        onUpdate(node.node_id, {
          tags: metadata.suggested_tags,
          categoryId: metadata.suggested_category_id || undefined,
          content: {
            ...node.content,
            ai_summary: [metadata.summary]
          }
        });
      }
    } finally {
      setIsGenerating(false);
    }
  };

  const removeTag = (tagToRemove: string) => {
    onUpdate(node.node_id, {
      tags: node.tags.filter(t => t !== tagToRemove)
    });
  };

  const addTag = () => {
    if (newTag.trim() && !node.tags.includes(newTag.trim())) {
      onUpdate(node.node_id, {
        tags: [...node.tags, newTag.trim()]
      });
      setNewTag('');
      setIsAddingTag(false);
    }
  };

  const selectCategory = (categoryId: string) => {
    onUpdate(node.node_id, { categoryId });
    setShowCategoryMenu(false);
    // User said: "鼠标点击即完成归档"
    onArchive(node.node_id);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !isAddingTag) {
      onArchive(node.node_id);
    }
  };

  const currentCategory = categories.find(c => c.id === node.categoryId);

  const renderCategoryTree = (parentId: string | null = null, level = 0) => {
    const children = categories.filter(c => c.parentId === parentId);
    if (children.length === 0) return null;

    return (
      <div className={cn("flex flex-col", level > 0 && "ml-2 border-l border-neutral-100 pl-2")}>
        {children.map(cat => (
          <div key={cat.id}>
            <button
              onClick={() => selectCategory(cat.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm flex items-center gap-2 hover:bg-neutral-50 transition-colors group",
                node.categoryId === cat.id && "bg-emerald-50 text-emerald-700 font-medium"
              )}
            >
              <span className="text-lg">{cat.icon}</span>
              <span className="flex-1 truncate">{cat.name}</span>
              {suggestedCategoryId === cat.id && <Sparkles className="w-3 h-3 text-emerald-500" />}
              {node.categoryId === cat.id && <Check className="w-3.5 h-3.5" />}
            </button>
            {renderCategoryTree(cat.id, level + 1)}
          </div>
        ))}
      </div>
    );
  };

  const SourceIcon = {
    url: LinkIcon,
    pdf: FileText,
    image: ImageIcon,
    text: PenTool
  }[node.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, x: 100, transition: { duration: 0.3 } }}
      onKeyDown={handleKeyDown}
      tabIndex={0}
      className="bg-neutral-50/50 dark:bg-neutral-900/50 rounded-2xl border-2 border-dashed border-neutral-200 dark:border-neutral-800 shadow-sm hover:shadow-md hover:border-emerald-200 transition-all p-6 flex flex-col gap-5 group focus:ring-2 focus:ring-emerald-500 outline-none"
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1 min-w-0" onClick={() => onNodeClick(node)}>
          <div className="flex items-center gap-2 mb-1">
            <SourceIcon className="w-4 h-4 text-neutral-400" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-neutral-400">
              {node.type}
            </span>
          </div>
          <h3 className="text-lg font-bold text-neutral-900 truncate group-hover:text-emerald-600 transition-colors">
            {node.content.title}
          </h3>
        </div>
        <button 
          onClick={handleAutoTag}
          disabled={isGenerating}
          className={cn(
            "p-2 rounded-full transition-all",
            isGenerating ? "animate-spin text-emerald-500" : "text-neutral-400 hover:text-emerald-500 hover:bg-emerald-50"
          )}
          title="AI 自动打标"
        >
          <Sparkles className="w-5 h-5" />
        </button>
      </div>

      {/* Tags Section */}
      <div className="flex flex-wrap gap-2 items-center">
        {node.tags.map(tag => (
          <span 
            key={tag}
            className="flex items-center gap-1 px-2.5 py-1 bg-neutral-100/60 text-neutral-500 text-xs font-medium rounded-full border border-neutral-200/50 group/tag backdrop-blur-sm"
          >
            {tag}
            <button 
              onClick={() => removeTag(tag)}
              className="hover:text-red-500 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          </span>
        ))}
        
        {isAddingTag ? (
          <div className="flex items-center gap-1">
            <input
              autoFocus
              type="text"
              value={newTag}
              onChange={(e) => setNewTag(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && addTag()}
              onBlur={addTag}
              className="w-24 px-2 py-1 text-xs border border-emerald-300 rounded-full outline-none focus:ring-2 focus:ring-emerald-200"
              placeholder="Tag name..."
            />
          </div>
        ) : (
          <button 
            onClick={() => setIsAddingTag(true)}
            className="p-1 text-neutral-400 hover:text-emerald-500 hover:bg-emerald-50 rounded-full transition-all"
          >
            <Plus className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* AI Summary Preview - Grayscale style */}
      {node.content.ai_summary.length > 0 && (
        <p className="text-sm text-neutral-400 dark:text-neutral-500 line-clamp-2 italic border-l-2 border-neutral-200 dark:border-neutral-800 pl-3">
          {node.content.ai_summary[0]}
        </p>
      )}

      <div className="mt-2 pt-5 border-t border-neutral-100 dark:border-neutral-800 flex flex-col gap-4">
        <div className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          Quick Classify
        </div>
        
        <div className="grid grid-cols-2 gap-2">
          {categories.filter(c => !c.parentId).slice(0, 4).map(cat => (
            <button
              key={cat.id}
              onClick={() => selectCategory(cat.id)}
              className={cn(
                "flex items-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border text-left group/btn",
                node.categoryId === cat.id 
                  ? "bg-emerald-600 border-emerald-500 text-white shadow-lg shadow-emerald-200" 
                  : "bg-white dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-300 hover:border-emerald-300 hover:bg-emerald-50/50"
              )}
            >
              <span className="text-base group-hover/btn:scale-110 transition-transform">{cat.icon}</span>
              <span className="truncate">{cat.name}</span>
            </button>
          ))}
          
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowCategoryMenu(!showCategoryMenu)}
              className={cn(
                "w-full flex items-center justify-center gap-2 px-3 py-2.5 rounded-xl text-xs font-bold transition-all border",
                showCategoryMenu 
                  ? "bg-neutral-900 text-white border-neutral-900" 
                  : "bg-neutral-100 dark:bg-neutral-800 border-neutral-200 dark:border-neutral-700 text-neutral-500 hover:bg-neutral-200"
              )}
            >
              <Plus className="w-3.5 h-3.5" />
              More
            </button>

            <AnimatePresence>
              {showCategoryMenu && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: 10 }}
                  className="absolute bottom-full left-0 mb-2 w-64 bg-white dark:bg-neutral-900 rounded-xl shadow-2xl border border-neutral-200 dark:border-neutral-800 p-2 z-50 max-h-80 overflow-y-auto"
                >
                  <div className="px-3 py-2 text-[10px] font-bold text-neutral-400 dark:text-neutral-500 uppercase tracking-widest border-b border-neutral-50 dark:border-neutral-800 mb-1">
                    All Categories
                  </div>
                  {renderCategoryTree()}
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          <button
            onClick={() => onArchive(node.node_id)}
            className="flex items-center justify-center gap-2 px-3 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 shadow-lg shadow-emerald-200 transition-all active:scale-95"
          >
            <Check className="w-3.5 h-3.5" />
            Archive
          </button>
        </div>
      </div>
    </motion.div>
  );
}
