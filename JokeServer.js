var http = require('http');

http.createServer(clientListener).listen(4502);
http.createServer(adminListener).listen(9506);

var clientInfo = {};

function clientListener(req, resp) {
    resp.write("Client Request");
    resp.end();
}

function adminListener(req, resp) {
    resp.write("Admin Request");
    resp.end();
}