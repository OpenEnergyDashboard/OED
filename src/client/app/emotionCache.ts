//imports the createSche function from React's Emotion library
import createCache from '@emotion/cache';

//creates the nonce for the script being run
//he nonce works alongside the webpack_nonce and plotly_nonce to protect against unwated scripts
const nonce = (document.querySelector('script[nonce]') as HTMLScriptElement | null)?.nonce;

const emotionCache = createCache({
	key: 'css',
	nonce: nonce,
});

export default emotionCache;