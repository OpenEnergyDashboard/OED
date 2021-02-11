const weekday = new Array(7);
weekday[0] = 'Sunday';
weekday[1] = 'Monday';
weekday[2] = 'Tuesday';
weekday[3] = 'Wednesday';
weekday[4] = 'Thursday';
weekday[5] = 'Friday';
weekday[6] = 'Saturday';

const formatRawDateToExport = dateString =>{
	const d=new Date(dateString);
	const time=formatAMPM(d);
	return `${weekday[d.getDay()]} ${d.toDateString().substring(4)} ${time}`
}

const formatAMPM = date =>{
	let hours = date.getHours();
	let minutes = date.getMinutes();    
	const ampm = hours >= 12 ? 'pm' : 'am';

	hours %= 12;
	hours = hours || 12;    
	minutes = minutes < 10 ? `0${minutes}` : minutes;

	const strTime = `${hours}:${minutes} ${ampm}`;

	return strTime;
}

module.exports={
	formatRawDateToExport
}