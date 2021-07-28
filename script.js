/******* Start Utils *******/

/*
 * Parse true/false to yes/no
 */
const parseBool = bool => camelize(bool) == 'true' ? 'yes' : 'no'

/*
 * Decode HTML escapes
 */
const decodeEscapes = text => {
	var txt = document.createElement("textarea");
	txt.innerHTML = text;
	return txt.value;
}

/*
 * Define a prop in an object
 */
const define = (key, val) => Object.defineProperty(window, key, val);

/*
 * Camel casify a string
 */
const camelize = str => decodeEscapes(str)
	.replace('-', ' ')
	.replace(/(?:^\w|[A-Z]|\b\w)/g, 
		(word, index) => index === 0 ? word.toLowerCase() : word.toUpperCase())
	.replace(/\s+/g, "")
	.replace(/$(\d+)/g, '$$$1');

/*
 * Build a TriviaDB query
 */
const buildTDBQuery = (number = 10) => `https://opentdb.com/api.php?amount=${ number > 0 && number < 10 ? number : 10}`;

/*
 Get quiz questions
 */
const getQuizQuestions = (...opts) => {
	const url = buildTDBQuery(...opts);

	return fetch(url)
		.then(res => res.json())
		.then(res => res.results.map(question => question.type === 'multiple' ? ({
			question: decodeEscapes(question.question),
			options: [
				camelize(question.correct_answer),
				...question.incorrect_answers.map(camelize)
			]
		}) : ({
			question: decodeEscapes(question.question),
			options: [
				parseBool(question.correct_answer),
				parseBool(question.incorrect_answers[0])
			]
		})))
		.catch(error => {
			err(
				'An error has occured. Please try refreshing the page. The error is down there 👇.'
			);
			console.error(error);
		})
};

/******* End Utils *******/

/******* Start Messaging *******/

/*
 Log an instruction to the console
 */
const instruction = (msg = '') => console.log('%c' + msg, 'padding: 0.3rem 1.5rem; font-family: Roboto; font-size: 1.2em; line-height: 1.4em; font-style: italic; border: 2px solid white;');

/*
 Log an error to the console
 */
const err = (msg = '') => console.log('%c' + msg, 'background-color: #E22134; padding: 0.3rem 1.5rem; font-family: Roboto; font-size: 1.2em; line-height: 1.4em; color: white;');

/*
 * Positive response
 */
const positive = (msg = '') => console.log('%c' + msg, 'background-color: #32CD32; padding: 0.3rem 1.5rem; font-family: Roboto; font-size: 1.2em; line-height: 1.4em; color: black;');
;

/*
 * Negative response
 */
const negative = err;

/*
 Generate the CSS for a pill
 */
const pill = (backgroundColor = 'orange', fontColor = 'black') => {
	return `background-color: ${backgroundColor}; color: ${fontColor}; padding: 0.15rem 0.75rem; font-family: Roboto; font-size: 1.2em; line-height: 1.4em; border-radius: 10px; margin: 2px;`
}

/*
 Log all the options as pills
 */
const options = opts => console.log(
	// TIL Flatmap
	'Options: ' + opts.map(opt => '%c' + opt).join(''), ...opts.map(() => pill())
)

/******* End messaging *******/

/******* Start assigning *******/

let cmds = [];

const setCmd = (key, handler) => {
	cmds.push({key, handler});
	define(key, {get: handler});
};

const clearCmd = key => {
	delete window[key];
	cmds = cmds.filter(cmd => cmd.key !== key);
};

const clearAllCmds = () => {
	cmds.forEach(({key}) => delete window[key]);
	cmds = [];
};

/******* End assigning *******/

/******* Actually start asking *******/

instruction('Welcome to the trivia quiz! Here, we\'ll get you questions from the Open Trivia DB (opentdb.com) and ask them to you. Try to answer as good as you can!');

instruction('First, choose how many questions you would like to answer');

const nums = ['one', 'two', 'three', 'four', 'five', 'six', 'seven', 'eight', 'nine', 'ten'];

let questionCount = null;

nums.forEach((num, index) => setCmd(num, () => {
	questionCount = index + 1;
	clearAllCmds();
	startQuizSession();
}));

options(nums);

const startQuizSession = () => {
	instruction(`Fetching ${questionCount} questions from OTDB... Please wait`);

	getQuizQuestions(questionCount).then((res) => {
		instruction('Fetch complete!');

		let score = 0;
		let index = 0;

		const ask = index => {
			const question = res[index];
			instruction(question.question);

			question.options.forEach((opt, idx) => setCmd(opt, () => {
				clearAllCmds();
				if (idx === 0) {
					score++;
					positive('Correct answer!');

					if (res[index + 1]) ask(index + 1);
					else positive('The quiz is over! You scored ' + score + '/' + res.length + '.')

					return;
				}

				negative('Oops, wrong answer. The correct answer was ' + question.options[0])

				if (res[index + 1]) ask(index + 1);
				else positive('The quiz is over! You scored ' + score + '/' + res.length + '.')
			}));

			options(question.options);
		};

		ask(index)
	});
};
