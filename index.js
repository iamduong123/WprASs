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


// Middleware to check if the user is authenticated
app.use((req, res, next) => {
  const userId = req.cookies.userId;

  // Replace the hardcoded user data with a database query
  db.query('SELECT * FROM users WHERE id = ?', [userId], (err, results) => {
    if (err) {
      console.error('Error retrieving user data from the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    // Check if a user with the given ID exists
    const user = results[0];
    req.user = user;

    // Continue with the request
    next();
  });
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
  db.query('SELECT * FROM users WHERE email = ? AND password = ?', [email, password], (err, results) => {
    if (err) {
      console.error('Error querying user data from the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    // Check if a user with the given credentials exists
    const user = results[0];
    if (user) {
      // Set user cookie
      res.cookie('userId', user.id.toString());
      res.redirect('/inbox');
    } else {
      res.render('signin', { error: 'Invalid email or password' });
    }
  });
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
  db.query('SELECT * FROM users WHERE email = ?', [email], (err, results) => {
    if (err) {
      console.error('Error checking email existence in the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    if (results.length > 0) {
      return res.render('signup', { error: 'Email address is already in use' });
    }

    // Check if passwords match
    if (password !== reenter_password) {
      return res.render('signup', { error: 'Passwords do not match' });
    }

  // Insert new user into the database
  db.query('INSERT INTO users (full_name, email, password) VALUES (?, ?, ?)', [full_name, email, password], (err, result) => {
    if (err) {
      console.error('Error inserting new user into the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    const newUser = {
      id: result.insertId,
      full_name,
      email,
      password,
    };

    // Set user cookie
    res.cookie('userId', newUser.id.toString());

    // Render welcome message
    res.render('welcome', { user: newUser });
  });
});
});


app.get('/inbox', (req, res) => {
  const user = req.user;
  if (user) {
    // Retrieve user's inbox emails from the database
    db.query('SELECT * FROM emails WHERE recipient_id = ?', [user.id], (err, inboxEmails) => {
      if (err) {
        console.error('Error retrieving inbox emails from the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const emailsPerPage = 5;
      const startIndex = (page - 1) * emailsPerPage;
      const endIndex = startIndex + emailsPerPage;
      const totalPages = Math.ceil(inboxEmails.length / emailsPerPage);

      const displayedEmails = inboxEmails.slice(startIndex, endIndex);
      res.render('inbox', { user, inboxEmails: displayedEmails, totalPages });
    });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
}); 

app.get('/compose', (req, res) => {
  // Fetch users from the database
  db.query('SELECT * FROM users', (err, users) => {
    if (err) {
      console.error('Error retrieving users from the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    res.render('compose', { users });
  });
});

app.post('/compose', (req, res) => {
  const { recipient, subject, body } = req.body;
  const senderId = req.user.id;

  // Validate recipient selection
  if (!recipient) {
    db.query('SELECT * FROM users', (err, users) => {
      if (err) {
        console.error('Error retrieving users from the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      return res.render('compose', { users, error: 'Please select a recipient.' });
    });
  } else {
    // Insert new email into the database
    const query = 'INSERT INTO emails (sender_id, recipient_id, subject, body) VALUES (?, ?, ?, ?)';
    db.query(query, [senderId, recipient, subject, body], (err, result) => {
      if (err) {
        console.error('Error inserting new email into the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      // Redirect to the inbox page with a success message
      res.redirect(`/inbox?success=${encodeURIComponent('Email sent successfully')}`);
    });
  }
});

app.get('/outbox', (req, res) => {
  const user = req.user;

  if (user) {
    // Retrieve user's outbox emails from the database
    db.query('SELECT * FROM emails JOIN users WHERE sender_id = ?', [user.id], (err, outboxEmails) => {
      if (err) {
        console.error('Error retrieving outbox emails from the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      // Pagination
      const page = parseInt(req.query.page) || 1;
      const emailsPerPage = 5;
      const startIndex = (page - 1) * emailsPerPage;
      const endIndex = startIndex + emailsPerPage;
      const totalPages = Math.ceil(outboxEmails.length / emailsPerPage);

      const displayedEmails = outboxEmails.slice(startIndex, endIndex);

      res.render('outbox', { user, outboxEmails: displayedEmails, totalPages });
    });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
});

app.get('/emaildetail/:emailId', (req, res) => {
  const user = req.user;

  if (user) {
    // Retrieve email details from the database
    const emailId = req.params.emailId;
    db.query('SELECT * FROM emails WHERE id = ?', [emailId], (err, results) => {
      if (err) {
        console.error('Error retrieving email details from the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      const emailDetails = results[0];

      res.render('emaildetail', { user, emailDetails });
    });
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
