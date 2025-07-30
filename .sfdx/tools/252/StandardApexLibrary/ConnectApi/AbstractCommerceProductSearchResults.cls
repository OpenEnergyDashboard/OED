global class AbstractCommerceProductSearchResults {
	global ConnectApi.SearchCategory categories;
	global String correlationId;
	global List<ConnectApi.SearchFacet> facets;
	global String locale;
	global ConnectApi.CommerceProductSummaryPage productsPage;
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}