CREATE TABLE IF NOT EXISTS meters (
  id SERIAL PRIMARY KEY,
  name VARCHAR(50) UNIQUE NOT NULL,
  ipAddress VARCHAR(20),
	enabled BOOLEAN NOT NULL,
	meter_type meter_type NOT NULL
);
