const {downloadImage} = require('./utils/image');
const lineByline = require('linebyline');
const fs = require('fs');
const path = require('path');

const pexels = require('pexels');
const { camelCaseToWords, removeExtension } = require('./utils/string');

const client = pexels.createClient(
	'4OtS4BNLpHggxTitGtTQtCA4nklTw9xhxipBRzAups6reldM1DUfmAJm',
);
const downloadedImages = fs.readdirSync(path.join(__dirname, '../public/images'));

const rl = lineByline(__dirname + '/data/imagelist.txt');


rl.on('line', async (line, lineCount, byteCount) => {
	const filename = path.basename(removeExtension(line));
	const query = camelCaseToWords(removeExtension(line));
    const filepath = path.join(__dirname, '../public/images', filename + '.jpeg');
	// Check if the file already exists
	if (downloadedImages.find((img) => removeExtension(img) === filename)) {
        return;
    }
	console.log(`Downloading image for ${query}...`);
	const resp = await client.photos.search({ query, per_page: 10 });
    const imageURL = resp.photos[ Math.floor(Math.random() * resp.photos.length) ]?.src.original;
    console.log("Image Fetching URL: ", imageURL);

    const savedPath = await downloadImage(imageURL, filepath)
    console.log(`Downloaded and saved: ${savedPath}`);
		
});
rl.on('end', () => {
	console.log('Finished downloading images');
});
rl.on('error', (err) => {
	console.error(err);
});
