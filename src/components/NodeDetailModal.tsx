import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Network, FileText, Sparkles, Brain, Info, Link as LinkIcon, Loader2, ArrowRight } from 'lucide-react';
import { KnowledgeNode } from '../types';
import { findLogicalConnections } from '../services/ai';

interface NodeDetailModalProps {
  node: KnowledgeNode | null;
  allNodes: KnowledgeNode[];
  onClose: () => void;
  onUpdate?: (id: string, updates: Partial<KnowledgeNode>) => void;
  onNodeClick?: (node: KnowledgeNode) => void;
}

interface Connection {
  target_id: string;
  relation_type: string;
  reason: string;
}

export function NodeDetailModal({ node, allNodes, onClose, onUpdate, onNodeClick }: NodeDetailModalProps) {
  const [connections, setConnections] = useState<Connection[]>([]);
  const [isLoadingConnections, setIsLoadingConnections] = useState(false);

  useEffect(() => {
    if (node && allNodes.length > 1) {
      const fetchConnections = async () => {
        setIsLoadingConnections(true);
        try {
          const libraryIndex = allNodes
            .filter(n => n.node_id !== node.node_id)
            .map(n => ({ id: n.node_id, title: n.content.title }));
          
          const result = await findLogicalConnections(
            { title: node.content.title, tags: node.tags },
            libraryIndex
          );
          setConnections(result);
        } catch (error) {
          console.error('Failed to fetch connections:', error);
        } finally {
          setIsLoadingConnections(false);
        }
      };
      fetchConnections();
    } else {
      setConnections([]);
    }
  }, [node, allNodes]);

  if (!node) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40 flex items-center justify-center p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="w-full max-w-3xl max-h-[85vh] bg-white rounded-2xl shadow-2xl z-50 overflow-hidden flex flex-col"
          onClick={e => e.stopPropagation()}
        >
          <div 
            className="p-6 border-b border-neutral-100 flex items-start justify-between relative overflow-hidden"
            style={{ backgroundColor: `${node.visual.primary_color}10` }}
          >
            <div className="absolute top-0 left-0 w-1 h-full" style={{ backgroundColor: node.visual.primary_color }} />
            <div className="flex items-start gap-4 z-10">
              <span className="text-4xl" role="img" aria-label="icon">{node.visual.icon}</span>
              <div className="flex-1">
                <div className="flex items-center gap-2 text-sm font-mono mb-1" style={{ color: node.visual.primary_color }}>
                  {node.content.content_type && (
                    <span className="px-2 py-0.5 bg-white/80 rounded-md border border-neutral-100 uppercase text-[10px] font-bold">
                      {node.content.content_type}
                    </span>
                  )}
                  {node.tags ? node.tags.join(', ') : 'Untagged'}
                </div>
                <h2 className="text-2xl font-bold text-neutral-900 leading-tight">{node.content.title}</h2>
              </div>
            </div>
            <button onClick={onClose} className="p-2 hover:bg-white/50 rounded-full transition-colors z-10">
              <X className="w-5 h-5 text-neutral-500" />
            </button>
          </div>

          <div className="flex-1 overflow-auto p-6 flex flex-col gap-8">
            {/* AI Summary Section */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Sparkles className="w-4 h-4 text-emerald-500" />
                AI Key Takeaways
              </h3>
              <div className="grid gap-3">
                {node.content.ai_summary.map((point, i) => (
                  <div key={i} className="bg-neutral-50 p-4 rounded-xl border border-neutral-100 flex items-start gap-3">
                    <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center text-xs font-bold shrink-0 mt-0.5">
                      {i + 1}
                    </div>
                    <p className="text-neutral-700 leading-relaxed">{point}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Connection Logic Section */}
            {node.content.connection_logic && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <Brain className="w-4 h-4 text-indigo-500" />
                  Connection Logic
                </h3>
                <div className="bg-indigo-50/30 p-5 rounded-xl border border-indigo-100/50 text-neutral-700 leading-relaxed italic">
                  {node.content.connection_logic}
                </div>
              </section>
            )}

            {/* Logical Connections Section */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Network className="w-4 h-4 text-indigo-500" />
                Logical Connections
              </h3>
              {isLoadingConnections ? (
                <div className="flex items-center gap-2 text-neutral-400 text-sm italic p-4">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Analyzing knowledge graph...
                </div>
              ) : connections.length > 0 ? (
                <div className="grid gap-3">
                  {connections.map((conn, i) => {
                    const targetNode = allNodes.find(n => n.node_id === conn.target_id);
                    if (!targetNode) return null;
                    return (
                      <button
                        key={i}
                        onClick={() => onNodeClick?.(targetNode)}
                        className="w-full text-left bg-white border border-neutral-100 p-4 rounded-xl hover:border-indigo-200 hover:shadow-md transition-all group"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            <span className="text-lg">{targetNode.visual.icon}</span>
                            <span className="text-xs font-bold uppercase tracking-widest text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                              {conn.relation_type}
                            </span>
                          </div>
                          <ArrowRight className="w-4 h-4 text-neutral-300 group-hover:text-indigo-500 transition-colors" />
                        </div>
                        <h4 className="font-semibold text-neutral-900 mb-1">{targetNode.content.title}</h4>
                        <p className="text-xs text-neutral-500 leading-relaxed">{conn.reason}</p>
                      </button>
                    );
                  })}
                </div>
              ) : (
                <div className="bg-neutral-50 p-6 rounded-xl border border-neutral-100 border-dashed text-center">
                  <Network className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500">No logical connections found yet.</p>
                  <p className="text-xs text-neutral-400 mt-1">Add more nodes to build your knowledge network.</p>
                </div>
              )}
            </section>

            {/* File Content Section */}
            {node.content.file && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-blue-500" />
                  Original File: {node.content.file.name}
                </h3>
                <div className="bg-neutral-50 p-2 rounded-xl border border-neutral-100 overflow-hidden flex justify-center">
                  {node.content.file.mimeType.startsWith('image/') ? (
                    <img 
                      src={node.content.file.data} 
                      alt={node.content.file.name} 
                      className="max-w-full max-h-[60vh] object-contain rounded-lg"
                    />
                  ) : node.content.file.mimeType === 'application/pdf' ? (
                    <object 
                      data={node.content.file.data} 
                      type="application/pdf" 
                      className="w-full h-[60vh] rounded-lg"
                    >
                      <p className="p-4 text-center text-neutral-500">
                        Unable to display PDF directly. <a href={node.content.file.data} download={node.content.file.name} className="text-blue-500 hover:underline">Download</a> instead.
                      </p>
                    </object>
                  ) : (
                    <div className="p-8 text-center text-neutral-500">
                      <FileText className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>Preview not available for this file type.</p>
                      <a href={node.content.file.data} download={node.content.file.name} className="text-blue-500 hover:underline mt-2 inline-block">Download File</a>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Raw Content Section */}
            {node.content.raw_input && !node.content.file && (
              <section>
                <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                  <FileText className="w-4 h-4 text-neutral-500" />
                  Original Content
                </h3>
                <div className="bg-neutral-50 p-5 rounded-xl border border-neutral-100 text-sm text-neutral-600 whitespace-pre-wrap font-mono leading-relaxed max-h-64 overflow-y-auto">
                  {node.content.raw_input}
                </div>
              </section>
            )}

            {/* User Notes Section */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <FileText className="w-4 h-4 text-amber-500" />
                My Notes
              </h3>
              <div className="bg-amber-50/50 p-5 rounded-xl border border-amber-100">
                <textarea 
                  className="w-full bg-transparent border-none outline-none resize-none text-neutral-700 text-sm leading-relaxed min-h-[100px]"
                  placeholder="Add your personal notes, reflections, or action items here..."
                  defaultValue={node.content.user_notes}
                  onBlur={(e) => {
                    if (onUpdate) {
                      onUpdate(node.node_id, {
                        content: { ...node.content, user_notes: e.target.value }
                      });
                    }
                  }}
                />
              </div>
            </section>

            {/* Dynamic Graph Placeholder */}
            <section>
              <h3 className="text-sm font-semibold text-neutral-900 uppercase tracking-wider flex items-center gap-2 mb-4">
                <Network className="w-4 h-4 text-indigo-500" />
                Knowledge Graph
              </h3>
              <div className="h-48 bg-neutral-50 rounded-xl border border-neutral-100 border-dashed flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 opacity-10" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, black 1px, transparent 0)', backgroundSize: '20px 20px' }} />
                <div className="text-center z-10">
                  <Network className="w-8 h-8 text-neutral-300 mx-auto mb-2" />
                  <p className="text-sm text-neutral-500 font-medium">Graph visualization coming soon</p>
                  <p className="text-xs text-neutral-400 mt-1">Connect this node to others to build your network.</p>
                </div>
              </div>
            </section>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
