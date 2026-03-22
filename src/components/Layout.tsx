import React, { ReactNode, useState, useEffect } from 'react';
import { Inbox, Library, Target, Search, Plus, Settings, ChevronRight, ChevronDown, Trash2, X, Clipboard, ArrowRight, CheckCircle2 } from 'lucide-react';
import { cn } from '../lib/utils';
import { Category, KnowledgeNode } from '../types';
import { motion, AnimatePresence } from 'motion/react';

interface LayoutProps {
  children: ReactNode;
  activeTab: 'inbox' | 'asset' | 'focus' | 'trash';
  onTabChange: (tab: 'inbox' | 'asset' | 'focus' | 'trash') => void;
  onAddClick: () => void;
  categories: Category[];
  selectedCategoryId: string | null;
  onCategorySelect: (id: string | null) => void;
  nodes: KnowledgeNode[];
}

export function Layout({ 
  children, 
  activeTab, 
  onTabChange, 
  onAddClick, 
  categories, 
  selectedCategoryId, 
  onCategorySelect,
  nodes
}: LayoutProps) {
  const [isInputFocused, setIsInputFocused] = useState(false);
  const [showUndo, setShowUndo] = useState(false);

  const focusNodes = nodes.filter(n => n.status === 'focus');
  const inboxNodes = nodes.filter(n => n.status === 'inbox');
  const trashNodes = nodes.filter(n => n.status === 'trash');

  const handlePaste = async () => {
    try {
      const text = await navigator.clipboard.readText();
      if (text) {
        onAddClick();
      }
    } catch (err) {
      console.error('Failed to read clipboard', err);
    }
  };

  const showCategorySidebar = activeTab === 'asset' || activeTab === 'focus';

  return (
    <div className="flex h-screen bg-neutral-50 text-neutral-900 font-sans overflow-hidden">
      {/* Sidebar - Minimalist Icons */}
      <aside className="w-16 border-r border-neutral-200 bg-white flex flex-col items-center py-6 shrink-0 z-30">
        <div className="mb-8 text-2xl">🌱</div>
        
        <nav className="flex-1 flex flex-col gap-4">
          <NavIcon 
            icon={Inbox} 
            active={activeTab === 'inbox'} 
            onClick={() => onTabChange('inbox')} 
            label="Inbox"
            count={inboxNodes.length}
          />
          <NavIcon 
            icon={Library} 
            active={activeTab === 'asset'} 
            onClick={() => onTabChange('asset')} 
            label="Assets"
          />
          <NavIcon 
            icon={Target} 
            active={activeTab === 'focus'} 
            onClick={() => onTabChange('focus')} 
            label="Focus"
            count={focusNodes.length}
          />
        </nav>

        <div className="mt-auto flex flex-col gap-4">
          <NavIcon 
            icon={Trash2} 
            active={activeTab === 'trash'} 
            onClick={() => onTabChange('trash')} 
            label="Trash"
            count={trashNodes.length}
          />
          <NavIcon icon={Settings} active={false} onClick={() => {}} label="Settings" />
        </div>
      </aside>

      {/* Category Sidebar - Secondary */}
      <AnimatePresence>
        {showCategorySidebar && (
          <motion.aside 
            initial={{ width: 0, opacity: 0 }}
            animate={{ width: 260, opacity: 1 }}
            exit={{ width: 0, opacity: 0 }}
            className="border-r border-neutral-200 bg-white flex flex-col shrink-0 z-20 overflow-hidden"
          >
            <div className="p-6 border-b border-neutral-100 flex items-center justify-between">
              <h2 className="font-bold text-neutral-900 flex items-center gap-2">
                {activeTab === 'asset' ? <Library className="w-4 h-4 text-emerald-500" /> : <Target className="w-4 h-4 text-emerald-500" />}
                {activeTab === 'asset' ? 'Categories' : 'Focus Areas'}
              </h2>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
              <div className="space-y-1">
                <CategoryTree 
                  categories={categories} 
                  parentId={null} 
                  selectedId={selectedCategoryId} 
                  onSelect={onCategorySelect} 
                  nodes={activeTab === 'focus' ? nodes.filter(n => n.status === 'focus') : undefined}
                />

                {(activeTab !== 'focus' || nodes.some(n => n.status === 'focus' && !n.categoryId)) && (
                  <button
                    onClick={() => onCategorySelect('uncategorized')}
                    className={cn(
                      "w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors mt-4",
                      selectedCategoryId === 'uncategorized' ? "bg-emerald-50 text-emerald-700" : "text-neutral-400 hover:bg-neutral-50 hover:text-neutral-600"
                    )}
                  >
                    <span className="text-lg opacity-50">📁</span>
                    Uncategorized
                  </button>
                )}
              </div>
            </div>
          </motion.aside>
        )}
      </AnimatePresence>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col relative min-w-0">
        
        {/* Floating Input Bar */}
        <div className="absolute top-6 left-1/2 -translate-x-1/2 z-40 w-full max-w-xl px-4">
          <div 
            className={cn(
              "bg-white/80 backdrop-blur-md border border-neutral-200 shadow-lg rounded-2xl flex items-center px-4 py-2 transition-all duration-300",
              isInputFocused ? "ring-2 ring-emerald-200 border-emerald-400 w-full" : "w-[400px]"
            )}
          >
            <Plus className="w-5 h-5 text-emerald-500 mr-3 shrink-0" />
            <input 
              type="text" 
              placeholder="Paste URL or type a thought..."
              className="flex-1 bg-transparent border-none outline-none text-sm py-1"
              onFocus={() => setIsInputFocused(true)}
              onBlur={() => setIsInputFocused(false)}
              onClick={handlePaste}
            />
            <button 
              onClick={onAddClick}
              className="ml-2 p-1.5 bg-emerald-500 text-white rounded-lg hover:bg-emerald-600 transition-colors"
            >
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Header / Breadcrumbs */}
        <header className="h-20 flex items-end px-8 pb-4 shrink-0">
          <div className="flex items-center gap-2 text-sm text-neutral-400">
            <button 
              className="hover:text-neutral-600 transition-colors" 
              onClick={() => onCategorySelect(null)}
            >
              Library
            </button>
            {selectedCategoryId && (
              <>
                {selectedCategoryId === 'uncategorized' ? (
                  <>
                    <ChevronRight className="w-3 h-3" />
                    <span className="text-neutral-900 font-medium italic">Uncategorized</span>
                  </>
                ) : (
                  (() => {
                    const path: Category[] = [];
                    let currId: string | null = selectedCategoryId;
                    while (currId) {
                      const cat = categories.find(c => c.id === currId);
                      if (cat) {
                        path.unshift(cat);
                        currId = cat.parentId;
                      } else break;
                    }
                    return path.map((cat, i) => (
                      <React.Fragment key={cat.id}>
                        <ChevronRight className="w-3 h-3" />
                        <button
                          onClick={() => onCategorySelect(cat.id)}
                          className={cn(
                            "transition-colors",
                            i === path.length - 1 ? "text-neutral-900 font-medium" : "hover:text-neutral-600"
                          )}
                        >
                          {cat.name}
                        </button>
                      </React.Fragment>
                    ));
                  })()
                )}
              </>
            )}
          </div>
        </header>

        {/* Content Grid */}
        <main className="flex-1 overflow-auto px-8 pb-20">
          {children}
        </main>

        {/* Shredder - Bottom Right */}
        <div className="absolute bottom-8 right-8 z-40">
          <motion.div 
            whileHover={{ scale: 1.1 }}
            className="w-14 h-14 bg-white/50 backdrop-blur-sm border-2 border-dashed border-neutral-300 rounded-2xl flex items-center justify-center text-neutral-400 hover:border-red-400 hover:text-red-500 transition-all cursor-pointer group"
          >
            <Trash2 className="w-6 h-6 group-hover:animate-bounce" />
          </motion.div>
        </div>

        {/* Undo Toast */}
        <AnimatePresence>
          {showUndo && (
            <motion.div 
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              className="absolute bottom-8 left-8 z-50 bg-neutral-900 text-white px-4 py-2 rounded-lg shadow-xl flex items-center gap-4 text-sm"
            >
              <span>Node moved to trash</span>
              <button className="text-emerald-400 font-bold hover:underline">Undo (Ctrl+Z)</button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

interface CategoryTreeProps {
  categories: Category[];
  parentId: string | null;
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  nodes?: KnowledgeNode[];
}

const CategoryTree: React.FC<CategoryTreeProps> = ({ 
  categories, 
  parentId, 
  selectedId, 
  onSelect,
  nodes
}) => {
  const items = categories.filter(c => c.parentId === parentId).sort((a, b) => (a.order ?? 0) - (b.order ?? 0));
  
  // If nodes are provided (Focus view), filter out empty categories
  const filteredItems = nodes ? items.filter(cat => {
    const hasFocusNodes = (catId: string): boolean => {
      if (nodes.some(n => n.categoryId === catId)) return true;
      const children = categories.filter(c => c.parentId === catId);
      return children.some(child => hasFocusNodes(child.id));
    };
    return hasFocusNodes(cat.id);
  }) : items;

  if (filteredItems.length === 0) return null;

  return (
    <div className={cn("space-y-1", parentId !== null && "ml-4 border-l border-neutral-100 pl-2 mt-1")}>
      {filteredItems.map(category => (
        <CategoryItem 
          key={category.id} 
          category={category} 
          categories={categories} 
          selectedId={selectedId} 
          onSelect={onSelect} 
          nodes={nodes}
        />
      ))}
    </div>
  );
};

interface CategoryItemProps {
  category: Category;
  categories: Category[];
  selectedId: string | null;
  onSelect: (id: string | null) => void;
  nodes?: KnowledgeNode[];
}

const CategoryItem: React.FC<CategoryItemProps> = ({ 
  category, 
  categories, 
  selectedId, 
  onSelect,
  nodes
}) => {
  const [isOpen, setIsOpen] = useState(true);
  const hasChildren = categories.some(c => c.parentId === category.id);
  const isActive = selectedId === category.id;

  return (
    <div className="space-y-1">
      <div className="flex items-center group">
        {hasChildren ? (
          <button 
            onClick={() => setIsOpen(!isOpen)}
            className="p-1 text-neutral-400 hover:text-neutral-600 transition-colors"
          >
            <ChevronRight className={cn("w-3 h-3 transition-transform", isOpen && "rotate-90")} />
          </button>
        ) : (
          <div className="w-5" />
        )}
        <button
          onClick={() => onSelect(category.id)}
          className={cn(
            "flex-1 flex items-center gap-2 px-2 py-1.5 rounded-lg text-sm transition-colors",
            isActive 
              ? "bg-emerald-50 text-emerald-700 font-bold" 
              : cn("font-medium", nodes ? "text-neutral-300 hover:text-neutral-500" : "text-neutral-600 hover:bg-neutral-50 hover:text-neutral-900")
          )}
        >
          <span className={cn(isActive ? "opacity-100" : "opacity-50")}>{category.icon}</span>
          <span className="truncate">{category.name}</span>
        </button>
      </div>
      
      {hasChildren && isOpen && (
        <CategoryTree 
          categories={categories} 
          parentId={category.id} 
          selectedId={selectedId} 
          onSelect={onSelect} 
          nodes={nodes}
        />
      )}
    </div>
  );
}

function NavIcon({ icon: Icon, active, onClick, label, count }: { icon: any, active: boolean, onClick: () => void, label: string, count?: number }) {
  return (
    <div className="relative group">
      <button 
        onClick={onClick}
        className={cn(
          "p-3 rounded-xl transition-all duration-200",
          active ? "bg-emerald-50 text-emerald-600 shadow-sm" : "text-neutral-400 hover:bg-neutral-100 hover:text-neutral-600"
        )}
      >
        <Icon className="w-6 h-6" />
      </button>
      {count !== undefined && count > 0 && (
        <span className="absolute -top-1 -right-1 w-5 h-5 bg-emerald-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white">
          {count}
        </span>
      )}
      <div className="absolute left-full ml-2 px-2 py-1 bg-neutral-900 text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none transition-opacity whitespace-nowrap z-50">
        {label}
      </div>
    </div>
  );
}
