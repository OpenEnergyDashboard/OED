exports.localeData = {
	"en": {
		"status.success": "SUCCESS",
		"status.failure": "FAILURE",
		"csv.failed-to-write-file": "Internal OED error: Failed to write the file: {filename}",
		"csv.missing-dst-crossing-date": "Could not find DST crossing date in pipeline so giving up.",
		"csv.invalid-gps-input": "For meter {meter} the gps coordinates of {gps} are invalid",
		"csv.invalid-unit-id": "For meter {meter} the unit of {unit} is invalid",
		"csv.invalid-graphic-unit": "For meter {meter} the default graphic unit of {graphic_unit} is invalid",
		"csv.require-single-meter": "Meter name provided (\"{meter}\") in request with update for meters but more than one meter in CSV so not processing",
		"csv.non-existent-meter-name": "Meter name of \"{meter}\" does not seem to exist with update for meters and got DB error of: {errorMessage}",
		"csv.duplicate-meter": "Meter name of \"{meter}\" got database error of: {errorMessage}",
		"csv.failed-meter-upload": "Failed to upload meters due to internal OED Error: {errorMessage}",
		"csv.mismatched-cumulative-variables": "On meter {meter} in pipeline: cumulative was false but cumulative reset was true. To avoid mistakes all reading are rejected.",
		"csv.failed-to-parse-start-datetime": "The start date/time of {datetime} did not parse to a date/time using the normal format so a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.",
		"csv.failed-to-parse-end-datetime": "The end date/time of {datetime} did not parse to a date/time using the normal format so a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.",
		"csv.invalid-date": "For meter {meter}: Error parsing Reading #{num} The start ({start}) and/or end time ({end}) provided did not parse into a valid date/time so all reading are rejected.",
		"csv.invalid-reading-number": "For meter {meterName}: Error parsing Reading #{num} with cumulative data. The reading value provided of {reading} is not considered a number so all reading are rejected."
	},
	"fr": {
		"status.success": "SUCCÈS",
		"status.failure": "ÉCHEC",
		"csv.failed-to-write-file": "Erreur interne OED: Impossible d'écrire le fichier: {filename}",
		"csv.missing-dst-crossing-date": "Impossible de trouver la date de passage à l'heure d'été dans le pipeline, donc abandonner.",
		"csv.invalid-gps-input": "(Need French) For meter {meter} the gps coordinates of {gps} are invalid",
		"csv.invalid-unit-id": "(Need French) For meter {meter} the unit of {unit} is invalid",
		"csv.invalid-graphic-unit": "(Need French) For meter {meter} the default graphic unit of {graphic_unit} is invalid",
		"csv.require-single-meter": "(Need French) Meter name provided (\"{meter}\") in request with update for meters but more than one meter in CSV so not processing",
		"csv.non-existent-meter-name": "(Need French) Meter name of \"{meter}\" does not seem to exist with update for meters and got DB error of: {errorMessage}",
		"csv.duplicate-meter": "(Need French) Meter name of \"{meter}\" got database error of: {errorMessage}",
		"csv.failed-meter-upload": "(Need French) Failed to upload meters due to internal OED Error: {errorMessage}",
		"csv.mismatched-cumulative-variables": "(Need French) On meter {meter} in pipeline: cumulative was false but cumulative reset was true. To avoid mistakes all reading are rejected.",
		"csv.failed-to-parse-start-datetime": "(Need French) The start date/time of {datetime} did not parse to a date/time using the normal format so a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.",
		"csv.failed-to-parse-end-datetime": "(Need French) The end date/time of {datetime} did not parse to a date/time using the normal format so a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.",
		"csv.invalid-date": "(Need French) For meter {meter}: Error parsing Reading #{num} The start ({start}) and/or end time ({end}) provided did not parse into a valid date/time so all reading are rejected.",
		"csv.invalid-reading-number": "(Need French) For meter {meterName}: Error parsing Reading #{num} with cumulative data. The reading value provided of {reading} is not considered a number so all reading are rejected."
	}
}
