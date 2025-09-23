/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
//Realize that * is already imported from react
import { useState } from 'react';
import { Button } from 'reactstrap';
import { FormattedMessage } from 'react-intl';
import EditWeatherModalComponent from './EditWeatherModalComponent';
import '../../styles/card-page.css';
import { WeatherLocationData } from 'types/redux/weather';

interface WeatherViewComponentProps {
	weather: WeatherLocationData;
}

/**
 * Defines the weather info card
 * @param props variables passed in to define
 * @returns Weather info card element
 */
export default function WeatherViewComponent(props: WeatherViewComponentProps) {
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	return (
		<div className="card">
			<div className="identifier-container">
				{props.weather.identifier}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="weather.longitude" /></b> {props.weather.longitude}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="weather.latitude" /></b> {props.weather.latitude}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line. Protect against null from DB in note. */}
				<b><FormattedMessage id="note" /></b> {props.weather.note ? props.weather.note.slice(0, 29) : ''}
			</div>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="edit.weather.location" />
				</Button>
				{/* Creates a child UnitModalEditComponent */}
				<EditWeatherModalComponent
					show={showEditModal}
					location={props.weather}
					handleClose={handleClose} />
			</div>
		</div>
	);
}
