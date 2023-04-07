/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import DatasourceBoxComponent from '../../components/groups/DatasourceBoxComponent';
import { changeSelectedChildMetersOfGroup, changeSelectedChildGroupsOfGroup, changeChildMeters, changeChildGroups } from '../../actions/groups';
import { NamedIDItem } from '../../types/items';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';

export enum SelectionType {
	Children = 'children',
	All = 'all',
	Custom = 'custom'
}

interface DatasourceBoxContainerProps {
	selection?: SelectionType;
	type?: string;
	parentID?: number;
	datasource?: NamedIDItem[];
	selectedOptions?: NamedIDItem[];
	selectDatasource?: (meterIDs: number[]) => void;
}

/* eslint-disable */
// ownProps.selection may be 'children', 'all', or 'custom'
// if ownProps.selection is 'children', ownProps must have a 'parentID' property
// if ownProps.selection is 'custom', ownProps must have both a 'datasource' and 'selectDatasource' prop (and optional selectedOptions prop)
function mapStateToProps(state: State, ownProps: DatasourceBoxContainerProps) {
	let datasource: NamedIDItem[] = [];
	if (ownProps.selection === SelectionType.All) {
		if (ownProps.type === 'meter') {
			datasource = Object.keys(state.meters.byMeterID)
				.map((meterIDString: string) => parseInt(meterIDString))
				.map(meterID => {
					const meter = state.meters.byMeterID[meterID];
					return {
						id: meter.id,
						name: meter.name
					};
				});
		} else {
			datasource = Object.keys(state.groups.byGroupID)
				.map((groupIDString: string) => parseInt(groupIDString))
				.map(groupID => {
					const group = state.groups.byGroupID[groupID];
					return {
						id: group.id,
						name: group.name
					};
				});
		}
	} else if (ownProps.selection === 'children') {
		if (ownProps.parentID) {
			if (ownProps.type === 'meter') {
				datasource = state.groups.byGroupID[ownProps.parentID].childMeters.map(meterID => {
					const meter = state.meters.byMeterID[meterID];
					return {
						id: meter.id,
						name: meter.name
					};
				});
			} else {
				datasource = state.groups.byGroupID[ownProps.parentID].childGroups.map(groupID => {
					const group = state.groups.byGroupID[groupID];
					return {
						id: group.id,
						name: group.name
					};
				});
			}
		} else {
			throw new Error('DatasourceBoxContainer must be supplied a parentID prop if type === children');
		}
	} else if (ownProps.datasource !== undefined) { // custom selection handled by parent
		datasource = ownProps.datasource;
	}

	return {
		datasource: _.sortBy(datasource, 'name'),
		selectedOptions: ownProps.selectedOptions ? ownProps.selectedOptions : undefined,
		type: ownProps.type
	};
}

function mapDispatchToProps(dispatch: Dispatch, ownProps: DatasourceBoxContainerProps) {
	if (ownProps.selection === 'all') {
		if (ownProps.type === 'meter') {
			return {
				selectDatasource: (meterIDs: number[]) => dispatch(changeChildMeters(meterIDs))
			};
		}
		return {
			selectDatasource: (groupIDs: number[]) => dispatch(changeChildGroups(groupIDs))
		};
	} else if (ownProps.selection === 'children') {
		const parentID = ownProps.parentID;
		if (parentID !== undefined) {
			if (ownProps.type === 'meter') {
				return {
					selectDatasource: (meterIDs: number[]) => dispatch(changeSelectedChildMetersOfGroup(parentID, meterIDs))
				};
			}
			return {
				selectDatasource: (groupIDs: number[]) => dispatch(changeSelectedChildGroupsOfGroup(parentID, groupIDs))
			};
		} else {
			throw new Error('Unacceptable condition: DatasourceBoxContainer given children selection without parent ID');
		}
	} else {
		const selectDatasource = ownProps.selectDatasource;
		if (selectDatasource !== undefined) {
			return {
				selectDatasource: (meterIDs: number[]) => selectDatasource(meterIDs)
			};
		} else {
			throw new Error('Unacceptable condition: DatasourceBoxContainer for "custom" requires a selectDatasource function, but it was undefined.');
		}
	}
}

export default connect(mapStateToProps, mapDispatchToProps)(DatasourceBoxComponent);
