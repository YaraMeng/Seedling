import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Loader2, Sparkles, Link as LinkIcon, FileText, Image as ImageIcon, PenTool, UploadCloud } from 'lucide-react';
import { processInput } from '../services/ai';
import { KnowledgeNode, Category } from '../types';

interface CaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (node: Omit<KnowledgeNode, 'node_id' | 'created_at' | 'updated_at'>) => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => Category;
}

export function CaptureModal({ isOpen, onClose, onAdd, categories, onAddCategory }: CaptureModalProps) {
  const [input, setInput] = useState('');
  const [noteTitle, setNoteTitle] = useState('');
  const [file, setFile] = useState<{ mimeType: string, data: string, name: string } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [type, setType] = useState<KnowledgeNode['type']>('text');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64String = (event.target?.result as string).split(',')[1];
      setFile({
        mimeType: selectedFile.type,
        data: base64String,
        name: selectedFile.name,
      });
    };
    reader.readAsDataURL(selectedFile);
  };

  const handleCapture = async () => {
    if (!input.trim() && !noteTitle.trim() && !file) return;
    
    setIsProcessing(true);
    try {
      const textToProcess = isNoteMode && noteTitle ? `${noteTitle}\n\n${input}` : input;
      const result = await processInput({ text: textToProcess, file: file ? { mimeType: file.mimeType, data: file.data } : undefined });
      
      if (result) {
        let categoryId: string | undefined;
        
        if (result.category_suggestion?.path?.length > 0) {
          const path = result.category_suggestion.path;
          let currentParentId: string | null = null;
          let lastFoundCat: Category | undefined;

          for (const segment of path) {
            const found = categories.find(c => 
              c.name.toLowerCase() === segment.toLowerCase() && 
              c.parentId === currentParentId
            );
            if (found) {
              lastFoundCat = found;
              currentParentId = found.id;
            } else {
              // If not found, we stop searching for deeper levels
              break;
            }
          }
          categoryId = lastFoundCat?.id;
        }

        onAdd({
          status: 'inbox',
          type,
          visual: {
            primary_color: '#10b981', // Default color
            icon: '📝', // Default icon
          },
          tags: result.tags || [],
          categoryId,
          content: {
            title: result.title || (isNoteMode && noteTitle ? noteTitle : (file ? file.name : 'Untitled Knowledge')),
            ai_summary: result.ai_summary || ['No summary available.'],
            user_notes: '',
            raw_input: input || (file ? `[File: ${file.name}]` : ''),
            content_type: result.content_type,
            connection_logic: result.connection_logic,
            file: file ? { mimeType: file.mimeType, data: file.data, name: file.name } : undefined,
          },
          links: [],
        });
        resetAndClose();
      }
    } catch (error) {
      console.error('Failed to process input:', error);
      // Fallback if AI fails
      onAdd({
        status: 'inbox',
        type,
        visual: { primary_color: '#94a3b8', icon: '📝' },
        tags: [],
        content: {
          title: isNoteMode && noteTitle ? noteTitle : (file ? file.name : 'Captured Note'),
          ai_summary: [input.slice(0, 100) + '...'],
          user_notes: '',
          raw_input: input || (file ? `[File: ${file.name}]` : ''),
          file: file ? { mimeType: file.mimeType, data: file.data, name: file.name } : undefined,
        },
        links: [],
      });
      resetAndClose();
    } finally {
      setIsProcessing(false);
    }
  };

  const resetAndClose = () => {
    setInput('');
    setNoteTitle('');
    setFile(null);
    setIsProcessing(false);
    onClose();
  };

  // If type is 'text' (Note), we render a full-screen-like editor
  const isNoteMode = type === 'text';

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 backdrop-blur-sm z-40"
            onClick={resetAndClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            className={`fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-white shadow-2xl z-50 overflow-hidden flex flex-col transition-all duration-300 ${
              isNoteMode ? 'w-[90vw] h-[90vh] rounded-xl' : 'w-full max-w-lg rounded-2xl'
            }`}
          >
            <div className="p-4 border-b border-neutral-100 flex items-center justify-between bg-neutral-50/50">
              <div className="flex items-center gap-2">
                <Sparkles className="w-5 h-5 text-emerald-500" />
                <h2 className="text-lg font-semibold text-neutral-800">
                  {isNoteMode ? 'New Note' : 'Smart Capture'}
                </h2>
              </div>
              
              {!isNoteMode && (
                <div className="flex gap-1 bg-neutral-100 p-1 rounded-lg">
                  {(['text', 'url', 'pdf', 'image'] as const).map(t => (
                    <button
                      key={t}
                      onClick={() => { setType(t); setFile(null); setInput(''); }}
                      className={`px-3 py-1.5 rounded-md text-xs font-medium flex items-center gap-1.5 transition-all ${
                        type === t 
                          ? 'bg-white shadow-sm text-emerald-700' 
                          : 'text-neutral-500 hover:text-neutral-700'
                      }`}
                    >
                      {t === 'text' && <PenTool className="w-3.5 h-3.5" />}
                      {t === 'url' && <LinkIcon className="w-3.5 h-3.5" />}
                      {t === 'pdf' && <FileText className="w-3.5 h-3.5" />}
                      {t === 'image' && <ImageIcon className="w-3.5 h-3.5" />}
                      <span className="capitalize">{t === 'text' ? 'Note' : t}</span>
                    </button>
                  ))}
                </div>
              )}

              <div className="flex items-center gap-2">
                {isNoteMode && (
                  <button
                    onClick={() => setType('url')} // Switch back to normal capture mode
                    className="text-xs font-medium text-neutral-500 hover:text-neutral-700 px-3 py-1.5 rounded-md hover:bg-neutral-100 transition-colors"
                  >
                    Switch to File/URL
                  </button>
                )}
                <button onClick={resetAndClose} className="p-1.5 hover:bg-neutral-200 rounded-full transition-colors">
                  <X className="w-4 h-4 text-neutral-500" />
                </button>
              </div>
            </div>

            <div className={`flex-1 flex flex-col ${isNoteMode ? '' : 'p-6'}`}>
              {isNoteMode ? (
                <div className="flex-1 flex flex-col p-8 md:p-12 max-w-4xl mx-auto w-full">
                  <input
                    type="text"
                    value={noteTitle}
                    onChange={(e) => setNoteTitle(e.target.value)}
                    placeholder="Untitled Note"
                    className="text-4xl font-bold text-neutral-900 placeholder:text-neutral-300 border-none outline-none bg-transparent mb-6"
                    autoFocus
                  />
                  <textarea
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Start typing your thoughts here..."
                    className="flex-1 w-full text-lg text-neutral-700 placeholder:text-neutral-300 border-none outline-none bg-transparent resize-none leading-relaxed"
                  />
                </div>
              ) : type === 'url' ? (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-700">Paste URL</label>
                  <input
                    type="url"
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="https://..."
                    className="w-full p-4 bg-neutral-50 border border-neutral-200 rounded-xl focus:ring-2 focus:ring-emerald-200 focus:border-emerald-500 outline-none transition-all text-neutral-800"
                    autoFocus
                  />
                </div>
              ) : (
                <div className="space-y-4">
                  <label className="block text-sm font-medium text-neutral-700">
                    Upload {type === 'pdf' ? 'PDF Document' : 'Image'}
                  </label>
                  <div 
                    onClick={() => fileInputRef.current?.click()}
                    className="w-full h-40 border-2 border-dashed border-neutral-200 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-neutral-50 hover:border-emerald-300 transition-all group"
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept={type === 'pdf' ? '.pdf' : 'image/*'}
                      onChange={handleFileChange}
                    />
                    <div className="w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center text-emerald-500 group-hover:scale-110 transition-transform">
                      <UploadCloud className="w-6 h-6" />
                    </div>
                    <div className="text-center">
                      <p className="text-sm font-medium text-neutral-700">
                        {file ? file.name : 'Click to browse or drag file here'}
                      </p>
                      <p className="text-xs text-neutral-400 mt-1">
                        {type === 'pdf' ? 'PDF up to 10MB' : 'PNG, JPG up to 5MB'}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <div className={`mt-auto pt-6 ${isNoteMode ? 'p-6 border-t border-neutral-100 bg-white' : ''}`}>
                <button
                  onClick={handleCapture}
                  disabled={(!input.trim() && !noteTitle.trim() && !file) || isProcessing}
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-300 text-white rounded-xl font-medium flex items-center justify-center gap-2 transition-colors shadow-sm"
                >
                  {isProcessing ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin" />
                      AI is processing...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-5 h-5" />
                      {isNoteMode ? 'Save & Analyze Note' : 'Capture & Analyze'}
                    </>
                  )}
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
