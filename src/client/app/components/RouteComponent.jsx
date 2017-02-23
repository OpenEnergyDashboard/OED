import React from 'react';
import { Router, Route, browserHistory } from 'react-router';
import axios from 'axios';
import HomeComponent from './HomeComponent';
import LoginComponent from './LoginComponent';
import AdminComponent from './AdminComponent';
import NotFoundComponent from './NotFoundComponent';
import GroupComponent from './groupUIComponents/GroupMainComponent';

function requireAuth(nextState, replace) {
    function redirectRoute() {
        replace({
            pathname: '/login',
            state: { nextPathname: nextState.location.pathname }
        });
    }
    const token = localStorage.getItem('token');
    if (!token) {
        console.log('Inside the stupid container');
        redirectRoute();
        return;
    }
    axios.post('/api/verification/', { token }, { validateStatus: status => (status >= 200 && status < 300) || (status === 401 || status === 403) })
        .then(res => {
            if (!res.data.success) browserHistory.push('/login');
        })
        .catch(err => console.log(err));
}

export default function RouteComponent() {
    return (
        <Router history={browserHistory}>
            <Route path="/" component={HomeComponent} />
            <Route path="/login" component={LoginComponent} />
            <Route path="/admin" component={AdminComponent} onEnter={requireAuth} />
            <Route path="/group" component={GroupComponent} />
            <Route path="*" component={NotFoundComponent} />
        </Router>
    );
}
