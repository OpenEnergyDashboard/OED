/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store'
import 'bootstrap/dist/css/bootstrap.css';
// import RouteContainer from './containers/RouteContainer';
import RouteComponent from './components/RouteComponentWIP';
import './styles/index.css';
import InitializationComponent from './components/InitializationComponent';

// Renders the entire application, starting with RouteComponent, into the root div
const container = document.getElementById('root');

// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(
	// Provides the Redux store to all child components
	<Provider store={store}  >
		<InitializationComponent />
		<RouteComponent />
	</Provider>
);