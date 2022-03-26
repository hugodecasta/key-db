import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/home.vue'
import Connect from '../views/connect.vue'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'home',
    component: HomeView
  },
  {
    path: '/connect',
    name: 'connect',
    component: Connect
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
