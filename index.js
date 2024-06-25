const express = require('express');
const connectDB = require('./model/db/mongoDB');
const User = require('./model/user');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const cors = require('cors');

const app = express();

connectDB();


app.use(express.json());

app.get('/', async (req, res) => {
  res.send("Hello there! Api is working")
});


app.post('/register', async (req, res) => {
  try {
    const user = new User(req.body);
    await user.save();
    //const token = await user.generateAuthToken();
    res.status(201).json({ message: 'User Created' });
  } catch (error) {
    res.status(400).json(error);
    console.log(error)
  }
});


app.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    const user = await User.findByCredentials(email, password);
    const token = await user.generateAuthToken();
    res.send({ user, token });
  } catch (error) {
    res.status(400).json(error);
  }
});


app.get('/profile', verifyToken, async (req, res) => {
    let id = req.user
    console.log()
    const user = await User.findById(id['_id']);  
    res.send(user);
});

// Middleware for authentication
function verifyToken(req, res, next) {
    // Get the token from the request header
    let token = req.headers['authorization'];
    
    // Check if token exists
    if (!token) {
      return res.status(401).json({ message: 'No token provided' });
    }
    const tk = token.split(' ')[1]
    // Verify the token
    jwt.verify(tk, 'secretkey', (err, decoded) => {
      if (err) {
        console.log(err)
        return res.status(403).json({ message: 'Failed to authenticate token' });
      }
  
      // Store the decoded token in the request object
      req.user = decoded;
      next();
    });
  }
let port = process.env.PORT ?? 9090
app.listen(port, "0.0.0.0", () => {
  console.log('Server running on port 3000');
});
