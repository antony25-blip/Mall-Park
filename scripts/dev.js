const { spawn } = require('child_process')
const path = require('path')

const root = path.resolve(__dirname, '..')
const processes = [
    {
        name: 'api',
        cwd: path.join(root, 'mall-park-server'),
        args: ['index.js'],
    },
    {
        name: 'web',
        cwd: path.join(root, 'mall-park-client'),
        args: [
            path.join('node_modules', 'vite', 'bin', 'vite.js'),
            ...process.argv.slice(2),
        ],
    },
]

let shuttingDown = false

function shutdown(exitCode = 0) {
    if (shuttingDown) {
        return
    }
    shuttingDown = true
    for (const child of processes) {
        if (child.process && child.process.exitCode === null) {
            child.process.kill()
        }
    }
    process.exitCode = exitCode
}

for (const child of processes) {
    child.process = spawn(process.execPath, child.args, {
        cwd: child.cwd,
        env: process.env,
        stdio: 'inherit',
    })

    child.process.on('error', (error) => {
        console.error(`Unable to start ${child.name}:`, error.message)
        shutdown(1)
    })

    child.process.on('exit', (code, signal) => {
        if (!shuttingDown) {
            if (signal) {
                console.log(`${child.name} stopped (${signal}).`)
            } else if (code !== 0) {
                console.error(`${child.name} exited with code ${code}.`)
            }
            shutdown(code || (signal ? 1 : 0))
        }
    })
}

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
