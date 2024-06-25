const express = require('express');
const connectDB = require('./model/db/mongoDB');
const User = require('./model/user');
const Books = require('./model/books');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');

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
    const user = await User.findById(id['_id']);  
    res.send(user);
});

app.get('/get-book', verifyToken, async (req, res) => {
  const bookId = req.body['bookId']
  try {
    const book = await Books.findById(bookId)
    if (!book) {
      return res.status(404).json({ message: 'book not found' });
    }
    return res.status(200).json({ message: 'Book fetch sucessfuly', book});
  } catch (err) {
    return res.status(500).json({ message: 'Failed to save book', error: err });
  }
});
app.get('/books', verifyToken, (req, res) => {
  let id = req.user
  User.findById(id['_id'])
    .populate('books')
    .then(user => {
      if (!user) {
        return res.status(404).json({ message: 'User not found' });
      }

      return res.status(200).json({ books: user.books });
    })
    .catch(err => res.status(500).json({ message: 'Failed to find user', error: err }));
});

app.post('/save-book', verifyToken, async (req, res) => {
  const bookId = req.body['bookId'];
  let id = req.user

  try {
    const user = await User.findById(id['_id'])
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    const bk = Books.findById(bookId)
    if (!bk) {
      return res.status(404).json({ message: 'Book not found' });
    }
    else {
      if (user.books.includes(bookId)) {
        return res.status(409).json({ message: 'Book already saved by the user' });
      }
      user.books.push(bookId);
      // Save the updated user
      await user.save();
      console.log(user['books'].length)
      if (user['books'].length > 10){
        User.findById(id['_id'])
        .populate('books')
        .then(user => {
                if (!user) {
                  return res.status(404).json({ message: 'User not found' });
                }
                const topGenre = countBooksByGenre(user.books)
                console.log(Object.keys(topGenre)[0])
                updateGenrefav(id['_id'],Object.keys(topGenre)[0])
                ;}).catch(err => res.status(500).json({ message: 'Failed to find user', error: err }));
      }
      
      return res.status(200).json({ message: 'Book saved successfully' });
    }
  } catch (err) {
    return res.status(500).json({ message: 'Failed to save book', error: err });
  }
});

app.get('/recommendation', verifyToken, async (req, res) => {
  let id = req.user
  try {
    const user = await User.findById(id['_id']);
    if (!user) {
      return res.status(404).json({ message: 'User not found' });
    }
    user
    if(user['genre_fav'] == 'First' || user['books'].length < 10){
      
      const randomBook = await Books.aggregate([{ $sample: { size: 1 } }]);
      if (user.books.includes(randomBook["bookId"])) {
        return res.status(409).json({ message: 'Book already saved by the user' });
      }
      return res.status(200).json({ randomBook });
    }
    else{
      do {
        const recommendedBook = await Books.find({
          Genre: user['genre_fav']}).limit(1);
        } while (user.books.includes(recommendedBook['_id']));

        return res.status(200).json({ recommendedGenre, recommendedBook });
    }
  } catch (err) {
    console.log(err)
    return res.status(500).json({ message: 'Failed to get book recommendation', error: err });
  }
});
const updateGenrefav = async (id, Genre) => {
  try {
      const updatedBook = await User.findByIdAndUpdate(
          id,
          { genre_fav: Genre },
          { new: true } 
      );
      console.log('Updated User:', updatedBook);
  } catch (error) {
      console.error('Error updating User:', error);
  }
};

function countBooksByGenre(booksArray) {
  const genreCounts = booksArray.reduce((acc, book) => {
      acc[book.Genre] = (acc[book.Genre] || 0) + 1;
      return acc;
  }, {});
  const genreCountsArray = Object.entries(genreCounts);

  genreCountsArray.sort((a, b) => b[1] - a[1]);

  const sortedGenreCounts = Object.fromEntries(genreCountsArray);

  return sortedGenreCounts;
}

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
const port = process.env.PORT || 3000;
app.listen(port,"0.0.0.0", () => {
  console.log('Server running on port 3000');
});
