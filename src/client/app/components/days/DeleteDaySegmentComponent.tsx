/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { useTranslate } from '../../redux/componentHooks';
import { DaySegment } from '../../types/redux/days';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';

interface DeleteDaySegmentComponentProps {
	/**
	 * The direction to delete the segment
	 */
	direction: 'earlier' | 'later';

	/**
	 * The day segment to delete
	 */
	daySegment: DaySegment;
}

/**
 * Defines a button that opens a modal to delete a day segment.
 * The deletion can be done earlier or later based on the direction prop.
 * @param props The properties for the component
 * @returns A button element
 */
export default function DeleteDaySegmentComponent(props: DeleteDaySegmentComponentProps): React.ReactElement {
	const translate = useTranslate();
	const [showDeleteModal, setShowDeleteModal] = React.useState(false);

	const handleShowDeleteModal = () => setShowDeleteModal(true);
	const handleHideDeleteModal = () => setShowDeleteModal(false);

	const [deleteDaySegmentEarlierMutation] = daySegmentsApi.useDeleteDaySegmentEarlierMutation();
	const [deleteDaySegmentLaterMutation] = daySegmentsApi.useDeleteDaySegmentLaterMutation();

	const handleDeleteDaySegment = async () => {
		try {
			if (props.direction === 'earlier') {
				await deleteDaySegmentEarlierMutation(props.daySegment).unwrap();
			} else if (props.direction === 'later') {
				await deleteDaySegmentLaterMutation(props.daySegment).unwrap();
			} else {
				throw new Error(
					translate('day.segments.delete.invalid.direction').replace('{direction}', props.direction)
				);
			}
			handleHideDeleteModal();
			showSuccessNotification(translate('day.segments.delete.success'));
		} catch (error) {
			showErrorNotification(error);
		}
	};

	const deleteButtonText = props.direction === 'earlier'
		? translate('delete.earlier') : translate('delete.later');

	const deleteConfirmationMessage = props.direction === 'earlier'
		? translate('day.segments.delete.confirm.earlier')
		: translate('day.segments.delete.confirm.later');

	return (
		<>
			<Button size="sm" color="danger" onClick={handleShowDeleteModal}>
				{deleteButtonText}
			</Button>

			{/* Delete day segment confirmation modal */}
			<ConfirmActionModalComponent
				show={showDeleteModal}
				actionConfirmMessage={
					deleteConfirmationMessage
						.replace('{startHour}', props.daySegment.startHour.toString())
						.replace('{endHour}', props.daySegment.endHour.toString())
				}
				actionFunction={handleDeleteDaySegment}
				handleClose={handleHideDeleteModal}
				actionConfirmText={translate('day.segments.delete.confirm.button')}
				actionRejectText={translate('cancel')}
			/>
		</>
	);
}
