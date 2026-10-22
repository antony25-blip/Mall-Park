const { spawn } = require('child_process')
const net = require('net')
const path = require('path')

const root = path.resolve(__dirname, '..')
const requestedPort = Number(process.env.PORT) || 3000
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

function isPortAvailable(port) {
    return new Promise((resolve, reject) => {
        const server = net.createServer()
        server.once('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                resolve(false)
            } else {
                reject(error)
            }
        })
        server.listen(port, () => {
            server.close((error) => {
                if (error) {
                    reject(error)
                } else {
                    resolve(true)
                }
            })
        })
    })
}

async function findAvailablePort(startPort) {
    if (!Number.isInteger(startPort) || startPort < 1 || startPort > 65535) {
        throw new Error(`Invalid API port: ${process.env.PORT}`)
    }

    for (let port = startPort; port <= 65535; port += 1) {
        if (await isPortAvailable(port)) {
            return port
        }
    }

    throw new Error(`No available API port found at or above ${startPort}.`)
}

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

async function start() {
    const port = await findAvailablePort(requestedPort)
    if (port !== requestedPort) {
        console.warn(`API port ${requestedPort} is in use; using port ${port} instead.`)
    }

    const env = {
        ...process.env,
        PORT: String(port),
        MALLPARK_API_TARGET: `http://localhost:${port}`,
    }

    for (const child of processes) {
        child.process = spawn(process.execPath, child.args, {
            cwd: child.cwd,
            env,
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
}

start().catch((error) => {
    console.error(`Unable to start development servers: ${error.message}`)
    shutdown(1)
})

process.on('SIGINT', () => shutdown(0))
process.on('SIGTERM', () => shutdown(0))
