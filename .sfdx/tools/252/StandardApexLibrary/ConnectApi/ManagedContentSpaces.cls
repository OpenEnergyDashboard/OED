global class ManagedContentSpaces {
	global Object clone() { }
	global static ConnectApi.ManagedContentSpaceChannelsRepresentation getManagedContentSpaceChannels(String contentSpaceId, Integer pageParam, Integer pageSize) { }
	global static ConnectApi.ManagedContentSpaceChannelsRepresentation patchManagedContentSpaceChannels(String contentSpaceId, ConnectApi.ManagedContentSpaceChannelsInputRepresentation spaceChannels) { }

}