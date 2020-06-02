import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import MapInitiateComponent from '../components/MapInitiateComponent';
import { Dispatch } from '../types/redux/actions';
import { updateMapSource, updateMapMode } from '../actions/map';
import { MapModeTypes } from '../types/redux/map';

function mapStateToProps(state: State) {
	const isLoading = state.map.isLoading;
	return {
		isLoading
	};
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		uploadMapImage: (imageURI: string) => dispatch(updateMapSource(imageURI)),
		updateMapMode: (nextMode: MapModeTypes) => dispatch(updateMapMode(nextMode))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapInitiateComponent);
