/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import Select from 'react-select';
import { TimeZoneOption } from 'types/timezone';
import { useTranslate } from '../redux/componentHooks';
import * as moment from 'moment-timezone';

interface TimeZoneSelectProps {
	// The timezone is a string and null is stored in DB when there isn't one.
	current: string | null;
	handleClick: (value: string) => void;
}

const TimeZoneSelect: React.FC<TimeZoneSelectProps> = ({ current, handleClick }) => {
	const translate = useTranslate();
	const getTimeZones = () => {
		const zoneNames = moment.tz.names();
		return zoneNames.map(zoneName => {
			const zone = moment.tz(zoneName);
			const abbrev = zone.format('z');
			return { value: zoneName, label: `${zoneName} (${abbrev})` };
		});
	};
	const resetTimeZone = [{ value: null, label: translate('timezone.no') }];
	const options = [...resetTimeZone, ...getTimeZones()];

	const handleChange = (selectedOption: TimeZoneOption) => {
		handleClick(selectedOption.value);
	};

	return <Select isClearable={false} value={options.filter(({ value }) => value === current)} options={options} onChange={handleChange} />;
};

export default TimeZoneSelect;
