global class Example {
	global Object clone() { }
	global static ConnectApi.ExampleEntityRepresentation getExampleEntityWithFields(String recordId, List<String> fields) { }
	global static ConnectApi.ExampleEntityRepresentation getExampleEntityWithOptionalParameters(String recordId, List<String> fields, Map<String,String> connectDynamicParameters) { }
	global static ConnectApi.ExampleListRepresentation getExampleListWithFields(String recordId, List<String> fields) { }
	global static ConnectApi.ExampleMapRepresentation getExampleMapWithFields(String recordId, List<String> fields) { }
	global static ConnectApi.ExampleSerializationRepresentation postExampleSerialization(ConnectApi.ExampleSerializationInputRepresentation input) { }
	global static ConnectApi.ExampleEntityRepresentation updateExampleEntity(String recordId, ConnectApi.ExampleEntityInputRepresentation recordInput) { }
	global static ConnectApi.ExampleEntityRepresentation updateExampleEntityWithOptionalParameters(String recordId, ConnectApi.ExampleEntityInputRepresentation recordInput, Map<String,String> connectDynamicParameters) { }
	global static ConnectApi.ExampleListRepresentation updateExampleList(String recordId, ConnectApi.ExampleListInputRepresentation recordInput) { }
	global static ConnectApi.ExampleMapRepresentation updateExampleMap(String recordId, ConnectApi.ExampleMapInputRepresentation recordInput) { }

}