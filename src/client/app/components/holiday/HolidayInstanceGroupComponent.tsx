/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import { titleStyle } from '../../styles/modalStyle';
import { HolidayInstance } from '../../types/redux/holiday';
import CreateHolidayInstanceGroupModalComponent from './CreateHolidayInstanceGroupModalComponent';
import { HolidayInstanceGroupData } from './EditHolidayInstanceGroupModalComponent';
import HolidayInstanceGroupViewComponent from './HolidayInstanceGroupViewComponent';
import { testHolidayInstances } from './holidayInstanceTestData'; // For testing purposes, remove in production.

interface HolidayInstanceGroupComponentProps {
	holidayInstances?: HolidayInstance[];
	holidayInstanceGroups?: HolidayInstanceGroupData[];
	handleCreateHolidayInstanceGroup?: (name: string, holidayInstanceIds: number[], note: string) => void;
	handleUpdateHolidayInstanceGroup?: (
		holidayInstanceGroupId: number,
		name: string,
		holidayInstanceIds: number[],
		note: string
	) => void;
	handleDeleteHolidayInstanceGroup?: (holidayInstanceGroupId: number) => void;
}

/**
 * Defines the holiday instance group card page.
 * @param props Holiday instance data, group data, and optional action handlers.
 * @returns Holiday instance group page element.
 */
export default function HolidayInstanceGroupComponent(props: HolidayInstanceGroupComponentProps) {
	const holidayInstances = props.holidayInstances ?? testHolidayInstances;
	const [createdHolidayInstanceGroups, setCreatedHolidayInstanceGroups] = useState<HolidayInstanceGroupData[]>([]);
	const holidayInstanceGroups = props.holidayInstanceGroups ?? createdHolidayInstanceGroups;
	const usingLocalHolidayInstanceGroups = props.holidayInstanceGroups === undefined;

	const handleCreateHolidayInstanceGroup = (name: string, holidayInstanceIds: number[], note: string) => {
		props.handleCreateHolidayInstanceGroup?.(name, holidayInstanceIds, note);

		if (usingLocalHolidayInstanceGroups) {
			setCreatedHolidayInstanceGroups(currentGroups => {
				const nextId = Math.max(0, ...currentGroups.map(group => group.id)) + 1;

				return [
					...currentGroups,
					{
						id: nextId,
						name,
						holidayInstanceIds,
						note
					}
				];
			});
		}
	};

	const handleUpdateHolidayInstanceGroup = (
		holidayInstanceGroupId: number,
		name: string,
		holidayInstanceIds: number[],
		note: string
	) => {
		props.handleUpdateHolidayInstanceGroup?.(
			holidayInstanceGroupId,
			name,
			holidayInstanceIds,
			note
		);

		if (usingLocalHolidayInstanceGroups) {
			setCreatedHolidayInstanceGroups(currentGroups => currentGroups.map(group =>
				group.id === holidayInstanceGroupId
					? { ...group, name, holidayInstanceIds, note }
					: group
			));
		}
	};

	const handleDeleteHolidayInstanceGroup = (holidayInstanceGroupId: number) => {
		props.handleDeleteHolidayInstanceGroup?.(holidayInstanceGroupId);

		if (usingLocalHolidayInstanceGroups) {
			setCreatedHolidayInstanceGroups(currentGroups =>
				currentGroups.filter(group => group.id !== holidayInstanceGroupId)
			);
		}
	};

	return (
		<div className='flexGrowOne'>
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage
						id='holiday.instance.groups'
					/>
				</h2>
				<div className='edit-btn'>
					<CreateHolidayInstanceGroupModalComponent
						holidayInstances={holidayInstances}
						onCreateHolidayInstanceGroup={handleCreateHolidayInstanceGroup}
					/>
				</div>
				<div className='card-container'>
					{[...holidayInstanceGroups]
						.sort((firstGroup, secondGroup) => firstGroup.id - secondGroup.id)
						.map(holidayInstanceGroup => (
							<HolidayInstanceGroupViewComponent
								key={holidayInstanceGroup.id}
								holidayInstanceGroup={holidayInstanceGroup}
								holidayInstances={holidayInstances}
								onEditHolidayInstanceGroup={handleUpdateHolidayInstanceGroup}
								onDeleteHolidayInstanceGroup={handleDeleteHolidayInstanceGroup}
							/>
						))}
				</div>
			</div>
		</div>
	);
}
