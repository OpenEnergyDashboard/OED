import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import MapInitiateComponent from '../components/MapInitiateComponent';
import { Dispatch } from '../types/redux/actions';
import {updateMapSource} from '../actions/map';

function mapStateToProps(state: State) {
	let isLoading = state.map.isLoading;
	return {
		isLoading,
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		uploadMapImage: (imageURI: string) => dispatch(updateMapSource(imageURI)),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapInitiateComponent);
