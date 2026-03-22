import { useState, useEffect } from 'react';
import { KnowledgeNode, Category } from './types';
import { v4 as uuidv4 } from 'uuid';

const STORAGE_KEY = 'seedling_nodes';
const CATEGORIES_KEY = 'seedling_categories';

const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Work', icon: '💼', color: '#3b82f6', parentId: null },
  { id: 'cat-2', name: 'Personal', icon: '🏠', color: '#10b981', parentId: null },
  { id: 'cat-3', name: 'Learning', icon: '📚', color: '#8b5cf6', parentId: null },
];

export function useStore() {
  const [nodes, setNodes] = useState<KnowledgeNode[]>(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return [];
      }
    }
    return [];
  });

  const [categories, setCategories] = useState<Category[]>(() => {
    const saved = localStorage.getItem(CATEGORIES_KEY);
    if (saved) {
      try {
        return JSON.parse(saved);
      } catch (e) {
        return DEFAULT_CATEGORIES;
      }
    }
    return DEFAULT_CATEGORIES;
  });

  useEffect(() => {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(nodes));
  }, [nodes]);

  useEffect(() => {
    localStorage.setItem(CATEGORIES_KEY, JSON.stringify(categories));
  }, [categories]);

  const addNode = (node: Omit<KnowledgeNode, 'node_id' | 'created_at' | 'updated_at'>) => {
    const newNode: KnowledgeNode = {
      ...node,
      node_id: uuidv4(),
      created_at: Date.now(),
      updated_at: Date.now(),
    };
    setNodes(prev => [newNode, ...prev]);
    return newNode;
  };

  const updateNode = (id: string, updates: Partial<KnowledgeNode>) => {
    setNodes(prev => prev.map(n => n.node_id === id ? { ...n, ...updates, updated_at: Date.now() } : n));
  };

  const deleteNode = (id: string) => {
    setNodes(prev => prev.filter(n => n.node_id !== id));
  };

  const moveNode = (id: string, newStatus: KnowledgeNode['status'], categoryId?: string) => {
    updateNode(id, { 
      status: newStatus, 
      ...(categoryId ? { categoryId } : {}),
      ...(newStatus === 'trash' ? { deletedAt: Date.now() } : { deletedAt: undefined })
    });
  };

  const internalizeNode = (id: string) => {
    updateNode(id, { status: 'asset', isInternalized: true });
  };

  const trashNode = (id: string) => {
    moveNode(id, 'trash');
  };

  const restoreNode = (id: string) => {
    moveNode(id, 'asset');
  };

  // Auto-delete trash after 30 days
  useEffect(() => {
    const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;
    const now = Date.now();
    const nodesToKeep = nodes.filter(n => {
      if (n.status === 'trash' && n.deletedAt) {
        return now - n.deletedAt < THIRTY_DAYS;
      }
      return true;
    });
    if (nodesToKeep.length !== nodes.length) {
      setNodes(nodesToKeep);
    }
  }, [nodes]);

  const addCategory = (category: Omit<Category, 'id'>) => {
    const newCategory = { ...category, id: uuidv4() };
    setCategories(prev => [...prev, newCategory]);
    return newCategory;
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    setCategories(prev => prev.map(c => c.id === id ? { ...c, ...updates } : c));
  };

  const deleteCategory = (id: string) => {
    // Find all subcategories recursively
    const getSubcategoryIds = (parentId: string, cats: Category[]): string[] => {
      const children = cats.filter(c => c.parentId === parentId).map(c => c.id);
      return [...children, ...children.flatMap(childId => getSubcategoryIds(childId, cats))];
    };
    
    const idsToDelete = new Set([id, ...getSubcategoryIds(id, categories)]);
    
    // Update nodes to remove categoryId if it's in idsToDelete
    setNodes(prev => 
      prev.map(n => n.categoryId && idsToDelete.has(n.categoryId) ? { ...n, categoryId: undefined } : n)
    );

    setCategories(prev => prev.filter(c => !idsToDelete.has(c.id)));
  };

  const reorderCategories = (categoryIds: string[]) => {
    setCategories(prev => {
      const newCategories = [...prev];
      categoryIds.forEach((id, index) => {
        const cat = newCategories.find(c => c.id === id);
        if (cat) cat.order = index;
      });
      return newCategories;
    });
  };

  return { 
    nodes, 
    categories, 
    addNode, 
    updateNode, 
    deleteNode, 
    moveNode,
    internalizeNode,
    trashNode,
    restoreNode,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories
  };
}
