/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

import React from 'react';
import thunkMiddleware from 'redux-thunk';
import { render } from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import 'bootstrap/dist/css/bootstrap.css';
import RouteContainer from './containers/RouteContainer';
import reducers from './reducers';
import './styles/index.css';

// This sets up the redux-devtools extension (if it's installed in the browser).
// https://github.com/zalmoxisus/redux-devtools-extension
/* eslint-disable no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
/* eslint-enable */

// Creates and applies thunk middleware to the Redux store, which is defined from the Redux reducers
const store = createStore(reducers, composeEnhancers(applyMiddleware(thunkMiddleware)));

// Renders the entire application, starting with RouteComponent, into the root div
// Provides the Redux store to all child components
render(
	<Provider store={store}>
		<RouteContainer />
	</Provider>,
	document.getElementById('root')
);

export default store;
