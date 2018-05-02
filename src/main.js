import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(VueResource)
Vue.use(VueRouter)

import App from './App.vue'
import Welcome from './components/Welcome.vue'
import HelloWorld from './components/HelloWorld.vue'

const router = new VueRouter({
  routes: [
    { path: '/', component: Welcome },
    { path: '/hello', component: HelloWorld }
  ]
})

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
