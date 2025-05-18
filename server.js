const express = require('express');
const mongoose = require('mongoose');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

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

  const token = jwt.sign({ username: user.username }, 'SECRET_KEY', { expiresIn: '1h' });
  res.json({ message: '로그인 성공', token });
});

app.listen(3000, () => console.log('서버 실행 중: http://localhost:3000'));
