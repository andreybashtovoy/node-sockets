const http = require('http');
const fs = require('fs');
const path = require('path');

const host = 'localhost';
const port = '8000';

const requestListener = (req, res) => {
    const contentPath = path.join(__dirname,
        'src/', req.url === '/' ? 'index.html' : req.url);

    fs.readFile(contentPath, (err, data) => {
        if (err) {
            res.writeHead(404);
            res.end(JSON.stringify(err));
            return;
        }

        res.writeHead(200);
        res.end(data);
    });
};

const server = http.createServer(requestListener);

server.listen(port, host, () => {
    console.log(`Server is running on http://${host}:${port}`);
});