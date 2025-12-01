/* This Source Code Form is subject to the terms of the Mozilla Public
 * License, v. 2.0. If a copy of the MPL was not distributed with this
 * file, You can obtain one at http://mozilla.org/MPL/2.0/. */

const __webpack_nonce__ = (document.querySelector('script[nonce]') as HTMLScriptElement | null)?.nonce;
(window as any).__webpack_nonce__ = __webpack_nonce__;
(window as any).__plotly_nonce__ = __webpack_nonce__;

console.log('Set __webpack_nonce__ to:', __webpack_nonce__);

console.log('Set nonces:', __webpack_nonce__);
declare global {
	interface Window {
		__webpack_nonce__?: string;
		__plotly_nonce__?: string;
	}
}


const originalAppendChild = document.head.appendChild;
document.head.appendChild = function (node: any) {
	if (
		node instanceof HTMLStyleElement
	) {
		console.log('Appending style, has nonce:', __webpack_nonce__);
		node.setAttribute('nonce', __webpack_nonce__ || '');
	}

	try {
		return originalAppendChild.call(this, node);
	} catch (err) {
		console.error('Failed to append style:', err);
		throw err;
	}
};
// document.head.appendChild = function (node: any) {
// 	if (node instanceof HTMLStyleElement) {
// 		const hasNonce = node.getAttribute('nonce');
// 		console.log('Appending style, has nonce:', hasNonce);

// 		if (!hasNonce) {
// 			const nonceToUse = window.__plotly_nonce__ || window.__webpack_nonce__ || '';
// 			console.log('Setting nonce on style element:', nonceToUse);
// 			node.setAttribute('nonce', nonceToUse);
// 		}
// 	}
// 	try {
// 		return originalAppendChild.call(this, node);
// 	} catch (err) {
// 		console.error('Failed to append style:', err, node);
// 		throw err;
// 	}
// };
console.log('Before import, __webpack_nonce__ =', __webpack_nonce__);
import 'bootstrap/dist/css/bootstrap.css';
console.log('BootstrapCSS Loaded');
console.log('After import, __webpack_nonce__ =', __webpack_nonce__);
import * as React from 'react';
import { createRoot } from 'react-dom/client';
import { Provider } from 'react-redux';
import { store } from './store';
import RouteComponent from './components/RouteComponent';
import { initApp } from './redux/slices/appStateSlice';
import './styles/index.css';

store.dispatch(initApp());

import { CacheProvider } from '@emotion/react';
import emotionCache from './emotionCache';
// Renders the entire application, starting with RouteComponent, into the root div
const container = document.getElementById('root') as HTMLElement;
const root = createRoot(container);

root.render(
	//  Provides the Redux store to all child components
	<CacheProvider value={emotionCache}>
		<Provider store={store} stabilityCheck="always">
			<RouteComponent />
		</Provider>
	</CacheProvider>
);
