import Vue from 'vue'
import VueRouter from 'vue-router'
import HomeView from '../views/home.vue'
import Connect from '../views/connect.vue'
import Admin from '../views/admin.vue'
import password from '../views/password.vue'

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
  },
  {
    path: '/admin',
    name: 'admin',
    component: Admin
  },
  {
    path: '/password',
    name: 'password',
    component: password
  }
]

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes
})

export default router
