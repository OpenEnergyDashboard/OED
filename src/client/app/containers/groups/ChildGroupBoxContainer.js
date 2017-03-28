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
import ChildGroupBoxComponent from '../../components/groups/ChildGroupBoxComponent';

function mapStateToProps(state, ownProps) {
	const groups = state.groups.byGroupID[ownProps.parentID].childGroups.map(groupID => {
		const group = state.groups.byGroupID[groupID];
		return {
			id: group.id,
			name: group.name,
		};
	});
	return { groups };
}

function mapDispatchToProps(dispatch) {
	return {
		foo: 'bar',
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ChildGroupBoxComponent);
