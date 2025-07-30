global class IServiceProcessConnectFamily {
	global Object clone() { }
	global static ConnectApi.ServiceProcessRepresentation createCaseServiceProcess(ConnectApi.ServiceProcessRequestInputRepresentation serviceProcessRequestData) { }
	global static ConnectApi.ServiceProcessRecordRepresentation getCaseServiceProcess(String svcCatalogRequestId) { }
	global static ConnectApi.ServiceProcessRepresentation updateCaseServiceProcesses(ConnectApi.ServiceProcessRequestInputRepresentation serviceProcessRequestData, String svcCatalogRequestId) { }

}