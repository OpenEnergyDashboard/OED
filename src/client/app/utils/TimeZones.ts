// need a function that exports timezones

interface TimeZones {
	name: string;
	abbrev: string;
	offset: string;
}

export const timezones: TimeZones[] = // getTimeZones().then((res)=>
	// {
	// res=>
	// })[
	[{ name: 'Central', abbrev: 'ctrl', offset: '+10:00' }];
