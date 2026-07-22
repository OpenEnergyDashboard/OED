/* This Source Code Form is subject to the terms of the Mozilla Public
* License, v. 2.0. If a copy of the MPL was not distributed with this
* file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import { Button, Col, FormFeedback, FormGroup, Input, Label, Modal, ModalBody, ModalFooter, ModalHeader, Row } from 'reactstrap';
import { daySegmentsApi } from '../../redux/api/daySegmentsApi';
import { DaySegment, UpdateDaySegmentPayload } from '../../types/redux/days';
import { showErrorNotification } from '../../utils/notifications';

interface EditDaySegmentModalComponentProps {
	/**
	 * Whether the modal is visible or not
	 */
	show: boolean;

	/**
	 * The day segment to edit
	 */
	daySegment: DaySegment;

	/**
	 * Function to run when edit modal closes
	 */
	handleClose: () => void;
}

/**
 * /**
 * Defines a modal that allows editing of an existing Day Segment.
 * @param props - The properties for the component
 * @returns Day segment edit element
 */
export default function EditDaySegmentModalComponent(props: EditDaySegmentModalComponentProps): React.ReactElement {
	const [daySegment, setDaySegment] = React.useState<UpdateDaySegmentPayload>(
		{ ...props.daySegment, originalStartHour: props.daySegment.startHour, originalEndHour: props.daySegment.endHour }
	);

	// Fetch day segments by day ID to validate start and end hours
	const { data: daySegments = [] } = daySegmentsApi.useGetDaySegmentsByDayIdQuery(props.daySegment.dayId);

	const [editDaySegmentMutation, { isLoading: isSaving }] = daySegmentsApi.useEditDaySegmentMutation();

	const handleStringChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDaySegment({ ...daySegment, [e.target.name]: e.target.value });
	};

	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setDaySegment({ ...daySegment, [e.target.name]: Number(e.target.value) });
	};

	const handleSubmit = () => {
		props.handleClose();
		editDaySegmentMutation(daySegment).unwrap()
			.then(() => {
			})
			.catch(error => {
				showErrorNotification(error);
			});
	};

	// The segment immediately before the current segment, if it exists.
	// Used to validate the start hour.
	const earlierSegment = React.useMemo(() => {
		const segmentIndex = daySegments.findIndex(s => s.id === props.daySegment.id);
		if (segmentIndex > 0) {
			return daySegments[segmentIndex - 1];
		}
		return null;
	}, [daySegments, props.daySegment.id]);

	// The segment immediately after the current segment, if it exists.
	// Used to validate the end hour.
	const laterSegment = React.useMemo(() => {
		const segmentIndex = daySegments.findIndex(s => s.id === props.daySegment.id);
		if (segmentIndex < daySegments.length - 1) {
			return daySegments[segmentIndex + 1];
		}
		return null;
	}, [daySegments, props.daySegment.id]);

	// Validate the start hour
	// It should be a valid hour and not conflict with existing segments
	const isStartHourValid = React.useMemo(() => {
		if (!Number.isInteger(daySegment.startHour) || daySegment.startHour < 0 || daySegment.startHour >= daySegment.endHour) {
			return false;
		}
		// Check if the start hour does not conflict with existing segments
		if (earlierSegment && daySegment.startHour <= earlierSegment.startHour) {
			return false;
		}

		return true;
	}, [daySegment.startHour, daySegment.endHour, earlierSegment]);

	// Validate the end hour
	// It should be a valid hour and not conflict with existing segments
	const isEndHourValid = React.useMemo(() => {
		if (!Number.isInteger(daySegment.endHour) || daySegment.endHour <= daySegment.startHour || daySegment.endHour > 24) {
			return false;
		}
		// Check if the end hour does not conflict with existing segments
		if (laterSegment && daySegment.endHour >= laterSegment.endHour) {
			return false;
		}

		return true;
	}, [daySegment.startHour, daySegment.endHour, laterSegment]);

	// Validate the segment as a whole
	// It should have valid start and end hours
	const isSegmentValid = React.useMemo(() => {
		return isStartHourValid && isEndHourValid;
	}, [daySegment.startHour, daySegment.endHour]);

	const isSegmentUnchanged = React.useMemo(() => {
		return props.daySegment.slope === daySegment.slope &&
			props.daySegment.intercept === daySegment.intercept &&
			props.daySegment.startHour === daySegment.startHour &&
			props.daySegment.endHour === daySegment.endHour &&
			props.daySegment.note === daySegment.note;
	}, [props.daySegment, daySegment]);

	return (
		<>
			<Modal isOpen={props.show} toggle={props.handleClose}>
				<ModalHeader>
					<FormattedMessage id="edit.segment.title" />
				</ModalHeader>
				<ModalBody>
					<FormGroup>
						<Label for="segment-slope">
							<FormattedMessage id="slope" />
						</Label>
						<Input
							id="segment-slope"
							name="slope"
							type="number"
							required
							value={daySegment.slope}
							onChange={handleNumberChange}
						/>
					</FormGroup>
					<FormGroup>
						<Label for="segment-intercept">
							<FormattedMessage id="intercept" />
						</Label>
						<Input
							id="segment-intercept"
							name="intercept"
							type="number"
							required
							value={daySegment.intercept}
							onChange={handleNumberChange}
						/>
					</FormGroup>
					<FormGroup>
						<Row>
							<Col>
								<Label for="segment-start-hour">
									<FormattedMessage id="day.start.hour" />
								</Label>
								<Input
									id="segment-start-hour"
									name="startHour"
									type="number"
									min={earlierSegment ? earlierSegment.startHour + 1 : 0}
									max={daySegment.endHour - 1}
									step="1"
									value={daySegment.startHour}
									onChange={handleNumberChange}
									invalid={!isStartHourValid}
									disabled={daySegment.originalStartHour === 0}
								/>
								<FormFeedback>
									<FormattedMessage id="day.segments.edit.start.hour.invalid" values={
										{ min: earlierSegment?.startHour ?? 0 }
									} />
								</FormFeedback>
							</Col>
							<Col>
								<Label for="segment-end-hour">
									<FormattedMessage id="day.end.hour" />
								</Label>
								<Input
									id="segment-end-hour"
									name="endHour"
									type="number"
									min={daySegment.startHour + 1}
									max={laterSegment ? laterSegment.endHour - 1 : 24}
									step="1"
									value={daySegment.endHour}
									onChange={handleNumberChange}
									invalid={!isEndHourValid}
									disabled={daySegment.originalEndHour === 24}
								/>
								<FormFeedback>
									<FormattedMessage id="day.segments.edit.end.hour.invalid" values={
										{ max: laterSegment?.endHour ?? 24 }
									} />
								</FormFeedback>
							</Col>
						</Row>
					</FormGroup>
					<FormGroup>
						<Label for="segment-note">
							<FormattedMessage id="note" />
						</Label>
						<Input
							id="segment-note"
							name="note"
							type="textarea"
							value={daySegment.note ?? ''}
							onChange={handleStringChange}
						/>
					</FormGroup>
				</ModalBody>
				<ModalFooter>
					{/* Discard changes */}
					<Button color="secondary" onClick={props.handleClose}>
						<FormattedMessage id="discard.changes" />
					</Button>
					{/* Save changes */}
					<Button
						color="primary"
						onClick={handleSubmit}
						disabled={isSegmentUnchanged || !isSegmentValid || isSaving}
					>
						<FormattedMessage id="day.segments.edit.save" />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
