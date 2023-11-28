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
  const createEmailsTable = ` CREATE TABLE IF NOT EXISTS emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    sender_id INT,
    recipient_id INT,
    subject VARCHAR(255),
    body TEXT,
    attachment VARCHAR(255),
    time_sent TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (sender_id) REFERENCES users(id),
    FOREIGN KEY (recipient_id) REFERENCES users(id) 
  );`;
  const createDeletedEmailsTable = `CREATE TABLE IF NOT EXISTS deleted_emails (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email_id INT,
    user_id INT,
    deleted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (email_id) REFERENCES emails(id),
    FOREIGN KEY (user_id) REFERENCES users(id)
  );`;
  
  // SQL query to insert users data
  const insertUsers = `
INSERT INTO users (full_name, email, password) VALUES
  ('Nguyen Van A', 'a@a.com', 'NVA123'),
  ('Hoang Thai Duong', 'HTD@gmail.com', 'HTD123'),
  ('Nicolas Viau', 'NV@edu.vn.com', 'NIC123'),
  ('Truong Ha Huynh Thai', 'THHT@gmail.com', 'THHTdeptrai');
`;


    // SQL query to initialize data for users
    const insertEmails = `INSERT INTO emails (sender_id, recipient_id, subject, body) VALUES
  (3, 2, 'Hello', 'Hi Hoang Thai Duong, how are you?'),
  (2, 3, 'Game Dev Meeting', 'Are you available for a meeting tomorrow?'),
  (3, 2, 'Regarding Project', 'Let''s discuss the project details.'),
  (2, 3, 'Game Project', 'Sure, let''s schedule a meeting.'),
  (4, 2, 'WorkFlow', 'May lam ve workflow de ca team cung theo nhe!'),
  (4, 3, 'Project Update', 'I hope this email finds you well. I wanted to provide a quick update on the current status of our project. We have made significant progress in the last week, and I would like to discuss the next steps in our upcoming meeting.
Please review the attached document for a detailed report.
Best regards, THHT'),
  (2, 4, 'Rep: Workflow', 'OK, de t lam nhe !'),
  (3, 4, 'Rep: Project Update', 'Alright, i will look forward into it. For now, want to have a quick lunch with me and Hoang Thai Duong??'),
  (2, 1, 'Quick Question', 'Do you have the latest updates?'),
  (1, 2, 'Trung Giai Thuong!!!', 'Chuc Mung ban la nguoi thu 100 may man nhan duoc 1 chiec xe HONDA CIVIC'),
  (1, 3, 'Thu Moi Tuyen Dung', 'Chuc Mung ban da qua vong gui xe'),
  (3, 1, 'Canh Bao Bao Mat', 'May Tinh Cua Ban da bi hong. Can phai giai quyet SOS');
`;

  

    
  // Execute queries
  db.query(createUsersTable, (err) => {
    if (err) throw err;
    console.log('Users table created');
    db.query(createEmailsTable, (err) => {
      if (err) throw err;
      console.log('Emails table created');
  
      db.query(createDeletedEmailsTable, (err) => {
        if (err) throw err;
        console.log('Deleted emails table created');
  
        db.query(insertUsers, (err) => {
          if (err) throw err;
          console.log('Data user inserted');
  
          db.query(insertEmails, (err) => {
            if (err) throw err;
            console.log('Data email inserted');
            // Close the database connection
            db.end((err) => {
              if (err) throw err;
              console.log('Database connection closed');
            });
          });
        });
      });
    });
  })};
