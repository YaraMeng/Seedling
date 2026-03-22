export type NodeStatus = 'inbox' | 'asset' | 'focus' | 'trash' | 'deleted';
export type NodeType = 'url' | 'pdf' | 'image' | 'text';

export interface Visual {
  primary_color: string;
  icon: string;
}

export interface Content {
  title: string;
  ai_summary: string[];
  user_notes: string;
  raw_input?: string;
  content_type?: string;
  connection_logic?: string;
  file?: {
    mimeType: string;
    data: string;
    name: string;
  };
}

export interface Link {
  target: string;
  label: string;
}

export interface KnowledgeNode {
  node_id: string;
  status: NodeStatus;
  type: NodeType;
  visual: Visual;
  tags: string[]; // Replaced hierarchy with tags
  categoryId?: string;
  content: Content;
  links: Link[];
  created_at: number;
  updated_at: number;
  isInternalized?: boolean;
  deletedAt?: number;
  deleted_at?: Date; // Added for backend compatibility
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  parentId: string | null;
  order?: number;
}
