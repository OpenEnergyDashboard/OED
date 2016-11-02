
-- Build the database (next few queries)
CREATE SCHEMA IF NOT EXISTS meter_data;

USE meter_data;

CREATE TABLE IF NOT EXISTS meters (
  id INT PRIMARY KEY AUTO_INCREMENT,
  name VARCHAR(50) UNIQUE NOT NULL,
  ipAddress VARCHAR(20)
);

CREATE TABLE IF NOT EXISTS readings (
  id INT PRIMARY KEY AUTO_INCREMENT,
  meter_id INT NOT NULL REFERENCES meters(id),
  reading INT NOT NULL,
  read_timestamp TIMESTAMP NOT NULL
);

-- Insert a new meter
INSERT INTO meters(name, ipAddress)
    VALUES (?);

-- Add a new timestamp based on a meter's name

INSERT INTO readings(reading, read_timestamp, meter_id)
    VALUES(?, ?, (SELECT id from meters WHERE name = ?));

-- Get all readings from a meter in a range

SELECT *
FROM meters m
INNER JOIN readings r ON m.id = r.meter_id
WHERE m.name = ? AND
  r.read_timestamp BETWEEN ? AND ?;
