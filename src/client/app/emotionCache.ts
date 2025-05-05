import createCache from '@emotion/cache';

const nonce = (document.querySelector('script[nonce]') as HTMLScriptElement | null)?.nonce;

const emotionCache = createCache({
	key: 'css',
	nonce: nonce,
});

export default emotionCache;