const mongoose = require('mongoose');

const BookSchema = new mongoose.Schema({
  bookID: { type: String, required: true, unique: true },
  Author: { type: String, required: true, unique: true },
  Title: { type: String, required: true },
  Publisher: { type: String, required: true },
  Year: { type: Number, required: true },
  Pages: { type: Array, required: true },
  Language: { type: String, required: true },
  Mirror_1: { type: String, required: true },
  download_links: { type: String, required: true },
  Genre: { type: String, required: true },
  cover: { type: String, required: true },
  desc: { type: String, required: true }
});


const Books = mongoose.model('books', BookSchema);

module.exports = Books;