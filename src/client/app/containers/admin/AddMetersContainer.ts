/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import AddMetersComponent from '../../components/admin/AddMetersComponent';
import { fetchMetersDetailsIfNeeded } from '../../actions/meters';
import { Dispatch } from '../../types/redux/actions';

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		fetchMeterDetailsIfNeeded: () => dispatch(fetchMetersDetailsIfNeeded(true))
	};
}

export default connect(null, mapDispatchToProps)(AddMetersComponent);
