import React from 'react';
import thunkMiddleware from 'redux-thunk';
import { render } from 'react-dom';
import { createStore, applyMiddleware } from 'redux';
import { Provider } from 'react-redux';
import RouteComponent from './components/RouteComponent';
import reducers from './reducers';

const store = createStore(reducers, applyMiddleware(thunkMiddleware));
render(
	<Provider store={store}>
		<RouteComponent />
	</Provider>,
	document.getElementById('root')
);
