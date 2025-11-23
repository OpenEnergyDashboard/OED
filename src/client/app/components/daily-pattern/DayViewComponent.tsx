/* eslint-disable no-trailing-spaces */
import * as React from 'react';
// Realize that * is already imported from react
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import { Day } from 'types/redux/days';
import '../../styles/card-page.css';
//import { useTranslate } from '../../redux/componentHooks';
//import EditConversionModalComponent from './EditConversionModalComponent';

interface DayViewComponentProps {
	day: Day;
}

/**
 * Defines the daily pattern info card
 * @param props defined above
 * @returns Single day element
 */
export default function DayViewComponent(props: DayViewComponentProps) {
	//const translate = useTranslate();
	// Don't check if admin since only an admin is allow to route to this page.

	// Edit Modal Show
	// eslint-disable-next-line @typescript-eslint/no-unused-vars
	const [showEditModal, setShowEditModal] = useState(false);
	//const unitDataById = useAppSelector(selectUnitDataById);

	const handleShow = () => {
		setShowEditModal(true);
	};

	// const handleClose = () => {
	// 	setShowEditModal(false);
	// };

	// Create header from sourceId, destinationId identifiers
	//const conversionIdentifier = String(unitDataById[props.conversion.sourceId]?.identifier + conversionArrow(props.conversion.bidirectional) +
	//  unitDataById[props.conversion.destinationId]?.identifier);
	const dayIdentifier = props.day.dayName || 'Unnamed Day';

	// Unlike the details component, we don't check if units are loaded since must come through that page.

	return (
		<div className="card">
			<div className="identifier-container">
				{dayIdentifier}
			</div>
			<div className="item-container">
				{/* Only show first 30 characters so card does not get too big. Should limit to one line */}
				<b><FormattedMessage id="note" /></b> {props.day.note.slice(0, 29)}
			</div>
			<div className="edit-btn">
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage id="daily.patterns.edit" />
				</Button>
				{/* Creates a child DayModalEditComponent */}
				{/* <EditDayModalComponent
					show={showEditModal}
					day={props.day}
					dayIdentifier={dayIdentifier}
					handleShow={handleShow}
					handleClose={handleClose} /> */}
			</div>
		</div>
	);
}
