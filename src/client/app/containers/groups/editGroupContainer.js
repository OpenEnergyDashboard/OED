/*
 * This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/.
 *
 */


import { connect } from 'react-redux';
import ChildGroupBoxComponent from '../../components/groups/ChildGroupBoxComponent';
import { changeSelectedGroups } from '../../actions/groups';

function mapStateToProps(state) {

}

function mapDispatchToProps(dispatch) {
	return {

	};
}

export default connect(mapStateToProps, mapDispatchToProps)(ChildGroupBoxComponent);

