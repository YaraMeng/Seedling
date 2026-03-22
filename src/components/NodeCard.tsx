import React from 'react';
import { KnowledgeNode } from '../types';
import { Settings, ExternalLink } from 'lucide-react';
import { SeedCard } from './SeedCard';

interface NodeCardProps {
  key?: string | number;
  node: KnowledgeNode;
  onClick?: () => void;
  onEdit?: () => void;
  onMove?: (status: KnowledgeNode['status']) => void;
  onDeletePermanent?: () => void;
  className?: string;
  viewMode?: 'grid' | 'list';
}

export function NodeCard({ node, onClick, onEdit, onMove, onDeletePermanent, className, viewMode }: NodeCardProps) {
  const handleViewSource = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (node.content.file) {
      const { data, mimeType } = node.content.file;
      const byteCharacters = atob(data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], {type: mimeType});
      const url = URL.createObjectURL(blob);
      window.open(url, '_blank');
    } else if (node.type === 'url' && node.content.raw_input) {
      window.open(node.content.raw_input, '_blank');
    }
  };

  const hasSource = !!node.content.file || (node.type === 'url' && !!node.content.raw_input);

  const sourceTypeMap: Record<string, 'link' | 'pdf' | 'note' | 'image'> = {
    url: 'link',
    pdf: 'pdf',
    text: 'note',
    image: 'image',
  };

  const handleFocusToggle = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.(node.status === 'focus' ? 'asset' : 'focus');
  };

  const handleDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.('trash');
  };

  const handleInternalize = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.('asset'); 
  };

  const handleRestore = (e: React.MouseEvent) => {
    e.stopPropagation();
    onMove?.('asset');
  };

  const handlePermanentDelete = (e: React.MouseEvent) => {
    e.stopPropagation();
    onDeletePermanent?.();
  };

  return (
    <div className="relative group h-full">
      <SeedCard
        title={node.content.title}
        summary={node.content.ai_summary}
        tags={node.tags || []}
        sourceType={sourceTypeMap[node.type] || 'note'}
        status={node.status}
        themeColor={node.visual.primary_color}
        icon={node.visual.icon}
        isInternalized={node.isInternalized}
        onClick={onClick}
        onFocusToggle={handleFocusToggle}
        onInternalize={handleInternalize}
        onDelete={handleDelete}
        onRestore={handleRestore}
        onPermanentDelete={handlePermanentDelete}
        className={className}
        viewMode={viewMode}
        createdAt={node.created_at}
      />

      {/* Secondary Action Buttons (Settings/Source) - Top Left in Grid Mode */}
      {viewMode === 'grid' && (
        <div className="absolute top-3 left-3 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
          {hasSource && (
            <button
              onClick={handleViewSource}
              className="p-1.5 text-neutral-400 hover:text-blue-600 hover:bg-blue-50 rounded-full transition-colors bg-white/60 backdrop-blur-sm border border-neutral-100/50 shadow-sm"
              title="View Source"
            >
              <ExternalLink className="w-3.5 h-3.5" />
            </button>
          )}
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(); }}
              className="p-1.5 text-neutral-400 hover:text-emerald-600 hover:bg-emerald-50 rounded-full transition-colors bg-white/60 backdrop-blur-sm border border-neutral-100/50 shadow-sm"
              title="Edit"
            >
              <Settings className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}
    </div>
  );
}
