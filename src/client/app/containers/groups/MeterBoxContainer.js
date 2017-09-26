/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

import _ from 'lodash';
import { connect } from 'react-redux';
import MeterBoxComponent from '../../components/groups/MeterBoxComponent';
import { changeSelectedMetersOfGroup, changeChildMeters } from '../../actions/groups';

function mapStateToProps(state, ownProps) {
	let meters = null;
	if (ownProps.parentID) {
		meters = state.groups.byGroupID[ownProps.parentID].childMeters.map(meterID => {
			const meter = state.meters.byMeterID[meterID];
			return {
				id: meter.id,
				name: meter.name,
			};
		});
	} else {
		meters = Object.keys(state.meters.byMeterID).map(meterID => {
			const meter = state.meters.byMeterID[meterID];
			return {
				id: meter.id,
				name: meter.name
			};
		});
	}

	return { meters: _.sortBy(meters, 'name') };
}

function mapDispatchToProps(dispatch, ownProps) {
	if (ownProps.parentID) {
		return {
			selectMeters: meterIDs => dispatch(changeSelectedMetersOfGroup(ownProps.parentID, meterIDs))
		};
	}
	return {
		selectMeters: meterIDs => dispatch(changeChildMeters(meterIDs)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterBoxComponent);
