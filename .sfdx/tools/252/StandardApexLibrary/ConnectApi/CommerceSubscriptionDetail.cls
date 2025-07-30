global class CommerceSubscriptionDetail {
	global ConnectApi.CommerceSubscriptionBillingSummary billing;
	global Datetime endDate;
	global String id;
	global ConnectApi.BuyerProductSummary product;
	global Double quantity;
	global ConnectApi.ProductSellingModel sellingModel;
	global Datetime startDate;
	global CommerceSubscriptionDetail() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}