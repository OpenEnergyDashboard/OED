/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select from 'react-select';
import axios from 'axios';
import { TimeZones, TimeZoneOption } from 'types/timezone';

interface TimeZoneSelectProps {
	current?: TimeZoneOption;
	handleClick: (value: TimeZoneOption) => void;
}

let options: null | TimeZoneOption[] = null;

const TimeZoneSelect: React.FC<TimeZoneSelectProps> = ({ current, handleClick }) => {

	const [optionsLoaded, setOptionsLoaded] = React.useState(false);

	React.useEffect(() => {
		if (!optionsLoaded) {
			axios.get('/api/timezones').then(res => {
				const timezones = res.data;
				options = timezones.map((timezone: TimeZones) => {
					return { value: timezone.name, label: `${timezone.name} (${timezone.abbrev}) ${timezone.offset}` };
				});
				setOptionsLoaded(true);
			});
		}
	}, []);

	const handleChange = (selectedOption: TimeZoneOption | null) => {
		if (selectedOption != null) {
			handleClick(selectedOption);
		}
	};

	return (options !== null ? <Select isClearable={false} value={current} options={options} onChange={handleChange} /> : <span>Please Reload</span>);
};

export default TimeZoneSelect;
