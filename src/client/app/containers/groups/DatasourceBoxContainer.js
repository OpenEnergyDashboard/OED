/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import _ from 'lodash';
import { connect } from 'react-redux';
import DatasourceBoxComponent from '../../components/groups/DatasourceBoxComponent';
import { changeSelectedChildMetersOfGroup, changeSelectedChildGroupsOfGroup, changeChildMeters, changeChildGroups } from '../../actions/groups';

// ownProps.selection may be 'children', 'all', or 'custom'
// if ownProps.selection is 'children', ownProps must have a 'parentID' property
// if ownProps.selection is 'custom', ownProps must have both a 'datasource' and 'selectDatasource' prop (and optional selectedOptions prop)
function mapStateToProps(state, ownProps) {
	let datasource = null;
	if (ownProps.selection === 'all') {
		if (ownProps.type === 'meter') {
			datasource = Object.keys(state.meters.byMeterID).map(meterID => {
				const meter = state.meters.byMeterID[meterID];
				return {
					id: meter.id,
					name: meter.name
				};
			});
		} else {
			datasource = Object.keys(state.groups.byGroupID).map(groupID => {
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
						name: meter.name,
					};
				});
			} else {
				datasource = state.groups.byGroupID[ownProps.parentID].childGroups.map(groupID => {
					const group = state.groups.byGroupID[groupID];
					return {
						id: group.id,
						name: group.name,
					};
				});
			}
		} else {
			console.error('DatasourceBoxContainer must be supplied a parentID prop if type === children');
		}
	} else { // custom selection handled by parent
		datasource = ownProps.datasource;
	}

	return {
		datasource: _.sortBy(datasource, 'name'),
		selectedOptions: ownProps.selectedOptions ? ownProps.selectedOptions : undefined,
		type: ownProps.type
	};
}

function mapDispatchToProps(dispatch, ownProps) {
	if (ownProps.selection === 'all') {
		if (ownProps.type === 'meter') {
			return {
				selectDatasource: meterIDs => dispatch(changeChildMeters(meterIDs)),
			};
		}
		return {
			selectDatasource: groupIDs => dispatch(changeChildGroups(groupIDs))
		};
	} else if (ownProps.selection === 'children') {
		if (ownProps.type === 'meter') {
			return {
				selectDatasource: meterIDs => dispatch(changeSelectedChildMetersOfGroup(ownProps.parentID, meterIDs))
			};
		}
		return {
			selectDatasource: groupIDs => dispatch(changeSelectedChildGroupsOfGroup(ownProps.parentID, groupIDs))
		};
	}
	return {
		selectDatasource: meterIDs => ownProps.selectDatasource(meterIDs)
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(DatasourceBoxComponent);
