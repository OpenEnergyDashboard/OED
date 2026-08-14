/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { Day } from 'types/redux/days';
import '../../styles/card-page.css';
import EditDailyPatternModalComponent from './EditDayModalComponent';

interface DayViewComponentProps {
	day: Day;
}

/**
 * Defines the daily pattern info card
 * @param props defined above
 * @returns Single day element
 */
export default function DayViewComponent(props: DayViewComponentProps) {
	// Edit Modal Show
	const [showEditModal, setShowEditModal] = React.useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	return (
		<div className="card">
			<div className="identifier-container">
				{props.day.name}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
				<b><FormattedMessage id="note" /></b> {props.day.note.slice(0, 29)}
			</div>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="day.edit" />
				</Button>
				{/* Creates a child DayModalEditComponent */}
				<EditDailyPatternModalComponent
					show={showEditModal}
					day={props.day}
					handleClose={handleClose}
				/>
			</div>
		</div>
	);
}
