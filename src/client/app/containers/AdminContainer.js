/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import AdminComponent from '../components/AdminComponent';
import { updateTitle } from '../actions/admin';

function mapStateToProps(state) {
	return {
		title: state.admin.title
	};
}

function mapDispatchToProps(dispatch) {
	return {
		updateTitle: title => dispatch(updateTitle(title))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminComponent);
