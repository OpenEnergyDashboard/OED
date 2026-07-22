/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { Button } from 'reactstrap';
import '../../styles/card-page.css';
import EditHolidayInstanceGroupModalComponent from './EditHolidayInstanceGroupModalComponent';

/**
 * Defines a holiday instance group information card.
 * @param {object} props Component properties.
 * @param {{id: number, name: string, holidayInstanceIds: number[], note: string}} props.holidayInstanceGroup Group data.
 * @param {Array<{id: number, name: string}>} props.holidayInstances Available holiday instances.
 * @param {(id: number, name: string, holidayInstanceIds: number[], note: string) => void} props.onEditHolidayInstanceGroup Edit handler.
 * @param {(id: number) => void} [props.onDeleteHolidayInstanceGroup] Optional delete handler.
 * @returns Holiday instance group card element.
 */
export default function HolidayInstanceGroupViewComponent(props) {
	const [showEditModal, setShowEditModal] = useState(false);

	const handleShow = () => {
		setShowEditModal(true);
	};

	const handleClose = () => {
		setShowEditModal(false);
	};

	const selectedHolidayInstances = props.holidayInstanceGroup.holidayInstanceIds
		.map(holidayInstanceId => props.holidayInstances.find(
			holidayInstance => holidayInstance.id === holidayInstanceId
		))
		.filter(holidayInstance => holidayInstance !== undefined);

	const note = props.holidayInstanceGroup.note ?? '';
	const displayedNote = note.length > 30 ? `${note.slice(0, 29)}...` : note;

	return (
		<div className='card'>
			<div className='identifier-container'>
				{props.holidayInstanceGroup.name}
			</div>

			<div className='item-container'>
				<b>
					<FormattedMessage
						id='holiday.instances'
					/>
				</b>
				{selectedHolidayInstances.length > 0 ? (
					<span>
						{selectedHolidayInstances[0].name}
						{selectedHolidayInstances.length > 1 &&
							`...(${selectedHolidayInstances.length})`}
					</span>
				) : (
					<span> None</span>
				)}
			</div>

			<div className='item-container'>
				<b>
					<FormattedMessage id='holiday.region' />
				</b>{' '}
				<FormattedMessage
					id='holiday.region.unavailable'
				/>
			</div>

			<div className='item-container' title={note}>
				<b><FormattedMessage id='note' /></b>{' '}
				{displayedNote}
			</div>

			<div className='edit-btn'>
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage
						id='holiday.instance.group.details'
					/>
				</Button>
				<EditHolidayInstanceGroupModalComponent
					show={showEditModal}
					holidayInstanceGroup={props.holidayInstanceGroup}
					holidayInstances={props.holidayInstances}
					handleShow={handleShow}
					handleClose={handleClose}
					onEditHolidayInstanceGroup={props.onEditHolidayInstanceGroup}
					onDeleteHolidayInstanceGroup={props.onDeleteHolidayInstanceGroup}
				/>
			</div>
		</div>
	);
}
