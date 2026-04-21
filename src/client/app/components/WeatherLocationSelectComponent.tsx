/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import Select from 'react-select';
import { useSelector } from 'react-redux';
import TooltipMarkerComponent from './TooltipMarkerComponent';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { selectSelectedWeatherLocationId, updateSelectedWeatherLocationId } from '../redux/slices/graphSlice';
import { weatherLocationApi, selectAllWeatherLocations } from '../redux/api/weatherLocationApi';
import { useTranslate } from '../redux/componentHooks';

interface WeatherLocationOption {
	label: string;
	value: string | null;
}

/**
 * React Component that creates the weather location selector dropdown for the temperature chart
 * @returns weather location select element
 */
export default function WeatherLocationSelectComponent() {
	const dispatch = useAppDispatch();
	const translate = useTranslate();
	const selectedWeatherLocationId = useAppSelector(selectSelectedWeatherLocationId);

	// Fetch weather locations into the store (no-op if already cached)
	weatherLocationApi.useGetWeatherLocationDetailsQuery();
	const weatherLocations = useSelector(selectAllWeatherLocations);

	const weatherLocationOptions: WeatherLocationOption[] = [
		{ value: null, label: translate('weather.location.no') },
		...weatherLocations.map(loc => ({
			value: String(loc.id),
			label: loc.identifier
		}))
	];

	const currentOption =
		weatherLocationOptions.find(opt => opt.value === String(selectedWeatherLocationId))
		?? weatherLocationOptions[0];

	const divBottomPadding: React.CSSProperties = {
		paddingBottom: '15px'
	};

	return (
		<div>
			<p style={{ fontWeight: 'bold', margin: 0 }}>
				<FormattedMessage id='weather.location' />
				<TooltipMarkerComponent page='home' helpTextId='help.home.weather.location' />
			</p>
			<div style={divBottomPadding}>
				<Select
					value={currentOption}
					options={weatherLocationOptions}
					onChange={selected => {
						dispatch(updateSelectedWeatherLocationId(
							selected?.value ? Number(selected.value) : null
						));
					}}
				/>
			</div>
		</div>
	);
}
