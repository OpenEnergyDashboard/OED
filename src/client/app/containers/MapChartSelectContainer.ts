/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as _ from 'lodash';
import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import MapChartSelectComponent from '../components/MapChartSelectComponent';
import {changeSelectedMap} from '../actions/map';
import {SelectOption} from '../types/items';

function mapStateToProps(state: State) {
	const maps = state.maps.byMapID;
	const sortedMaps = _.sortBy(_.values(maps).map(map => (
		{
		value: map.id, label: map.name.trim(), disabled: !(map.origin && map.opposite)
		} as SelectOption
	)), 'label');

	// If there is only one map, selectedMap is the id of the only map. ie; display map automatically if only 1 map
	if (Object.keys(sortedMaps).length === 1) {
		state.maps.selectedMap = sortedMaps[0].value;
	}

	const selectedMap = {
		label: state.maps.byMapID[state.maps.selectedMap] ? state.maps.byMapID[state.maps.selectedMap].name : '',
		value: state.maps.selectedMap
		};

	return {
		maps: sortedMaps,
		selectedMap
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		selectMap: (newSelectedMapID: number) => dispatch(changeSelectedMap(newSelectedMapID))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapChartSelectComponent);
