import cors from 'cors';
import express from 'express';
import { getDb } from './db.js';
import { handleGetData, handleHealth, handlePutData } from './handlers.js';

const PORT = Number(process.env.PORT) || 3001;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', async (_req, res) => {
  try {
    res.json(await handleHealth());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

app.get('/api/data', async (_req, res) => {
  try {
    getDb();
    res.json(await handleGetData());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '데이터를 불러오지 못했습니다.' });
  }
});

app.put('/api/data', async (req, res) => {
  try {
    await handlePutData(req.body);
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === 'INVALID_DATA') {
      res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
      return;
    }
    console.error(e);
    res.status(500).json({ error: '저장에 실패했습니다.' });
  }
});

app.listen(PORT, () => {
  getDb();
  console.log(`API server http://localhost:${PORT}`);
});
