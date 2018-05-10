<template>
  <div class="entry">
    <font-awesome-icon :icon="['fas', 'user']" ref="icon" /> {{user.username}}
  </div>
</template>

<script>
  export default {
    name: 'online-display',
    props: ['user'],
    data () {
      return {
        canvas: undefined,
        ctx: undefined
      }
    },
    watch: {
      'user.pen': {
        handler: function () {
          this.updateColour()

        },
        deep: true
      }
    },
    methods: {
      updateColour () {
        this.$refs.icon.style = `color: rgba(${this.user.pen.r}, ${this.user.pen.g}, ${this.user.pen.b}, ${this.user.pen.a/255})`
      }
    },
    mounted () {
      this.updateColour()
    }
  }
</script>

<style lang="scss" scoped>
  .entry {
    vertical-align: middle;
  }
  canvas {
    margin-left: 0.5em;
    margin-right: 0.5em;
    height: 0.85em;
  }
</style>
