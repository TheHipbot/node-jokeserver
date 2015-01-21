var http = require('http');
var fs = require('fs');
var io = require('socket.io');

// create http servers for ports to serve up client side code
var client = http.createServer(clientListener).listen(4502, function () {
    console.log("Client Listening on port 4502\n");
});

var admin = http.createServer(adminListener).listen(9506,  function () {
    console.log("Admin Listening on port 9506");
});

// create admin and client sockets
var ioClient = io.listen(client);
var ioAdmin = io.listen(admin);

// client info object
var serverInfo = {
    state: 1,
    clients: {}
};

ioClient.on('connection', function (socket) {
    socket.on('request', function (data) {
        if (!serverInfo.clients[data.id]) {
            socket.emit('get name');
        } else {
            socket.emit('response', { message: "test" });
            console.log("Response sent to " + serverInfo.clients[data.id].name);
        }
    });

    socket.on('set name', function (data) {
        serverInfo.clients[data.id] = {
            name: data.name,
            jokes: [false, false, false, false, false],
            proverbs: [false, false, false, false, false]
        }
    });
});

ioAdmin.on('connection', function (socket) {
    socket.on('get state', function (data) {
        socket.emit('state', { state: serverInfo.state });
    });

    socket.on('change state', function (data) {
        serverInfo.state = data.state;
        socket.emit('state', { state: serverInfo.state });
        console.log("State change to " + serverInfo.state);
    });

    socket.on('shutdown', function() {
        console.log('Shutdown request received');
    });
});

function clientListener (req, resp) {
    if (req.url !== '/favicon.ico') {
        // console logging
    }
    resp.writeHead(200);
    fs.createReadStream(__dirname + "/client.html").pipe(resp);
}

function adminListener (req, resp) {
    if (req.url !== '/favicon.ico') {
        // console logging
    }
    resp.writeHead(200);
    fs.createReadStream(__dirname + "/admin.html").pipe(resp);
}