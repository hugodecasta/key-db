module.exports = ({ app }) => {

    const http = require('http')
    const server = http.createServer(app)

    const auth_api = require('../auth_api')
    app.use('/api/auth', auth_api)

    const key_api = require('../key_api')
    app.use('/api/key', key_api)

    const key_socket_api = require('../key_socket_api')
    key_socket_api.attach(server)

    return server
}