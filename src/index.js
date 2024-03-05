const express = require('express');
const cors = require('cors');
const path = require('path');
const sessions = require('client-sessions');
const { create } = require('express-handlebars');
const { camelCaseToWords } = require('./utils/string');
const { getImages } = require('./utils/image');
const { readFile, writeFile } = require('fs/promises');

const app = express();
app.use(
	sessions({
		cookieName: 'session',
		secret: 'a very long and complex secret',
	}),
);

const hbs = create({
	extname: '.hbs',
	helpers: {
		camelCaseToWords,
	},
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, '../public')));
app.engine('.hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use((req, res, next) => {
	// Custom middleware to parse the cookie
	if (req.headers.cookie) {
		const cookies = req.headers.cookie.split(';').map((c) => {
			const [key, value] = c.trim().split('=');
			return { [key]: value };
		});
		req.cookies = cookies;
	} else {
		req.cookies = [];
	}
	next();
});

app.get('/', async (req, res) => {
	//! Client Sessions is not getting or setting the cookie so we are directly accessing the session object
	const user = req.cookies[0]?.username;
	if (!user) {
		return res.redirect('/login');
	}
	const images = await getImages();
	if (!app.locals.currentImage) {
		app.locals.currentImage = images[0];
	}
	const imageUrl = path.join(`/images/${app.locals.currentImage}.jpeg`);
	res.render('index', {
		layout: 'main',
		images,
		imageUrl: imageUrl,
		currentImage: camelCaseToWords(app.locals.currentImage),
		user: user,
	});
});

app.post('/login', async (req, res) => {
	if (!req.body.username || !req.body.password) {
		app.locals.error = 'Please provide a username and password';
		return res.redirect('/login');
	}
	const users = await readFile(
		path.join(__dirname, '/data/user.json'),
		'utf-8',
	);
	const parsedUsers = JSON.parse(users);

	const user = parsedUsers[req.body.username];
    if (!user) {
        app.locals.error = 'Not a registered username';
        return res.redirect('/login');
    }
	if (user !== req.body.password) {
		app.locals.error = 'Invalid password';
		return res.redirect('/login');
	}
	app.locals.error = null;
	req.session.user = req.body.username;
	//! Needed to set the cookie because the client-sessions library is not setting the cookie
	res.setHeader('Set-Cookie', `username=${req.body.username}; HttpOnly`);

	res.redirect('/');
});

app.get('/logout', (req, res) => {
	res.clearCookie('username');
	// This Does not work
	req.session.reset();
	res.redirect('/login');
});

app.get('/login', (req, res) => {
	const user = req.cookies[0]?.username;
	if (user) {
		return res.redirect('/');
	}
	res.render('login', {
		layout: 'main',
		error: app.locals.error,
	});
});

app.post('/register', async (req, res) => {
	if (!req.body.username || !req.body.password || !req.body.confirmPassword) {
		app.locals.error = 'Please provide a username and password';
		return res.redirect('/register');
	}
	if (req.body.password !== req.body.confirmPassword) {
		app.locals.error = 'Passwords do not match';
		return res.redirect('/register');
	}
	const users = await readFile(
		path.join(__dirname, '/data/user.json'),
		'utf-8',
	);
	const parsedUsers = JSON.parse(users);

	if (parsedUsers[req.body.username]) {
		app.locals.error = 'Username already exists';
		return res.redirect('/register');
	}
	parsedUsers[req.body.username] = req.body.password;
	await writeFile(
		path.join(__dirname, '/data/user.json'),
		JSON.stringify(parsedUsers, null, 2),
	);
	app.locals.error = null;
	req.session.user = req.body.username;
	//! Needed to set the cookie because the client-sessions library is not setting the cookie
	res.setHeader('Set-Cookie', `username=${req.body.username}; HttpOnly`);
	res.redirect('/');
});

app.get('/register', (req, res) => {
	const user = req.cookies[0]?.username;
	if (user) {
		return res.redirect('/');
	}
	res.render('register', {
		layout: 'main',
		error: app.locals.error,
	});
});

app.post('/change-image', (req, res) => {
	if (!req.body.image) {
		return res.redirect('/');
	}
	app.locals.currentImage = req.body.image;

	res.redirect('/');
});

const PORT = process.env.PORT || 3000;

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT} 🔥 🔥 `);
});
