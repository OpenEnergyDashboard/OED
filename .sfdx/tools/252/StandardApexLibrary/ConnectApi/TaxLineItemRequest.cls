global class TaxLineItemRequest {
	global ConnectApi.TaxAddressesRequest addresses;
	global Double amount;
	global String description;
	global Datetime effectiveDate;
	global String lineNumber;
	global String productCode;
	global Double quantity;
	global String taxCode;
	global TaxLineItemRequest() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Integer hashCode() { }
	global String toString() { }

}