import React from 'react';
import { render } from 'react-dom';
import { Router, Route, browserHistory } from 'react-router';
import HomeComponent from './components/HomeComponent';
import AdminComponent from './components/AdminComponent';
import NotFoundComponent from './components/NotFoundComponent';
// import { createStore } from 'redux'
// import { Provider } from 'react-redux'
// import reducer from './reducers'

// const store = createStore(reducer);
// render(
//     <Provider store={store}>
//         <AppComponent />
//     </Provider>,
//     document.getElementById('root')
// );

render(
	<Router history={browserHistory}>
		<Route path="/" component={HomeComponent} />
		<Route path="/admin" component={AdminComponent} />
		<Route path="*" component={NotFoundComponent} />
	</Router>,
	document.getElementById('root')
);
