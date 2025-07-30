global class ManagedContentCollectionDetailRepresentation {
	global String collectionKey;
	global ConnectApi.ManagedContentTypeSummary collectionType;
	global String id;
	global Boolean isPublished;
	global List<ConnectApi.ManagedContentCollectionItem> items;
	global String language;
	global String title;
	global Integer total;
	global String urlName;
	global String versionNumber;
	global ManagedContentCollectionDetailRepresentation() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}