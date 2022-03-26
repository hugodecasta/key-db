module.exports = async (PORT) => {

    const express = require('express')
    const app = express()

    const http = require('http')
    const server = http.createServer(app).listen(PORT)

    // const swaggerUi = require('swagger-ui-express')
    // const swaggerFile = require('./swagger_output.json')
    // app.use('/doc', swaggerUi.serve, swaggerUi.setup(swaggerFile))

    const auth_api = require('./auth_api')
    app.use('/api/auth', auth_api)

    const key_api = require('./key_api')
    app.use('/api/key', key_api)

    const key_socket_api = require('./key_socket_api')
    key_socket_api.attach(server)

    server.on('close', () => console.log('KEY-DB server closed'))
    console.log('KEY-DB server listening on', PORT)

    return server
}