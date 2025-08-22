/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { useEffect } from 'react';
import { Badge } from 'reactstrap';
import { selectGraphState, selectLastMeterOrGroup, selectThreeDState, updateThreeDMeterOrGroupInfo } from '../redux/slices/graphSlice';
import { selectGroupDataById } from '../redux/api/groupsApi';
import { useAppDispatch, useAppSelector } from '../redux/reduxHooks';
import { MeterOrGroup, MeterOrGroupPill } from '../types/redux/graph';
import { AreaUnitType } from '../utils/getAreaUnitConversion';
import { selectMeterDataById } from '../redux/api/metersApi';
import { useTranslate } from '../redux/componentHooks';
import { pillContainer, pillBoxLabel, pillBox, pills, pill } from '../styles/modalStyle';

/**
 * A component used in the threeD graphics to select a single meter from the currently selected meters and groups.
 * @returns List of selected groups and meters as reactstrap Pills Badges
 */
export default function ThreeDPillComponent() {
	const translate = useTranslate();
	const dispatch = useAppDispatch();
	const meterDataById = useAppSelector(selectMeterDataById);
	const groupDataById = useAppSelector(selectGroupDataById);
	const threeDState = useAppSelector(selectThreeDState);
	const graphState = useAppSelector(selectGraphState);

	const meterPillData = graphState.selectedMeters.map(meterID => {
		const area = meterDataById[meterID]?.area;
		const areaUnit = meterDataById[meterID]?.areaUnit;
		const isAreaCompatible = area !== 0 && areaUnit !== AreaUnitType.none;
		const isDisabled = !isAreaCompatible && graphState.areaNormalization;

		return { meterOrGroupID: meterID, isDisabled: isDisabled, meterOrGroup: MeterOrGroup.meters } as MeterOrGroupPill;
	});

	const groupPillData = graphState.selectedGroups.map(groupID => {
		const area = groupDataById[groupID]?.area;
		const areaUnit = groupDataById[groupID]?.areaUnit;
		const isAreaCompatible = area !== 0 && areaUnit !== AreaUnitType.none;
		const isDisabled = !isAreaCompatible && graphState.areaNormalization;
		return { meterOrGroupID: groupID, isDisabled: isDisabled, meterOrGroup: MeterOrGroup.groups } as MeterOrGroupPill;
	});

	// Merge meters and groups into one array
	const combinedPillData = [...meterPillData, ...groupPillData];
	// Track length of combinedPillData to determine if a new pill was added
	const prevLengthRef = React.useRef(combinedPillData.length);
	// selector to get if the last added thing is a meter or group (Returns MeterOrGroup type, not boolean)
	const lastAddedType = useAppSelector(selectLastMeterOrGroup);
	useEffect(() => {
		// If only one item is selected, auto-select it
		if (combinedPillData.length === 1) {
			const singlePill = combinedPillData[0];
			dispatch(updateThreeDMeterOrGroupInfo({
				meterOrGroupID: singlePill.meterOrGroupID,
				meterOrGroup: singlePill.meterOrGroup
			}));
		}
		// If the current 3D selection is no longer present, clear it
		const stillExists = combinedPillData.some(
			pill => pill.meterOrGroupID === threeDState.meterOrGroupID && pill.meterOrGroup === threeDState.meterOrGroup
		);
		if (!stillExists && (threeDState.meterOrGroupID !== undefined)) {
			dispatch(updateThreeDMeterOrGroupInfo({ meterOrGroupID: undefined, meterOrGroup: undefined }));
		}
		// Auto-select new item on 3D chart if a new pill was added
		// If the number of pills increased, and the last added type is defined we can assume a new meter or group was added
		// If the last added type is undefined, it means something messed up, and we have no clue what to select, so we do nothing
		// If the last added type is defined, we select the last meter or group from the respective array
		if (combinedPillData.length > prevLengthRef.current && lastAddedType) {
			let lastAdded;
			if (lastAddedType === MeterOrGroup.meters && meterPillData.length > 0) {
				// Because meters and groups can share IDs, we need to check the last added type
				// and select the last meter or group from the respective array, so we rely on the array to be sorted by chronological order
				lastAdded = meterPillData[meterPillData.length - 1];
			} else if (lastAddedType === MeterOrGroup.groups) {
				lastAdded = groupPillData[groupPillData.length - 1];
			}
			if (lastAdded) {
				dispatch(updateThreeDMeterOrGroupInfo({
					meterOrGroupID: lastAdded.meterOrGroupID,
					meterOrGroup: lastAdded.meterOrGroup
				}));
			}
		}
		// Update the previous length reference to the current length
		prevLengthRef.current = combinedPillData.length;
	}, [combinedPillData, dispatch]);

	// When a Pill Badge is clicked update threeD state to indicate new meter or group to render.
	const handlePillClick = (pillData: MeterOrGroupPill) => dispatch(
		updateThreeDMeterOrGroupInfo({
			meterOrGroupID: pillData.meterOrGroupID,
			meterOrGroup: pillData.meterOrGroup
		})
	);

	// Method Generates Reactstrap Pill Badges for selected meters or groups
	const populatePills = (pillDataArray: MeterOrGroupPill[]) => {
		return pillDataArray.map(pillData => {
			// retrieve data from appropriate state slice .meters or .group
			const meterOrGroupName = pillData.meterOrGroup === MeterOrGroup.meters
				? `${meterDataById[pillData.meterOrGroupID]?.identifier ?? ''}ᴹ`
				: `${groupDataById[pillData.meterOrGroupID]?.name ?? ''}ᴳ`;

			// Get Selected ID from state
			const selectedMeterOrGroupID = threeDState.meterOrGroupID;

			// meterOrGroup value in state
			const selectedMeterOrGroup = threeDState.meterOrGroup;

			// Determines if the current pill is the one being generated, and sets its color accordingly
			// meters and groups can share id's so check for both: id match, and meter or group label match
			const isCurrentlySelected = (pillData.meterOrGroupID === selectedMeterOrGroupID) && (selectedMeterOrGroup === pillData.meterOrGroup);

			//  highlight currently Selected  as primary
			const colorToRender = isCurrentlySelected ? 'primary' : 'secondary';
			return (
				<Badge
					key={`${pillData.meterOrGroup}:${pillData.meterOrGroupID}`}
					pill
					// Change colors for selected metersOrGroups that are incompatible, except for the currently selected.
					color={pillData.isDisabled && !isCurrentlySelected ? 'dark' : colorToRender}
					style={pill}
					onClick={() => handlePillClick(pillData)}
				>
					{meterOrGroupName}
				</Badge>
			);
		});
	};

	return (
		<div style={pillContainer}>
			{combinedPillData.length > 0 &&
				<div style={pillBox}>
					<p style={pillBoxLabel}>{translate('data.sources')}</p>
					<div style={pills}>
						{populatePills(combinedPillData)}
					</div>
				</div>
			}
		</div >
	);
}