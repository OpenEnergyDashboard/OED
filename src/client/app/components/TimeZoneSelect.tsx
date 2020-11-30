import * as React from 'react';
import Select from 'react-select';
import axios from 'axios';

export interface TimeZones {
	name: string;
	abbrev: string;
	offset: string;
}

interface TimeZoneSelectProps {
	current: string;
	handleClick: (value: string) => void;
}

interface TimeZoneOption {
	value: string;
	label: string;
}

let options: null | TimeZoneOption[] = null;

axios.get('/api/timezones').then(res => {
	const timezones = res.data;
	console.log(timezones);
	options = timezones.map((timezone: TimeZones) => {
		return { value: timezone.name, label: `${timezone.name} (${timezone.abbrev}) ${timezone.offset}` };
	});
});

const TimeZoneSelect = ({ current, handleClick }: TimeZoneSelectProps) => {

	const handleChange = (selectedOption: TimeZoneOption | null) => {
		if (selectedOption != null) {
			handleClick(selectedOption.value);
		}
	};

	return (options !== null ? <Select value={current} options={options} onChange={handleChange} /> : <span>Please Reload</span>);
};

export default TimeZoneSelect;
