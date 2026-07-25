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
import { HolidayInstanceDetails, HolidayInstanceGroup } from '../../types/redux/holidays';
import { useTranslate } from '../../redux/componentHooks';

interface EditHolidayInstanceGroupModalComponentProps {
	show: boolean;
	holidayInstanceGroup: HolidayInstanceGroup;
	holidayInstances: HolidayInstanceDetails[];
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

interface LocationOption extends SelectOption {
	location: string;
}

/**
 * Defines the edit holiday instance group modal form.
 * @param props Existing group data, available holiday instances, and action handlers.
 * @returns Holiday instance group edit element.
 */
export default function EditHolidayInstanceGroupModalComponent(
	props: EditHolidayInstanceGroupModalComponentProps
) {
	const translate = useTranslate();
	const [name, setName] = useState(props.holidayInstanceGroup.name ?? '');
	const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
	const [holidayInstanceIds, setHolidayInstanceIds] = useState<number[]>(
		props.holidayInstanceGroup.holidayInstanceIds
	);
	const [note, setNote] = useState(props.holidayInstanceGroup.note);
	const [showDeleteConfirmationModal, setShowDeleteConfirmationModal] = useState(false);

	const locations = React.useMemo(
		() => Array.from(new Set(
			props.holidayInstances
				.map(holidayInstance => holidayInstance.location.trim())
				.filter(location => location !== '')
		)).sort((first, second) =>
			first.localeCompare(second, undefined, { sensitivity: 'base' })),
		[props.holidayInstances]
	);
	const locationOptions: LocationOption[] = locations.map((location, index) => ({
		label: location,
		value: index,
		location
	}));
	const selectedLocationOptions = locationOptions.filter(option =>
		selectedLocations.includes(option.location)
	);
	const filteredHolidayInstances = props.holidayInstances.filter(holidayInstance =>
		selectedLocations.includes(holidayInstance.location.trim())
	);
	const sortedHolidayInstances = React.useMemo(
		() => [...filteredHolidayInstances].sort((first, second) =>
			first.name.localeCompare(second.name, undefined, { sensitivity: 'base' })),
		[filteredHolidayInstances]
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
		const groupLocations = Array.from(new Set(
			props.holidayInstanceGroup.holidayInstanceIds
				.map(id => props.holidayInstances.find(instance => instance.id === id)?.location.trim())
				.filter((location): location is string => Boolean(location))
		));
		setName(props.holidayInstanceGroup.name ?? '');
		setSelectedLocations(locations.length === 1 ? locations : groupLocations);
		setHolidayInstanceIds(props.holidayInstanceGroup.holidayInstanceIds);
		setNote(props.holidayInstanceGroup.note);
	}, [locations, props.holidayInstanceGroup, props.holidayInstances]);

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
				actionConfirmMessage={translate('holiday.instance.group.delete.confirm')}
				handleClose={handleDeleteConfirmationModalClose}
				actionFunction={handleDeleteHolidayInstanceGroup}
				actionConfirmText={translate('holiday.instance.group.delete')}
				actionRejectText={translate('cancel')}
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
								<FormGroup>
									<Label for='holidayLocation'>
										<FormattedMessage
											id='holiday.location'
										/>
									</Label>
									{locations.length > 1 ? (
										<MultiSelectComponent<LocationOption>
											options={locationOptions}
											selectedOptions={selectedLocationOptions}
											placeholder='Select locations'
											onValuesChange={(newSelectedLocationOptions: LocationOption[]) => {
												const updatedLocations = newSelectedLocationOptions.map(
													option => option.location
												);
												setSelectedLocations(updatedLocations);
												setHolidayInstanceIds(currentIds => currentIds.filter(id => {
													const holidayInstance = props.holidayInstances.find(
														instance => instance.id === id
													);
													return holidayInstance !== undefined
														&& updatedLocations.includes(holidayInstance.location.trim());
												}));
											}}
										/>
									) : (
										<Input
											id='holidayLocation'
											name='holidayLocation'
											type='select'
											disabled
											value={locations[0] ?? ''}
										>
											<option value={locations[0] ?? ''}>
												{locations[0] ?? (
													<FormattedMessage
														id='holiday.location.unavailable'
														defaultMessage='Unavailable'
													/>
												)}
											</option>
										</Input>
									)}
								</FormGroup>
							</Col>
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
										placeholder={
											selectedLocations.length > 0
												? 'Select holiday instances'
												: 'Select a location first'
										}
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
