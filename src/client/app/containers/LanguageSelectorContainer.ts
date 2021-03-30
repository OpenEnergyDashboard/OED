/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import { connect } from 'react-redux';
import LanguageSelectorComponent from '../components/LanguageSelectorComponent';
import { State } from '../types/redux/state';
import { Dispatch } from '../types/redux/actions';
import { updateDefaultLanguage } from '../actions/admin';
import { LanguageTypes } from '../types/redux/i18n';


/*
*  Passes the current redux state of the language selection, and turns it into props for the React
*  component, which is what will be visible on the page. Makes it possible to access
*  your reducer state objects from within your React components.
*/
function mapStateToProps(state: State) {
	return {
		selectedLanguage: state.admin.defaultLanguage
	};
}

// Function to dispatch the changed language choice
function mapDispatchToProps(dispatch: Dispatch) {
	return {
		changeLanguage: (languageType: LanguageTypes) => dispatch(updateDefaultLanguage(languageType))
	};
}

// function that connects the React container to the Redux store of states
export default connect(mapStateToProps, mapDispatchToProps)(LanguageSelectorComponent);