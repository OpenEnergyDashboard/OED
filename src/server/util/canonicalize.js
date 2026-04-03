function canonicalize(input){
    if (input === null || input === undefined) {
		return '';
	}
	// Force string
	let value = String(input);
	// Normalize Unicode 
	value = value.normalize('NFKC');
	return value;
}

module.exports = { canonicalize };