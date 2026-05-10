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
const socket = new WebSocket(`ws://${window.location.host}`);

socket.onopen = () => {
    console.log('[Socket] Connected to GitLinux Kernel');
    term.write('\x1b[32mWelcome to GitLinux Cloud OS v1.0.0\x1b[m\r\n');
};

socket.onmessage = (event) => {
    const payload = JSON.parse(event.data);
    if (payload.type === 'output') {
        term.write(payload.data);
    }
};

term.onData(data => {
    socket.send(JSON.stringify({ type: 'input', data }));
});

window.addEventListener('resize', () => {
    fitAddon.fit();
    socket.send(JSON.stringify({
        type: 'resize',
        cols: term.cols,
        rows: term.rows
    }));
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
