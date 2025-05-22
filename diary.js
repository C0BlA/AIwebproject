const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },  // YYYY-MM-DD
  emoji: { type: String, required: true, default: '⛅' },   // ☀️ 등
  title: String,
  text: String,
  imageData: String
});

module.exports = mongoose.model('Diary', diarySchema);

