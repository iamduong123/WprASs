const express = require('express');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config();
const app = express();

// Middleware
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
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

// Middleware to check if the user is authenticated
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
  console.log('Request body:', req.body);

  const { email, password } = req.body;
  console.log('Entered email:', email);
  console.log('Entered password:', password); 

  // Check credentials against the hardcoded user data array
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
  const { full_name, email, password, reenter_password } = req.body;

  // Validation
  if (!full_name || !email || !password || !reenter_password) {
    return res.render('signup', { error: 'Please fill in all fields' });
  }

  // Check if the email address is already used (you would check against the database)
  const emailExists = users.some(u => u.email === email);
  if (emailExists) {
    return res.render('signup', { error: 'Email address is already in use' });
  }

  // Check if passwords match
  if (password !== reenter_password) {
    return res.render('signup', { error: 'Passwords do not match' });
  }

  // Implement user registration logic here (you would add the user to the database)
  const newUser = {
    id: users.length + 1,
    full_name,
    email,
    password,
  };

  users.push(newUser);

  // Set user cookie
  res.cookie('userId', newUser.id.toString());

  // Render welcome message
  res.render('welcome', { user: newUser });
});

app.get('/inbox', (req, res) => {
  const user = req.user;
  if (user) {
    // Retrieve user's inbox emails (you would fetch from the database)
    const inboxEmails = []; // Replace with actual data

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const emailsPerPage = 5;
    const startIndex = (page - 1) * emailsPerPage;
    const endIndex = startIndex + emailsPerPage;
    const totalPages = Math.ceil(inboxEmails.length / emailsPerPage);

    const displayedEmails = inboxEmails.slice(startIndex, endIndex);

    res.render('inbox', { user, inboxEmails: displayedEmails, totalPages });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
});

app.get('/compose', (req, res) => {
  const users = []; // Fetch users from the database
  res.render('compose', { users });
});

app.post('/compose', (req, res) => {
  const { recipient, subject, body } = req.body;

  // Validate recipient selection
  if (!recipient) {
    const users = []; // Fetch users from the database
    return res.render('compose', { users, error: 'Please select a recipient.' });
  }

  // Implement email sending logic (you would save the email to the database)
  // For learning purposes, let's assume the email is successfully sent

  // Redirect to the inbox page with a success message
  res.redirect('/inbox?success=Email sent successfully');
});

app.get('/outbox', (req, res) => {
  const user = req.user;
  if (user) {
    // Retrieve user's outbox emails (you would fetch from the database)
    const outboxEmails = []; // Replace with actual data

    // Pagination
    const page = parseInt(req.query.page) || 1;
    const emailsPerPage = 5;
    const startIndex = (page - 1) * emailsPerPage;
    const endIndex = startIndex + emailsPerPage;
    const totalPages = Math.ceil(outboxEmails.length / emailsPerPage);

    const displayedEmails = outboxEmails.slice(startIndex, endIndex);

    res.render('outbox', { user, emails: displayedEmails, totalPages });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
});

app.get('/emaildetail/:emailId', (req, res) => {
  const user = req.user;

  if (user) {
    // Retrieve email details (you would fetch from the database based on emailId)
    const emailId = req.params.emailId;
    const emailDetails = {}; // Replace with actual data

    res.render('emaildetail', { user, emailDetails });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
});

app.get('/signout', (req, res) => {
  // Clear user cookie
  res.clearCookie('userId');
  res.redirect('/');
});

// Start server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
