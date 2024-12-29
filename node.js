const https = require('https');
const fs = require('fs');
const express = require('express');

const app = express();
app.use(express.static('public')); // Serve your files from the "public" folder

const options = {
    key: fs.readFileSync('key.pem'), // Your private key
    cert: fs.readFileSync('cert.pem'), // Your certificate
};

https.createServer(options, app).listen(15500, () => {
    console.log('HTTPS Server running on https://localhost:15500');
});
