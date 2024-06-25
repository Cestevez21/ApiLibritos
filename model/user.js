const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const UserSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  books: [{ type: mongoose.Schema.Types.ObjectId, ref: 'books' }],
  genre_fav: { type: String, required: true, default: 'First'},
  tokens: [{ token: { type: String, required: true } }],
});
// Define a secret key for JWT
const secretKey = 'your-secret-key';

UserSchema.pre('save', async function (next) {
  const user = this;
  if (user.isModified('password')) {
    user.password = await bcrypt.hash(user.password, 8);
  }
  next();
});


UserSchema.methods.generateAuthToken = async function () {
  const user = this;
  const token = jwt.sign({ _id: user._id.toString() }, 'secretkey');
  user.tokens = user.tokens.concat({ token });
  await user.save();
  return token;
};


UserSchema.statics.findByCredentials = async (email, password) => {
  const user = await User.findOne({ email });
  if (!user) {
    throw new Error('Unable to login');
  }
  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) {
    throw new Error('Unable to login');
  }
  return user;
};

const User = mongoose.model('User', UserSchema);

module.exports = User;
