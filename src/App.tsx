/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState, useEffect } from 'react';
import { Layout } from './components/Layout';
import { NodeCard } from './components/NodeCard';
import { InboxView } from './components/InboxView';
import { AssetsView } from './components/AssetsView';
import { FocusView } from './components/FocusView';
import { CaptureModal } from './components/CaptureModal';
import { NodeDetailModal } from './components/NodeDetailModal';
import { EditNodeModal } from './components/EditNodeModal';
import { useStore } from './store';
import { KnowledgeNode } from './types';
import { motion, AnimatePresence } from 'motion/react';
import { Trash2, RotateCcw, X } from 'lucide-react';

export default function App() {
  const [activeTab, setActiveTab] = useState<'inbox' | 'asset' | 'focus' | 'trash'>('asset');
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [isCaptureOpen, setIsCaptureOpen] = useState(false);
  const [selectedNode, setSelectedNode] = useState<KnowledgeNode | null>(null);
  const [editingNode, setEditingNode] = useState<KnowledgeNode | null>(null);
  const [toast, setToast] = useState<{ message: string; nodeId: string; prevStatus: KnowledgeNode['status'] } | null>(null);
  
  const { 
    nodes, 
    categories, 
    addNode, 
    moveNode, 
    updateNode, 
    deleteNode,
    internalizeNode,
    trashNode,
    restoreNode,
    addCategory, 
    updateCategory, 
    deleteCategory, 
    reorderCategories 
  } = useStore();

  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => {
        setToast(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [toast]);

  const handleNodeClick = (node: KnowledgeNode) => {
    setSelectedNode(node);
  };

  const handleEditNode = (node: KnowledgeNode) => {
    setEditingNode(node);
  };

  const handleMoveNode = (id: string, status: KnowledgeNode['status']) => {
    if (status === 'trash') {
      const node = nodes.find(n => n.node_id === id);
      if (node) {
        moveNode(id, 'trash');
        setToast({ message: 'Moved to trash', nodeId: id, prevStatus: node.status });
      }
    } else {
      moveNode(id, status);
    }
  };

  const handleUndoTrash = () => {
    if (toast) {
      moveNode(toast.nodeId, toast.prevStatus);
      setToast(null);
    }
  };

  return (
    <>
      <Layout 
        activeTab={activeTab} 
        onTabChange={setActiveTab}
        onAddClick={() => setIsCaptureOpen(true)}
        categories={categories}
        selectedCategoryId={selectedCategoryId}
        onCategorySelect={setSelectedCategoryId}
        nodes={nodes}
      >
        {activeTab === 'inbox' && (
          <InboxView 
            nodes={nodes} 
            categories={categories}
            onMove={handleMoveNode} 
            onUpdate={updateNode}
            onNodeClick={handleNodeClick} 
            onEditNode={handleEditNode} 
          />
        )}
        {activeTab === 'asset' && <AssetsView 
          nodes={nodes} 
          categories={categories} 
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          onMove={handleMoveNode} 
          onNodeClick={handleNodeClick} 
          onEditNode={handleEditNode}
          onUpdate={updateNode}
          onAddCategory={addCategory}
          onUpdateCategory={updateCategory}
          onDeleteCategory={deleteCategory}
          onReorderCategories={reorderCategories}
        />}
        {activeTab === 'focus' && <FocusView 
          nodes={nodes} 
          categories={categories}
          selectedCategoryId={selectedCategoryId}
          setSelectedCategoryId={setSelectedCategoryId}
          onMove={handleMoveNode} 
          onNodeClick={handleNodeClick} 
          onUpdate={updateNode} 
          onEditNode={handleEditNode} 
        />}
        {activeTab === 'trash' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {nodes.filter(n => n.status === 'trash').map(node => (
              <NodeCard 
                key={node.node_id}
                node={node}
                onClick={() => handleNodeClick(node)}
                onMove={(status) => handleMoveNode(node.node_id, status)}
                onDeletePermanent={() => deleteNode(node.node_id)}
              />
            ))}
          </div>
        )}
      </Layout>

      {/* Undo Toast */}
      <AnimatePresence>
        {toast && (
          <motion.div
            initial={{ opacity: 0, y: 50, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            className="fixed bottom-8 left-1/2 -translate-x-1/2 z-[100] flex items-center gap-4 px-6 py-3 bg-neutral-900 text-white rounded-full shadow-2xl border border-neutral-800"
          >
            <div className="flex items-center gap-2 text-sm font-medium">
              <Trash2 className="w-4 h-4 text-red-400" />
              <span>{toast.message}</span>
            </div>
            <div className="w-px h-4 bg-neutral-700 mx-1" />
            <button
              onClick={handleUndoTrash}
              className="flex items-center gap-1.5 text-xs font-bold text-emerald-400 hover:text-emerald-300 transition-colors uppercase tracking-wider"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              Undo
            </button>
            <button
              onClick={() => setToast(null)}
              className="p-1 hover:bg-neutral-800 rounded-full transition-colors"
            >
              <X className="w-3.5 h-3.5 text-neutral-500" />
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <CaptureModal
        isOpen={isCaptureOpen}
        onClose={() => setIsCaptureOpen(false)}
        onAdd={addNode}
        categories={categories}
        onAddCategory={addCategory}
      />

      <NodeDetailModal
        node={selectedNode}
        allNodes={nodes}
        onClose={() => setSelectedNode(null)}
        onUpdate={updateNode}
        onNodeClick={handleNodeClick}
      />

      <EditNodeModal
        node={editingNode}
        categories={categories}
        isOpen={!!editingNode}
        onClose={() => setEditingNode(null)}
        onSave={(id, updates) => {
          updateNode(id, updates);
          setEditingNode(null);
        }}
        onMove={moveNode}
        onAddCategory={addCategory}
      />
    </>
  );
}


