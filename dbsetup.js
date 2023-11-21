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


    // SQL query to initialize data for users
    const insertEmails = `INSERT INTO emails (id, sender_id, recipient_id, subject, body) VALUES
    (1, 1, 3, 'Hello', 'Hi @, how are you?'),
    (2, 2, 3, 'Note', 'Remember to close the door!'),
    (3, 3, 1, 'Re: Hello', 'I am fine thank you and you?'),
    (4, 3, 2, 'Re: Note', 'Sure, I will close it right after i leave the house.'),
    (5, 1, 2, 'Question', 'Have you done the WPR assignment?'),
    (6, 2, 1, 'Re: Question', 'No, its so hard!!!.'),
    (7, 2, 3, 'Reminder', 'Don''t forget about our SAD meeting tomorrow.'),
    (8, 3, 1, 'Re: Reminder', 'Yeah, sure!.');`;
  // Execute queries
  db.query(createUsersTable, (err) => {
    if (err) throw err;
    console.log('Users table created');

    db.query(createEmailsTable, (err) => {
      if (err) throw err;
      console.log('Emails table created');

      db.query(insertEmails, (err) => {
        if (err) throw err;
        console.log('Data user inserted');

        // Close the database connection
        db.end((err) => {
          if (err) throw err;
          console.log('Database connection closed');
        });
      });
    });
  });
}
