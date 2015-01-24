/**--------------------------------------------------------

 1. Jeremy Chambers / 2015-01-24

 2. NodeJS 0.10.35

 3. Precise command-line run examples / instructions:

    Requires NodeJS, available here: http://nodejs.org/

    If you have pulled the code down from github, you must
    first run `npm install` to install required node modules

 e.g.:

 > node JokeServer.js


 4. Precise examples / instructions to run this program:

 e.g.:

 While node server is running, visit the server through your browser

 > http://localhost:4502 for client
 > http://localhost:9506 for admin

 If you would like to connect to the server from another computer on the
 same network replace 'localhost' with the local IP address of the server computer


 ----------------------------------------------------------*/

var http = require('http');
var fs = require('fs');
var io = require('socket.io');

// create http listeners for ports to serve up client side code
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

/**
 * Create client socket, socket.io uses an event base model for
 * socket communication. The outer layer defines the connection
 * and the inner layers define the events the server should listen
 * for and what to do upon receiving each type of request
 */
ioClient.on('connection', function (socket) {
    /**
     * Listen for request event, client socket has
     * requested a message
     */
    socket.on('request', function (data) {
        // if new user, request name
        if (!serverInfo.clients[data.id]) {
            socket.emit('get name');
        } else {
            var message,
                r = Math.floor(Math.random() * 5),
                allUsed = true;

            // check state
            if (serverInfo.state === 'maintenance') {
                socket.emit('response', { message: "Server Maintenance, please try again later" });
            } else {

                // check to see if used responses must be reset
                for (var i = 0; i < 5; i++) {
                    allUsed = allUsed && serverInfo.clients[data.id][serverInfo.state][i];
                }

                if (allUsed) {
                    serverInfo.clients[data.id][serverInfo.state] = [false, false, false, false, false];
                }

                // find valid random message
                while (serverInfo.clients[data.id][serverInfo.state][r]) {
                    r = Math.floor(Math.random() * 5);
                }

                message = (serverInfo.state === 'jokes') ?  jokes[r] : proverbs[r];

                // send response
                socket.emit('response', {message: serverInfo.clients[data.id].name + ', ' + message});
                serverInfo.clients[data.id][serverInfo.state][r] = true;
            }
        }
    });

    /**
     * Listen for set name event from client socket,
     * client has set name so we create a new record for the
     * client
     */
    socket.on('set name', function (data) {
        serverInfo.clients[data.id] = {
            name: data.name,
            jokes: [false, false, false, false, false],
            proverbs: [false, false, false, false, false]
        }
    });
});

/**
 * Create admin socket and events to listen for
 */
ioAdmin.on('connection', function (socket) {
    /**
     * Listen for get state event from client socket,
     * state has been requested, send state to client
     */
    socket.on('get state', function (data) {
        socket.emit('state', { state: serverInfo.state });
    });

    /**
     * Listen for change state event from client socket,
     * update the state and notify all admin clients connected
     */
    socket.on('change state', function (data) {
        serverInfo.state = data.state;
        ioAdmin.sockets.emit('state', { state: serverInfo.state });
        console.log("State change to " + serverInfo.state);
    });

    /**
     * Shutdown has been requested, close socket
     */
    socket.on('shutdown', function() {
        socket.close();
    });
});

/**
 * http listeners for admin and client jokeclients
 * here is where we serve up html and client socket code
 *
 * @param req request data from client
 * @param resp response data to send to client
 */
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