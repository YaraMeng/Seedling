import { KnowledgeNode, Category } from '../types';
import { InboxCard } from './InboxCard';
import { motion, AnimatePresence } from 'motion/react';
import { Inbox as InboxIcon } from 'lucide-react';

interface InboxProps {
  nodes: KnowledgeNode[];
  categories: Category[];
  onMove: (id: string, status: KnowledgeNode['status']) => void;
  onUpdate: (id: string, updates: Partial<KnowledgeNode>) => void;
  onNodeClick: (node: KnowledgeNode) => void;
  onEditNode: (node: KnowledgeNode) => void;
}

export function InboxView({ nodes, categories, onMove, onUpdate, onNodeClick, onEditNode }: InboxProps) {
  const inboxNodes = nodes.filter(n => n.status === 'inbox');

  if (inboxNodes.length === 0) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-neutral-400">
        <InboxIcon className="w-16 h-16 mb-4 opacity-50" />
        <h2 className="text-xl font-medium text-neutral-600">Inbox is empty</h2>
        <p className="text-sm mt-2">Capture new ideas to see them here.</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6 flex items-center justify-between">
        <div className="flex flex-col">
          <h2 className="text-2xl font-semibold tracking-tight text-neutral-900">Unprocessed ({inboxNodes.length})</h2>
          <p className="text-sm text-neutral-500">Review and organize your captured knowledge.</p>
        </div>
        <div className="hidden md:flex items-center gap-2 px-3 py-1.5 bg-neutral-100 rounded-lg border border-neutral-200 text-[10px] font-bold text-neutral-400 uppercase tracking-widest">
          <span className="px-1.5 py-0.5 bg-white border border-neutral-300 rounded shadow-sm text-neutral-600">Enter</span>
          Confirm & Archive
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <AnimatePresence mode="popLayout">
          {inboxNodes.map(node => (
            <InboxCard
              key={node.node_id}
              node={node}
              categories={categories}
              onUpdate={onUpdate}
              onArchive={(id) => onMove(id, 'asset')}
              onNodeClick={onNodeClick}
            />
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
