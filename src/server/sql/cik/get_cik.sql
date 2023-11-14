SELECT U.id AS meter_unit_id, U2.id AS non_meter_unit_id, C.slope, C.intercept
FROM cik AS C
JOIN units AS U ON C.row_index = U.unit_index
JOIN units AS U2 ON C.column_index = U2.unit_index
WHERE U.type_of_unit = 'meter'::unit_type AND U2.type_of_unit != 'meter'::unit_type;
