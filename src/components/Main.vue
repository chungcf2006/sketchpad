<template>
  <div class="parent">
    <b-modal ref="setUsername" @ok="verifyUsername" title="Set Screen Name">
      <b-alert variant="danger" :show="setUsername.error !== undefined">{{setUsername.error}}</b-alert>
      <b-input type="text" placeholder="Please set your screen name" v-model="setUsername.username" />
    </b-modal>
    <div id="sketchpadapp" ref="sketchpadapp">
      <canvas ref="sketchpad" @mouseup="sketchpad_mouseUp" @mousedown="sketchpad_mouseDown" @mousemove="sketchpad_mouseMove"></canvas>
    </div>
    <div class="panel">
      <div id="console_box" ref="console_box">
        <div v-for="(entry, index) in console_box" :key="index">&lt;{{entry.date}}&gt; {{entry.activity}}</div>
      </div>

      <div class="leftside" ref="leftside">
        <div>
          <b-button><font-awesome-icon :icon="['fas', 'download']" /></b-button>
          <b-button><font-awesome-icon :icon="['fas', 'trash']" /></b-button>
          <b-button variant="primary" @click="save()"><font-awesome-icon :icon="['fas', 'save']" /></b-button>
        </div>
        <div>
          <b-button :variant="sketchpad.mode==='brush'?'success':'secondary'" @click="sketchpad.mode='brush'"><font-awesome-icon :icon="['fas', 'paint-brush']" /></b-button>
          <b-button :variant="sketchpad.mode==='square'?'success':'secondary'" @click="sketchpad.mode='square'"><font-awesome-icon :icon="['fas', 'square']" /></b-button>
          <b-button :variant="sketchpad.mode==='circle'?'success':'secondary'" @click="sketchpad.mode='circle'"><font-awesome-icon :icon="['fas', 'circle']" /></b-button>
        </div>
        <div>
          <b-button id="edit" :variant="!sketchpad.erase?'success':'secondary'" @click="sketchpad.erase=false"><font-awesome-icon :icon="['fas', 'edit']" /></b-button>
          <b-button id="eraser" :variant="sketchpad.erase?'success':'secondary'" @click="sketchpad.erase=true"><font-awesome-icon :icon="['fas', 'eraser']" /></b-button>
        </div>
        <div class="slide-control"><input id="dia" v-model="pen.dia" type="range" min="1" max="30" step="0.1" />{{pen.dia}}</div>
        <div class="slide-control"><input id="r" v-model="pen.r" type="range" min="0" max="255" />{{pen.r}}</div>
        <div class="slide-control"><input id="g" v-model="pen.g" type="range" min="0" max="255" />{{pen.g}}</div>
        <div class="slide-control"><input id="b" v-model="pen.b" type="range" min="0" max="255" />{{pen.b}}</div>
      </div>
      <div class="online_box">
        <b-alert show class="header">#{{roomNumber}}</b-alert>
        <b-alert show variant="secondary" id="onlineUsers">
          <ul>
            <li v-for="user in onlineUsers" :key="user.name"><online-display :user="user"></online-display></li>
          </ul>
        </b-alert>
      </div>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import io from 'socket.io-client'
  import OnlineDisplay from './templates/OnlineDisplay'

  export default{
    name: 'Main',
    components: {
      'online-display': OnlineDisplay
    },
    data () {
      return {
        onlineUsers: [],
        username: 'john',
        sketchpad: {canvas: undefined, ctx: undefined, imageData: undefined, mode: 'brush', erase: false},

        pen: {dia: 5, r: undefined, b: undefined, g: undefined, a: 255},
        mouse: {x: 0, y: 0, down: 0},
        isDrawing: undefined, lastPoint: undefined,
        date_format: 'YYYY-MM-DD HH:mm:ss',
        console_box: [],
        socket: undefined,
        pendingSend: {},
        setUsername: {username: undefined, error: undefined}
      }
    },
    computed: {
      roomNumber () {
        return this.$store.state.roomNumber
      }
    },
    watch: {
      pen: {
        handler: function () {
          let data = {username: this.username}
          data.pen = this.pen
          this.socket.emit('update_pen', data)
        },
        deep: true
      },
      'sketchpad.erase': function () {
        if (this.sketchpad.erase) {
          this.sketchpad.ctx.globalCompositeOperation = 'destination-out'
          this.log('Yu using eraser')
        } else {
          this.sketchpad.ctx.globalCompositeOperation = 'source-over'
          this.log('Yu using edit')
        }
      }
    },
    methods:{
      log (content) {
        this.console_box.unshift({
          date: moment().format(this.date_format),
          activity: content
        })
      },
      verifyUsername (e) {
        e.preventDefault()
        this.$http.post(`/api/sketchpads/${this.roomNumber}/login`, {username: this.setUsername.username}).then(response => {
          console.log(response)
          localStorage.setItem('username', this.setUsername.username)
          this.username = this.setUsername.username
          this.$refs.setUsername.hide()
        }).catch(error => {
          this.setUsername.error = "Username already exists"
        })
      },
      loadUserlist () {
        this.$http.get(`/api/sketchpads/${this.roomNumber}/members`).then(response => {
          this.onlineUsers = response.data
        })
      },
      sketchpad_mouseDown (e) {
        this.isDrawing = true;
        this.lastPoint = { x: this.sketchpad.canvas.width * (e.clientX/this.sketchpad.canvas.offsetWidth), y: this.sketchpad.canvas.height * (e.clientY/this.sketchpad.canvas.offsetHeight)};

        if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight < (16/9)) {
          const blank = (this.sketchpad.canvas.offsetHeight - (this.sketchpad.canvas.offsetWidth*9/16))/2
          this.lastPoint.y = this.sketchpad.canvas.height * ((e.clientY - blank)/(this.sketchpad.canvas.offsetWidth*9/16))
        }
        if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight > (16/9)) {
          const blank = (this.sketchpad.canvas.offsetWidth - (this.sketchpad.canvas.offsetHeight*16/9))/2
          this.lastPoint.x = this.sketchpad.canvas.width * ((e.clientX - blank)/(this.sketchpad.canvas.offsetHeight*16/9))
        }

        this.log('Key Down')
        this.sketchpad.imageData = this.sketchpad.ctx.getImageData(0, 0, 1920, 1080)
        this.pendingSend.pen = this.pen
        this.pendingSend.erase = this.sketchpad.erase
        this.pendingSend.mode = this.sketchpad.mode
        this.pendingSend.coordinates = [this.lastPoint]
        this.setPen(this.pen)

      },
      sketchpad_mouseMove (e) {
        if (!this.isDrawing) return;

        var currentPoint = {};

        if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight < (16/9)) {
          const blank = (this.sketchpad.canvas.offsetHeight - (this.sketchpad.canvas.offsetWidth*9/16))/2
          currentPoint.y = this.sketchpad.canvas.height * ((e.clientY - blank)/(this.sketchpad.canvas.offsetWidth*9/16))
          currentPoint.x = this.sketchpad.canvas.width * (e.clientX/this.sketchpad.canvas.offsetWidth)
        } else if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight > (16/9)) {
          const blank = (this.sketchpad.canvas.offsetWidth - (this.sketchpad.canvas.offsetHeight*16/9))/2
          currentPoint.x = this.sketchpad.canvas.width * ((e.clientX - blank)/(this.sketchpad.canvas.offsetHeight*16/9))
          currentPoint.y = this.sketchpad.canvas.height * (e.clientY/this.sketchpad.canvas.offsetHeight)
        } else {
           currentPoint.x = this.sketchpad.canvas.width * (e.clientX/this.sketchpad.canvas.offsetWidth)
           currentPoint.y = this.sketchpad.canvas.height * (e.clientY/this.sketchpad.canvas.offsetHeight)
        }

        currentPoint.x = Math.floor(currentPoint.x)
        currentPoint.y = Math.floor(currentPoint.y)
        this.log('Key Move:' + currentPoint.x + ", " + currentPoint.y);

        if(this.sketchpad.mode === 'brush'){
          this.draw(this.lastPoint, currentPoint)
          this.pendingSend.coordinates[0] = this.lastPoint
          this.pendingSend.coordinates[1] = currentPoint
          this.lastPoint = currentPoint
        } else if(this.sketchpad.mode === 'square'){
          this.draw_rect(this.lastPoint, currentPoint)
          this.pendingSend.coordinates[1] = currentPoint
        }
        this.socket.emit('new_stroke', this.pendingSend)
      },
      sketchpad_mouseUp () {
        this.sketchpad.ctx.save()
        this.isDrawing = false
        this.lastPoint = undefined
        this.log('Key Up')
      },
      clearCanvas (canvas, ctx) {
        ctx.clearRect(0, 0,
          canvas.width, canvas.height);
      },
      draw_rect(last, current) {
        if (this.sketchpad.imageData !== undefined) {
          this.sketchpad.ctx.putImageData(this.sketchpad.imageData, 0, 0)
        }
        this.sketchpad.ctx.beginPath()
        this.sketchpad.ctx.rect(last.x, last.y, current.x-last.x, current.y-last.y)
        this.sketchpad.ctx.closePath()
        this.sketchpad.ctx.stroke()
      },
      draw (last, current) {
        this.sketchpad.ctx.beginPath()
        this.sketchpad.ctx.moveTo(last.x, last.y)
        this.sketchpad.ctx.lineTo(current.x, current.y)
        this.sketchpad.ctx.stroke()
      },
      save () {
        const fd = new FormData()
        this.sketchpad.canvas.toBlob((blob) => {
          fd.append('sketchpad', blob)
          this.$http.post(`/api/sketchpads/${this.roomNumber}`, fd, {
            headers: {
              'Content-Type': 'multipart/form-data'
            }
          })
        })
      },
      defineSketchpad () {
        this.sketchpad.canvas = this.$refs.sketchpad;

        this.sketchpad.canvas.width = 1920
        this.sketchpad.canvas.height = 1080

        if(this.sketchpad.canvas.getContext){
          this.sketchpad.ctx = this.sketchpad.canvas.getContext('2d');

          this.sketchpad.ctx.lineCap='round'
          var img = document.createElement('img')
          img.onload = () => {
            this.sketchpad.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, this.sketchpad.canvas.width, this.sketchpad.canvas.height)
          }
          img.src = `/api/sketchpads/${this.roomNumber}`
        }
      },
      bindWebSocket () {
        this.socket = io({
          query: {
            sketchpadID: this.roomNumber
          }
        })
        this.socket.open()
        this.socket.on('draw', data => {
          this.setPen(data.pen)
          const originalComposite = this.sketchpad.ctx.globalCompositeOperation
          if (data.erase) {
            this.sketchpad.ctx.globalCompositeOperation = 'destination-out'
          } else {
            this.sketchpad.ctx.globalCompositeOperation = 'source-over'
          }
          switch (data.mode) {
            case 'brush':
              for (let i = 0; i < data.coordinates.length - 1; i++) {
                this.draw(data.coordinates[i], data.coordinates[i+1])
              }
              break
            case 'square':
              this.draw_rect(data.coordinates[0], data.coordinates[1])
              break
          }

          this.sketchpad.ctx.globalCompositeOperation = originalComposite
        })
        this.socket.on('display_update_pen', data => {
          let index
          if ((index = this.onlineUsers.findIndex(user => user.username === data.username)) != -1) {
            this.onlineUsers[index].pen = data.pen
          }
        })
      },
      setPen (pen) {
        this.sketchpad.ctx.strokeStyle = `rgba(${pen.r}, ${pen.g}, ${pen.b}, ${pen.a/255})`
        this.sketchpad.ctx.lineWidth = pen.dia
      }
    },
    mounted() {
      this.username = localStorage.getItem('username')
      if (this.username === null) {
        this.$refs.setUsername.show()
      }
      if (this.$store.state.roomNumber === undefined) {
        // this.$router.push('/')
        this.$store.commit('roomNumber', {roomNumber: '123456'})
      }
      this.pen.r = Math.floor(Math.random()*256);
      this.pen.g = Math.floor(Math.random()*256);
      this.pen.b = Math.floor(Math.random()*256);

      this.defineSketchpad()
      this.loadUserlist()

      this.bindWebSocket()

      this.log(`Welcome, ${this.username}!`);
    }
  }
