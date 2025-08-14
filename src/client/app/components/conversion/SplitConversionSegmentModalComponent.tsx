/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader
} from 'reactstrap';
import { ConversionSegmentData, SplitConversionSegmentPayload } from '../../types/redux/conversionSegments';
import { Week } from '../../types/redux/weeks';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import { conversionSegmentsApi } from '../../redux/api/conversionSegmentsApi';
import { selectDefaultSplitConversionSegmentValues } from '../../redux/selectors/adminSelectors';
import { showErrorNotification, showSuccessNotification } from '../../utils/notifications';
import { useTranslate } from '../../redux/componentHooks';
import * as moment from 'moment-timezone';

interface SplitConversionSegmentModalComponentProps {
	show: boolean;
	direction: 'earlier' | 'later';
	segment: ConversionSegmentData;
	weekPatterns: Week[];
	handleClose: () => void;
}

/**
 * Renders a modal that allows the user to split a conversion segment in either direction.
 * The new segment includes slope, intercept, pattern, and an optional note.
 * @param props The properties for the component
 * @returns A modal component for splitting a conversion segment
 */
export default function SplitConversionSegmentModalComponent(props: SplitConversionSegmentModalComponentProps): React.ReactElement {
	const translate = useTranslate();
	const defaultSegmentValues = selectDefaultSplitConversionSegmentValues(props.segment);
	const [newSegment, setNewSegment] = React.useState<SplitConversionSegmentPayload>(defaultSegmentValues);
	const [showWarningModal, setShowWarningModal] = React.useState(false);
	const [fieldError, setFieldError] = React.useState<string>('');

	const [splitEarlier] = conversionSegmentsApi.useSplitConversionSegmentEarlierMutation();
	const [splitLater] = conversionSegmentsApi.useSplitConversionSegmentLaterMutation();

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewSegment(prev => ({
			...prev,
			[e.target.name]: Number(e.target.value)
		}));
	};

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		setNewSegment(prev => ({
			...prev,
			[e.target.name]: e.target.value
		}));
	};

	const handlePatternChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
		const selectedPattern = Number(e.target.value);
		setNewSegment(prev => {
			if (selectedPattern === -99) {
				return {
					...prev,
					newWeekPatternsId: -99,
					newSlope: 0,
					newIntercept: 0
				};
			} else {
				return {
					...prev,
					newWeekPatternsId: selectedPattern
				};
			}
		});
	};

	const handleSplitTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewSegment(prev => ({
			...prev,
			splitTime: e.target.value
		}));
	};


	const doMutation = async () => {
		const payload: SplitConversionSegmentPayload = {
			...newSegment,
			sourceId: props.segment.sourceId,
			destinationId: props.segment.destinationId,
			startTime: props.segment.startTime,
			endTime: props.segment.endTime,
			splitTime: newSegment.splitTime,
			newWeekPatternsId: newSegment.newWeekPatternsId,
			newNote: newSegment.newNote || ''
		};

		try {
			if (props.direction === 'earlier') {
				await splitEarlier(payload).unwrap();
			} else {
				await splitLater(payload).unwrap();
			}
			showSuccessNotification(translate('conversion.segment.split.success'));
			props.handleClose();
		} catch (error) {
			showErrorNotification(translate('conversion.segment.split.error'));
		}
	};

	const handleSplitSegment = async () => {
		const isValidFormat = moment(newSegment.splitTime, 'YYYY-MM-DD HH:mm:ss', true).isValid();
		if (!isValidFormat) {
			setFieldError(translate('conversion.error.datetime.invalid'));
			return;
		}

		if (newSegment.newSlope === 0 && newSegment.newIntercept === 0 && newSegment.newWeekPatternsId === -99) {
			setShowWarningModal(true);
			return;
		}

		doMutation();
	};

	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose}>
				<ModalHeader>
					<FormattedMessage id={`split.${props.direction}`} />
				</ModalHeader>
				<ModalBody>
					<FormGroup>
						<Label for="splitTime"><FormattedMessage id="conversion.split.datetime.prompt" /></Label>
						<Input
							type="text"
							name="splitTime"
							id="splitTime"
							placeholder="YYYY-MM-DD HH:mm:ss"
							value={newSegment.splitTime}
							onChange={e => handleSplitTimeChange(e)}
							invalid={!!fieldError}
						/>
						<FormFeedback>{fieldError}</FormFeedback>
					</FormGroup>
					<FormGroup>
						<Label for="slope"><FormattedMessage id="slope" /></Label>
						<Input
							type="number"
							name="newSlope"
							id="slope"
							value={newSegment.newSlope}
							onChange={e => handleNumberChange(e)}
							disabled={newSegment.newWeekPatternsId !== -99}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="intercept"><FormattedMessage id="intercept" /></Label>
						<Input
							type="number"
							name="newIntercept"
							id="intercept"
							value={newSegment.newIntercept}
							onChange={e => handleNumberChange(e)}
							disabled={newSegment.newWeekPatternsId !== -99}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="pattern"><FormattedMessage id="conversion.pattern" /></Label>
						<Input
							type="select"
							name="newWeekPatternsId"
							id="pattern"
							value={newSegment.newWeekPatternsId}
							onChange={e => handlePatternChange(e)}
						>
							<option value={-99}>{translate('conversion.pattern.no')}</option>
							{props.weekPatterns.map(pattern => (
								<option key={pattern.id} value={pattern.id}>{pattern.name}</option>
							))}
						</Input>
					</FormGroup>
					<FormGroup>
						<Label for="note"><FormattedMessage id="note" /></Label>
						<Input
							type="textarea"
							name="newNote"
							id="note"
							value={newSegment.newNote}
							onChange={e => handleStringChange(e)}
						/>
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button color="primary" onClick={handleSplitSegment}>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>
			</Modal>

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
		</>
	);
}
