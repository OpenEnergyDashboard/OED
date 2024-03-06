/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import 'bootstrap/dist/css/bootstrap.css';
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import RouteComponent from './components/RouteComponent';
import { initApp } from './redux/slices/appStateSlice';
import './styles/index.css';

store.dispatch(initApp());

// Renders the entire application, starting with RouteComponent, into the root div
const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
	//  Provides the Redux store to all child components
	< Provider store={store} stabilityCheck='always' >
		< RouteComponent />
	</Provider >
);
