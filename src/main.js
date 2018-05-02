import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'
import 'font-awesome/css/font-awesome.min.css'

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(VueResource)
Vue.use(VueRouter)

import App from './App.vue'
import Welcome from './components/Main.vue'
import Main from './components/Main.vue'

const router = new VueRouter({
  routes: [
    { path: '/', component: Welcome },
    { path: '/Main', component: Main }
  ]
})

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
