/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Alert, Button, Col, FormGroup, Input, Label, Row } from 'reactstrap';
import {
	stableEmptyHolidays,
	useGetHolidaysQuery,
	useGetHolidayLocationsQuery,
	useRefreshHolidaysMutation
} from '../../redux/api/holidaysApi';
import { useTranslate } from '../../redux/componentHooks';
import { titleStyle } from '../../styles/modalStyle';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import HolidayViewComponent from './HolidayViewComponent';

/**
 * Defines the holiday import page.
 * @returns Holiday import page element
 */
export default function HolidayPage() {
	const translate = useTranslate();

	const [countryCode, setCountryCode] = React.useState('');
	const [stateCode, setStateCode] = React.useState('');
	const [regionCode, setRegionCode] = React.useState('');
	const [year, setYear] = React.useState(
		String(new Date().getFullYear())
	);
	const [refreshHolidays, { isLoading }] = useRefreshHolidaysMutation();
	const { data: holidays = stableEmptyHolidays } = useGetHolidaysQuery();

	const { data: locationData } = useGetHolidayLocationsQuery({
		country: countryCode,
		state: stateCode
	});

	const countries = React.useMemo(() => {
		if (locationData === undefined) {
			return [];
		}

		return locationData.countries;
	}, [locationData]);

	const states = React.useMemo(() => {
		if (locationData === undefined) {
			return [];
		}

		return locationData.states;
	}, [locationData]);

	const regions = React.useMemo(() => {
		if (locationData === undefined) {
			return [];
		}

		return locationData.regions;
	}, [locationData]);

	const selectedHolidays = React.useMemo(() => {
		if (countryCode.length === 0) {
			return [];
		}

		const selectedYear = Number(year);

		if (!Number.isInteger(selectedYear)) {
			return [];
		}

		const locationParts = [countryCode];

		if (stateCode.length > 0) {
			locationParts.push(stateCode);
		}

		if (regionCode.length > 0) {
			locationParts.push(regionCode);
		}

		const selectedLocation = locationParts.join('-');

		return holidays
			.filter(holiday => {
				if (holiday.location !== selectedLocation) {
					return false;
				}

				return Number(holiday.startDate.slice(0, 4)) === selectedYear;
			})
			.sort((first, second) => {
				const dateComparison = first.startDate.localeCompare(second.startDate);

				if (dateComparison !== 0) {
					return dateComparison;
				}

				return first.name.localeCompare(second.name);
			});
	}, [countryCode, stateCode, regionCode, year, holidays]);

	const handleCountryChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setCountryCode(event.target.value);
		setStateCode('');
		setRegionCode('');
	};

	const handleStateChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setStateCode(event.target.value);
		setRegionCode('');
	};

	const handleRegionChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setRegionCode(event.target.value);
	};

	const handleYearChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setYear(event.target.value);
	};

	const handleImport = () => {
		if (countryCode.length === 0) {
			showErrorNotification(translate('holiday.import.country.required'));
			return;
		}

		if (year.trim().length === 0) {
			showErrorNotification(translate('holiday.year.invalid'));
			return;
		}

		const selectedYear = Number(year);

		if (!Number.isInteger(selectedYear)) {
			showErrorNotification(translate('holiday.year.invalid'));
			return;
		}

		refreshHolidays({
			country: countryCode,
			state: stateCode,
			region: regionCode,
			year: selectedYear
		}).unwrap()
			.then(result => {
				showSuccessNotification(`${translate('holiday.import.success')}${result.total}`);
			})
			.catch(error => {
				showErrorNotification(`${translate('holiday.import.failure')}${error}`);
			});
	};

	let holidayContent: React.ReactNode = null;

	if (countryCode.length > 0 && selectedHolidays.length === 0) {
		holidayContent = <FormattedMessage id='holiday.none' />;
	}

	if (selectedHolidays.length > 0) {
		holidayContent = (
			<div className='card-container'>
				{selectedHolidays.map(holiday => (
					<HolidayViewComponent key={holiday.id} holiday={holiday} />
				))}
			</div>
		);
	}

	return (
		<div className='flexGrowOne'>
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage id='holidays' />
				</h2>
				<Alert color='warning'>
					<FormattedMessage id='holiday.history.warning' />
				</Alert>
				<Row>
					<Col md='3'>
						<FormGroup>
							<Label for='holiday-country'>
								<FormattedMessage id='holiday.country' />
							</Label>
							<Input
								id='holiday-country'
								type='select'
								value={countryCode}
								onChange={handleCountryChange}
							>
								<option value=''>
									<FormattedMessage id='holiday.country.select' />
								</option>
								{countries.map(country => (
									<option key={country.code} value={country.code}>
										{country.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
					<Col md='3'>
						<FormGroup>
							<Label for='holiday-state'>
								<FormattedMessage id='holiday.state' />
							</Label>
							<Input
								id='holiday-state'
								type='select'
								value={stateCode}
								onChange={handleStateChange}
								disabled={countryCode.length === 0 || states.length === 0}
							>
								<option value=''>
									<FormattedMessage id='holiday.state.select' />
								</option>
								{states.map(state => (
									<option key={state.code} value={state.code}>
										{state.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
					<Col md='3'>
						<FormGroup>
							<Label for='holiday-region'>
								<FormattedMessage id='holiday.region' />
							</Label>
							<Input
								id='holiday-region'
								type='select'
								value={regionCode}
								onChange={handleRegionChange}
								disabled={stateCode.length === 0 || regions.length === 0}
							>
								<option value=''>
									<FormattedMessage id='holiday.region.none' />
								</option>
								{regions.map(region => (
									<option key={region.code} value={region.code}>
										{region.name}
									</option>
								))}
							</Input>
						</FormGroup>
					</Col>
					<Col md='3'>
						<FormGroup>
							<Label for='holiday-year'>
								<FormattedMessage id='holiday.year' />
							</Label>
							<Input
								id='holiday-year'
								type='number'
								step='1'
								value={year}
								onChange={handleYearChange}
							/>
						</FormGroup>
					</Col>
				</Row>
				<Row>
					<Col md='auto'>
						<Button
							color='primary'
							type='button'
							onClick={handleImport}
							disabled={isLoading}
						>
							<FormattedMessage id='holiday.import.button' />
						</Button>
					</Col>
				</Row>
				<h3>
					<FormattedMessage id='holiday.saved' />
				</h3>
				{holidayContent}
			</div>
		</div>
	);
}
