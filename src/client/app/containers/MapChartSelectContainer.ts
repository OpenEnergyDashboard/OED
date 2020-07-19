/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import MapChartSelectComponent from "../components/MapChartSelectComponent";
import {changeSelectedMap} from "../actions/map";

function mapStateToProps(state: State) {
	const displayableMaps = _.filter(state.maps.byMapID, 'displayable');
	const sortedMaps = _.sortBy(_.values(displayableMaps).map(map => ({ value: map.id, label: map.name.trim() })), 'id');

	const selectedMap =
		{
		label: state.maps.byMapID[state.maps.selectedMap] ? state.maps.byMapID[state.maps.selectedMap].name : '',
		value: state.maps.selectedMap,
		};

	return {
		maps: sortedMaps,
		selectedMap
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		selectMap: ((newSelectedMapID: number) => dispatch(changeSelectedMap(newSelectedMapID))),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapChartSelectComponent);
