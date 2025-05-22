const mongoose = require('mongoose');

const diarySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  date: { type: String, required: true },  // YYYY-MM-DD
  title: String,
  text: String,
  imageData: String
});

module.exports = mongoose.model('Diary', diarySchema);

