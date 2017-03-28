/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import ChildMeterBoxComponent from '../../components/groups/ChildMeterBoxComponent';

function mapStateToProps(state, ownProps) {
	const meters =  state.groups.byGroupID[ownProps.parentID].childMeters.map(meterID => {
		const meter = state.meters.byMeterID[meterID];
		return {
			id: meter.id,
			name: meter.name,
		};
	});
	return { meters };
}

function mapDispatchToProps(dispatch) {
	return {
		foo: 'bar',
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ChildMeterBoxComponent);
