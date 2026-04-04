-- ArcadeDB seed: initial users
-- Passwords are bcrypt-hashed (cost 12).
-- Plaintext: admin=admin  editor=editor  viewer=viewer
--
-- To generate a new hash: node -e "const b=require('bcryptjs');b.hash('yourpass',12).then(console.log)"

INSERT INTO User SET
  username      = 'admin',
  password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TtxMQJqhN8/Lewdg9a9X1zmL0KXa',
  role          = 'admin';

INSERT INTO User SET
  username      = 'editor',
  password_hash = '$2a$12$Yj7vAQb3GnF5X9mK8zPtWODoHhLmS6uCsJqEVN2x4T1gBpRd0wIXe',
  role          = 'editor';

INSERT INTO User SET
  username      = 'viewer',
  password_hash = '$2a$12$MnK8pR3QsT6vXwY1zBcDaOeN9fGuJhLmP4rSwA7tV0iCqEkXdFyHz',
  role          = 'viewer';
