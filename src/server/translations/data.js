/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

/**
 * Server-side translation strings for CSV upload internationalization
 * 
 * This file contains all user-facing messages for the CSV upload pipeline in three languages:
 * English (en), French (fr), and Spanish (es).
 * 
 * Follows the same pattern as client-side translations in src/client/app/translations/data.ts
 * 
 * Translation key naming convention:
 * - Prefix: csv.upload
 * - Component: readings/meters/error/success/info/warning
 * - Description: specific error/message type
 * 
 * Example usage:
 *   const message = translate('csv.upload.meters.success', 'fr');
 *   // Returns: 'Les compteurs ont ete inseres avec succes.'
 * 
 * Placeholders (like {meterName}, {error}, {value}) are replaced using JavaScript .replace() method
 * 
 * Created to fix internationalization bug where CSV upload messages always appeared in English.
 */


// Server-side translations 
const ServerTranslationData = {
	// ============================================
	// ENGLISH
	// ============================================
	'en': {
		// CSV Route Error Messages (csv.js)
		'csv.upload.error.no.file': 'No csv file was uploaded. A csv file must be submitted via the csvfile parameter.',

		// CSV Meters Upload (uploadMeters.js)
		'csv.upload.meters.success': 'Successfully inserted the meters.',
		'csv.upload.meters.error.gps.missing.comma': 'GPS Input is missing a comma',
		'csv.upload.meters.error.gps.too.many.commas': 'GPS Input has too many commas',
		'csv.upload.meters.error.gps.invalid.coordinates': 'Invalid GPS coordinate, latitude must be an integer between -90 and 90, longitude must be an integer between -180 and 180. You input: {input}',
		'csv.upload.meters.error.gps.invalid': 'For meter {meterName} the gps coordinates of {gps} are invalid with error of "{error}"',
		'csv.upload.meters.error.unit.invalid': 'For meter {meterName} the unit of {unit} is invalid',
		'csv.upload.meters.error.default.graphic.unit.invalid': 'For meter {meterName} the default graphic unit of {unit} is invalid',
		'csv.upload.meters.error.identifier.multiple.meters': 'Meter identifier provided ("{identifier}") in request with update for meters but more than one meter in CSV so not processing',
		'csv.upload.meters.error.identifier.not.exist': 'Meter identifier of "{identifier}" does not seem to exist with update for meters and got DB error of: {error}',
		'csv.upload.meters.error.meter.name.db': 'Meter name of "{meterName}" got database error of: {error}',
		'csv.upload.meters.error.internal': 'Failed to upload meters due to internal OED Error: {error}',

		// CSV Readings Upload (uploadReadings.js)
		'csv.upload.readings.success.complete': 'It looks like the insert of the readings was a success.',
		'csv.upload.readings.success.with.warnings': 'However, note that the processing of the readings returned these warning(s):',
		'csv.upload.readings.error.has.issues': 'It looks like the insert of the readings had issues with some or all of the readings where the processing of the readings returned these warning(s)/error(s):',
		'csv.upload.readings.error.meter.identifier.not.found': "User Error: Meter with identifier '{identifier}' not found.",
		'csv.upload.readings.error.meter.name.not.found': "User Error: Meter with name '{name}' not found.",

		// Database Insertion (loadArrayInput.js)
		'csv.upload.readings.error.db.insert.with.updates': 'Attempting to insert the readings into the database with updates failed with error: "{error}" and the pipeline returned these messages: {messages}',
		'csv.upload.readings.error.db.insert': 'Attempting to insert the readings into the database failed with error: "{error}" and the pipeline returned these messages: {messages}',

		// Success/Failure Headers (success.js)
		'csv.upload.success.header': '<h1>SUCCESS</h1>',
		'csv.upload.failure.header': '<h1>FAILURE</h1>',

		// File Operations (saveCsv.js)
		'csv.upload.error.file.write.failed': 'Failed to write the file: {filepath}',
		'csv.upload.error.internal.oed': 'Internal OED error: {message}',

		// Reading Processing Pipeline (processData.js)
		'csv.upload.readings.error.cumulative.mismatch': 'On meter {meterName} in pipeline: cumulative was false but cumulative reset was true. To avoid mistakes all reading are rejected.',
		'csv.upload.readings.error.end.date.parse': 'The end date/time of {datetime} did not parse to a date/time using the normal format so a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.',
		'csv.upload.readings.error.start.date.parse': 'The start date/time of {datetime} did not parse to a date/time using the normal format so a less restrictive method is being tried. This is a warning since it can lead to wrong results but often okay.',
		'csv.upload.readings.error.parsing.reading.invalid.datetime': 'For meter {meterName}: Error parsing Reading #{readingNum}. The start ({start}) and/or end time ({end}) provided did not parse into a valid date/time so all reading are rejected.',
		'csv.upload.readings.error.parsing.reading.not.number': 'For meter {meterName}: Error parsing Reading #{readingNum}. The reading value provided of {value} is not considered a number so all reading are rejected.',
		'csv.upload.readings.info.first.reading.dropped.cumulative': 'The first ever reading must be dropped when dealing with cumulative data.',
		'csv.upload.readings.info.first.reading.dropped.end.only': 'The first ever reading must be dropped when dealing only with endTimestamps.',
		'csv.upload.readings.info.dst.prorate': 'This or a previous reading crossed from daylight savings time and is the first one that does not entirely overlap a previous reading so its reading will be prorated where the original values were: startTimestamp of {origStart} endTimestamp of {origEnd} reading value of {value}. The used part has startTimestamp of {usedStart} and endTimestamp of {usedEnd} and value of {usedValue}. This is only a notification and should not be an issue.',
		'csv.upload.readings.info.dst.dropped': 'This reading is entirely within the shift time from daylight savings to standard time so it is dropped. The dropped reading had startTimestamp of {start} and endTimestamp of {end} and value of {value}. This should not be an issue but the reading is lost.',
		'csv.upload.readings.info.dst.split.first': 'Reading #{readingNum} crossed into daylight savings so it needs to be split where the first part is now being used. The original reading had startTimestamp of {origStart} endTimestamp of {origEnd} reading value of {origValue} and the first part has a startTimestamp of {newStart} endTimestamp of {newEnd} reading value of {newValue}. This is only a notification and should not be an issue.',
		'csv.upload.readings.info.dst.split.second': 'Reading #{readingNum} crossed into daylight savings so it needs to be split where the second part is now being used. The original reading had startTimestamp of {origStart} endTimestamp of {origEnd} reading value of {origValue} and the second part has a startTimestamp of {newStart} endTimestamp of {newEnd} reading value of {newValue}. This is only a notification and should not be an issue.',
		'csv.upload.readings.warning.dst.shift.overlap': 'The reading start time is shifted and within the DST shift so it is possible that the crossing to standard time was missed and readings overlap.',
		'csv.upload.readings.error.end.before.start': 'The reading end time is not after the start time so we must drop the reading.',
		'csv.upload.readings.error.end.from.previous': ' The start time came from the previous readings end time.',
		'csv.upload.readings.error.not.after.previous': 'The reading is not after the previous reading with only end time given so we must drop the reading.',
		'csv.upload.readings.error.start.before.previous.cumulative': 'The reading start time is before the previous end time and the data is cumulative so OED cannot use this reading.',
		'csv.upload.readings.warning.start.not.after.previous': "The current reading startTime is not after the previous reading's end time. Note this is treated only as a warning since readings may be sent out of order.",
		'csv.upload.readings.error.gap.too.large.cumulative': 'The end of the previous reading is too far from the start of the next readings in cumulative data so drop this reading.',
		'csv.upload.readings.error.gap.too.large': 'There is a gap in time between this reading and the previous reading that exceeds the allowed amount of {gap} seconds.',
		'csv.upload.readings.error.negative.reading.meter': 'The last meter reading (logical previous reading) was negative with value {value}. With cumulative readings the previous reading cannot be negative so all reading are rejected.',
		'csv.upload.readings.error.negative.reading.detected': 'Error parsing Reading #{readingNum}. Detected a negative value while handling cumulative readings so all reading are rejected.',
		'csv.upload.readings.error.negative.reading.reset': 'For meter {meterName}: Error parsing Reading #{readingNum}. Reading value of {rawValue} gives {netValue} with error message: A negative meterReading has been detected but either cumulativeReset is not enabled, or the start time and end time of this reading is out of the reset range. Reject all readings.',
		'csv.upload.readings.error.length.variation': 'The previous reading has a different time length than the current reading and exceeds the tolerance of {variation} seconds. Note this is treated only as a warning since this may be expected for certain meters.',
		'csv.upload.readings.warning.parsing': 'For meter {meterName}: Warning parsing Reading #{readingNum}. Reading value gives {value} with warning message',
		'csv.upload.readings.error.parsing.value': 'For meter {meterName}: Error parsing Reading #{readingNum}. Reading value gives {value} with error message',
		'csv.upload.readings.error.validation.reject.bad': 'For meter {meterName}: Error when validating data where only bad readings are rejected',
		'csv.upload.readings.error.validation.reject.all': 'For meter {meterName}: Error when validating data where all readings are rejected',
		'csv.upload.readings.info.dropped.header': 'Readings Dropped and should have previous messages',
		'csv.upload.readings.warning.size.limit': 'WARNING - The total number of messages was stopped due to size. The log file has all the messages.',
	},

	// ============================================
	// FRENCH
	// ============================================
	'fr': {
		// CSV Route Error Messages (csv.js)
		'csv.upload.error.no.file': 'Aucun fichier csv n\'a été téléchargé. Un fichier csv doit être soumis via le paramètre csvfile.',

		// CSV Meters Upload (uploadMeters.js)
		'csv.upload.meters.success': 'Les compteurs ont été insérés avec succès.',
		'csv.upload.meters.error.gps.missing.comma': 'L\'entrée GPS manque une virgule',
		'csv.upload.meters.error.gps.too.many.commas': 'L\'entrée GPS contient trop de virgules',
		'csv.upload.meters.error.gps.invalid.coordinates': 'Coordonnées GPS invalides, la latitude doit être un entier entre -90 et 90, la longitude doit être un entier entre -180 et 180. Vous avez entré : {input}',
		'csv.upload.meters.error.gps.invalid': 'Pour le compteur {meterName}, les coordonnées GPS de {gps} sont invalides avec l\'erreur suivante : "{error}"',
		'csv.upload.meters.error.unit.invalid': 'Pour le compteur {meterName}, l\'unité {unit} est invalide',
		'csv.upload.meters.error.default.graphic.unit.invalid': 'Pour le compteur {meterName}, l\'unité graphique par défaut {unit} est invalide',
		'csv.upload.meters.error.identifier.multiple.meters': 'L\'identifiant de compteur fourni ("{identifier}") dans la demande de mise à jour des compteurs mais plus d\'un compteur dans le CSV donc pas de traitement',
		'csv.upload.meters.error.identifier.not.exist': 'L\'identifiant de compteur "{identifier}" ne semble pas exister avec la mise à jour des compteurs et a obtenu l\'erreur de base de données : {error}',
		'csv.upload.meters.error.meter.name.db': 'Le nom du compteur "{meterName}" a rencontré une erreur de base de données : {error}',
		'csv.upload.meters.error.internal': 'Échec du téléchargement des compteurs en raison d\'une erreur interne OED : {error}',

		// CSV Readings Upload (uploadReadings.js)
		'csv.upload.readings.success.complete': 'Il semble que l\'insertion des relevés ait réussi.',
		'csv.upload.readings.success.with.warnings': 'Cependant, notez que le traitement des relevés a renvoyé ces avertissement(s) :',
		'csv.upload.readings.error.has.issues': 'Il semble que l\'insertion des relevés ait rencontré des problèmes avec certains ou tous les relevés où le traitement des relevés a renvoyé ces avertissement(s)/erreur(s) :',
		'csv.upload.readings.error.meter.identifier.not.found': 'Erreur utilisateur : Compteur avec l\'identifiant \'{identifier}\' introuvable.',
		'csv.upload.readings.error.meter.name.not.found': 'Erreur utilisateur : Compteur avec le nom \'{name}\' introuvable.',

		// Database Insertion (loadArrayInput.js)
		'csv.upload.readings.error.db.insert.with.updates': 'La tentative d\'insertion des relevés dans la base de données avec mises à jour a échoué avec l\'erreur : "{error}" et le pipeline a renvoyé ces messages : {messages}',
		'csv.upload.readings.error.db.insert': 'La tentative d\'insertion des relevés dans la base de données a échoué avec l\'erreur : "{error}" et le pipeline a renvoyé ces messages : {messages}',

		// Success/Failure Headers (success.js)
		'csv.upload.success.header': '<h1>SUCCÈS</h1>',
		'csv.upload.failure.header': '<h1>ÉCHEC</h1>',

		// File Operations (saveCsv.js)
		'csv.upload.error.file.write.failed': 'Échec de l\'écriture du fichier : {filepath}',
		'csv.upload.error.internal.oed': 'Erreur interne OED : {message}',

		// Reading Processing Pipeline (processData.js)
		'csv.upload.readings.error.cumulative.mismatch': 'Sur le compteur {meterName} dans le pipeline : cumulatif était faux mais la réinitialisation cumulative était vraie. Pour éviter les erreurs, tous les relevés sont rejetés.',
		'csv.upload.readings.error.end.date.parse': 'La date/heure de fin de {datetime} n\'a pas pu être analysée en date/heure en utilisant le format normal, donc une méthode moins restrictive est tentée. Ceci est un avertissement car cela peut conduire à des résultats incorrects mais souvent acceptable.',
		'csv.upload.readings.error.start.date.parse': 'La date/heure de début de {datetime} n\'a pas pu être analysée en date/heure en utilisant le format normal, donc une méthode moins restrictive est tentée. Ceci est un avertissement car cela peut conduire à des résultats incorrects mais souvent acceptable.',
		'csv.upload.readings.error.parsing.reading.invalid.datetime': 'Pour le compteur {meterName} : Erreur d\'analyse du relevé #{readingNum}. Le début ({start}) et/ou l\'heure de fin ({end}) fournis n\'ont pas pu être analysés en date/heure valide, donc tous les relevés sont rejetés.',
		'csv.upload.readings.error.parsing.reading.not.number': 'Pour le compteur {meterName} : Erreur d\'analyse du relevé #{readingNum}. La valeur de relevé fournie de {value} n\'est pas considérée comme un nombre, donc tous les relevés sont rejetés.',
		'csv.upload.readings.info.first.reading.dropped.cumulative': 'Le tout premier relevé doit être supprimé lors du traitement de données cumulatives.',
		'csv.upload.readings.info.first.reading.dropped.end.only': 'Le tout premier relevé doit être supprimé lors du traitement uniquement avec des horodatages de fin.',
		'csv.upload.readings.info.dst.prorate': 'Ce relevé ou un relevé précédent a franchi l\'heure d\'été et est le premier qui ne chevauche pas entièrement un relevé précédent, donc son relevé sera au prorata où les valeurs d\'origine étaient : startTimestamp de {origStart} endTimestamp de {origEnd} valeur de relevé de {value}. La partie utilisée a startTimestamp de {usedStart} et endTimestamp de {usedEnd} et valeur de {usedValue}. Ceci n\'est qu\'une notification et ne devrait pas poser de problème.',
		'csv.upload.readings.info.dst.dropped': 'Ce relevé est entièrement dans la période de changement de l\'heure d\'été à l\'heure normale, donc il est supprimé. Le relevé supprimé avait startTimestamp de {start} et endTimestamp de {end} et valeur de {value}. Cela ne devrait pas poser de problème mais le relevé est perdu.',
		'csv.upload.readings.info.dst.split.first': 'Le relevé #{readingNum} a franchi l\'heure d\'été, donc il doit être divisé où la première partie est maintenant utilisée. Le relevé d\'origine avait startTimestamp de {origStart} endTimestamp de {origEnd} valeur de relevé de {origValue} et la première partie a un startTimestamp de {newStart} endTimestamp de {newEnd} valeur de relevé de {newValue}. Ceci n\'est qu\'une notification et ne devrait pas poser de problème.',
		'csv.upload.readings.info.dst.split.second': 'Le relevé #{readingNum} a franchi l\'heure d\'été, donc il doit être divisé où la deuxième partie est maintenant utilisée. Le relevé d\'origine avait startTimestamp de {origStart} endTimestamp de {origEnd} valeur de relevé de {origValue} et la deuxième partie a un startTimestamp de {newStart} endTimestamp de {newEnd} valeur de relevé de {newValue}. Ceci n\'est qu\'une notification et ne devrait pas poser de problème.',
		'csv.upload.readings.warning.dst.shift.overlap': 'L\'heure de début du relevé est décalée et dans le décalage DST, il est donc possible que le passage à l\'heure normale ait été manqué et que les relevés se chevauchent.',
		'csv.upload.readings.error.end.before.start': 'L\'heure de fin du relevé n\'est pas après l\'heure de début, nous devons donc supprimer le relevé.',
		'csv.upload.readings.error.end.from.previous': ' L\'heure de début provient de l\'heure de fin du relevé précédent.',
		'csv.upload.readings.error.not.after.previous': 'Le relevé n\'est pas après le relevé précédent avec seulement l\'heure de fin donnée, nous devons donc supprimer le relevé.',
		'csv.upload.readings.error.start.before.previous.cumulative': 'L\'heure de début du relevé est avant l\'heure de fin précédente et les données sont cumulatives, donc OED ne peut pas utiliser ce relevé.',
		'csv.upload.readings.warning.start.not.after.previous': 'L\'heure de début du relevé actuel n\'est pas après l\'heure de fin du relevé précédent. Notez que ceci n\'est traité que comme un avertissement car les relevés peuvent être envoyés dans le désordre.',
		'csv.upload.readings.error.gap.too.large.cumulative': 'La fin du relevé précédent est trop éloignée du début des relevés suivants dans les données cumulatives, donc supprimez ce relevé.',
		'csv.upload.readings.error.gap.too.large': 'Il y a un écart de temps entre ce relevé et le relevé précédent qui dépasse le montant autorisé de {gap} secondes.',
		'csv.upload.readings.error.negative.reading.meter': 'Le dernier relevé du compteur (relevé précédent logique) était négatif avec la valeur {value}. Avec les relevés cumulatifs, le relevé précédent ne peut pas être négatif, donc tous les relevés sont rejetés.',
		'csv.upload.readings.error.negative.reading.detected': 'Erreur d\'analyse du relevé #{readingNum}. Valeur négative détectée lors du traitement des relevés cumulatifs, donc tous les relevés sont rejetés.',
		'csv.upload.readings.error.negative.reading.reset': 'Pour le compteur {meterName} : Erreur d\'analyse du relevé #{readingNum}. La valeur de relevé de {rawValue} donne {netValue} avec message d\'erreur : Un relevé de compteur négatif a été détecté mais soit cumulativeReset n\'est pas activé, soit l\'heure de début et l\'heure de fin de ce relevé sont en dehors de la plage de réinitialisation. Rejeter tous les relevés.',
		'csv.upload.readings.error.length.variation': 'Le relevé précédent a une durée différente du relevé actuel et dépasse la tolérance de {variation} secondes. Notez que ceci n\'est traité que comme un avertissement car cela peut être attendu pour certains compteurs.',
		'csv.upload.readings.warning.parsing': 'Pour le compteur {meterName} : Avertissement lors de l\'analyse du relevé #{readingNum}. La valeur du relevé donne {value} avec message d\'avertissement',
		'csv.upload.readings.error.parsing.value': 'Pour le compteur {meterName} : Erreur lors de l\'analyse du relevé #{readingNum}. La valeur du relevé donne {value} avec message d\'erreur',
		'csv.upload.readings.error.validation.reject.bad': 'Pour le compteur {meterName} : Erreur lors de la validation des données où seuls les mauvais relevés sont rejetés',
		'csv.upload.readings.error.validation.reject.all': 'Pour le compteur {meterName} : Erreur lors de la validation des données où tous les relevés sont rejetés',
		'csv.upload.readings.info.dropped.header': 'Relevés supprimés et devrait avoir des messages précédents',
		'csv.upload.readings.warning.size.limit': 'AVERTISSEMENT - Le nombre total de messages a été arrêté en raison de la taille. Le fichier journal contient tous les messages.',
	},

	// ============================================
	// SPANISH
	// ============================================
	'es': {
		// CSV Route Error Messages (csv.js)
		'csv.upload.error.no.file': 'No se cargó ningún archivo csv. Se debe enviar un archivo csv a través del parámetro csvfile.',

		// CSV Meters Upload (uploadMeters.js)
		'csv.upload.meters.success': 'Los medidores se insertaron correctamente.',
		'csv.upload.meters.error.gps.missing.comma': 'La entrada GPS falta una coma',
		'csv.upload.meters.error.gps.too.many.commas': 'La entrada GPS tiene demasiadas comas',
		'csv.upload.meters.error.gps.invalid.coordinates': 'Coordenada GPS inválida, la latitud debe ser un entero entre -90 y 90, la longitud debe ser un entero entre -180 y 180. Usted ingresó: {input}',
		'csv.upload.meters.error.gps.invalid': 'Para el medidor {meterName}, las coordenadas GPS de {gps} son inválidas con el error: "{error}"',
		'csv.upload.meters.error.unit.invalid': 'Para el medidor {meterName}, la unidad {unit} es inválida',
		'csv.upload.meters.error.default.graphic.unit.invalid': 'Para el medidor {meterName}, la unidad gráfica predeterminada {unit} es inválida',
		'csv.upload.meters.error.identifier.multiple.meters': 'Identificador de medidor proporcionado ("{identifier}") en la solicitud con actualización para medidores pero más de un medidor en CSV, por lo que no se procesa',
		'csv.upload.meters.error.identifier.not.exist': 'El identificador de medidor "{identifier}" no parece existir con actualización para medidores y obtuvo error de base de datos: {error}',
		'csv.upload.meters.error.meter.name.db': 'El nombre del medidor "{meterName}" obtuvo error de base de datos: {error}',
		'csv.upload.meters.error.internal': 'Error al cargar medidores debido a un error interno de OED: {error}',

		// CSV Readings Upload (uploadReadings.js)
		'csv.upload.readings.success.complete': 'Parece que la inserción de las lecturas fue exitosa.',
		'csv.upload.readings.success.with.warnings': 'Sin embargo, tenga en cuenta que el procesamiento de las lecturas devolvió estas advertencia(s):',
		'csv.upload.readings.error.has.issues': 'Parece que la inserción de las lecturas tuvo problemas con algunas o todas las lecturas donde el procesamiento de las lecturas devolvió estas advertencia(s)/error(es):',
		'csv.upload.readings.error.meter.identifier.not.found': 'Error del usuario: Medidor con identificador \'{identifier}\' no encontrado.',
		'csv.upload.readings.error.meter.name.not.found': 'Error del usuario: Medidor con nombre \'{name}\' no encontrado.',

		// Database Insertion (loadArrayInput.js)
		'csv.upload.readings.error.db.insert.with.updates': 'El intento de insertar las lecturas en la base de datos con actualizaciones falló con error: "{error}" y el pipeline devolvió estos mensajes: {messages}',
		'csv.upload.readings.error.db.insert': 'El intento de insertar las lecturas en la base de datos falló con error: "{error}" y el pipeline devolvió estos mensajes: {messages}',

		// Success/Failure Headers (success.js)
		'csv.upload.success.header': '<h1>ÉXITO</h1>',
		'csv.upload.failure.header': '<h1>FALLO</h1>',

		// File Operations (saveCsv.js)
		'csv.upload.error.file.write.failed': 'Error al escribir el archivo: {filepath}',
		'csv.upload.error.internal.oed': 'Error interno de OED: {message}',

		// Reading Processing Pipeline (processData.js)
		'csv.upload.readings.error.cumulative.mismatch': 'En el medidor {meterName} en el pipeline: acumulativo era falso pero el reinicio acumulativo era verdadero. Para evitar errores, se rechazan todas las lecturas.',
		'csv.upload.readings.error.end.date.parse': 'La fecha/hora de finalización de {datetime} no se analizó a una fecha/hora usando el formato normal, por lo que se intenta un método menos restrictivo. Esta es una advertencia ya que puede llevar a resultados incorrectos pero a menudo está bien.',
		'csv.upload.readings.error.start.date.parse': 'La fecha/hora de inicio de {datetime} no se analizó a una fecha/hora usando el formato normal, por lo que se intenta un método menos restrictivo. Esta es una advertencia ya que puede llevar a resultados incorrectos pero a menudo está bien.',
		'csv.upload.readings.error.parsing.reading.invalid.datetime': 'Para el medidor {meterName}: Error al analizar la lectura #{readingNum}. El inicio ({start}) y/o el tiempo de finalización ({end}) proporcionados no se analizaron en una fecha/hora válida, por lo que se rechazan todas las lecturas.',
		'csv.upload.readings.error.parsing.reading.not.number': 'Para el medidor {meterName}: Error al analizar la lectura #{readingNum}. El valor de lectura proporcionado de {value} no se considera un número, por lo que se rechazan todas las lecturas.',
		'csv.upload.readings.info.first.reading.dropped.cumulative': 'La primera lectura debe eliminarse cuando se trata de datos acumulativos.',
		'csv.upload.readings.info.first.reading.dropped.end.only': 'La primera lectura debe eliminarse cuando se trata solo con marcas de tiempo de finalización.',
		'csv.upload.readings.info.dst.prorate': 'Esta lectura o una lectura anterior cruzó del horario de verano y es la primera que no se superpone completamente con una lectura anterior, por lo que su lectura se prorrateará donde los valores originales eran: startTimestamp de {origStart} endTimestamp de {origEnd} valor de lectura de {value}. La parte utilizada tiene startTimestamp de {usedStart} y endTimestamp de {usedEnd} y valor de {usedValue}. Esto es solo una notificación y no debería ser un problema.',
		'csv.upload.readings.info.dst.dropped': 'Esta lectura está completamente dentro del tiempo de cambio del horario de verano al horario estándar, por lo que se elimina. La lectura eliminada tenía startTimestamp de {start} y endTimestamp de {end} y valor de {value}. Esto no debería ser un problema pero la lectura se pierde.',
		'csv.upload.readings.info.dst.split.first': 'La lectura #{readingNum} cruzó al horario de verano, por lo que debe dividirse donde se usa ahora la primera parte. La lectura original tenía startTimestamp de {origStart} endTimestamp de {origEnd} valor de lectura de {origValue} y la primera parte tiene un startTimestamp de {newStart} endTimestamp de {newEnd} valor de lectura de {newValue}. Esto es solo una notificación y no debería ser un problema.',
		'csv.upload.readings.info.dst.split.second': 'La lectura #{readingNum} cruzó al horario de verano, por lo que debe dividirse donde se usa ahora la segunda parte. La lectura original tenía startTimestamp de {origStart} endTimestamp de {origEnd} valor de lectura de {origValue} y la segunda parte tiene un startTimestamp de {newStart} endTimestamp de {newEnd} valor de lectura de {newValue}. Esto es solo una notificación y no debería ser un problema.',
		'csv.upload.readings.warning.dst.shift.overlap': 'La hora de inicio de la lectura está desplazada y dentro del cambio DST, por lo que es posible que se haya perdido el cruce al horario estándar y las lecturas se superpongan.',
		'csv.upload.readings.error.end.before.start': 'La hora de finalización de la lectura no es posterior a la hora de inicio, por lo que debemos eliminar la lectura.',
		'csv.upload.readings.error.end.from.previous': ' La hora de inicio proviene de la hora de finalización de la lectura anterior.',
		'csv.upload.readings.error.not.after.previous': 'La lectura no es posterior a la lectura anterior con solo la hora de finalización dada, por lo que debemos eliminar la lectura.',
		'csv.upload.readings.error.start.before.previous.cumulative': 'La hora de inicio de la lectura es anterior a la hora de finalización anterior y los datos son acumulativos, por lo que OED no puede usar esta lectura.',
		'csv.upload.readings.warning.start.not.after.previous': 'La hora de inicio de la lectura actual no es posterior a la hora de finalización de la lectura anterior. Tenga en cuenta que esto se trata solo como una advertencia ya que las lecturas pueden enviarse fuera de orden.',
		'csv.upload.readings.error.gap.too.large.cumulative': 'El final de la lectura anterior está demasiado lejos del inicio de las siguientes lecturas en datos acumulativos, por lo que se elimina esta lectura.',
		'csv.upload.readings.error.gap.too.large': 'Hay una brecha de tiempo entre esta lectura y la lectura anterior que excede la cantidad permitida de {gap} segundos.',
		'csv.upload.readings.error.negative.reading.meter': 'La última lectura del medidor (lectura anterior lógica) fue negativa con valor {value}. Con lecturas acumulativas, la lectura anterior no puede ser negativa, por lo que se rechazan todas las lecturas.',
		'csv.upload.readings.error.negative.reading.detected': 'Error al analizar la lectura #{readingNum}. Se detectó un valor negativo al manejar lecturas acumulativas, por lo que se rechazan todas las lecturas.',
		'csv.upload.readings.error.negative.reading.reset': 'Para el medidor {meterName}: Error al analizar la lectura #{readingNum}. El valor de lectura de {rawValue} da {netValue} con mensaje de error: Se ha detectado una lectura de medidor negativa pero o bien cumulativeReset no está habilitado, o la hora de inicio y la hora de finalización de esta lectura están fuera del rango de reinicio. Rechazar todas las lecturas.',
		'csv.upload.readings.error.length.variation': 'La lectura anterior tiene una duración diferente a la lectura actual y excede la tolerancia de {variation} segundos. Tenga en cuenta que esto se trata solo como una advertencia ya que esto puede esperarse para ciertos medidores.',
		'csv.upload.readings.warning.parsing': 'Para el medidor {meterName}: Advertencia al analizar la lectura #{readingNum}. El valor de lectura da {value} con mensaje de advertencia',
		'csv.upload.readings.error.parsing.value': 'Para el medidor {meterName}: Error al analizar la lectura #{readingNum}. El valor de lectura da {value} con mensaje de error',
		'csv.upload.readings.error.validation.reject.bad': 'Para el medidor {meterName}: Error al validar datos donde solo se rechazan las lecturas incorrectas',
		'csv.upload.readings.error.validation.reject.all': 'Para el medidor {meterName}: Error al validar datos donde se rechazan todas las lecturas',
		'csv.upload.readings.info.dropped.header': 'Lecturas eliminadas y deben tener mensajes anteriores',
		'csv.upload.readings.warning.size.limit': 'ADVERTENCIA - El número total de mensajes se detuvo debido al tamaño. El archivo de registro tiene todos los mensajes.',
	}
};
module.exports = ServerTranslationData;