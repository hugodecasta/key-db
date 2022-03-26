const { defineConfig } = require('@vue/cli-service')
const dev_server = require('./dev_server')

module.exports = defineConfig({
  outputDir: '../dist',
  devServer: {
    onBeforeSetupMiddleware: dev_server
  },
  transpileDependencies: [
    'vuetify'
  ]
})
