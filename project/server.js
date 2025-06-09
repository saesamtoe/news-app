// server.js (신뢰도 평가 개선 + description 사용 + 내용 길이 제한)
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
  let { title, content, description } = req.body;

  // fallback to description if content is short or missing
  if (!content || content.length < 50) {
    if (description && description.length >= 50) {
      content = description;
    } else {
      return res.json({ result: '판단 보류 (내용 부족)' });
    }
  }

  // 길이 제한 적용
  content = content.slice(0, 1000);

  const prompt = `다음 뉴스의 제목과 내용을 고려했을 때, 이 기사는 일반적으로 신뢰할 수 있습니까?\n\n- 제목: ${title}\n- 내용: ${content}\n\n"예" 또는 "아니오"로만 답변하세요.`;

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
        temperature: 0.3
      })
    });

    const data = await response.json();
    const result = data.choices?.[0]?.message?.content?.trim() || '판단 보류';
    res.json({ result });
  } catch (err) {
    res.status(500).json({ error: 'GPT 평가 실패', detail: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`서버 실행됨: http://localhost:${PORT}`);
});
