import { createHistory } from 'history';
import { useRouterHistory } from 'react-router';

const baseHref = (document.getElementsByTagName('base')[0] || {}).href;
export const browserHistory = useRouterHistory(createHistory)({
	basename: baseHref
});
