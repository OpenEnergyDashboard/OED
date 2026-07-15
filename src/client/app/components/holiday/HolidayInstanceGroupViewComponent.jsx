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
 * @param {{id: number, holidayInstanceIds: number[], note: string}} props.holidayInstanceGroup Group data.
 * @param {Array<{id: number, name: string}>} props.holidayInstances Available holiday instances.
 * @param {(id: number, holidayInstanceIds: number[], note: string) => void} props.onEditHolidayInstanceGroup Edit handler.
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
				<FormattedMessage
					id='holiday.instance.group.identifier'
					defaultMessage='Holiday Instance Group {id}'
					values={{ id: props.holidayInstanceGroup.id }}
				/>
			</div>

			<div className='item-container'>
				<b>
					<FormattedMessage
						id='holiday.instances'
						defaultMessage='Holiday Instances'
					/>
				</b>
				{selectedHolidayInstances.length > 0 ? (
					<ul style={holidayInstanceListStyle}>
						{selectedHolidayInstances.map(holidayInstance => (
							<li key={holidayInstance.id}>{holidayInstance.name}</li>
						))}
					</ul>
				) : (
					<span> None</span>
				)}
			</div>

			<div className='item-container'>
				<b>
					<FormattedMessage id='holiday.region' defaultMessage='Holiday Region' />
				</b>{' '}
				<FormattedMessage
					id='holiday.region.unavailable'
					defaultMessage='Unavailable'
				/>
			</div>

			<div className='item-container' title={note}>
				<b><FormattedMessage id='note' defaultMessage='Note' /></b>{' '}
				{displayedNote}
			</div>

			<div className='edit-btn'>
				<Button color='secondary' onClick={handleShow}>
					<FormattedMessage
						id='holiday.instance.group.edit'
						defaultMessage='Edit Holiday Instance Group'
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

const holidayInstanceListStyle = {
	margin: '0.5rem 0 0',
	maxHeight: '8rem',
	overflowY: 'auto',
	paddingLeft: '1.25rem'
};
