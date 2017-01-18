CREATE TABLE IF NOT EXISTS users(
  id SERIAL PRIMARY KEY NOT NULL,
  name VARCHAR(120)
  -- email VARCHAR(254), -- http://stackoverflow.com/questions/386294/what-is-the-maximum-length-of-a-valid-email-address
  -- password_hash CHAR(60) NOT NULL -- bcrypt hashes are 60 characters.
)