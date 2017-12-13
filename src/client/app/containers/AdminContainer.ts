/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import AdminComponent from '../components/AdminComponent';
import { updateDisplayTitle, updateDefaultChartToRender, toggleDefaultBarStacking, submitPreferencesIfNeeded } from '../actions/admin';
import { Dispatch } from '../types/redux/actions';
import { State } from '../types/redux/state';
import { ChartTypes } from '../types/redux/graph';

function mapStateToProps(state: State) {
	return {
		displayTitle: state.admin.displayTitle,
		defaultChartToRender: state.admin.defaultChartToRender,
		defaultBarStacking: state.admin.defaultBarStacking,
		disableSubmitPreferences: state.admin.submitted
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		updateDisplayTitle: (displayTitle: string) => dispatch(updateDisplayTitle(displayTitle)),
		updateDefaultChartType: (defaultChartToRender: ChartTypes) => dispatch(updateDefaultChartToRender(defaultChartToRender)),
		toggleDefaultBarStacking: () => dispatch(toggleDefaultBarStacking()),
		submitPreferences: () => dispatch(submitPreferencesIfNeeded())
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(AdminComponent);
