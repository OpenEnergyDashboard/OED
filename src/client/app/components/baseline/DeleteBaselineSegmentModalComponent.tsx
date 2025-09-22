/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { Button } from 'reactstrap';
import { baselineSegmentsApi } from '../../redux/api/baselineApi';
import { useTranslate } from '../../redux/componentHooks';
import { BaselineSegment } from '../../types/redux/baselines';
import { showErrorNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';

interface DeleteBaselineSegmentComponentProps {
	/**
	 * The direction to delete the segment
	 */
	direction: 'earlier' | 'later';

	/**
	 * The baseline segment to delete
	 */
	baselineSegment: BaselineSegment;
}
/**
 * Defines a button that opens a modal to delete a baseline segment.
 * The deletion can be done earlier or later based on the direction prop.
 * @param props The properties for the component
 * @returns A button element
 */
export default function DeleteBaselineSegmentComponent(props: DeleteBaselineSegmentComponentProps): React.ReactElement {
	const translate = useTranslate();
	const [showDeleteModal, setShowDeleteModal] = React.useState(false);

	const handleShowDeleteModal = () => setShowDeleteModal(true);
	const handleHideDeleteModal = () => setShowDeleteModal(false);

	const [deleteBaselineSegmentEarlierMutation] = baselineSegmentsApi.useDeleteBaselineSegmentEarlierMutation();
	const [deleteBaselineSegmentLaterMutation] = baselineSegmentsApi.useDeleteBaselineSegmentLaterMutation();

	const handleDeleteBaselineSegment = async () => {
		try {
			if (props.direction === 'earlier') {
				await deleteBaselineSegmentEarlierMutation(props.baselineSegment).unwrap();
			} else if (props.direction === 'later') {
				await deleteBaselineSegmentLaterMutation(props.baselineSegment).unwrap();
			} else {
				throw new Error(
					translate('baseline.segments.delete.invalid.direction').replace('{direction}', props.direction)
				);
			}
			handleHideDeleteModal();
		} catch (error) {
			showErrorNotification(error);
		}
	};

	const deleteButtonText = props.direction === 'earlier'
		? translate('delete.earlier') : translate('delete.later');

	const deleteConfirmationMessage = props.direction === 'earlier'
		? translate('baseline.segments.delete.confirm.earlier')
		: translate('baseline.segments.delete.confirm.later');

	return (
		<>
			<Button size="sm" color="danger" onClick={handleShowDeleteModal}>
				{deleteButtonText}
			</Button>

			{/* Delete baseline segment confirmation modal */}
			<ConfirmActionModalComponent
				show={showDeleteModal}
				actionConfirmMessage={
					deleteConfirmationMessage
						.replace('{startHour}', props.baselineSegment.startTime.toString())
						.replace('{endHour}', props.baselineSegment.endTime.toString())
				}
				actionFunction={handleDeleteBaselineSegment}
				handleClose={handleHideDeleteModal}
				actionConfirmText={translate('baseline.segments.delete.confirm.button')}
				actionRejectText={translate('cancel')}
			/>
		</>
	);
}