const express = require('express');
const http = require('http');
const path = require('path');
const WebSocketGateway = require('./WebSocketGateway');

const app = express();
const server = http.createServer(app);

// Serve Static Frontend
app.use(express.static(path.join(__dirname, '../public')));

// Initialize the WebSocket Gateway
new WebSocketGateway(server);

const PORT = process.env.PORT || 8080;

server.listen(PORT, '0.0.0.0', () => {
    console.log(`\x1b[36m[GitLinux Kernel] Online at Port ${PORT}\x1b[0m`);
});

process.on('SIGTERM', () => {
    server.close(() => process.exit(0));
});
