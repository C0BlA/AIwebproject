const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Diary = require('./diary');
const multer = require('multer');

const SECRET = "AIwebproject123!";
const app = express();

app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage();
const upload = multer({ storage });

mongoose.connect('mongodb://localhost:27017/emotion-diary');

// 사용자 스키마
const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model('User', userSchema);

// 회원가입
app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  const existingUser = await User.findOne({ username });
  if (existingUser) return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashed });
  await newUser.save();
  res.json({ message: '회원가입 완료' });
});

// 로그인
app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: '사용자 없음' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: '비밀번호 오류' });

  const token = jwt.sign({ id: user._id, username }, SECRET, { expiresIn: '1h' });
  res.json({ message: '로그인 성공', token });
});

// 다이어리 저장
app.post('/api/diaries', upload.single('image'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const { date, title, text, weather } = req.body;
    const imageData = req.file ? req.file.buffer.toString('base64') : null;

    const newDiary = new Diary({
      userId: decoded.id,
      date,
      weather,
      title,
      text,
      imageData
    });

    await newDiary.save();
    res.json({ message: '다이어리 저장 완료' });
  } catch (err) {
    res.status(403).json({ error: '토큰이 유효하지 않음' });
  }
});

// 최근 다이어리
app.get('/api/diaries/recent', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const diaries = await Diary.find({ userId: decoded.id }).sort({ updatedAt: -1 }).limit(7);
    res.json(diaries);
  } catch (err) {
    res.status(403).json({ error: '토큰이 유효하지 않음' });
  }
});

// 월별 다이어리
app.get('/api/diaries/month', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const { year, month } = req.query;
    const regex = new RegExp(`^${year}-${month.padStart(2, '0')}-\\d{2}$`);
    const diaries = await Diary.find({ userId: decoded.id, date: regex });
    res.json(diaries);
  } catch (err) {
    res.status(403).json({ error: '토큰 유효하지 않음' });
  }
});

// 특정 날짜 다이어리 조회
app.get('/api/diaries/:date', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const diary = await Diary.findOne({ userId: decoded.id, date: req.params.date });
    if (!diary) return res.status(404).json({ message: '해당 날짜의 다이어리 없음' });

    res.json(diary);
  } catch (err) {
    res.status(403).json({ error: '토큰이 유효하지 않음' });
  }
});

// 다이어리 수정
app.put('/api/diaries/:date', upload.single('image'), async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const { title, text, weather } = req.body;
    const imageData = req.file ? req.file.buffer.toString('base64') : undefined;

    const updateFields = { title, text, weather };
    if (imageData) updateFields.imageData = imageData;

    const updated = await Diary.findOneAndUpdate(
      { userId: decoded.id, date: req.params.date },
      updateFields,
      { new: true }
    );

    if (!updated) return res.status(404).json({ error: '다이어리 없음' });
    res.json({ message: '수정 완료', diary: updated });
  } catch (err) {
    res.status(403).json({ error: '토큰 유효하지 않음' });
  }
});

// 다이어리 삭제
app.delete('/api/diaries/:date', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const result = await Diary.findOneAndDelete({
      userId: decoded.id,
      date: req.params.date
    });

    if (!result) return res.status(404).json({ error: '다이어리 없음' });
    res.json({ message: '삭제 완료' });
  } catch (err) {
    res.status(403).json({ error: '토큰 유효하지 않음' });
  }
});

// 감정 벡터 분석용 API
app.get('/api/emotions/vectors', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const diaries = await Diary.find({ userId: decoded.id }).sort({ date: -1 }).limit(21);

    const emojiToVector = {
      '⛅': { x: 0.3, y: 0.2 }, '☀️': { x: 0.7, y: 0.5 }, '🌞': { x: 1.0, y: 0.8 },
      '🌫': { x: -0.2, y: -0.3 }, '🌦': { x: -0.5, y: -0.6 }, '🌧': { x: -0.8, y: -1.0 },
      '🌬': { x: -0.3, y: 0.2 }, '⛈': { x: -0.6, y: 0.4 }, '🌪': { x: -1.0, y: 0.6 },
      '🌁': { x: -0.3, y: -0.1 }, '🌫️': { x: -0.5, y: -0.5 }, '🌪️': { x: -0.9, y: -0.9 },
      '🌙': { x: -0.1, y: -0.4 }, '🌨': { x: -0.4, y: -0.7 }, '❄️': { x: -0.7, y: -1.0 }
    };

    const weeklyVectors = [];
    for (let i = 0; i < 3; i++) {
      const weekData = diaries.slice(i * 7, (i + 1) * 7);
      if (weekData.length === 0) continue;

      const vectors = weekData.map(d => emojiToVector[d.weather] || { x: 0, y: 0 });
      const avgX = vectors.reduce((acc, v) => acc + v.x, 0) / vectors.length;
      const avgY = vectors.reduce((acc, v) => acc + v.y, 0) / vectors.length;

      weeklyVectors.push({ x: avgX, y: avgY, week: i + 1 });
    }

    res.json(weeklyVectors);
  } catch (err) {
    res.status(403).json({ error: '토큰 유효하지 않음' });
  }
});

// 최근 21일 날짜 기준 다이어리 이모지 추출
app.get('/api/diaries/last21days', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const userId = decoded.id;

    const today = new Date();
    const dates = [];
    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dates.push(dateStr);
    }

    const diaries = await Diary.find({ userId, date: { $in: dates } });
    const diaryMap = {};
    diaries.forEach(d => { diaryMap[d.date] = d; });

    const result = dates.map(date => ({
      date,
      weather: diaryMap[date]?.weather || null
    }));

    res.json(result);
  } catch (err) {
    res.status(403).json({ error: '토큰이 유효하지 않음' });
  }
});

app.listen(3000, () => console.log('서버 실행 중: http://localhost:3000'));


app.post('/api/dev/seed21', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const userId = decoded.id;

    // 원하는 이모지 21개 (원하면 수정 가능)
    const emojis = ['☀️', '☁️', '☔', '🌩️', '❄️', '⛅', '🌧', '🌫', '🌙', '🌪️',
                    '☀️', '☁️', '☔', '🌩️', '❄️', '⛅', '🌧', '🌫', '🌙', '🌪️', '☀️'];

    const today = new Date();
    const entries = [];

    for (let i = 20; i >= 0; i--) {
      const d = new Date(today);
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];

      entries.push({
        userId,
        date: dateStr,
        weather: emojis[20 - i],
        title: `감정 기록 ${dateStr}`,
        text: `이 날의 날씨는 ${emojis[20 - i]}`
      });
    }

    await Diary.deleteMany({ userId }); // 기존 것 지우고 다시 넣기
    await Diary.insertMany(entries);

    res.json({ message: '✅ 21일치 이모지 다이어리 저장 완료', count: entries.length });
  } catch (err) {
    console.error('이모지 시드 실패:', err);
    res.status(403).json({ error: '토큰 유효하지 않음' });
  }
});