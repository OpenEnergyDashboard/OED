/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import MeterViewComponent from '../../components/meters/MeterViewComponent';
import { Dispatch } from '../../types/redux/actions';
import { State } from '../../types/redux/state';

function mapStateToProps(state: State, ownProps: {id: number}) {
	return state.meters.byMeterID[ownProps.id];
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {};
}

export default connect(mapStateToProps, mapDispatchToProps)(MeterViewComponent);
