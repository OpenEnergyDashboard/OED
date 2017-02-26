
export function stringifyTimeInterval(startTimestamp, endTimestamp) {
	if (startTimestamp === undefined && endTimestamp === undefined) {
		return 'all';
	}
	return `${startTimestamp} - ${endTimestamp}`;
}
