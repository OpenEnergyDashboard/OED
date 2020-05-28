import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import MapInitiateComponent from '../components/MapInitiateComponent';
import { Dispatch } from '../types/redux/actions';
import {stallUpload, updateMapSource} from '../actions/map';

function mapStateToProps(state: State) {
	let isLoading = state.map.isLoading;
	return {
		isLoading,
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		uploadMapImage: (imageURI: string) => dispatch(updateMapSource(imageURI)),
		stallSourceUpload: () => dispatch((stallUpload())),
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapInitiateComponent);
