const readline = require('readline');


function ask(question, condition = true) {
	const rl = readline.createInterface({
		input: process.stdin,
		output: process.stdout
	});
	return new Promise((resolve, reject) => {
		rl.question(question, response  => {
			if (condition(response)) {
				resolve(response);
			} else {
				reject(response);
			}
		});
	})
}

function validate(text) {
	if (text === 'yeah') {
		return true;
	} else {
		return false;
	}
}

(async () => {
	const ans = await ask('What do you want?', validate);
	console.log(ans);
})();

