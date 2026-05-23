import cors from 'cors';
import express from 'express';
import {
  AuthError,
  handleAuthChangePassword,
  handleAuthLogin,
  handleAuthSession,
} from './authHandlers.js';
import { getDb } from './db.js';
import { handleGetData, handleHealth, handlePutData } from './handlers.js';
import { buildClearSessionCookie, buildSessionCookie } from './session.js';

const PORT = Number(process.env.PORT) || 3001;
const app = express();

app.use(
  cors({
    origin: true,
    credentials: true,
  }),
);
app.use(express.json({ limit: '10mb' }));

function getCookieHeader(req: express.Request): string | undefined {
  return req.headers.cookie;
}

app.get('/api/health', async (_req, res) => {
  try {
    res.json(await handleHealth());
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '서버 오류가 발생했습니다.' });
  }
});

app.get('/api/auth/session', async (req, res) => {
  try {
    res.json(await handleAuthSession(getCookieHeader(req)));
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    await handleAuthLogin(req.body?.password);
    res.setHeader('Set-Cookie', buildSessionCookie());
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      res.status(401).json({ error: e.message });
      return;
    }
    console.error(e);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
});

app.post('/api/auth/logout', (_req, res) => {
  res.setHeader('Set-Cookie', buildClearSessionCookie());
  res.json({ ok: true });
});

app.put('/api/auth/password', async (req, res) => {
  try {
    await handleAuthChangePassword(getCookieHeader(req), req.body);
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof AuthError) {
      const status = e.code === 'WEAK_PASSWORD' || e.code === 'SAME_PASSWORD' ? 400 : 401;
      res.status(status).json({ error: e.message });
      return;
    }
    console.error(e);
    res.status(500).json({ error: '인증 처리 중 오류가 발생했습니다.' });
  }
});

app.get('/api/data', async (req, res) => {
  try {
    getDb();
    res.json(await handleGetData(getCookieHeader(req)));
  } catch (e) {
    if (e instanceof AuthError) {
      res.status(401).json({ error: e.message });
      return;
    }
    console.error(e);
    res.status(500).json({ error: '데이터를 불러오지 못했습니다.' });
  }
});

app.put('/api/data', async (req, res) => {
  try {
    await handlePutData(getCookieHeader(req), req.body);
    res.json({ ok: true });
  } catch (e) {
    if (e instanceof Error && e.message === 'INVALID_DATA') {
      res.status(400).json({ error: '잘못된 데이터 형식입니다.' });
      return;
    }
    if (e instanceof AuthError) {
      res.status(401).json({ error: e.message });
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
