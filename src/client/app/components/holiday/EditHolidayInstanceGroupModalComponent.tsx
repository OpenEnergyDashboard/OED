/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect, useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
	Button,
	Col,
	Container,
	FormFeedback,
	FormGroup,
	Input,
	Label,
	Modal,
	ModalBody,
	ModalFooter,
	ModalHeader,
	Row
} from 'reactstrap';
import ConfirmActionModalComponent from '../ConfirmActionModalComponent';
import MultiSelectComponent from '../MultiSelectComponent';
import { SelectOption } from '../../types/items';
import { HolidayInstance } from '../../types/redux/holiday';

export interface HolidayInstanceGroupData {
	id: number;
	name: string;
	holidayInstanceIds: number[];
	note: string;
}

interface EditHolidayInstanceGroupModalComponentProps {
	show: boolean;
	holidayInstanceGroup: HolidayInstanceGroupData;
	holidayInstances: HolidayInstance[];
	handleShow: () => void;
	handleClose: () => void;
	onEditHolidayInstanceGroup: (
		holidayInstanceGroupId: number,
		name: string,
		holidayInstanceIds: number[],
		note: string
	) => void;
	onDeleteHolidayInstanceGroup?: (holidayInstanceGroupId: number) => void;
}

/**
 * Defines the edit holiday instance group modal form.
 * @param props Existing group data, available holiday instances, and action handlers.
 * @returns Holiday instance group edit element.
 */
export default function EditHolidayInstanceGroupModalComponent(
	props: EditHolidayInstanceGroupModalComponentProps
) {
	const [name, setName] = useState(props.holidayInstanceGroup.name ?? '');
	const [holidayInstanceIds, setHolidayInstanceIds] = useState<number[]>(
		props.holidayInstanceGroup.holidayInstanceIds
	);
	const [note, setNote] = useState(props.holidayInstanceGroup.note);
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);

	const sortedHolidayInstances = React.useMemo(
		() => [...props.holidayInstances].sort((first, second) =>
			first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })),
		[props.holidayInstances]
	);
	const holidayInstanceOptions: SelectOption[] = sortedHolidayInstances.map(holidayInstance => ({
		label: holidayInstance.name,
		value: holidayInstance.id
	}));
	const selectedHolidayInstanceOptions = holidayInstanceOptions.filter(option =>
		holidayInstanceIds.includes(option.value)
	);
	const validName = name.trim() !== '';
	const validHolidayInstanceGroup = validName && holidayInstanceIds.length > 0;

	const resetState = React.useCallback(() => {
		setName(props.holidayInstanceGroup.name ?? '');
		setHolidayInstanceIds(props.holidayInstanceGroup.holidayInstanceIds);
		setNote(props.holidayInstanceGroup.note);
	}, [props.holidayInstanceGroup]);

	useEffect(() => {
		if (props.show) {
			resetState();
		}
	}, [props.show, resetState]);

	const handleClose = () => {
		props.handleClose();
		resetState();
	};

	const handleSaveChanges = () => {
		if (!validHolidayInstanceGroup) {
			return;
		}

		props.handleClose();
		props.onEditHolidayInstanceGroup(
			props.holidayInstanceGroup.id,
			name.trim(),
			holidayInstanceIds,
			note
		);
	};

	const handleDeleteConfirmationModalOpen = () => {
		props.handleClose();
		setShowDeleteConfirmationModal(true);
	};

	const handleDeleteConfirmationModalClose = () => {
		setShowDeleteConfirmationModal(false);
		props.handleShow();
	};

	const handleDeleteHolidayInstanceGroup = () => {
		setShowDeleteConfirmationModal(false);
		props.onDeleteHolidayInstanceGroup?.(props.holidayInstanceGroup.id);
	};

	return (
		<>
			<ConfirmActionModalComponent
				show={showDeleteConfirmationModal}
				actionConfirmMessage={`Delete Holiday Instance Group ${props.holidayInstanceGroup.id}?`}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteHolidayInstanceGroup}
				actionConfirmText='Delete'
				actionRejectText='Cancel'
			/>

			<Modal isOpen={props.show} toggle={handleClose} size='lg'>
				<ModalHeader toggle={handleClose}>
					<FormattedMessage
						id='holiday.instance.group.edit'
					/>
				</ModalHeader>
				<ModalBody>
					<Container>
						<FormGroup>
							<Label for='name'>
								<FormattedMessage id='name'/>
							</Label>
							<Input
								id='name'
								name='name'
								type='text'
								value={name}
								onChange={e => setName(e.target.value)}
								required
								invalid={!validName}
							/>
							<FormFeedback>
								<FormattedMessage id='error.required'/>
							</FormFeedback>
						</FormGroup>

						<Row xs='1' lg='2'>
							<Col>
								{/* The holiday instances in this group */}
								<FormGroup>
									<Label>
										<FormattedMessage
											id='holiday.instances'
										/>
									</Label>
									<MultiSelectComponent
										options={holidayInstanceOptions}
										selectedOptions={selectedHolidayInstanceOptions}
										placeholder='Select holiday instances'
										onValuesChange={(newSelectedHolidayOptions: SelectOption[]) => {
											const updatedHolidayInstanceIds = newSelectedHolidayOptions.map(
												holidayInstance => holidayInstance.value
											);
											setHolidayInstanceIds(updatedHolidayInstanceIds);
										}}
									/>
									{holidayInstanceIds.length === 0 && (
										<FormFeedback className='d-block'>
											<FormattedMessage id='error.required' />
										</FormFeedback>
									)}
								</FormGroup>
							</Col>
							<Col>
								<FormGroup>
									<Label for='holidayRegionId'>
										<FormattedMessage
											id='holiday.region'
										/>
									</Label>
									<Input
										id='holidayRegionId'
										name='holidayRegionId'
										type='select'
										disabled
										value=''
									>
										<option value=''>
											<FormattedMessage
												id='holiday.region.unavailable'
											/>
										</option>
									</Input>
								</FormGroup>
							</Col>
						</Row>

						<FormGroup>
							<Label for='note'>
								<FormattedMessage id='note'/>
							</Label>
							<Input
								id='note'
								name='note'
								type='textarea'
								value={note}
								onChange={e => setNote(e.target.value)}
							/>
						</FormGroup>
					</Container>
				</ModalBody>
				<ModalFooter>
					{props.onDeleteHolidayInstanceGroup && (
						<Button color='danger' onClick={handleDeleteConfirmationModalOpen}>
							<FormattedMessage
								id='holiday.instance.group.delete'
							/>
						</Button>
					)}
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id='discard.changes' />
					</Button>
					<Button
						color='primary'
						onClick={handleSaveChanges}
						disabled={!validHolidayInstanceGroup}
					>
						<FormattedMessage id='save.all' />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
