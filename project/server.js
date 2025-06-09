// server.js (신뢰도 평가 프롬프트 개선 버전)
import express from 'express';
import fetch from 'node-fetch';
import cors from 'cors';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3000;
const NEWS_API_KEY = process.env.NEWS_API_KEY;
const OPENAI_API_KEY = process.env.OPENAI_API_KEY;

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

console.log('🧠 OPENAI 키 확인:', OPENAI_API_KEY);

app.get('/news', async (req, res) => {
  const query = req.query.q || '한국';
  try {
    const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&language=ko&pageSize=10&apiKey=${NEWS_API_KEY}`;
    const response = await fetch(url);
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: '뉴스 가져오기 실패', detail: err.message });
  }
});

app.post('/analyze', async (req, res) => {
  const { title, content } = req.body;

  if (!content || content.length < 50) {
    return res.json({ result: '평가할 수 없음 (내용 부족)' });
  }

  const prompt = `다음은 뉴스 제목과 내용입니다. 이 뉴스의 내용이 얼마나 신뢰할 수 있는지 평가해 주세요.\n- 제목과 내용의 사실성, 출처의 신뢰성, 과장이나 왜곡이 있는지 고려하세요.\n- '높음', '중간', '낮음' 중 하나로 평가한 뒤, 간단한 이유를 함께 알려주세요.\n\n제목: ${title}\n내용: ${content}`;

  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${OPENAI_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        messages: [{ role: 'user', content: prompt }],
        temperature: 0.5
      })
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || '평가 실패';
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'GPT 평가 실패', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행됨: http://localhost:${PORT}`);
});
