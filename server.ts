import 'dotenv/config';
import express from 'express';
import chatHandler from './api/chat';
import generateHandler from './api/generate';
import importHandler from './api/import';

const app = express();
app.use(express.json({ limit: '10mb' }));

app.post('/api/chat', chatHandler);
app.post('/api/generate', generateHandler);
app.post('/api/import', importHandler);

const PORT = 3002;
app.listen(PORT, () => console.log(`API locale sur http://localhost:${PORT}`));
