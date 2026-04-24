import express from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { initDatabase } from './database';
import routes from './routes';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

const dataDir = path.join(__dirname, '..', 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

app.use('/api', routes);

app.get('/', (req, res) => {
  res.json({
    name: 'PhD Dialectics Capsule API',
    version: '1.0.0',
    endpoints: {
      projects: '/api/projects',
      dialogue: '/api/projects/:id/dialogue',
      tree: '/api/projects/:id/tree',
      attack: '/api/projects/:id/attack',
      defense: '/api/projects/:id/defense',
      'cross-disciplinary': '/api/projects/:id/cross-disciplinary',
    },
  });
});

async function startServer() {
  try {
    await initDatabase();
    console.log('Database initialized successfully');
    
    app.listen(PORT, () => {
      console.log(`PhD Dialectics Capsule API running on http://localhost:${PORT}`);
      console.log(`API documentation available at http://localhost:${PORT}/`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();
