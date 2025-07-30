global class ExternalAuthIdentityProviderInput {
	global ConnectApi.IdentityProviderAuthFlow authenticationFlow;
	global ConnectApi.IdentityProviderAuthProtocol authenticationProtocol;
	global String authorizeUrl;
	global String description;
	global String fullName;
	global String label;
	global String tokenUrl;
	global String userInfoUrl;
	global ExternalAuthIdentityProviderInput() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Integer hashCode() { }
	global String toString() { }

}