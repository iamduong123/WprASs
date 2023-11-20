const mysql = require('mysql2');
const dotenv = require('dotenv');
dotenv.config();

// MySQL database connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'wpr',
  password: 'fit2023',
  database: 'wpr2023',
  port: 3306,
});

// Connect to the database
db.connect((err) => {
  if (err) {
    console.error('Error connecting to the database:', err);
    return;
  }
  console.log('Connected to the database');
  
  // Create tables and initialize data
  createTables();
});

// Function to create tables and initialize data
function createTables() {
  // SQL query to create users table
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users (
      id INT AUTO_INCREMENT PRIMARY KEY,
      full_name VARCHAR(255) NOT NULL,
      email VARCHAR(255) UNIQUE NOT NULL,
      password VARCHAR(255) NOT NULL
    );
  `;

  // SQL query to create emails table
  const createEmailsTable = `
    CREATE TABLE IF NOT EXISTS emails (
      id INT AUTO_INCREMENT PRIMARY KEY,
      sender_id INT,
      recipient_id INT,
      subject VARCHAR(255),
      body TEXT,
      attachment_path VARCHAR(255),
      time_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (sender_id) REFERENCES users(id),
      FOREIGN KEY (recipient_id) REFERENCES users(id)
    );
  `;

  // SQL query to initialize data
  const insertData = `
    INSERT INTO users (full_name, email, password) VALUES
    ('User1', 'a@a.com', 'password1'),
    ('User2', 'b@b.com', 'password2'),
    ('User3', 'c@c.com', 'password3');
    
    INSERT INTO emails (sender_id, recipient_id, subject, body) VALUES
    (1, 2, 'Hello', 'How are you?'),
    (2, 1, 'Re: Hello', 'I am good, thank you!'),
    (1, 3, 'Meeting', 'Let's meet tomorrow.'),
    (3, 1, 'Re: Meeting', 'Sure, where?');
  `;

  // Execute queries
  db.query(createUsersTable, (err) => {
    if (err) throw err;
    console.log('Users table created');

    db.query(createEmailsTable, (err) => {
      if (err) throw err;
      console.log('Emails table created');

      db.query(insertData, (err) => {
        if (err) throw err;
        console.log('Data inserted');

        // Close the database connection
        db.end((err) => {
          if (err) throw err;
          console.log('Database connection closed');
        });
      });
    });
  });
}
