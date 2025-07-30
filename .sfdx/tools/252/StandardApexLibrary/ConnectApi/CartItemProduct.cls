global class CartItemProduct {
	global Map<String,String> fields;
	global String name;
	global String productId;
	global ConnectApi.ProductSellingModel productSubscriptionInformation;
	global ConnectApi.PurchaseQuantityRule purchaseQuantityRule;
	global String sku;
	global ConnectApi.ProductMedia thumbnailImage;
	global Map<String,ConnectApi.CartProductAttribute> variationAttributes;
	global CartItemProduct() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}