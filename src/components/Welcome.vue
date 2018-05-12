<template>
  <div>
    <b-alert variant="danger" :show="error !== undefined">{{error}}</b-alert>
    <b-alert show class="dialog" variant="success">
      <h1>Welcome to Online Sketchpad</h1>
      <transition name="slide-fade" mode="out-in" appear>
        <div class="row" v-if="mode === undefined" key="selector">
          <b-button class="mode" key="join" variant="success" @click="join()">Join</b-button>
          <b-button class="mode" key="create" variant="primary" @click="create()">Create</b-button>
        </div>
        <b-alert show v-if="mode === 'join'" key="join" class="detail-dialog">
          <b-form @submit="joinRoom(roomNumber)">
            <b-form-input v-model="roomNumber" pattern="\d*" class="roomNumber-input" type="text" placeholder="Enter Room Number"></b-form-input>
            <b-button class="mode" variant="success" type="submit">Join Room</b-button>
            <b-button class="mode" variant="secondary" @click="mode = undefined">Back</b-button>
          </b-form>
        </b-alert>
        <b-alert show v-if="mode === 'create'" key="create" class="detail-dialog">
          <div>Your Room Number: <strong>{{newRoomNumber}}</strong></div>
          <b-button class="mode" variant="success" @click="joinRoom(newRoomNumber)">Enter Room</b-button>
          <b-button class="mode" variant="secondary" @click="mode = undefined">Back</b-button>
        </b-alert>
      </transition>
    </b-alert>
  </div>
</template>

<script>
export default {
  name: 'Welcome',
  data () {
    return {
      mode: undefined,
      roomNumber: undefined,
      newRoomNumber: undefined,
      error: undefined
    }
  },
  methods: {
    join () {
      this.mode = 'join'
    },
    create () {
      this.newRoomNumber = Math.floor(Math.random() * 1000000).toString().padStart(6, '0')
      // this.newRoomNumber = '123456'
      this.$http.get(`/api/sketchpads/${this.newRoomNumber}`).then(() => {
        this.create()
      }).catch(() => {})

      this.mode = 'create'
    },
    joinRoom (roomNumber) {
      this.$http.get(`/api/sketchpads/${roomNumber}`).then(() => {
        if (this.mode === 'join') {
          this.$store.commit('roomNumber', {roomNumber: roomNumber})
          this.$router.push('/main')
        }

      }).catch(() => {
        if (this.mode === 'create') {
          this.$http.post(`/api/sketchpads/${roomNumber}`).then(() => {
            this.$store.commit('roomNumber', {roomNumber: roomNumber})
            this.$router.push('/main')
          })
        } else {
          this.error = 'Cannot join room'
        }
      })
    }
  }
}
</script>

<style lang="scss" scoped>

  .dialog {
    .slide-fade-enter-active, .slide-fade-leave-active { transition: all .3s ease; }
    .slide-fade-enter { transform: translateY(0.5em); opacity: 0; }
    .slide-fade-leave-to { transform: translateX(0.5em); opacity: 0; }
    position: absolute;
    margin: auto;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
    max-height: 28%;
    width: 75%;
    padding-top: 0.5em;
    padding-bottom: 0.5em;
    font-size: 3em;
    input, button {
      font-size: 0.75em;
    }
    .row {
      display: flex;
      button.mode {
        position: relative;
        width: 100%;
        flex-basis: calc(50% - 0.5em);
        border-radius: 0.5em;
        margin: 0.25em;
        padding: 1em;
      }
    }
  }
  .detail-dialog {
    button {
      margin: 0.1em;
    }
  }
</style>
