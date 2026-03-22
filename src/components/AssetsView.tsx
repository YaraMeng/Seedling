import React, { useState, useMemo } from 'react';
import { KnowledgeNode, Category } from '../types';
import { NodeCard } from './NodeCard';
import { FocusKnowledgeCard } from './FocusKnowledgeCard';
import { motion, AnimatePresence } from 'motion/react';
import { Library, ChevronRight, FolderOpen, Tag, Settings, Plus, Trash2, Edit2, GripVertical, X } from 'lucide-react';
import { DragDropContext, Droppable, Draggable, DropResult } from '@hello-pangea/dnd';
import { LayoutToggler } from './LayoutToggler';
import { AssetContainer } from './AssetContainer';
import { cn } from '../lib/utils';

interface AssetsProps {
  nodes: KnowledgeNode[];
  categories: Category[];
  selectedCategoryId: string | null;
  setSelectedCategoryId: (id: string | null) => void;
  onMove: (id: string, status: KnowledgeNode['status']) => void;
  onNodeClick: (node: KnowledgeNode) => void;
  onEditNode: (node: KnowledgeNode) => void;
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onUpdateCategory: (id: string, updates: Partial<Category>) => void;
  onDeleteCategory: (id: string) => void;
  onReorderCategories: (categoryIds: string[]) => void;
}

