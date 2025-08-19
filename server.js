import dotenv from 'dotenv';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import handler from './pages/api/initiate-call.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables from .env (if present) and env.local as a fallback
dotenv.config();
dotenv.config({ path: path.join(__dirname, 'env.local') });

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Serve the static index.html at root
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Mount the existing API route
app.options('/api/initiate-call', (req, res) => handler(req, res));
app.post('/api/initiate-call', (req, res) => handler(req, res));

app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});


