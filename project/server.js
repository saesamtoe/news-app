import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT || 3000;

// 정적 파일 경로 설정
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
app.use(express.static(path.join(__dirname, 'public')));

app.use(cors());

const NEWS_API_KEY = '7d6840b23d1b4610828c6eeff820c1b6'; // 실제 API 키로 대체하세요

app.get('/news', async (req, res) => {
  const q = req.query.q || '한국';
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(q)}&language=ko&pageSize=10&apiKey=${NEWS_API_KEY}`;
  
  try {
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '프록시 서버 오류', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`✅ 서버 실행됨: http://localhost:${PORT}`);
});
