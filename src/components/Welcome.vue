<template>
  <div class="dialog">
    <h1>Welcome to Online Sketchpad</h1>
    <div class="row">
      <b-button variant="success" @click="join()">Join</b-button>
      <b-button variant="primary" @click="create()">Create</b-button>
    </div>
  </div>
</template>

<script>
export default {
  name: 'Welcome',
  props: {
    msg: String
  },
  methods: {
    join () {
      console.log('hi')
    },
    create () {
      console.log('hi2')
    },
  }
}
</script>

<style lang="scss" scoped>


  .dialog {
    position: absolute;
    margin: auto;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 25%;
    width: 75%;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
    .row {
      display: flex;
      @keyframes fadein {
        0%   {top: 1em; opacity: 0;}
        100% {top: 0; opacity: 100%;}
      }
      >* {
        position: relative;
        width: 100%;
        flex-basis: calc(50% - 0.5em);
        font-size: 3em;
        margin: 0.25em;
        padding: 1em;
        animation-name: fadein;
        animation-duration: 1s;
      }
    }
  }
</style>
