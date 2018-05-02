import Vue from 'vue'
import BootstrapVue from 'bootstrap-vue'
import VueResource from 'vue-resource'
import VueRouter from 'vue-router'
import fontawesome from '@fortawesome/fontawesome'
import FontAwesomeIcon from '@fortawesome/vue-fontawesome'
import solid from '@fortawesome/fontawesome-free-solid'

import 'bootstrap/dist/css/bootstrap.css'
import 'bootstrap-vue/dist/bootstrap-vue.css'

fontawesome.library.add(solid)

Vue.config.productionTip = false

Vue.use(BootstrapVue)
Vue.use(VueResource)
Vue.use(VueRouter)

Vue.component('font-awesome-icon', FontAwesomeIcon)

import App from './App.vue'
import Welcome from './components/Welcome.vue'
import Main from './components/Main.vue'

const router = new VueRouter({
  routes: [
    { path: '/', component: Welcome },
    { path: '/main', component: Main }
  ]
})

new Vue({
  render: h => h(App),
  router
}).$mount('#app')
