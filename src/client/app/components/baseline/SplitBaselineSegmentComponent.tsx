/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader } from 'reactstrap';
import { baselineSegmentsApi } from '../../redux/api/baselineApi';
import { useTranslate } from '../../redux/componentHooks';
import { selectDefaultSplitBaselineSegmentValues } from '../../redux/selectors/adminSelectors';
import { BaselineSegment, SplitBaselineSegmentPayload } from '../../types/redux/baselines';
import { showErrorNotification } from '../../utils/notifications';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';

interface SplitBaselineSegmentComponentProps {
	/**
	 * The direction to split the segment
	 */
	direction: 'earlier' | 'later';

	/**
	 * The baseline segment to split
	 */
	baselineSegment: BaselineSegment;
}

/**
 * Defines a button that opens a modal to split a baseline segment into two segments.
 * The split can be done earlier or later based on the direction prop.
 * @param props The properties for the component
 * @returns A button element
 */
export default function SplitBaselineSegmentComponent(props: SplitBaselineSegmentComponentProps): React.ReactElement {
	const translate = useTranslate();

	const [splitHour, setSplitHour] = React.useState<number>(-999);

	const defaultSegmentValues = selectDefaultSplitBaselineSegmentValues(props.baselineSegment);

	// New segment to be created after the split
	const [newSegment, setNewSegment] = React.useState<SplitBaselineSegmentPayload>(defaultSegmentValues);

	const [showSplitModal, setShowSplitModal] = React.useState(false);

	// State for the warning modal
	const [showWarningModal, setShowWarningModal] = React.useState(false);
	const [warningMessage, setWarningMessage] = React.useState('');

	const [splitEarlierMutation] = baselineSegmentsApi.useSplitEarlierMutation();
	const [splitLaterMutation] = baselineSegmentsApi.useSplitLaterMutation();

	const handleShowSplitModal = () => setShowSplitModal(true);
	const handleHideSplitModal = () => setShowSplitModal(false);

	const handleSplitInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setSplitHour(Number(e.target.value));
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewSegment(prev => ({
			...prev,
			[e.target.name]: Number(e.target.value)
		}));
	};
	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setNewSegment(prev => ({
			...prev,
			[e.target.name]: e.target.value
		}));
	};

	// Validate the split hour
	// It should be greater than the start hour and less than the end hour
	const isSplitValid = React.useMemo(() => {
		if (!Number.isInteger(splitHour)) {
			return false;
		}
		return splitHour > props.baselineSegment.startTime && splitHour < props.baselineSegment.endTime;

	}, [splitHour, props.baselineSegment, props.direction]);

	const doMutation = () => {
		const mutation = props.direction === 'earlier'
			? splitEarlierMutation
			: splitLaterMutation;

		handleHideSplitModal();
		mutation({ ...newSegment, meterId: props.baselineSegment.meterId, splitTime: splitHour }).unwrap()
			.then(() => {
			})
			.catch(error => {
				showErrorNotification(error);
			});
	};

	// Handle the split operation
	const handleSubmit = () => {
		// Show warning modal if baseline value is 0
		if (newSegment.newBaselineValue === 0) {
			setWarningMessage(translate('baseline.baseline.zero'));
			setShowWarningModal(true);
			return;
		}
		doMutation();
	};

	const handleWarningCancel = () => {
		setShowWarningModal(false);
	};

	const handleWarningConfirm = () => {
		setShowWarningModal(false);
		doMutation();
	};

	return (
		<>
			<Button size="sm" onClick={handleShowSplitModal}>
				<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
			</Button>

			<Modal isOpen={showSplitModal} toggle={handleHideSplitModal}>
				<ModalHeader>
					<FormattedMessage id={props.direction === 'earlier' ? 'split.earlier' : 'split.later'} />
				</ModalHeader>
				<ModalBody>
					{/* split hour */}
					<FormGroup>
						<Label for="split">
							<FormattedMessage id="split.hour.prompt" />
						</Label>
						<Input
							id="split"
							type="number"
							min={props.baselineSegment.startTime + 1}
							max={props.baselineSegment.endTime - 1}
							step="1"
							onChange={handleSplitInputChange}
							placeholder={props.baselineSegment.startTime + 1 + ' - ' + (props.baselineSegment.endTime - 1)}
							invalid={!isSplitValid}
						/>
						<FormFeedback>
							{!isSplitValid && translate('split.hour.invalid')
								.replace('{start}', String(props.baselineSegment.startTime + 1))
								.replace('{end}', String(props.baselineSegment.endTime - 1))}
						</FormFeedback>
					</FormGroup>
					<FormGroup>
						<Label for="segment-baseline-value">
							<FormattedMessage id="baseline.value" />
						</Label>
						<Input
							id="segment-baseline-value"
							name="newBaselineValue"
							type="number"
							required
							value={newSegment.newBaselineValue}
							onChange={handleNumberChange}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="segment-note">
							<FormattedMessage id="note" />
						</Label>
						<Input
							id="segment-note"
							name="newNote"
							type="textarea"
							value={newSegment.newNote}
							onChange={handleStringChange}
						/>
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					<Button color="secondary" onClick={handleHideSplitModal}>
						<FormattedMessage id="cancel" />
					</Button>
					<Button
						color="primary"
						onClick={handleSubmit}
						disabled={!isSplitValid}
					>
						<FormattedMessage id="save.all" />
					</Button>
				</ModalFooter>

				{/* Warning modal if baseline value is zero */}
				<ConfirmActionModalComponent
					show={showWarningModal}
					actionConfirmMessage={warningMessage}
					handleClose={handleWarningCancel}
					actionFunction={handleWarningConfirm}
					actionConfirmText={translate('confirm.action')}
					actionRejectText={translate('cancel')}
				/>
			</Modal>
		</>
	);
}
