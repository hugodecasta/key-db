const { defineConfig } = require('@vue/cli-service')
const server = require('../server')
// server(8569)

module.exports = defineConfig({
  outputDir: '../dist',
  devServer: {
    proxy: {
      '/api': {
        target: 'http://localhost:8569',
      },
      '/socket.io': {
        target: 'http://localhost:8569',
        ws: true
      }
    }
  },
  transpileDependencies: [
    'vuetify'
  ]
})
