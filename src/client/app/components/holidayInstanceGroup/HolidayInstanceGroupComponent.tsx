/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useState } from 'react';
import { FormattedMessage } from 'react-intl';
import {
	stableEmptyHolidayInstances,
	useGetHolidayInstancesQuery
} from '../../redux/api/holidayInstancesApi';
import {
	stableEmptyHolidayInstanceGroups,
	useAddHolidayInstanceGroupMutation,
	useDeleteHolidayInstanceGroupMutation,
	useEditHolidayInstanceGroupMutation,
	useGetHolidayInstanceGroupsQuery
} from '../../redux/api/holidayInstanceGroupsApi';
import { useTranslate } from '../../redux/componentHooks';
import { titleStyle } from '../../styles/modalStyle';
import CreateHolidayInstanceGroupModalComponent from './CreateHolidayInstanceGroupModalComponent';
import HolidayInstanceGroupViewComponent from './HolidayInstanceGroupViewComponent';

/**
 * Defines the holiday instance group card page.
 * @returns Holiday instance group page element.
 */
export default function HolidayInstanceGroupComponent() {
	const translate = useTranslate();
	const [mutationError, setMutationError] = useState('');
	const {
		data: holidayInstances = stableEmptyHolidayInstances,
		isLoading: holidayInstancesLoading,
		error: holidayInstancesError
	} = useGetHolidayInstancesQuery();
	const {
		data: holidayInstanceGroups = stableEmptyHolidayInstanceGroups,
		isLoading: holidayInstanceGroupsLoading,
		error: holidayInstanceGroupsError
	} = useGetHolidayInstanceGroupsQuery();
	const [addHolidayInstanceGroup] = useAddHolidayInstanceGroupMutation();
	const [editHolidayInstanceGroup] = useEditHolidayInstanceGroupMutation();
	const [deleteHolidayInstanceGroup] = useDeleteHolidayInstanceGroupMutation();

	const handleCreateHolidayInstanceGroup = async (
		name: string,
		holidayInstanceIds: number[],
		note: string
	) => {
		setMutationError('');
		try {
			await addHolidayInstanceGroup({ name, holidayInstanceIds, note }).unwrap();
		} catch (error) {
			setMutationError(
				`${translate('holiday.instance.group.create.failure')}${JSON.stringify(error)}`
			);
		}
	};

	const handleUpdateHolidayInstanceGroup = async (
		holidayInstanceGroupId: number,
		name: string,
		holidayInstanceIds: number[],
		note: string
	) => {
		setMutationError('');
		try {
			await editHolidayInstanceGroup({
				id: holidayInstanceGroupId,
				name,
				holidayInstanceIds,
				note
			}).unwrap();
		} catch (error) {
			setMutationError(
				`${translate('holiday.instance.group.edit.failure')}${JSON.stringify(error)}`
			);
		}
	};

	const handleDeleteHolidayInstanceGroup = async (holidayInstanceGroupId: number) => {
		setMutationError('');
		try {
			await deleteHolidayInstanceGroup({ id: holidayInstanceGroupId }).unwrap();
		} catch (error) {
			setMutationError(
				`${translate('holiday.instance.group.delete.failure')}${JSON.stringify(error)}`
			);
		}
	};

	const isLoading = holidayInstancesLoading || holidayInstanceGroupsLoading;
	const loadError = holidayInstancesError || holidayInstanceGroupsError;

	return (
		<div className='flexGrowOne'>
			<div className='container-fluid'>
				<h2 style={titleStyle}>
					<FormattedMessage
						id='holiday.instance.groups'
					/>
				</h2>
				{loadError && (
					<div className='alert alert-danger' role='alert'>
						<FormattedMessage id='holiday.instance.group.load.failure' />
					</div>
				)}
				{mutationError && (
					<div className='alert alert-danger' role='alert'>{mutationError}</div>
				)}
				<div className='edit-btn'>
					<CreateHolidayInstanceGroupModalComponent
						holidayInstances={holidayInstances}
						onCreateHolidayInstanceGroup={handleCreateHolidayInstanceGroup}
					/>
				</div>
				<div className='card-container'>
					{isLoading ? (
						<div>
							<FormattedMessage id='holiday.instance.group.loading' />
						</div>
					) : [...holidayInstanceGroups]
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
