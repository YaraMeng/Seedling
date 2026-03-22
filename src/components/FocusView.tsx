import { useState, useEffect, useMemo } from 'react';
import { KnowledgeNode, Category } from '../types';
import { NodeCard } from './NodeCard';
import { FocusKnowledgeCard } from './FocusKnowledgeCard';
import { motion, AnimatePresence } from 'motion/react';
import { Target, Sparkles, AlertCircle, ChevronRight, Tag } from 'lucide-react';
import { LayoutToggler } from './LayoutToggler';
import { AssetContainer } from './AssetContainer';
import { cn } from '../lib/utils';

interface FocusProps {
  nodes: KnowledgeNode[];
  categories: Category[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  onMove: (id: string, status: KnowledgeNode['status']) => void;
  onNodeClick: (node: KnowledgeNode) => void;
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onEditNode: (node: KnowledgeNode) => void;
}

export function FocusView({ 
  nodes, 
  categories, 
  selectedCategoryId, 
  setSelectedCategoryId, 
  onMove, 
  onNodeClick, 
  onUpdate, 
  onEditNode 
}: FocusProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<KnowledgeNode['type'] | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'edited'>('latest');
  const [showAllTags, setShowAllTags] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  const nodesInCategory = useMemo(() => {
    const base = nodes.filter(n => n.status === 'focus');
    if (!selectedCategoryId) return base;
    if (selectedCategoryId === 'uncategorized') return base.filter(n => !n.categoryId);
    return base.filter(n => n.categoryId === selectedCategoryId);
  }, [nodes, selectedCategoryId]);

  const categoryTags = useMemo(() => {
    const tags = new Set<string>();
    nodesInCategory.forEach(node => {
      if (node.tags) {
        node.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [nodesInCategory]);

  const focusNodes = useMemo(() => {
    let filtered = nodesInCategory;
    if (selectedTag) {
      filtered = filtered.filter(node => node.tags?.includes(selectedTag));
    }
    if (selectedType) {
      filtered = filtered.filter(node => node.type === selectedType);
    }
    
    return [...filtered].sort((a, b) => {
      if (sortBy === 'latest') return b.created_at - a.created_at;
      if (sortBy === 'edited') return b.updated_at - a.updated_at;
      return 0;
    });
  }, [nodesInCategory, selectedTag, selectedType, sortBy]);

  const getBreadcrumbs = (catId: string | null): Category[] => {
    if (!catId || catId === 'uncategorized') return [];
    const cat = categories.find(c => c.id === catId);
    if (!cat) return [];
    return [...getBreadcrumbs(cat.parentId), cat];
  };

  const breadcrumbs = getBreadcrumbs(selectedCategoryId);

  if (focusNodes.length === 0 && !selectedCategoryId && !selectedTag) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
        <Target className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium text-neutral-600">No active focus</h2>
        <p className="text-sm mt-2">Move important assets here to keep them top of mind.</p>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Top Filter Bar: Tags */}
      {categoryTags.length > 0 && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 space-y-4">
          <div className="flex items-center gap-3 overflow-x-auto no-scrollbar">
            <div className="flex items-center gap-2 text-neutral-400 shrink-0 mr-2">
              <Tag className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Filter Tags</span>
            </div>
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-3 py-1.5 rounded-full text-xs font-medium transition-colors shrink-0 ${
                !selectedTag 
                  ? 'bg-neutral-800 text-white' 
                  : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-200'
              }`}
            >
              All
            </button>
            {(showAllTags ? categoryTags : categoryTags.slice(0, 5)).map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium flex items-center gap-1 transition-colors shrink-0 ${
                  selectedTag === tag
                    ? 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                    : 'bg-white border border-neutral-200 text-neutral-600 hover:bg-neutral-50 hover:border-neutral-300'
                }`}
              >
                {tag}
              </button>
            ))}
            {categoryTags.length > 5 && (
              <button
                onClick={() => setShowAllTags(!showAllTags)}
                className="px-3 py-1.5 rounded-full text-xs font-medium bg-neutral-50 text-neutral-500 hover:bg-neutral-100 transition-colors shrink-0 border border-dashed border-neutral-300"
              >
                {showAllTags ? 'Show Less' : `+ ${categoryTags.length - 5} More`}
              </button>
            )}
          </div>

          {/* Quick Filters */}
          <div className="flex items-center gap-3 pt-2 border-t border-neutral-50">
            <div className="flex items-center gap-2 text-neutral-400 shrink-0 mr-2">
              <Target className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Quick Filters</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { type: 'pdf', label: '📄 PDF' },
                { type: 'url', label: '🌐 Link' },
                { type: 'image', label: '🖼 Image' }
              ].map((item) => (
                <button
                  key={item.type}
                  onClick={() => setSelectedType(selectedType === item.type ? null : item.type as any)}
                  className={`px-4 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                    selectedType === item.type
                      ? 'bg-[#00C1A3] text-white border-[#00C1A3] shadow-sm'
                      : 'bg-transparent text-neutral-600 border-neutral-200 hover:border-neutral-300 hover:bg-neutral-50'
                  }`}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Breadcrumbs */}
      {selectedCategoryId && (
        <div className="bg-white p-4 rounded-xl shadow-sm border border-neutral-100 flex items-center gap-2 text-sm font-medium text-neutral-500">
          <button 
            onClick={() => setSelectedCategoryId(null)}
            className="hover:text-emerald-600 transition-colors"
          >
            All Focus
          </button>
          
          {selectedCategoryId === 'uncategorized' && (
            <div className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-neutral-300" />
              <span className="text-emerald-700 flex items-center gap-1">
                <span>📁</span>
                Uncategorized
              </span>
            </div>
          )}

          {breadcrumbs.map((crumb, index) => (
            <div key={crumb.id} className="flex items-center gap-2">
              <ChevronRight className="w-4 h-4 text-neutral-300" />
              <button
                onClick={() => setSelectedCategoryId(crumb.id)}
                className={`flex items-center gap-1 transition-colors ${
                  index === breadcrumbs.length - 1 ? 'text-emerald-700' : 'hover:text-emerald-600'
                }`}
              >
                <span>{crumb.icon}</span>
                {crumb.name}
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex items-center justify-between bg-emerald-50 p-4 rounded-xl border border-emerald-100">
        <div className="flex items-center gap-6">
          <div>
            <h2 className="text-2xl font-bold tracking-tight text-emerald-900 flex items-center gap-2">
              <Sparkles className="w-6 h-6 text-emerald-500" />
              Active Focus
            </h2>
            <p className="text-sm text-emerald-700 mt-1">
              Limit your focus to 3-7 items to ensure deep learning and application.
            </p>
          </div>
          
          {/* Position A: Focus Count */}
          <div className="flex items-center gap-3 bg-white px-4 py-2 rounded-2xl border border-emerald-200 shadow-sm">
            <span className="text-4xl font-black text-emerald-600 tabular-nums">{focusNodes.length}</span>
            <div className="flex flex-col -space-y-1">
              <span className="text-[10px] font-bold text-emerald-800/40 uppercase tracking-widest">Active</span>
              <span className="text-lg font-bold text-emerald-800/20">/ 7</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Position B: Sort */}
          <div className="flex items-center gap-2 bg-white/50 border border-emerald-200 rounded-lg px-2 py-1">
            <span className="text-[10px] font-bold text-emerald-600/60 uppercase tracking-widest">Sort by</span>
            <select 
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="bg-transparent text-xs font-medium text-emerald-800 outline-none cursor-pointer"
            >
              <option value="latest">Latest Saved</option>
              <option value="edited">Recently Edited</option>
            </select>
          </div>
          {/* Position C: Layout Toggle */}
          <LayoutToggler viewMode={viewMode} onViewChange={setViewMode} />
        </div>
      </div>

      {focusNodes.length > 7 && (
        <div className="mb-6 p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3 text-amber-800">
          <AlertCircle className="w-5 h-5 shrink-0 mt-0.5" />
          <div>
            <h4 className="font-semibold">Too many focus items</h4>
            <p className="text-sm mt-1">You have more than 7 items in focus. Consider moving some back to Assets to maintain clarity.</p>
          </div>
        </div>
      )}

      {focusNodes.length === 0 ? (
        <div className="py-20 text-center bg-white rounded-3xl border border-dashed border-neutral-200 flex flex-col items-center justify-center">
          <div className="w-20 h-20 bg-neutral-50 rounded-full flex items-center justify-center mb-6">
            <Target className="w-10 h-10 text-neutral-200" />
          </div>
          <h3 className="text-lg font-bold text-neutral-900 mb-2">
            {selectedCategoryId ? "该分类下暂无 Focus 条目" : "暂无 Focus 条目"}
          </h3>
          <p className="text-neutral-400 max-w-xs mx-auto">
            去 Library 收藏一个吧！点击卡片上的 <Target className="w-3 h-3 inline" /> 图标即可加入 Focus。
          </p>
        </div>
      ) : (
        <AssetContainer viewMode={viewMode} className={cn(viewMode === 'grid' ? "lg:grid-cols-2" : "")}>
          {focusNodes.map(node => (
            <motion.div key={node.node_id} layout className={cn("flex flex-col gap-4", viewMode === 'list' ? "w-full" : "")}>
              {viewMode === 'grid' ? (
                <FocusKnowledgeCard
                  node={node}
                  onUnfocus={() => onMove(node.node_id, 'asset')}
                  onInternalize={() => onMove(node.node_id, 'asset')} // Assuming internalization moves it back or marks it
                  onUpdateNotes={(notes) => onUpdate(node.node_id, { content: { ...node.content, user_notes: notes } })}
                  onClick={() => onNodeClick(node)}
                />
              ) : (
                <NodeCard
                  node={node}
                  onMove={(status) => onMove(node.node_id, status)}
                  onClick={() => onNodeClick(node)}
                  onEdit={() => onEditNode(node)}
                  className="h-full"
                  viewMode={viewMode}
                />
              )}
            </motion.div>
          ))}
        </AssetContainer>
      )}
    </div>
  );
}
