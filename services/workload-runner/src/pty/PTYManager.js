let pty;
try {
    pty = require('node-pty');
} catch (e) {
    console.warn('[PTY] node-pty not found. Falling back to mock shell for demonstration.');
    // Mock for environments where native build fails (like some Termux setups)
    pty = {
        spawn: (shell) => {
            const { spawn } = require('child_process');
            const proc = spawn(shell, [], {
                env: process.env,
                cwd: process.cwd(),
                shell: true
            });
            return {
                on: (event, cb) => {
                    if (event === 'data') proc.stdout.on('data', d => cb(d.toString()));
                    if (event === 'exit') proc.on('exit', cb);
                },
                write: (data) => proc.stdin.write(data),
                resize: () => {},
                kill: () => proc.kill()
            };
        }
    };
}

class PTYManager {
    constructor() {
        this.sessions = new Map();
    }

    spawn(sessionId, options = {}) {
        const {
            cols = 80,
            rows = 24,
            cwd = process.cwd(),
            shell = process.platform === 'win32' ? 'powershell.exe' : 'bash'
        } = options;

        const term = pty.spawn(shell, [], {
            name: 'xterm-256color',
            cols,
            rows,
            cwd,
            env: process.env
        });

        this.sessions.set(sessionId, term);
        return term;
    }

    resize(sessionId, cols, rows) {
        const term = this.sessions.get(sessionId);
        if (term && term.resize) term.resize(cols, rows);
    }

    write(sessionId, data) {
        const term = this.sessions.get(sessionId);
        if (term) term.write(data);
    }

    kill(sessionId) {
        const term = this.sessions.get(sessionId);
        if (term) {
            term.kill();
            this.sessions.delete(sessionId);
        }
    }
}

module.exports = new PTYManager();
