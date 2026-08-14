/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { FormattedMessage } from 'react-intl';
import {
	useGetHolidayInstancesWithDetailsQuery
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
import { HolidayInstanceDetails } from '../../types/redux/holidays';
import {
	showErrorNotification,
	showSuccessNotification
} from '../../utils/notifications';

const stableEmptyHolidayInstanceDetails: HolidayInstanceDetails[] = [];

/**
 * Defines the holiday instance group card page.
 * @returns Holiday instance group page element.
 */
export default function HolidayInstanceGroupComponent() {
	// The route stops you from getting to this page if not an admin.
	const translate = useTranslate();
	const {
		data: holidayInstances = stableEmptyHolidayInstanceDetails,
		isLoading: holidayInstancesLoading,
		error: holidayInstancesError
	} = useGetHolidayInstancesWithDetailsQuery();
	const {
		data: holidayInstanceGroups = stableEmptyHolidayInstanceGroups,
		isLoading: holidayInstanceGroupsLoading,
		error: holidayInstanceGroupsError
	} = useGetHolidayInstanceGroupsQuery();
	const [addHolidayInstanceGroup] = useAddHolidayInstanceGroupMutation();
	const [editHolidayInstanceGroup] = useEditHolidayInstanceGroupMutation();
	const [deleteHolidayInstanceGroup] = useDeleteHolidayInstanceGroupMutation();

	// handle create holiday instance group
	const handleCreateHolidayInstanceGroup = async (
		name: string,
		holidayInstanceIds: number[],
		note: string
	) => {
		try {
			await addHolidayInstanceGroup({ name, holidayInstanceIds, note }).unwrap();
			showSuccessNotification(translate('holiday.instance.group.create.success'));
		} catch (error) {
			showErrorNotification(
				`${translate('holiday.instance.group.create.failure')}`
			);
		}
	};

	// handle update holiday instance group
	const handleUpdateHolidayInstanceGroup = async (
		holidayInstanceGroupId: number,
		name: string,
		holidayInstanceIds: number[],
		note: string
	) => {
		try {
			await editHolidayInstanceGroup({
				id: holidayInstanceGroupId,
				name,
				holidayInstanceIds,
				note
			}).unwrap();
			showSuccessNotification(translate('holiday.instance.group.edit.success'));
		} catch (error) {
			showErrorNotification(
				`${translate('holiday.instance.group.edit.failure')}`
			);
		}
	};

	// handle delete holiday instance group
	const handleDeleteHolidayInstanceGroup = async (holidayInstanceGroupId: number) => {
		try {
			await deleteHolidayInstanceGroup({ id: holidayInstanceGroupId }).unwrap();
			showSuccessNotification(translate('holiday.instance.group.delete.success'));
		} catch (error) {
			showErrorNotification(
				`${translate('holiday.instance.group.delete.failure')}`
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
				{/* Display error message if there is a load error */}
				{loadError && (
					<div className='alert alert-danger' role='alert'>
						<FormattedMessage id='holiday.instance.group.load.failure' />
					</div>
				)}
				{/* Create holiday instance group button */}
				<div className='edit-btn'>
					<CreateHolidayInstanceGroupModalComponent
						holidayInstances={holidayInstances}
						onCreateHolidayInstanceGroup={handleCreateHolidayInstanceGroup}
					/>
				</div>
				{/* Display holiday instance groups*/}
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
