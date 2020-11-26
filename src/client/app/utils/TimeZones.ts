// need a function that exports timezones

export interface TimeZones {
	name: string;
	abbrev: string;
	offset: string;
}

export const timezones: TimeZones[] = // getTimeZones().then((res)=>
	// {
	// res=>
	// })[
	[{ name: 'Central', abbrev: 'ctrl', offset: '+10:00' },
	{ name: 'Eastern', abbrev: 'east', offset: '+8:00' },
	{ name: 'Western', abbrev: 'west', offset: '+12:00' }];
