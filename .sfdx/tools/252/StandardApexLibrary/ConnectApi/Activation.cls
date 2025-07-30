global class Activation {
	global ConnectApi.ActivationTarget activationTarget;
	global String audienceDmoApiName;
	global String audienceDmoLabel;
	global String dataSpace;
	global String description;
	global Datetime lastPublishDate;
	global ConnectApi.DataExportRunStatus lastPublishStatus;
	global String lastPublishStatusErrorMsg;
	global String membershipName;
	global ConnectApi.DataExportRefreshModeEnum refreshType;
	global String segmentApiName;
	global String segmentId;
	global ConnectApi.ActivationStatusEnum status;
	global Activation() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}