</script>

<style lang="scss" scoped>
  .modal-dialog {
    color: black;
  }
  .parent{
    height: 100%;
    display: flex;
    flex-direction: row;
    overflow: hidden;
  }
  .header {
    font-size: 1.5em;
    font-weight: bold;
    margin: 0;
  }
  #sketchpadapp {
    -webkit-touch-callout: none;
    -webkit-user-select: none;
    -khtml-user-select: none;
    -moz-user-select: none;
    -ms-user-select: none;
    user-select: none;
    overflow:auto;
    width:100%;
    height:100%;
    flex-basis: 80%;
    overflow: hidden;
    canvas {
      object-fit: contain;
      width: 100%;
      height: 100%;
      // background-color: black;
    }
  }
  .panel {
    display: flex;
    flex-direction: column;
    width: 100%;
    flex-basis: 20%;
    .colorside {
      flex-basis: 0%;
      canvas {
        width: 100%;
        object-fit: contain;
      }
    }
    .leftside {
      flex-basis: 25%;
      padding: 3px;
      .slide-control {
        display: flex;
        width: 100%;
        input {
          flex-basis: 90%;
        }
      }
    }
    #console_box {
      flex-basis: 50%;
      height: 100%;
      overflow: auto;
      text-align: left;
    }
    .online_box {
      flex-basis: 25%;
      height: 100%;
      display: flex;
      flex-direction: column;
      #onlineUsers {
        text-align: left;
        ul  {
          padding: 0;
          li {
            list-style-type: none;
          }
        }
      }
    }
  }
  input[type=range] {
    -webkit-appearance: none;
    width: 80px;
    height: 5px;
    margin-top: 10px;
    margin-bottom: 15px;
    border-radius: 5px;
    background: #d3d3d3;
    outline: none;
    opacity: 0.7;
    -webkit-transition: .2s;
    transition: opacity .2s;
  }
  #r::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #ff2020;
    cursor: pointer;
  }
  #r::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #ff2020;
    cursor: pointer;
  }
  #b::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #337ab7;
    cursor: pointer;
  }
  #b::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #337ab7;
    cursor: pointer;
  }
  #g::-moz-range-thumb {
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #3c763d;
    cursor: pointer;
  }
  #g::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 15px;
    height: 15px;
    border-radius: 50%;
    background: #6fa93d;
    cursor: pointer;
  }
  #dia::-moz-range-thumb {
    width: 0;
    height: 0;
    border-style: solid;
    border-width: 7.5px 15px 7.5px 0;
    border-color: transparent #312d2d transparent transparent;
  }
  #dia::-webkit-slider-thumb {
    -webkit-appearance: none;
    appearance: none;
    width: 0px;
    height: 0px;
    border-style: solid;
    border-width: 7.5px 15px 7.5px 0;
    border-color: transparent #312d2d transparent transparent;
  }
  button{
    cursor:pointer;
    margin-right: 3px;
    margin-bottom: 5px;
  }
</style>
