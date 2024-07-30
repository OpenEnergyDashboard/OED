

-- Gets logs in table by date range. This is then ordered by time ascending.
SELECT 
  -- Short column names for smaller data.
  log_type as p, log_message as m, log_time as i
FROM logbase 
WHERE log_type = ${logType}
ORDER BY log_time ASC;