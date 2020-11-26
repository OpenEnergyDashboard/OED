import * as React from 'react';
import Select from 'react-select';
import { timezones } from '../utils/TimeZones';

interface TimeZoneOption {
	label: string;
	value: string;
}

interface TimeZoneSelectProps {
	current: string;
	handleClick: (value: string) => void;
}

const options = timezones.map(timezone => {
	return { value: timezone.name, label: `${timezone.name} (${timezone.abbrev}) ${timezone.offset}` }
});

const TimeZoneSelect = ({ current, handleClick }: TimeZoneSelectProps) => {

	const handleChange = (selectedOption: TimeZoneOption | null) => {
		if (selectedOption != null) {
			handleClick(selectedOption.value);
		}
	};

	return (<Select value={current} options={options} onChange={handleChange} />);
};

export default TimeZoneSelect;
