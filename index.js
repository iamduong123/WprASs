const express = require('express');
const cookieParser = require('cookie-parser');
const mysql = require('mysql2');
const dotenv = require('dotenv');
const path = require('path');
const multer = require('multer');

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, path.join(__dirname, 'uploads')); // Store the files in the 'uploads' directory within your project
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // Use the original file name as the stored file name
  }
});
const upload = multer({ storage: storage });
dotenv.config();
const app = express();
// path to store


// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, 'public')));
app.use(cookieParser());
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

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

let users = [];

db.query('SELECT * FROM users', (err, results) => {
  if (err) {
    console.error('Error retrieving users from the database:', err);
    // You might want to handle this error more gracefully in a production environment
    return;
  }
  users = results;
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
// Fetch users from the database and update the global variable
function updateUsers() {
  db.query('SELECT * FROM users', (err, usersFromDB) => {
    if (err) {
      console.error('Error retrieving users from the database:', err);
      return;
    }

    users = usersFromDB;
  });
}

// Fetch users when the server starts
updateUsers();

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
    const inboxQuery = `
  SELECT emails.*, users.full_name AS sender_name
  FROM emails
  JOIN users ON emails.sender_id = users.id
  WHERE emails.recipient_id = ? 
    AND emails.is_deleted = 0 
    AND NOT EXISTS (
      SELECT 1 FROM deleted_emails 
      WHERE deleted_emails.email_id = emails.id 
      AND deleted_emails.user_id = ?
    )
`;

    db.query(inboxQuery, [user.id, user.id], (err, inboxEmails) => {
      if (err) {
        console.error('Error retrieving inbox emails from the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      // Fetch users from the database
      db.query('SELECT * FROM users', (err, users) => {
        if (err) {
          console.error('Error retrieving users from the database:', err);
          return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
        }

        // Pagination
        const page = parseInt(req.query.page) || 1;
        const emailsPerPage = 5;
        const startIndex = (page - 1) * emailsPerPage;
        const endIndex = startIndex + emailsPerPage;
        const totalPages = Math.ceil(inboxEmails.length / emailsPerPage);

        const displayedEmails = inboxEmails.slice(startIndex, endIndex);

        // Pass 'users' array as a parameter to the 'inbox' view
        res.render('inbox', { user, inboxEmails: displayedEmails, totalPages, users });
      });
    });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
});


app.get('/outbox', (req, res) => {
  const user = req.user;

  if (user) {
    // Retrieve user's outbox emails from the database
    const outboxQuery = `
  SELECT emails.*, users.full_name AS recipient_name
  FROM emails
  JOIN users ON emails.recipient_id = users.id
  WHERE emails.sender_id = ? 
    AND emails.is_deleted = 0 
    AND NOT EXISTS (
      SELECT 1 FROM deleted_emails 
      WHERE deleted_emails.email_id = emails.id 
      AND deleted_emails.user_id = ?
    )
`;

    db.query(outboxQuery, [user.id, user.id], (err, outboxEmails) => {
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

      res.render('outbox', { user, outboxEmails: displayedEmails, totalPages, users });
    });
  } else {
    res.status(403).render('error', { status: 403, message: 'Access denied' });
  }
});



app.get('/compose', (req, res) => {
  const user = req.user;
  // Fetch users from the database
  
  db.query('SELECT * FROM users', (err, users) => {
    if (err) {
      console.error('Error retrieving users from the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    res.render('compose', { user, errorMessage: null, successMessage: null, users  });
  });
}); 

app.post('/compose',upload.single('attachment'), (req, res) => {
  const { recipient, subject, body } = req.body;
  const senderId = req.user.id;
  const attachmentFile = req.file;

  // Validate recipient selection
  if (!recipient) {
    // Fetch users from the database
    db.query('SELECT * FROM users', (err, users) => {
      if (err) {
        console.error('Error retrieving users from the database:', err);
        return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
      }

      return res.render('compose', {
        users,
        errorMessage: 'Please select a recipient.',
        successMessage: null,
        formData: { recipient, subject, body }, // Preserve form data for correction
      });
    });
    return;
  }

  // Insert new email into the database
  const query = 'INSERT INTO emails (sender_id, recipient_id, subject, body, attachment) VALUES (?, ?, ?, ?, ?)';
  db.query(query, [senderId, recipient, subject || '(no subject)', body || '', attachmentFile.originalname], (err, result) => {
    if (err) {
      console.error('Error inserting new email into the database:', err);
      return res.status(500).render('error', { status: 500, message: 'Internal Server Error' });
    }

    // Redirect to the inbox page with a success message
    res.redirect(`/inbox?success=${encodeURIComponent('Email sent successfully')}`);
  });
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

      // Fetch users from the database (optional)
      updateUsers();

      // Pass 'users' array as a parameter to the 'emaildetail' view
      res.render('emaildetail', { user, emailDetails, users });
      console.log(users);
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

app.post('/api/deleteemails', (req, res) => {
  const { emailIds } = req.body;
  const userId = req.user.id;

  // Ensure emailIds is an array and not empty
  if (!Array.isArray(emailIds) || emailIds.length === 0) {
    return res.status(400).json({ error: 'Invalid or empty emailIds' });
  }

  // Convert emailIds to an array of integers
  const idsToDelete = emailIds.map(id => parseInt(id, 10));

  // Check if emails are already deleted
  const checkDeletedQuery = 'SELECT email_id FROM deleted_emails WHERE user_id = ? AND email_id IN (?)';
  db.query(checkDeletedQuery, [userId, idsToDelete], (checkErr, existingDeletedEmails) => {
    if (checkErr) {
      console.error('Error checking deleted emails:', checkErr);
      return res.status(500).json({ error: 'Internal Server Error' });
    }

    const existingDeletedIds = existingDeletedEmails.map(row => row.email_id);

    // Filter out already deleted emails
    const uniqueIdsToDelete = idsToDelete.filter(id => !existingDeletedIds.includes(id));

    if (uniqueIdsToDelete.length === 0) {
      // All selected emails are already deleted
      return res.status(404).json({ error: 'Emails not found or already deleted' });
    }

    // Insert records into the deleted_emails table
    const insertDeletedEmailsQuery = 'INSERT INTO deleted_emails (email_id, user_id) VALUES ?';
    const values = uniqueIdsToDelete.map(emailId => [emailId, userId]);

    db.query(insertDeletedEmailsQuery, [values], (err) => {
      if (err) {
        console.error('Error inserting into deleted_emails table:', err);
        return res.status(500).json({ error: 'Internal Server Error' });
      }

      // Send a success response
      res.sendStatus(200);
    });
  });
});





// Start server
const PORT = 8000;
app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});

