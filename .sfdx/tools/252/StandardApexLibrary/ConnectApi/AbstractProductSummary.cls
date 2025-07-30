global class AbstractProductSummary {
	global ConnectApi.ProductMedia defaultImage;
	global Map<String,ConnectApi.FieldValue> fields;
	global String id;
	global String name;
	global ConnectApi.ProductClass productClass;
	global String urlName;
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}