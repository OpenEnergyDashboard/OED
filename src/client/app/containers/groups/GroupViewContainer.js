/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */

/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 */

import { connect } from 'react-redux';
import GroupViewComponent from '../../components/groups/GroupViewComponent';
import { fetchGroupChildrenIfNeeded } from '../../actions/groups';


/**
 * @param {State} state
 * @param {ownProps} ownProps
 * @return {{name: name of this group}, {id: id of this group}, {childGroups: list of objects describing child groups}, {childMeters: list of objects describing child meters}
 */
function mapStateToProps(state, ownProps) {
	return {
		name: ownProps.name,
		id: ownProps.id,
	};
}

function mapDispatchToProps(dispatch) {
	return {
		fetchGroupChildren: id => dispatch(fetchGroupChildrenIfNeeded(id)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(GroupViewComponent);
