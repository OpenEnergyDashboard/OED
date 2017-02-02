import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import HomeComponent from './HomeComponent';
import LoginComponent from './LoginComponent';
import AdminComponent from './AdminComponent';
import NotFoundComponent from './NotFoundComponent';

function requireAuth(nextState, replace) {
	const loggedIn = localStorage.getItem('token');
	if (!loggedIn) {
		replace({
			pathname: '/login',
			state: { nextPathname: nextState.location.pathname }
		});
	}
}

export default function Routes() {
	return (
		<Router history={browserHistory}>
			<Route path="/" component={HomeComponent} />
			<Route path="/login" component={LoginComponent} />
			<Route path="/admin" component={AdminComponent} onEnter={requireAuth} />
			<Route path="*" component={NotFoundComponent} />
		</Router>
	);
}
