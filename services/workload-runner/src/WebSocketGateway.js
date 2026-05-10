const { WebSocketServer } = require('ws');
const PTYManager = require('./pty/PTYManager');

/**
 * WebSocketGateway handles incoming client connections and 
 * pipes them to the appropriate PTY session.
 */
class WebSocketGateway {
    constructor(server) {
        this.wss = new WebSocketServer({ server });
        this.init();
    }

    init() {
        this.wss.on('connection', (ws, req) => {
            console.log('[Gateway] New connection established');

            // In production, extract sessionId from URL/Auth header
            const sessionId = 'test-session-' + Math.random().toString(36).substr(2, 9);

            // Spawn the PTY session
            let term;
            try {
                term = PTYManager.spawn(sessionId);
            } catch (err) {
                console.error(`[PTY] Failed to spawn for ${sessionId}:`, err);
                ws.send(JSON.stringify({ type: 'output', data: '\r\n[System Error] Failed to initialize terminal.\r\n' }));
                ws.close();
                return;
            }

            // Pipe PTY output to WebSocket
            term.on('data', (data) => {
                if (ws.readyState === ws.OPEN) {
                    ws.send(JSON.stringify({ type: 'output', data }));
                }
            });

            term.on('exit', () => {
                console.log(`[PTY] Session ${sessionId} exited`);
                ws.send(JSON.stringify({ type: 'exit' }));
                ws.close();
            });

            // Handle incoming WebSocket messages
            ws.on('message', (message) => {
                try {
                    const payload = JSON.parse(message);
                    
                    switch (payload.type) {
                        case 'input':
                            PTYManager.write(sessionId, payload.data);
                            break;
                        case 'resize':
                            PTYManager.resize(sessionId, payload.cols, payload.rows);
                            break;
                        case 'ping':
                            ws.send(JSON.stringify({ type: 'pong' }));
                            break;
                    }
                } catch (err) {
                    console.error('[Gateway] Error parsing message:', err);
                }
            });

            ws.on('close', () => {
                console.log(`[Gateway] Connection closed for ${sessionId}`);
                PTYManager.kill(sessionId);
            });

            ws.on('error', (err) => {
                console.error(`[Gateway] Socket error for ${sessionId}:`, err);
                PTYManager.kill(sessionId);
            });
        });
    }
}

module.exports = WebSocketGateway;
