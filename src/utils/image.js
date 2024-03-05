const fs = require('fs');
const client = require('https');
const lineByline = require('linebyline');
const { removeExtension } = require('./string');

const downloadImage = (url, filepath) =>
	new Promise((resolve, reject) => {
		client.get(url, (res) => {
			if (res.statusCode === 200) {
				res
					.pipe(fs.createWriteStream(filepath))
					.on('error', reject)
					.once('close', () => resolve(filepath));
			} else {
				res.resume();
				reject(
					new Error(`Request Failed With a Status Code: ${res.statusCode}`),
				);
			}
		});
	});

getImages = () =>
	new Promise((resolve, reject) => {
		const rl = lineByline(__dirname + '/../data/imagelist.txt');
		let images = [];
		rl.on('line', async (line, lineCount, byteCount) => {
			images.push(removeExtension(line));
		});
		rl.on('end', () => {
			resolve(images);
		});
		rl.on('error', (err) => {
			reject(err);
		});
	});

module.exports = { downloadImage, getImages };
