const express = require('express');
const cookieParser = require('cookie-parser');
const multer = require('multer');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');
dotenv.config();

const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(require('path').join(__dirname, 'public')));
app.use(cookieParser());

// Set up EJS
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views', 'page'));

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'wpr',
  password: 'fit2023',
  database: 'wpr2023',
  port: 3306,
});

db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
});

// Sample user data (you would retrieve this from the database)
const users = [
  { id: 1, full_name: 'User1', email: 'a@a.com', password: 'password1' },
  { id: 2, full_name: 'User2', email: 'b@b.com', password: 'password2' },
  { id: 3, full_name: 'User3', email: 'c@c.com', password: 'password3' },
];

// Middleware to check if user is authenticated
app.use((req, res, next) => {
  const userId = req.cookies.userId;
  req.user = users.find(u => u.id === parseInt(userId));
  next();
});

// Routes
app.get('/', (req, res) => {
  // Check if the user is already signed in
  if (req.user) {
    res.redirect('/inbox');
  } else {
    res.render('signin', { error: null });
  }
});

app.post('/signin', (req, res) => {
  const { email, password } = req.body;
  // Check credentials (you would compare with database records)
  const user = users.find(u => u.email === email && u.password === password);

  if (user) {
    // Set user cookie
    res.cookie('userId', user.id.toString());
    res.redirect('/inbox');
  } else {
    res.render('signin', { error: 'Invalid email or password' });
  }
});

app.get('/signup', (req, res) => {
  res.render('signup', { error: null });
});

app.post('/signup', (req, res) => {
  // Implement user registration logic here
  res.render('signup', { error: 'Registration not implemented yet' });
});

app.get('/inbox', (req, res) => {
  const user = req.user;
  if (user) {
    // Retrieve user's inbox emails (you would fetch from the database)
    const inboxEmails = []; // Replace with actual data
    res.render('inbox', { user, inboxEmails });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
});

// Implement other routes (compose, outbox, email detail) similarly

// Start server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
