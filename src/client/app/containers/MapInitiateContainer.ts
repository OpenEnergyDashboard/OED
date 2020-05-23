import { connect } from 'react-redux';
import { State } from '../types/redux/state';
import MapInitiateComponent from '../components/MapInitiateComponent';
import { Dispatch } from '../types/redux/actions';

function mapStateToProps(state: State) {
	let isLoading = state.map.isLoading;
	return {
		isLoading,
	}
}

function mapDispatchToProps(dispatch: Dispatch) {
	return {
		uploadMapImage: (imageURI: string) => dispatch(updateMap(string))
	};
}

export default connect(mapStateToProps, mapDispatchToProps)(MapInitiateComponent);
