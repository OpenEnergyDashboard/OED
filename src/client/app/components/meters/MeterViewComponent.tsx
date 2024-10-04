/* This Source Code Form is subject to the terms of the Mozilla Public
	* License, v. 2.0. If a copy of the MPL was not distributed with this
	* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { MeterData } from 'types/redux/meters';
import { useAppSelector } from '../../redux/reduxHooks';
import { selectGraphicName, selectUnitName } from '../../redux/selectors/adminSelectors';
import '../../styles/card-page.css';
import { useTranslate } from '../../redux/componentHooks';
import EditMeterModalComponent from './EditMeterModalComponent';
import { selectIsAdmin } from '../../redux/slices/currentUserSlice';

interface MeterViewComponentProps {
	meter: MeterData;
}

/**
 * Defines the meter info card
 * @param props component props
 * @returns Meter info card element
 */
export default function MeterViewComponent(props: MeterViewComponentProps) {
	const translate = useTranslate();
	// Edit Modal Show
	const [showEditModal, setShowEditModal] = useState(false);
	// Check for admin status
	const loggedInAsAdmin = useAppSelector(selectIsAdmin);


	// Set up to display the units associated with the meter as the unit identifier.
	// This is the unit associated with the meter.
	const unitName = useAppSelector(state => selectUnitName(state, props.meter.id));
	// This is the default graphic unit  name associated with the meter.
	const graphicName = useAppSelector(state => selectGraphicName(state, props.meter.id));
	const handleShow = () => {
		setShowEditModal(true);
	};
	const handleClose = () => {
		setShowEditModal(false);
	};
	// Only display limited data if not an admin.
	return (
		<div className="card">
			<div className="identifier-container">
				{props.meter.identifier}
			</div>
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="name" /></b> {props.meter.name}
				</div>
			}
			<div className="item-container">
				<b><FormattedMessage id="meter.unitName" /></b> {unitName}
			</div>
			<div className="item-container">
				<b><FormattedMessage id="defaultGraphicUnit" /></b> {graphicName}
			</div>
			{loggedInAsAdmin &&
				<div className="item-container">
					<b><FormattedMessage id="meter.enabled" /></b> {translate(`TrueFalseType.${props.meter.enabled.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className={props.meter.displayable.toString()}>
					<b><FormattedMessage id="displayable" /></b> {translate(`TrueFalseType.${props.meter.displayable.toString()}`)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="item-container">
					{/* Only show first 30 characters so card does not get too big. Should limit to one line. Check in case null. */}
					<b><FormattedMessage id="note" /></b> {props.meter.note?.slice(0, 29)}
				</div>
			}
			{loggedInAsAdmin &&
				<div className="edit-btn">
					<Button color='secondary' onClick={handleShow}>
						<FormattedMessage id="edit.meter" />
					</Button>
					{/* Creates a child MeterModalEditComponent */}
					<EditMeterModalComponent
						show={showEditModal}
						meter={props.meter}
						handleClose={handleClose}
					/>
				</div>
			}
		</div>
	);
}
