-- create readings table
CREATE TABLE IF NOT EXISTS readings (
  meter_id INT NOT NULL REFERENCES meters(id),
  reading INT NOT NULL,
  start_timestamp TIMESTAMP NOT NULL,
	end_timestamp TIMESTAMP NOT NULL,
	CHECK (start_timestamp < readings.end_timestamp),
  PRIMARY KEY (meter_id, start_timestamp)
);
