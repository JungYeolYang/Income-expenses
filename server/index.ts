import cors from 'cors';
import express from 'express';
import { getDb, loadAppData, persistAppData } from './db.js';
import type { AppData } from '../src/types.js';

const PORT = Number(process.env.PORT) || 3001;
const app = express();

app.use(cors());
app.use(express.json({ limit: '10mb' }));

app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

app.get('/api/data', (_req, res) => {
  try {
    getDb();
    res.json(loadAppData());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '데이터를 불러오지 못했습니다.' });
  }
});

app.put('/api/data', (req, res) => {
  try {
    const data = req.body as AppData;
    if (!data?.accounts?.income || !data.weeklyAmounts) {
      res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
      return;
    }
    persistAppData({
      version: data.version ?? 1,
      accounts: data.accounts,
      weeklyAmounts: data.weeklyAmounts ?? {},
      expenseMemos: data.expenseMemos ?? {},
      annualBudgets: data.annualBudgets ?? {},
    });
    res.json({ ok: true });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '저장에 실패했습니다.' });
  }
});

app.listen(PORT, () => {
  getDb();
  console.log(`API server http://localhost:${PORT}`);
});
