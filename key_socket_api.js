const { Server } = require("socket.io")
const io = new Server({ cors: { origin: '*' } })
module.exports = io

const auth_engine = require('./auth_engine')
const kam = require('./key_auth_middleware')


const socket_list = []

// --------------------- connection & auth

io.on('connection', (socket) => {
    if (!socket_list.includes(socket)) socket_list.push(socket)

    socket.on('auth', (token) => {
        socket.token = token
        if (!auth_engine.connected(token)) {
            delete socket.token
            socket.emit('auth_fail', null)
        } else {
            socket.emit('auth_success', token)
        }
    })

    socket.on('unauth', () => {
        delete socket.token
    })

    socket.emit('setup', true)
})

// --------------------- send updates

kam.subscribe((key, event, data, before_delete) => {
    const sending_sockets = socket_list.filter(socket => {
        const token = socket.token
        if (token != null && !auth_engine.connected(token)) {
            delete socket.token
            socket.emit('auth_fail', null)
            return false
        }
        if (!kam.has_access(token, key, 'get')) return false
        return true
    })

    sending_sockets.forEach(socket => {
        socket.emit('update', { key, event, data })
    })
})