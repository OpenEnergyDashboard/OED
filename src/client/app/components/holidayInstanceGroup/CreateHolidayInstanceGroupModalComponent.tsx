/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
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
import MultiSelectComponent from '../MultiSelectComponent';
import { SelectOption } from '../../types/items';
import { HolidayInstance } from '../../types/redux/holidays';
import { useTranslate } from '../../redux/componentHooks';

interface CreateHolidayInstanceGroupModalComponentProps {
	holidayInstances: HolidayInstance[];
	onCreateHolidayInstanceGroup: (name: string, holidayInstanceIds: number[], note: string) => void;
}

/**
 * Defines the create holiday instance group modal form.
 * @param props Available holiday instances and the create handler.
 * @returns Holiday instance group create element.
 */
export default function CreateHolidayInstanceGroupModalComponent(
	props: CreateHolidayInstanceGroupModalComponentProps
) {
	const translate = useTranslate();
	const [showModal, setShowModal] = useState(false);
	const [name, setName] = useState('');
	const [holidayInstanceIds, setHolidayInstanceIds] = useState<number[]>([]);
	const [note, setNote] = useState('');

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

	const resetState = () => {
		setName('');
		setHolidayInstanceIds([]);
		setNote('');
	};

	const handleShow = () => setShowModal(true);

	const handleClose = () => {
		setShowModal(false);
		resetState();
	};

	const handleSubmit = () => {
		if (holidayInstanceIds.length === 0) {
			return;
		}

		props.onCreateHolidayInstanceGroup(name.trim(), holidayInstanceIds, note);
		setShowModal(false);
		resetState();
	};

	const validName = name.trim() !== '';
	const validHolidayInstanceGroup = validName && holidayInstanceIds.length > 0;

	return (
		<>
			<Button color='secondary' onClick={handleShow}>
				<FormattedMessage
					id='holiday.instance.group.create'
				/>
			</Button>

			<Modal isOpen={showModal} toggle={handleClose} size='lg'>
				<ModalHeader toggle={handleClose}>
					<FormattedMessage
						id='holiday.instance.group.create'
					/>
				</ModalHeader>
				<ModalBody>
					<Container>
						<FormGroup>
							<Label for='name'>
								<FormattedMessage id='name' />
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
								<FormattedMessage id='error.required' />
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
										placeholder={translate('select.holiday.rates')}
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
								<FormattedMessage id='note' />
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
					<Button color='secondary' onClick={handleClose}>
						<FormattedMessage id='discard.changes' />
					</Button>
					<Button
						color='primary'
						onClick={handleSubmit}
						disabled={!validHolidayInstanceGroup}
					>
						<FormattedMessage id='save.all' />
					</Button>
				</ModalFooter>
			</Modal>
		</>
	);
}