export function AssetsView({ 
  nodes, 
  categories, 
  selectedCategoryId,
  setSelectedCategoryId,
  onMove, 
  onNodeClick, 
  onEditNode, 
  onUpdate,
  onAddCategory, 
  onUpdateCategory, 
  onDeleteCategory, 
  onReorderCategories 
}: AssetsProps) {
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<KnowledgeNode['type'] | null>(null);
  const [sortBy, setSortBy] = useState<'latest' | 'edited'>('latest');
  const [showAllTags, setShowAllTags] = useState(false);
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  const [isEditMode, setIsEditMode] = useState(false);
  
  // Category Edit Modal State
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [isAddingCategory, setIsAddingCategory] = useState(false);
  const [catName, setCatName] = useState('');
  const [catIcon, setCatIcon] = useState('📁');
  const [catColor, setCatColor] = useState('#94a3b8');

  const assetNodes = nodes.filter(n => n.status === 'asset' || n.status === 'focus');

  if (assetNodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
        <Library className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium text-neutral-600">No assets yet</h2>
        <p className="text-sm mt-2">Process items from your Inbox to build your knowledge base.</p>
      </div>
    );
  }

  // Calculate direct node counts per category
  const directCounts = assetNodes.reduce((acc, node) => {
    const catId = node.categoryId || 'uncategorized';
    acc[catId] = (acc[catId] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  // Calculate total counts including subcategories
  const getCategoryTotalCount = (catId: string): number => {
    const direct = directCounts[catId] || 0;
    const children = categories.filter(c => c.parentId === catId);
    return direct + children.reduce((sum, child) => sum + getCategoryTotalCount(child.id), 0);
  };

  const categoryCounts = categories.reduce((acc, cat) => {
    acc[cat.id] = getCategoryTotalCount(cat.id);
    return acc;
  }, { uncategorized: directCounts['uncategorized'] || 0 } as Record<string, number>);

  const currentCategories = categories
    .filter(c => (c.parentId || null) === (selectedCategoryId || null))
    .sort((a, b) => (a.order ?? 0) - (b.order ?? 0));

  const nodesInCategory = assetNodes.filter(node => 
    selectedCategoryId 
      ? node.categoryId === selectedCategoryId
      : !node.categoryId
  );

  const categoryTags = useMemo(() => {
    const tags = new Set<string>();
    nodesInCategory.forEach(node => {
      if (node.tags) {
        node.tags.forEach(tag => tags.add(tag));
      }
    });
    return Array.from(tags).sort();
  }, [nodesInCategory]);

  const displayedNodes = useMemo(() => {
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

  const selectedCategory = selectedCategoryId === 'uncategorized' 
    ? { id: 'uncategorized', name: 'Uncategorized', icon: '📁', color: '#94a3b8', parentId: null }
    : categories.find(c => c.id === selectedCategoryId);

  const handleDragEnd = (result: DropResult) => {
    if (!result.destination) return;
    const items = Array.from(currentCategories);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);
    onReorderCategories(items.map(c => c.id));
  };

  const openAddCategory = () => {
    setCatName('');
    setCatIcon('📁');
    setCatColor('#94a3b8');
    setIsAddingCategory(true);
  };

  const openEditCategory = (cat: Category) => {
    setCatName(cat.name);
    setCatIcon(cat.icon);
    setCatColor(cat.color);
    setEditingCategory(cat);
  };

  const saveCategory = () => {
    if (!catName.trim()) return;
    if (editingCategory) {
      onUpdateCategory(editingCategory.id, { name: catName, icon: catIcon, color: catColor });
      setEditingCategory(null);
    } else if (isAddingCategory) {
      onAddCategory({ name: catName, icon: catIcon, color: catColor, parentId: selectedCategoryId });
      setIsAddingCategory(false);
    }
  };

  const getBreadcrumbs = (catId: string | null): Category[] => {
    if (!catId || catId === 'uncategorized') return [];
    const cat = categories.find(c => c.id === catId);
    if (!cat) return [];
    return [...getBreadcrumbs(cat.parentId), cat];
  };

  const breadcrumbs = getBreadcrumbs(selectedCategoryId);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      {/* Sub-Category Grid */}
      {currentCategories.length > 0 && (
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
              <FolderOpen className="w-4 h-4" />
              Sub-folders
            </h3>
            {isEditMode && (
              <button
                onClick={openAddCategory}
                className="text-xs font-bold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1"
              >
                <Plus className="w-3 h-3" />
                Add Folder
              </button>
            )}
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {currentCategories.map(cat => (
              <motion.button
                key={cat.id}
                whileHover={{ y: -2, scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => setSelectedCategoryId(cat.id)}
                className="group relative flex items-center gap-3 p-3 bg-emerald-50/50 hover:bg-emerald-50 border border-emerald-100/50 hover:border-emerald-200 rounded-xl transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-white flex items-center justify-center text-xl shadow-sm group-hover:shadow-md transition-all relative">
                  {cat.icon}
                  <div className="absolute -bottom-1 -right-1 bg-emerald-100 text-emerald-600 p-0.5 rounded-md border border-emerald-200">
                    <FolderOpen className="w-2.5 h-2.5" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-neutral-800 truncate group-hover:text-emerald-700 transition-colors">
                    {cat.name}
                  </p>
                  <p className="text-[10px] font-medium text-neutral-400">
                    {categoryCounts[cat.id] || 0} items
                  </p>
                </div>
                
                {isEditMode && (
                  <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button 
                      onClick={(e) => { e.stopPropagation(); openEditCategory(cat); }}
                      className="p-1 bg-white rounded-md shadow-sm hover:text-emerald-600 transition-colors"
                    >
                      <Edit2 className="w-3 h-3" />
                    </button>
                    <button 
                      onClick={(e) => { e.stopPropagation(); onDeleteCategory(cat.id); }}
                      className="p-1 bg-white rounded-md shadow-sm hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-3 h-3" />
                    </button>
                  </div>
                )}
              </motion.button>
            ))}
          </div>
        </div>
      )}

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
              <Library className="w-4 h-4" />
              <span className="text-xs font-semibold uppercase tracking-wider">Quick Filters</span>
            </div>
            <div className="flex items-center gap-2">
              {[
                { type: 'pdf', label: '📄 PDF' },
                { type: 'url', label: '🌐 Link' },
                { type: 'image', label: '🖼 Image' },
                { type: 'text', label: '📝 Note' }
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

      {/* Content Area */}
      <div className="space-y-10">
        {/* Nodes */}
        <div className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-100 pb-2">
            <div className="flex items-center gap-4">
              <h3 className="text-sm font-bold text-neutral-400 uppercase tracking-widest flex items-center gap-2">
                <Library className="w-4 h-4" />
                Knowledge Assets
              </h3>
              <span className="text-xs font-medium text-neutral-400 bg-neutral-100 px-2 py-0.5 rounded-full">
                {displayedNodes.length} items
              </span>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Position B: Sort */}
              <div className="flex items-center gap-2 bg-neutral-50 border border-neutral-200 rounded-lg px-2 py-1">
                <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">Sort by</span>
                <select 
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="bg-transparent text-xs font-medium text-neutral-600 outline-none cursor-pointer"
                >
                  <option value="latest">Latest Saved</option>
                  <option value="edited">Recently Edited</option>
                </select>
              </div>
              {/* Position C: Layout Toggle */}
              <LayoutToggler viewMode={viewMode} onViewChange={setViewMode} />
            </div>
          </div>
          
          {displayedNodes.length === 0 ? (
            <div className="py-20 text-center text-neutral-400 bg-neutral-50/50 rounded-2xl border border-dashed border-neutral-200">
              <Library className="w-12 h-12 mx-auto mb-3 opacity-20" />
              <p className="text-sm font-medium">No knowledge assets in this category.</p>
              <p className="text-xs mt-1">Move items here from your Inbox or another folder.</p>
            </div>
          ) : (
            <AssetContainer viewMode={viewMode}>
              {displayedNodes.map(node => (
                <motion.div 
                  key={node.node_id} 
                  layout 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.9 }}
                  className={cn(viewMode === 'list' ? "w-full" : "h-full")}
                >
                  {viewMode === 'grid' && node.status === 'focus' ? (
                    <FocusKnowledgeCard
                      node={node}
                      onUnfocus={() => onMove(node.node_id, 'asset')}
                      onInternalize={() => onMove(node.node_id, 'asset')}
                      onUpdateNotes={(notes) => onUpdate(node.node_id, { content: { ...node.content, user_notes: notes } })}
                      onClick={() => onNodeClick(node)}
                    />
                  ) : (
                    <NodeCard
                      node={node}
                      onMove={(status) => onMove(node.node_id, status)}
                      onClick={() => onNodeClick(node)}
                      onEdit={() => onEditNode(node)}
                      viewMode={viewMode}
                    />
                  )}
                </motion.div>
              ))}
            </AssetContainer>
          )}
        </div>
      </div>

      {/* Category Edit Modal */}
      <AnimatePresence>
        {(isAddingCategory || editingCategory) && (
          <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-white rounded-2xl shadow-xl w-full max-w-md overflow-hidden"
            >
              <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
                <h3 className="text-lg font-semibold text-neutral-900">
                  {editingCategory ? 'Edit Category' : 'New Category'}
                </h3>
                <button 
                  onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }}
                  className="p-2 hover:bg-neutral-100 rounded-full transition-colors"
                >
                  <X className="w-5 h-5 text-neutral-500" />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-neutral-700 mb-1">Name</label>
                  <input
                    type="text"
                    value={catName}
                    onChange={e => setCatName(e.target.value)}
                    className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    placeholder="e.g., Project Alpha"
                    autoFocus
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Icon (Emoji)</label>
                    <input
                      type="text"
                      value={catIcon}
                      onChange={e => setCatIcon(e.target.value)}
                      className="w-full px-3 py-2 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-emerald-500 outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-neutral-700 mb-1">Color</label>
                    <input
                      type="color"
                      value={catColor}
                      onChange={e => setCatColor(e.target.value)}
                      className="w-full h-10 p-1 border border-neutral-200 rounded-lg cursor-pointer"
                    />
                  </div>
                </div>
              </div>
              <div className="p-6 border-t border-neutral-100 bg-neutral-50 flex justify-end gap-3">
                <button
                  onClick={() => { setIsAddingCategory(false); setEditingCategory(null); }}
                  className="px-4 py-2 text-sm font-medium text-neutral-600 hover:text-neutral-900 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={saveCategory}
                  disabled={!catName.trim()}
                  className="px-4 py-2 bg-emerald-600 text-white rounded-lg text-sm font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Save Category
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}
