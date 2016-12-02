-- create readings table
CREATE TABLE IF NOT EXISTS readings (
  meter_id INT NOT NULL REFERENCES meters(id),
  reading INT NOT NULL,
  read_timestamp TIMESTAMP NOT NULL,
  PRIMARY KEY (meter_id, read_timestamp)
);