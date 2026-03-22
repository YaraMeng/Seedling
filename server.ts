import express from 'express';
import mongoose from 'mongoose';
import cors from 'cors';
import path from 'path';
import { createServer as createViteServer } from 'vite';

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// MongoDB Connection (Placeholder - User should provide real URI)
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/seedling';

// Schema Definition
const KnowledgeNodeSchema = new mongoose.Schema({
  node_id: { type: String, required: true, unique: true },
  status: { type: String, enum: ['inbox', 'asset', 'focus', 'trash', 'deleted'], required: true },
  type: { type: String, required: true },
  visual: {
    primary_color: String,
    icon: String,
  },
  tags: [String],
  categoryId: String,
  content: {
    title: String,
    ai_summary: [String],
    user_notes: String,
    raw_input: String,
    content_type: String,
    connection_logic: String,
    file: {
      mimeType: String,
      data: String,
      name: String,
    },
  },
  links: [{
    target: String,
    label: String,
  }],
  created_at: { type: Number, default: Date.now },
  updated_at: { type: Number, default: Date.now },
  isInternalized: Boolean,
  deleted_at: { type: Date }, // Field for trash bin logic
});

// TTL Index for 30-day automatic deletion
// This index will automatically remove documents where status is 'deleted' after 30 days
// Note: TTL index works on Date fields. We use 'deleted_at'.
// To enable this, run the following command in MongoDB shell:
// db.knowledgenodes.createIndex({ "deleted_at": 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 })
// In Mongoose, we can define it like this:
KnowledgeNodeSchema.index({ deleted_at: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

const KnowledgeNodeModel = mongoose.model('KnowledgeNode', KnowledgeNodeSchema);

// API Routes

// 1. Move to Trash
app.post('/api/nodes/:id/trash', async (req, res) => {
  try {
    const { id } = req.params;
    const node = await KnowledgeNodeModel.findOneAndUpdate(
      { node_id: id },
      { 
        status: 'deleted', 
        deleted_at: new Date(),
        updated_at: Date.now()
      },
      { new: true }
    );
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 2. Restore from Trash
app.post('/api/nodes/:id/restore', async (req, res) => {
  try {
    const { id } = req.params;
    const node = await KnowledgeNodeModel.findOneAndUpdate(
      { node_id: id },
      { 
        status: 'asset', // Restore to 'asset' (or 'archived' as per user request)
        $unset: { deleted_at: 1 },
        updated_at: Date.now()
      },
      { new: true }
    );
    if (!node) return res.status(404).json({ error: 'Node not found' });
    res.json(node);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 3. Normal Query Interface (Security: Filter out 'deleted' status)
app.get('/api/nodes', async (req, res) => {
  try {
    // Automatically filter out 'deleted' nodes
    const nodes = await KnowledgeNodeModel.find({ status: { $ne: 'deleted' } });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// 4. Trash Bin Query (Optional, for viewing trash)
app.get('/api/nodes/trash', async (req, res) => {
  try {
    const nodes = await KnowledgeNodeModel.find({ status: 'deleted' });
    res.json(nodes);
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Vite middleware for development
async function startServer() {
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), 'dist');
    app.use(express.static(distPath));
    app.get('*', (req, res) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
