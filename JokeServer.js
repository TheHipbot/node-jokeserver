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
    state: 'jokes',
    clients: {}
};

var jokes = [
    "How many programmers does it take to change a light bulb? none, that's a hardware problem\n",
    "A neutron walks into a bar and asks how much for a beer? The bartender says, for you? no charge.\n",
    "A man didn't like his haircut, but it started to grow on him.\n",
    "What do you call a bear with no teeth? A gummy bear.\n",
    "What's the best way to carve wood? Whittle by whittle.\n"
];

var proverbs = [
    "A penny saved is a penny earned\n",
    "A bird in the hand is worth two in the bush\n",
    "A drowning man will clutch at a straw\n",
    "A journey of a thousand miles begins with a single step\n",
    "A poor workman always blames his tools\n"
];

ioClient.on('connection', function (socket) {
    socket.on('request', function (data) {
        if (!serverInfo.clients[data.id]) {
            socket.emit('get name');
        } else {
            var message,
                r = Math.floor(Math.random() * 5),
                allUsed = true;

            if (serverInfo.state === 'maintenance') {
                socket.emit('response', { message: "Server Maintenance, please try again later" });
            } else {

                for (var i = 0; i < 5; i++) {
                    allUsed = allUsed && serverInfo.clients[data.id][serverInfo.state][i];
                }

                if (allUsed) {
                    serverInfo.clients[data.id][serverInfo.state] = [false, false, false, false, false];
                }

                while (serverInfo.clients[data.id][serverInfo.state][r]) {
                    r = Math.floor(Math.random() * 5);
                }

                message = (serverInfo.state === 'jokes') ?  jokes[r] : proverbs[r];

                socket.emit('response', {message: message});
                serverInfo.clients[data.id][serverInfo.state][r] = true;
            }
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
        ioAdmin.sockets.emit('state', { state: serverInfo.state });
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