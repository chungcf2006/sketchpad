<template>
  <div id="app">
    <Welcome />
  </div>
</template>

<script>
import Welcome from './components/main.vue'

export default {
  name: 'app',
  components: {
    Welcome
  }
}
</script>

<style>
html body {
  width: 100vw;
  height: 100vh;
  margin: 0;
  padding: 0;
}
#app {
  font-family: 'Avenir', 'Myriad Pro', 'Lucida Sans', Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  background-image: url('./assets/welcome_bg.jpg');
  color: white;
  width: 100%;
  height: 100%;
}
</style>
