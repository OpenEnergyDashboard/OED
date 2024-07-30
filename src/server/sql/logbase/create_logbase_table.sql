
--create logbase table
CREATE TABLE IF NOT EXISTS logbase (
  log_type VARCHAR(5) NOT NULL,
  log_message VARCHAR(100) NOT NULL,
  log_time TIMESTAMP NOT NULL
);