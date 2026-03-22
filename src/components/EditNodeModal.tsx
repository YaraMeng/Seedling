import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Check, Edit2, ArrowRight, Plus } from 'lucide-react';
import { KnowledgeNode, Category } from '../types';

interface EditNodeModalProps {
  node: KnowledgeNode | null;
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  onSave: (id: string, updates: Partial<KnowledgeNode>) => void;
  onMove?: (id: string, status: KnowledgeNode['status'], categoryId?: string) => void;
  onAddCategory?: (category: Omit<Category, 'id'>) => void;
}

export function EditNodeModal({ node, categories, isOpen, onClose, onSave, onMove, onAddCategory }: EditNodeModalProps) {
  const [title, setTitle] = useState('');
  const [icon, setIcon] = useState('');
  const [color, setColor] = useState('');
  const [tags, setTags] = useState('');
  const [categoryId, setCategoryId] = useState<string>('');
  const [contentType, setContentType] = useState<string>('');
  const [connectionLogic, setConnectionLogic] = useState('');
  
  const [isCreatingCategory, setIsCreatingCategory] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('📁');
  const [newCatColor, setNewCatColor] = useState('#10b981');

  useEffect(() => {
    if (node) {
      setTitle(node.content.title);
      setIcon(node.visual.icon);
      setColor(node.visual.primary_color);
      setTags(node.tags ? node.tags.join(', ') : '');
      setCategoryId(node.categoryId || '');
      setContentType(node.content.content_type || '');
      setConnectionLogic(node.content.connection_logic || '');
      setIsCreatingCategory(false);
      setNewCatName('');
    }
  }, [node]);

  if (!node) return null;

  const handleSave = () => {
    onSave(node.node_id, {
      content: { 
        ...node.content, 
        title, 
        content_type: contentType || undefined,
        connection_logic: connectionLogic || undefined
      },
      visual: { icon, primary_color: color },
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      categoryId: categoryId || undefined,
    });
    onClose();
  };

  const handleSaveAndMove = () => {
    onSave(node.node_id, {
      content: { 
        ...node.content, 
        title,
        content_type: contentType || undefined,
        connection_logic: connectionLogic || undefined
      },
      visual: { icon, primary_color: color },
      tags: tags.split(',').map(s => s.trim()).filter(Boolean),
      categoryId: categoryId || undefined,
    });
    if (onMove) {
      onMove(node.node_id, 'asset', categoryId || undefined);
    }
    onClose();
  };

  const handleCreateCategory = () => {
    if (!newCatName.trim() || !onAddCategory) return;
    const newCat = {
      name: newCatName.trim(),
      icon: newCatIcon,
      color: newCatColor,
      parentId: null,
    };
    onAddCategory(newCat);
    // We can't immediately set categoryId because we don't know the generated ID.
    // But we can just close the creation UI and let the user select it.
    setIsCreatingCategory(false);
    setNewCatName('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className="fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-md bg-white rounded-2xl shadow-2xl z-50 overflow-hidden"
          >
            <div className="p-5 border-b border-neutral-100 flex items-center justify-between bg-neutral-50">
              <h2 className="text-lg font-semibold flex items-center gap-2 text-neutral-800">
                <Edit2 className="w-4 h-4 text-neutral-500" />
                Visual Correction
              </h2>
              <button onClick={onClose} className="p-1.5 hover:bg-neutral-200 rounded-full transition-colors">
                <X className="w-4 h-4 text-neutral-500" />
              </button>
            </div>

            <div className="p-6 space-y-5 max-h-[80vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Title</label>
                <input
                  type="text"
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Icon (Emoji)</label>
                  <input
                    type="text"
                    value={icon}
                    onChange={e => setIcon(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm text-center text-xl"
                  />
                </div>
                <div>
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Color (Hex)</label>
                  <div className="flex gap-2">
                    <input
                      type="color"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="w-10 h-10 p-1 bg-white border border-neutral-200 rounded-lg cursor-pointer"
                    />
                    <input
                      type="text"
                      value={color}
                      onChange={e => setColor(e.target.value)}
                      className="flex-1 px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm font-mono"
                    />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider">Category</label>
                  {!isCreatingCategory && onAddCategory && (
                    <button 
                      onClick={() => setIsCreatingCategory(true)}
                      className="text-xs text-emerald-600 hover:text-emerald-700 font-medium flex items-center gap-1"
                    >
                      <Plus className="w-3 h-3" /> New
                    </button>
                  )}
                </div>
                
                {isCreatingCategory ? (
                  <div className="p-3 bg-neutral-50 rounded-xl border border-neutral-200 space-y-3">
                    <div>
                      <input
                        type="text"
                        value={newCatName}
                        onChange={e => setNewCatName(e.target.value)}
                        placeholder="Category Name"
                        className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm"
                      />
                    </div>
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={newCatIcon}
                        onChange={e => setNewCatIcon(e.target.value)}
                        className="w-12 px-2 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm text-center"
                      />
                      <input
                        type="color"
                        value={newCatColor}
                        onChange={e => setNewCatColor(e.target.value)}
                        className="w-10 h-10 p-1 bg-white border border-neutral-200 rounded-lg cursor-pointer"
                      />
                      <button
                        onClick={handleCreateCategory}
                        disabled={!newCatName.trim()}
                        className="flex-1 bg-neutral-800 text-white rounded-lg text-sm font-medium disabled:opacity-50"
                      >
                        Add
                      </button>
                      <button
                        onClick={() => setIsCreatingCategory(false)}
                        className="px-3 bg-neutral-200 text-neutral-700 rounded-lg text-sm font-medium"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <select
                    value={categoryId}
                    onChange={e => setCategoryId(e.target.value)}
                    className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm"
                  >
                    <option value="">Uncategorized</option>
                    {(() => {
                      const renderOptions = (parentId: string | null, depth: number = 0): React.ReactNode[] => {
                        return categories
                          .filter(c => (c.parentId || null) === parentId)
                          .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                          .flatMap(cat => [
                            <option key={cat.id} value={cat.id}>
                              {'\u00A0'.repeat(depth * 4)}{cat.icon} {cat.name}
                            </option>,
                            ...renderOptions(cat.id, depth + 1)
                          ]);
                      };
                      return renderOptions(null);
                    })()}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Content Type</label>
                <select
                  value={contentType}
                  onChange={e => setContentType(e.target.value)}
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm"
                >
                  <option value="">Unknown</option>
                  <option value="article">Article</option>
                  <option value="tutorial">Tutorial</option>
                  <option value="recipe">Recipe</option>
                  <option value="news">News</option>
                  <option value="thought">Thought</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Connection Logic</label>
                <textarea
                  value={connectionLogic}
                  onChange={e => setConnectionLogic(e.target.value)}
                  placeholder="Explain why this knowledge is important..."
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm min-h-[80px] resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-500 uppercase tracking-wider mb-1.5">Tags (comma separated)</label>
                <input
                  type="text"
                  value={tags}
                  onChange={e => setTags(e.target.value)}
                  placeholder="e.g. Technology, React, Hooks"
                  className="w-full px-3 py-2 bg-white border border-neutral-200 rounded-lg focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-sm font-mono"
                />
              </div>

              <div className="pt-2 flex flex-col gap-3">
                <div className="flex gap-3">
                  <button
                    onClick={onClose}
                    className="flex-1 py-2.5 bg-neutral-100 hover:bg-neutral-200 text-neutral-700 rounded-xl font-medium transition-colors text-sm"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSave}
                    className="flex-1 py-2.5 bg-neutral-800 hover:bg-neutral-900 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <Check className="w-4 h-4" />
                    Save Changes
                  </button>
                </div>
                {node.status === 'inbox' && onMove && (
                  <button
                    onClick={handleSaveAndMove}
                    className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors text-sm"
                  >
                    <ArrowRight className="w-4 h-4" />
                    Save & Move to Assets
                  </button>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
