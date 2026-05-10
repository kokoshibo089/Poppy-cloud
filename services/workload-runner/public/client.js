/**
 * GitLinux Frontend Client
 */

// 1. Initialize Xterm.js
const term = new Terminal({
    cursorBlink: true,
    theme: {
        background: '#000000',
        foreground: '#00f3ff'
    },
    fontSize: 14,
    fontFamily: 'Courier New'
});
const fitAddon = new FitAddon.FitAddon();
term.loadAddon(fitAddon);
term.open(document.getElementById('terminal'));
fitAddon.fit();

// 2. WebSocket Connection
let socket;
let reconnectInterval = 2000;

function connect() {
    socket = new WebSocket(`ws://${window.location.host}`);

    socket.onopen = () => {
        console.log('[Socket] Connected to GitLinux Kernel');
        term.write('\r\n\x1b[32m[System] Connected to Kernel.\x1b[m\r\n');
        reconnectInterval = 2000;
    };

    socket.onmessage = (event) => {
        try {
            const payload = JSON.parse(event.data);
            if (payload.type === 'output') {
                term.write(payload.data);
            } else if (payload.type === 'exit') {
                term.write('\r\n\x1b[31m[System] Session terminated.\x1b[m\r\n');
            }
        } catch (e) {
            console.error('[Socket] Message parse error', e);
        }
    };

    socket.onclose = () => {
        console.log('[Socket] Disconnected. Retrying...');
        term.write('\r\n\x1b[33m[System] Disconnected. Reconnecting...\x1b[m\r\n');
        setTimeout(connect, reconnectInterval);
        reconnectInterval = Math.min(reconnectInterval * 2, 30000);
    };

    socket.onerror = (err) => {
        console.error('[Socket] Error:', err);
    };
}

connect();

term.onData(data => {
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({ type: 'input', data }));
    }
});

window.addEventListener('resize', () => {
    fitAddon.fit();
    if (socket && socket.readyState === WebSocket.OPEN) {
        socket.send(JSON.stringify({
            type: 'resize',
            cols: term.cols,
            rows: term.rows
        }));
    }
});

// 3. Initialize Monaco Editor
require.config({ paths: { vs: 'https://cdn.jsdelivr.net/npm/monaco-editor@0.44.0/min/vs' } });
require(['vs/editor/editor.main'], function () {
    const editor = monaco.editor.create(document.getElementById('monaco-editor'), {
        value: [
            '// GitLinux Cloud IDE',
            'function welcome() {',
            '    console.log("Welcome to GitLinux!");',
            '}',
            '',
            'welcome();'
        ].join('\n'),
        language: 'javascript',
        theme: 'vs-dark',
        automaticLayout: true,
        fontSize: 14
    });

    console.log('[Monaco] Editor ready');
});
