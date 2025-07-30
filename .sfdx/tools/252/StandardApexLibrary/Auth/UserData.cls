global class UserData {
	global Map<String,String> attributeMap;
	global String email;
	global String firstName;
	global String fullName;
	global String identifier;
	global String lastName;
	global String link;
	global String locale;
	global String provider;
	global String siteLoginUrl;
	global String username;
	global UserData(String identifier, String firstName, String lastName, String fullName, String email, String link, String username, String locale, String provider, String siteLoginUrl, Map<String,String> attributeMap) { }
	global Object clone() { }

}