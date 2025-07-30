global class SfEval {
	global Object clone() { }
	global static ConnectApi.AiEvaluationJobStatusOutputRepresentation getPlannerEvaluationStatus(String runConfigurationId) { }
	global static ConnectApi.StartEvaluationOutput runAiEvaluation(String runConfigurationId) { }

}