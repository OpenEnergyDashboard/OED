/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Holiday } from '../../types/redux/holidays';
import { useTranslate } from '../../redux/componentHooks';
import '../../styles/card-page.css';

interface HolidayViewComponentProps {
	holiday: Holiday;
}

/**
 * Displays a saved holiday as card style.
 * @param props Holiday to display
 * @returns Saved holiday card
 */
export default function HolidayViewComponent(props: HolidayViewComponentProps) {
	const translate = useTranslate();

	return (
		<div className='card'>
			<div className='identifier-container'>
				{props.holiday.name}
			</div>
			<div className='item-container'>
				<b><FormattedMessage id='holiday.date' /></b> {props.holiday.startDate}
			</div>
			<div className='item-container'>
				<b><FormattedMessage id='holiday.location' /></b> {props.holiday.location}
			</div>
			<div className='item-container'>
				<b><FormattedMessage id='holiday.type' /></b> {translate(`holiday.type.${props.holiday.type}`)}
			</div>
		</div>
	);
}
