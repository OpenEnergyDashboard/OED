/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { render } from 'react-dom';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.css';
import RouteContainer from './containers/RouteContainer';
import './styles/index.css';
import { store } from './store'


// Renders the entire application, starting with RouteComponent, into the root div
// Provides the Redux store to all child components
render(
	<Provider store={store}>
		<RouteContainer />
	</Provider>,
	document.getElementById('root')
);

export default store;
