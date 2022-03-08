/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import * as React from 'react';
import * as _ from 'lodash';
import thunkMiddleware from 'redux-thunk';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.css';
import RouteContainer from './containers/RouteContainer';
import reducers from './reducers';
import './styles/index.css';
import { composeWithDevTools } from '@redux-devtools/extension';
import initScript from './initScript';

// Creates and applies thunk middleware to the Redux store, which is defined from the Redux reducers.
// For now we are enabling Redux debug tools on production builds. If had a good way to only do this
// when not in production mode then maybe we should remove this but it does allow for debugging.
// Comment this out if enabling traces below.
const store = createStore(reducers, composeWithDevTools(applyMiddleware(thunkMiddleware)));

// Creates and applies thunk middleware to the Redux store, which is defined from the Redux reducers.
// It would be nice to enable this automatically if not in production mode. Unfortunately, the client
// side does not see the docker environment variables so it would require more work to do this. Doing
// in the initScript with a proper route would likely fix this up.
// For now,
// the developer needs to comment out the line above and uncomment the two lines below to get traces.
// The webpack rebuild should make the change while OED is running.
// Allow tracing of code.
// const composeEnhancers = composeWithDevTools({trace: true});
// const store = createStore(reducers, composeEnhancers(applyMiddleware(thunkMiddleware)));

// Store information that would rarely change throughout using OED into the Redux store when the application first mounts.
store.dispatch<any>(initScript());

// Renders the entire application, starting with RouteComponent, into the root div
// Provides the Redux store to all child components
render(
	<Provider store={store}>
		<RouteContainer />
	</Provider>,
	document.getElementById('root')
);

export default store;
