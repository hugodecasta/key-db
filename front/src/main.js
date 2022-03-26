import Vue from 'vue'
import App from './App.vue'
import router from './router'
import vuetify from './plugins/vuetify'
import './plugins/api.js'
import mobile_detect from './plugins/mobile_detect'
import key_api from './plugins/key_api'

Vue.config.productionTip = false

Vue.use(mobile_detect)
Vue.use(key_api(''))

new Vue({
  router,
  vuetify,
  render: h => h(App)
}).$mount('#app')
