import React from 'react';
import thunkMiddleware from 'redux-thunk';
import { render } from 'react-dom';
import { createStore, applyMiddleware, compose } from 'redux';
import { Provider } from 'react-redux';
import RouteComponent from './components/RouteComponent';
import reducers from './reducers';

// This sets up the redux-devtools extension (if it's installed in the browser).
// https://github.com/zalmoxisus/redux-devtools-extension
/* eslint-disable no-underscore-dangle */
const composeEnhancers = window.__REDUX_DEVTOOLS_EXTENSION_COMPOSE__ || compose;
/* eslint-enable */

const store = createStore(reducers, composeEnhancers(applyMiddleware(thunkMiddleware)));

render(
	<Provider store={store}>
		<RouteComponent />
	</Provider>,
	document.getElementById('root')
);
