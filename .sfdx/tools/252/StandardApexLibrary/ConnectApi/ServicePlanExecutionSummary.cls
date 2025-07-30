global class ServicePlanExecutionSummary {
	global Datetime executedDate;
	global String status;
	global List<ConnectApi.ServicePlanStepExecutionSummary> steps;
	global ServicePlanExecutionSummary() { }
	global Object clone() { }
	global Boolean equals(Object obj) { }
	global Double getBuildVersion() { }
	global Integer hashCode() { }
	global String toString() { }

}