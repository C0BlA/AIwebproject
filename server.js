const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');
const Diary = require('./diary'); 
const SECRET="AIwebproject123!";
const multer = require('multer');

const app = express();
app.use(cors());
app.use(express.json());
const storage = multer.memoryStorage(); 
const upload = multer({ storage });

mongoose.connect('mongodb://localhost:27017/emotion-diary');

const userSchema = new mongoose.Schema({
  username: String,
  password: String,
});
const User = mongoose.model('User', userSchema);


app.post('/api/register', async (req, res) => {
  const { username, password } = req.body;
  
  const existingUser = await User.findOne({ username });
  if (existingUser) {
    return res.status(400).json({ error: '이미 존재하는 아이디입니다.' });
  }

  const hashed = await bcrypt.hash(password, 10);
  const newUser = new User({ username, password: hashed });
  await newUser.save();

  res.json({ message: '회원가입 완료' });
});


app.post('/api/login', async (req, res) => {
  const { username, password } = req.body;
  const user = await User.findOne({ username });
  if (!user) return res.status(401).json({ error: '사용자 없음' });

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return res.status(401).json({ error: '비밀번호 오류' });

  const token = jwt.sign({ id:user._id, username: user.username }, SECRET, { expiresIn: '1h' });
  res.json({ message: '로그인 성공', token });
});

//다이어리 저장
app.post('/api/diaries',upload.single('image'), async (req, res) => {
  console.log("POST 요청 들어옴");
  const token = req.headers.authorization?.split(' ')[1];
  console.log("📌 받은 토큰:", token); 

  console.log("받은 Authorization 헤더:", req.headers.authorization); 
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const { date, title, text, weather} = req.body;
    console.log("✅ 토큰 검증 성공:", decoded);
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
    console.error("❌ 토큰 검증 실패:", err.message); 
    res.status(403).json({ error: '토큰이 유효하지 않음' });

  }
});

// 최근 다이어리 5개 불러오기
app.get('/api/diaries/recent', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  console.log("📌 받은 토큰:", token); 

  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const userId = decoded.id;

    const diaries = await Diary.find({ userId })
      .sort({ updatedAt: -1 }) 
      .limit(7); 

    res.json(diaries);
  } catch (err) {
    res.status(403).json({ error: '토큰이 유효하지 않음' });
  }
});

//월별 다이어리리
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

//다이어리 불러오기
app.get('/api/diaries/:date', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const userId = decoded.id;
    const date = req.params.date;

    const diary = await Diary.findOne({ userId, date });
    if (!diary) {
      return res.status(404).json({ message: '해당 날짜의 다이어리 없음' });
    }

    res.json(diary);
  } catch (err) {
    res.status(403).json({ error: '토큰이 유효하지 않음' });
  }
});

//다이어리 수정
app.put('/api/diaries/:date', async (req, res) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) return res.status(401).json({ error: '토큰 없음' });

  try {
    const decoded = jwt.verify(token, SECRET);
    const { title, text, imageUrl } = req.body;
    const updated = await Diary.findOneAndUpdate(
      { userId: decoded.id, date: req.params.date },
      { title, text, imageUrl },
      { new: true }
    );
    if (!updated) return res.status(404).json({ error: '다이어리 없음' });

    res.json({ message: '수정 완료', diary: updated });
  } catch (err) {
    res.status(403).json({ error: '토큰 유효하지 않음' });
  }
});

//다이어리 삭제
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

app.listen(3000, () => console.log('서버 실행 중: http://localhost:3000'));