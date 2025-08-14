/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { ConversionSegmentData, UpdateConversionSegmentPayload } from '../../types/redux/conversionSegments';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { conversionSegmentsApi } from '../../redux/api/conversionSegmentsApi';
import { Week } from '../../types/redux/weeks';
import * as moment from 'moment-timezone';
import { useTranslate } from '../../redux/componentHooks';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';

interface EditConversionSegmentModalComponentProps {
	show: boolean;
	segment: UpdateConversionSegmentPayload;
	weekPatterns: Week[];
	segments: ConversionSegmentData[];
	handleClose: () => void;
}

/**
 * Renders a modal for editing a conversion segment.
 * Users can modify slope, intercept, start/end times, weekly pattern, and notes.
 * @param props The properties for the component
 * @returns A modal element for editing a conversion segment
 */
export default function EditConversionSegmentModalComponent(props: EditConversionSegmentModalComponentProps): React.ReactElement {
	const translate = useTranslate();
	const [segment, setSegment] = React.useState<UpdateConversionSegmentPayload>(props.segment);
	const [editSegment] = conversionSegmentsApi.useEditConversionSegmentMutation();
	const [fieldErrors, setFieldErrors] = React.useState<{ segmentTimeError?: string; errorField?: string }>({});
	const [showWarningModal, setShowWarningModal] = React.useState(false);

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSegment(prev => ({
			...prev,
			[e.target.name]: Number(e.target.value),
			weekPatternsId: -99
		}));
	};

	const handleDatetimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSegment(prev => ({
			...prev,
			[e.target.name]: e.target.value
		}));
		setFieldErrors(prev => (prev.errorField === e.target.name ? {} : prev));
	};

	const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const selectedPattern = Number(e.target.value);
		setSegment(prev => {
			// If "No Pattern" is selected, keep slope/intercept; otherwise reset them
			if (selectedPattern === -99) {
				return {
					...prev,
					weekPatternsId: -99,
					slope: prev.slope,
					intercept: prev.intercept
				};
			} else {
				return {
					...prev,
					weekPatternsId: selectedPattern,
					slope: 0,
					intercept: 0
				};
			}
		});
	};

	const handleNoteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSegment(prev => ({
			...prev,
			note: e.target.value
		}));
	};

	const doMutation = async () => {
		try {
			await editSegment({
				segment,
				originalStartTime: segment.originalStartTime,
				originalEndTime: segment.originalEndTime
			}).unwrap();
			showSuccessNotification(translate('conversion.segment.save.success'));
			props.handleClose();
		} catch (error) {
			showErrorNotification(translate('conversion.segment.save.error'));
		}
	};

	const handleEditSegment = async () => {
		const isStartTimeValid = moment(segment.startTime, 'YYYY-MM-DD HH:mm:ss', true).isValid() || segment.startTime === '-infinity';
		const isEndTimeValid = moment(segment.endTime, 'YYYY-MM-DD HH:mm:ss', true).isValid() || segment.endTime === 'infinity';

		if (!isStartTimeValid) {
			setFieldErrors({
				segmentTimeError: translate('conversion.error.datetime.invalid'),
				errorField: 'startTime' });
			return;
		}
		if (!isEndTimeValid) {
			setFieldErrors({
				segmentTimeError: translate('conversion.error.datetime.invalid'),
				errorField: 'endTime' });
			return;
		}

		const wasAlreadyNeutral =
			props.segment.slope === 0 &&
			props.segment.intercept === 0 &&
			props.segment.weekPatternsId === -99;

		const isNowNeutral =
			segment.slope === 0 &&
			segment.intercept === 0 &&
			segment.weekPatternsId === -99;

		// Show warning if neutral slope/intercept and no pattern
		if (isNowNeutral && !wasAlreadyNeutral) {
			setShowWarningModal(true);
			return;
		}

		// Find the index of the segment being edited
		const index = props.segments.findIndex(
			seg => seg.startTime === segment.originalStartTime && seg.endTime === segment.originalEndTime
		);

		// Get previous and next segments
		const previous = props.segments[index - 1];
		const next = props.segments[index + 1];

		// If editing a segment's time range, ensure there are no gaps or overlaps with adjacent segments,
		// but only if the range is bounded (i.e., not -infinity or infinity).
		if (segment.startTime !== '-infinity' && previous) {
			const startMatches = moment.utc(segment.startTime, 'YYYY-MM-DD HH:mm:ss').isSame(moment.utc(previous.endTime));
			if (!startMatches) {
				setFieldErrors({
					segmentTimeError: translate('conversion.error.segment.startTimeMismatch'),
					errorField: 'startTime'
				});
				return;
			}
		}

		if (segment.endTime !== 'infinity' && next) {
			const endMatches = moment.utc(segment.endTime, 'YYYY-MM-DD HH:mm:ss').isSame(moment.utc(next.startTime));
			if (!endMatches) {
				setFieldErrors({
					segmentTimeError: translate('conversion.error.segment.endTimeMismatch'),
					errorField: 'endTime'
				});
				return;
			}
		}

		doMutation();
	};

	return (
		<Modal isOpen={props.show} toggle={props.handleClose}>
			<ModalHeader>
				<FormattedMessage id="conversion.edit.segment" />
			</ModalHeader>
			<ModalBody>
				<FormGroup>
					<Label for='startTime'><FormattedMessage id='conversion.time.start' /></Label>
					<Input
						type='text'
						name='startTime'
						value={segment.startTime}
						onChange={e => handleDatetimeChange(e)}
						invalid={fieldErrors.errorField === 'startTime'}
						disabled={segment.startTime === '-infinity'}
					/>
					<FormFeedback>{fieldErrors.segmentTimeError}</FormFeedback>
				</FormGroup>
				<FormGroup>
					<Label for='endTime'><FormattedMessage id='conversion.time.end' /></Label>
					<Input
						type='text'
						name='endTime'
						value={segment.endTime}
						onChange={e => handleDatetimeChange(e)}
						invalid={fieldErrors.errorField === 'endTime'}
						disabled={segment.endTime === 'infinity'}
					/>
					<FormFeedback>{fieldErrors.segmentTimeError}</FormFeedback>
				</FormGroup>
				<FormGroup>
					<Label for='slope'><FormattedMessage id='slope' /></Label>
					<Input
						type='number'
						name='slope'
						value={segment.slope}
						onChange={e => handleNumberChange(e)}
						disabled={segment.weekPatternsId !== -99}
					/>
				</FormGroup>
				<FormGroup>
					<Label for='intercept'><FormattedMessage id='intercept' /></Label>
					<Input
						type='number'
						name='intercept'
						value={segment.intercept}
						onChange={e => handleNumberChange(e)}
						disabled={segment.weekPatternsId !== -99}
					/>
				</FormGroup>
				<FormGroup>
					<Label for='pattern'><FormattedMessage id='conversion.pattern' /></Label>
					<Input
						type='select'
						name='pattern'
						value={segment.weekPatternsId}
						onChange={e => handlePatternChange(e)}
					>
						<option value={-99}>{translate('conversion.pattern.no')}</option>
						{props.weekPatterns.map(pattern => (
							<option key={pattern.id} value={pattern.id}>{pattern.name}</option>
						))}
					</Input>
				</FormGroup>
				<FormGroup>
					<Label for='note'><FormattedMessage id='note' /></Label>
					<Input
						type='textarea'
						name='note'
						value={segment.note ?? ''}
						onChange={e => handleNoteChange(e)}
					/>
				</FormGroup>
			</ModalBody>
			<ModalFooter>
				<Button color='secondary' onClick={props.handleClose}>
					<FormattedMessage id='cancel' />
				</Button>
				<Button color='primary' onClick={handleEditSegment}>
					<FormattedMessage id='save.all' />
				</Button>
			</ModalFooter>
			<ConfirmActionModalComponent
				show={showWarningModal}
				actionConfirmMessage={translate('conversion.slope.intercept.zero')}
				handleClose={() => setShowWarningModal(false)}
				actionFunction={() => {
					setShowWarningModal(false);
					doMutation();
				}}
				actionConfirmText={translate('confirm.action')}
				actionRejectText={translate('cancel')}
			/>
		</Modal>
	);
}
