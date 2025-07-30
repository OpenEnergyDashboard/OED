global class RecordRollupResultOutputRepresentation {
	global List<ConnectApi.RecordRollupResultColumnOutputRepresentation> columns;
	global String definitionDisplayName;
	global String message;
	global List<ConnectApi.RecordRollupResultRowOutputRepresentation> rows;
	global String statusCode;
	global Integer totalResultCount;
	global RecordRollupResultOutputRepresentation() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}