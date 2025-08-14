/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { ConversionSegmentData } from '../../types/redux/conversionSegments';
import { useTranslate } from '../../redux/componentHooks';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { conversionSegmentsApi } from '../../redux/api/conversionSegmentsApi';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';

interface DeleteConversionSegmentModalComponentProps {
	show: boolean;
	direction: 'earlier' | 'later';
	message: string;
	segment: ConversionSegmentData;
	handleClose: () => void;
}

/**
 * Renders a modal that confirms deletion of a conversion segment
 * in the 'earlier' or 'later' direction. Mutates the segment and
 * shows a success or error notification.
 * @param props Props for the component
 * @returns Modal component for deletion confirmation
 */
export default function DeleteConversionSegmentModalComponent(props: DeleteConversionSegmentModalComponentProps): React.ReactElement {
	const translate = useTranslate();

	const [deleteEarlier] = conversionSegmentsApi.useDeleteConversionSegmentEarlierMutation();
	const [deleteLater] = conversionSegmentsApi.useDeleteConversionSegmentLaterMutation();

	const handleHideDeleteModal = () => {
		props.handleClose();
	};

	const handleDeleteSegment = async () => {
		const payload = {
			sourceId: props.segment.sourceId,
			destinationId: props.segment.destinationId,
			startTime: props.segment.startTime,
			endTime: props.segment.endTime
		};

		try {
			if (props.direction === 'earlier') {
				await deleteEarlier(payload).unwrap();
			} else {
				await deleteLater(payload).unwrap();
			}
			showSuccessNotification(translate('conversion.segment.delete.success'));
			handleHideDeleteModal();
		} catch (error) {
			showErrorNotification(translate('conversion.segment.delete.error'));
		}
	};

	const deleteConfirmationMessage = props.direction === 'earlier'
		? translate('conversion.delete.segment.earlier')
		: translate('conversion.delete.segment.later');

	return (
		<ConfirmActionModalComponent
			show={props.show}
			actionConfirmMessage={
				deleteConfirmationMessage
					.replace('{start}', props.segment.startTime)
					.replace('{end}', props.segment.endTime)
			}
			actionFunction={handleDeleteSegment}
			handleClose={handleHideDeleteModal}
			actionConfirmText={translate('confirm.action')}
			actionRejectText={translate('cancel')}
		/>
	);
}
