/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store'
import 'bootstrap/dist/css/bootstrap.css';
import RouteContainer from './containers/RouteContainer';
import './styles/index.css';
import initScript from './initScript';

// Store information that would rarely change throughout using OED into the Redux store when the application first mounts.
store.dispatch<any>(initScript());

// Renders the entire application, starting with RouteComponent, into the root div
// Provides the Redux store to all child components
const container = document.getElementById('root');
// eslint-disable-next-line @typescript-eslint/no-non-null-assertion
const root = createRoot(container!);
root.render(
	<Provider store={store} >
		<RouteContainer />
	</Provider>
);

export default store;
