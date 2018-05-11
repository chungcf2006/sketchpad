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
          <div>
            <b-button @click="download()"><font-awesome-icon :icon="['fas', 'download']" /></b-button>
            <b-button @click="clearCanvas()"><font-awesome-icon :icon="['fas', 'trash']" /></b-button>
            <b-button @click="save()"><font-awesome-icon :icon="['fas', 'save']" /></b-button>
          </div>
            <b-button :variant="sketchpad.mode==='brush'?'success':'secondary'" @click="sketchpad.mode='brush'"><font-awesome-icon :icon="['fas', 'paint-brush']" /></b-button>
            <b-button :variant="sketchpad.mode==='square'?'success':'secondary'" @click="sketchpad.mode='square'"><font-awesome-icon :icon="['fas', 'square']" /></b-button>
            <b-button :variant="sketchpad.mode==='circle'?'success':'secondary'" @click="sketchpad.mode='circle'"><font-awesome-icon :icon="['fas', 'circle']" /></b-button>
          <div>
            <b-button :variant="!sketchpad.erase?'success':'secondary'" @click="sketchpad.erase=false"><font-awesome-icon :icon="['fas', 'edit']" /></b-button>
            <b-button :variant="sketchpad.erase?'success':'secondary'" @click="sketchpad.erase=true"><font-awesome-icon :icon="['fas', 'eraser']" /></b-button>
          </div>
          <div>
            <b-button :variant="!sketchpad.fill?'success':'secondary'" @click="sketchpad.fill=false"><font-awesome-icon :icon="['far', 'circle']" /></b-button>
            <b-button :variant="sketchpad.fill?'success':'secondary'" @click="sketchpad.fill=true"><font-awesome-icon :icon="['fas', 'circle']" /></b-button>
          </div>
        </div>
        <div>
          <div class="slide-control"><input id="dia" v-model="pen.dia" type="range" min="1" max="30" step="0.1" />{{pen.dia}}</div>
          <div class="slide-control"><input id="r" v-model="pen.r" type="range" min="0" max="255" />{{pen.r}}</div>
          <div class="slide-control"><input id="g" v-model="pen.g" type="range" min="0" max="255" />{{pen.g}}</div>
          <div class="slide-control"><input id="b" v-model="pen.b" type="range" min="0" max="255" />{{pen.b}}</div>
        </div>
      </div>
      <b-button @click="leaveRoom()">Leave Room</b-button>
      <div class="online_box">
        <b-alert show class="header">#{{roomNumber}}</b-alert>
        <b-alert :show="onlineUsers !== undefined" variant="secondary" id="onlineUsers">
          <ul>
            <li v-for="user in onlineUsers" :key="user.name" v-if="user.pen"><online-display :user="user"></online-display></li>
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
        onlineUsers: undefined,
        username: undefined,
        sketchpad: {canvas: undefined, ctx: undefined, imageData: undefined, mode: 'brush', erase: false, fill: false},
        forceSquare: false,
        pen: {dia: 5, r: undefined, b: undefined, g: undefined, a: 255},
        mouse: {x: 0, y: 0, down: 0},
        isDrawing: undefined, lastPoint: undefined,
        date_format: 'YYYY-MM-DD HH:mm:ss',
        console_box: [],
        socket: undefined,
        pendingSend: {},
        setUsername: {username: undefined, error: undefined},
        saved: true
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
          this.log('Eraser')
        } else {
          this.sketchpad.ctx.globalCompositeOperation = 'source-over'
          this.log('Edit')
        }
        this.log(`${this.local_user} using ${this.sketchpad.mode}`);
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
        if (this.setUsername.username === undefined) {
          this.setUsername.error = 'Please enter Username'
          return
        }
        this.$http.post(`/api/sketchpads/${this.roomNumber}/members/${this.setUsername.username}`).then(() => {
          localStorage.setItem('username', this.setUsername.username)
          this.username = this.setUsername.username
          this.init()
          this.log(`Welcome, ${this.username}!`)
          this.$refs.setUsername.hide()
        }).catch(error => {
          this.setUsername.error = error.data
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
        if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight < (this.sketchpad.canvas.width/this.sketchpad.canvas.height)) {
          const blank = (this.sketchpad.canvas.offsetHeight - (this.sketchpad.canvas.offsetWidth*this.sketchpad.canvas.height/this.sketchpad.canvas.width))/2
          this.lastPoint.y = this.sketchpad.canvas.height * ((e.clientY - blank)/(this.sketchpad.canvas.offsetWidth*this.sketchpad.canvas.height/this.sketchpad.canvas.width))
        }
        if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight > (this.sketchpad.canvas.width/this.sketchpad.canvas.height)) {
          const blank = (this.sketchpad.canvas.offsetWidth - (this.sketchpad.canvas.offsetHeight*this.sketchpad.canvas.width/this.sketchpad.canvas.height))/2
          this.lastPoint.x = this.sketchpad.canvas.width * ((e.clientX - blank)/(this.sketchpad.canvas.offsetHeight*this.sketchpad.canvas.width/this.sketchpad.canvas.height))
        }

        this.log('Key Down')
        this.pendingSend.pen = this.pen
        this.pendingSend.erase = this.sketchpad.erase
        this.pendingSend.mode = this.sketchpad.mode
        this.pendingSend.fill = this.sketchpad.fill
        this.pendingSend.coordinates = [this.lastPoint]
        this.setPen(this.pen)
        this.sketchpad.imageData = this.sketchpad.ctx.getImageData(0, 0, this.sketchpad.canvas.width, this.sketchpad.canvas.height)
        this.socket.emit('geometry_start', {username: this.username})
      },
      sketchpad_mouseMove (e) {
        if (!this.isDrawing) return;

        var currentPoint = {};

        if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight < (this.sketchpad.canvas.width/this.sketchpad.canvas.height)) {
          const blank = (this.sketchpad.canvas.offsetHeight - (this.sketchpad.canvas.offsetWidth*this.sketchpad.canvas.height/this.sketchpad.canvas.width))/2
          currentPoint.y = this.sketchpad.canvas.height * ((e.clientY - blank)/(this.sketchpad.canvas.offsetWidth*this.sketchpad.canvas.height/this.sketchpad.canvas.width))
          currentPoint.x = this.sketchpad.canvas.width * (e.clientX/this.sketchpad.canvas.offsetWidth)
        } else if (this.sketchpad.canvas.offsetWidth/this.sketchpad.canvas.offsetHeight > (this.sketchpad.canvas.width/this.sketchpad.canvas.height)) {
          const blank = (this.sketchpad.canvas.offsetWidth - (this.sketchpad.canvas.offsetHeight*this.sketchpad.canvas.width/this.sketchpad.canvas.height))/2
          currentPoint.x = this.sketchpad.canvas.width * ((e.clientX - blank)/(this.sketchpad.canvas.offsetHeight*this.sketchpad.canvas.width/this.sketchpad.canvas.height))
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
          this.lastPoint = currentPoint
        } else if(this.sketchpad.mode === 'square'){
          this.draw_rect(this.lastPoint, currentPoint, this.sketchpad.fill)
        }else if(this.sketchpad.mode === 'circle'){
          this.draw_Arc(this.lastPoint, currentPoint, this.sketchpad.fill)
        }
        this.pendingSend.coordinates[1] = currentPoint
        this.socket.emit('new_stroke', this.pendingSend)
      },
      sketchpad_mouseUp () {
        this.saved = false
        this.isDrawing = false
        this.lastPoint = undefined
        this.log('Key Up')
      },
      clearCanvas () {
        console.log(this.socket.emit('clear_canvas'))
        this.sketchpad.ctx.clearRect(0, 0, this.sketchpad.canvas.width, this.sketchpad.canvas.height)
      },
      draw_Arc (last, current, fill){
        if (this.sketchpad.imageData !== undefined) {
          this.sketchpad.ctx.putImageData(this.sketchpad.imageData, 0, 0)
        }
        this.sketchpad.ctx.beginPath()
        if (this.forceSquare) {
          const width = Math.abs(last.x-current.x)
          const height = Math.abs(last.y-current.y)
          if (height > width) {
            current.y = last.y + width
          } else {
            current.x = last.x + height
          }
        }
        this.sketchpad.ctx.ellipse((last.x+current.x)/2, (last.y+current.y)/2, Math.abs((last.x+current.x)/2-last.x), Math.abs((last.y+current.y)/2-last.y), 0, 0, 2*Math.PI)
        this.sketchpad.ctx.closePath()
        if (fill) {
          this.sketchpad.ctx.fill()
        } else {
          this.sketchpad.ctx.stroke()
        }
      },
      draw_rect(last, current, fill) {
        if (this.sketchpad.imageData !== undefined) {
          this.sketchpad.ctx.putImageData(this.sketchpad.imageData, 0, 0)
        }
        this.sketchpad.ctx.beginPath()
        if (this.forceSquare) {
          const width = Math.abs(last.x-current.x)
          const height = Math.abs(last.y-current.y)
          if (height > width) {
            current.y = last.y + (last.x-current.x)
          } else {
            current.x = last.x + (last.y-current.y)
          }
        }
        this.sketchpad.ctx.rect(last.x, last.y, current.x-last.x, current.y-last.y)
        this.sketchpad.ctx.closePath()
        if (fill) {
          this.sketchpad.ctx.fill()
        } else {
          this.sketchpad.ctx.stroke()
        }
      },
      draw (last, current) {
        this.sketchpad.ctx.beginPath()
        this.sketchpad.ctx.moveTo(last.x, last.y)
        this.sketchpad.ctx.lineTo(current.x, current.y)
        this.sketchpad.ctx.stroke()
      },
      save () {
        if (!this.saved) {
          const fd = new FormData()
          this.sketchpad.canvas.toBlob((blob) => {
            fd.append('sketchpad', blob)
            this.$http.post(`/api/sketchpads/${this.roomNumber}/image`, fd, {
              headers: {
                'Content-Type': 'multipart/form-data'
              }
            }).then(() => {
              this.log('Saved')
              this.socket.emit('save')
            })
          })
        }
      },
      defineSketchpad () {
        this.sketchpad.canvas = this.$refs.sketchpad;

        this.sketchpad.canvas.width = 1280
        this.sketchpad.canvas.height = 720

        if(this.sketchpad.canvas.getContext){
          this.sketchpad.ctx = this.sketchpad.canvas.getContext('2d');

          this.sketchpad.ctx.lineCap='round'
          var img = document.createElement('img')
          img.onload = () => {
            this.sketchpad.ctx.drawImage(img, 0, 0, img.width, img.height, 0, 0, this.sketchpad.canvas.width, this.sketchpad.canvas.height)
            this.drawUncommited()
          }
          img.onerror = () => {
            this.drawUncommited()
          }
          img.src = `/api/sketchpads/${this.roomNumber}/image`
        }
      },
      drawUncommited () {
        this.$http.get(`/api/sketchpads/${this.roomNumber}/uncommited`).then(response => {
          response.data.forEach(entry => {
            if (entry.type === 'draw') {
              this.remoteDraw(entry.data)
            }
          })
        })
      },
      remoteDraw (data) {
        this.saved = false
        this.setPen(data.pen)
        const originalComposite = this.sketchpad.ctx.globalCompositeOperation
        if (data.erase) {
          this.sketchpad.ctx.globalCompositeOperation = 'destination-out'
        } else {
          this.sketchpad.ctx.globalCompositeOperation = 'source-over'
        }
        switch (data.mode) {
          case 'brush':
            this.draw(data.coordinates[0], data.coordinates[1])
            break
          case 'square':
            this.draw_rect(data.coordinates[0], data.coordinates[1], data.fill)
            break
          case 'circle':
            this.draw_Arc(data.coordinates[0], data.coordinates[1], data.fill)
            break
        }
        console.log('drawing')

        this.sketchpad.ctx.globalCompositeOperation = originalComposite
      },
      bindWebSocket () {
        this.socket = io({
          query: {
            sketchpadID: this.roomNumber
          }
        })
        this.socket.open()
        this.socket.on('geometry_start', data => {
          if (data.username !== this.username) {
            this.sketchpad.imageData = this.sketchpad.ctx.getImageData(0, 0, this.sketchpad.canvas.width, this.sketchpad.canvas.height)
          }
        })
        this.socket.on('clear', () => {
          this.saved = false
          this.sketchpad.ctx.clearRect(0, 0, this.sketchpad.canvas.width, this.sketchpad.canvas.height)
        })
        this.socket.on('save', () => {
          this.saved = true
        })
        this.socket.on('draw', data => {
          this.remoteDraw(data)
        })
        this.socket.on('display_update_pen', data => {
          let index
          if ((this.onlineUsers !== undefined) && ((index = this.onlineUsers.findIndex(user => user.username === data.username)) != -1)) {
              this.onlineUsers[index].pen = data.pen
          }

        })
        this.socket.on('member_list', () => {
          this.loadUserlist()
        })
      },
      setPen (pen) {
        this.sketchpad.ctx.strokeStyle = `rgba(${pen.r}, ${pen.g}, ${pen.b}, ${pen.a/255})`
        this.sketchpad.ctx.fillStyle = `rgba(${pen.r}, ${pen.g}, ${pen.b}, ${pen.a/255})`
        this.sketchpad.ctx.lineWidth = pen.dia
      },
      download (){
        const MIME_TYPE = 'image/png'
        var imgURL = this.sketchpad.canvas.toDataURL(MIME_TYPE)
        var dlLink = document.createElement('a')
        dlLink.download = this.$store.state.roomNumber+"_"+moment().format(this.date_format)
        dlLink.href = imgURL
        dlLink.dataset.downloadurl = [MIME_TYPE, dlLink.download, dlLink.href].join(':')
        document.body.appendChild(dlLink)
        dlLink.click()
        document.body.removeChild(dlLink)
      },
      init () {
        this.defineSketchpad()
        this.loadUserlist()

        this.bindWebSocket()
        this.pen.r = Math.floor(Math.random()*256)
        this.pen.g = Math.floor(Math.random()*256)
        this.pen.b = Math.floor(Math.random()*256)

        setInterval(() => {
          if (this.onlineUsers.findIndex(user => user.username === this.username) === 0) {
            this.save()
          }
        }, 10000)

      },
      leaveRoom () {
        this.socket.close()
        this.$router.push('/')
      }
    },
    mounted() {
      if (this.$store.state.roomNumber === undefined) {
        this.$router.push('/')
        // this.$store.commit('roomNumber', {roomNumber: '123456'})
      }

      this.init()

      document.addEventListener('keydown', (e) => {
        if (e.keyCode === 16) {
          this.forceSquare = true
        }
      })

      document.addEventListener('keyup', (e) => {
        if (e.keyCode === 16) {
          this.forceSquare = false
        }
      })

      this.username = localStorage.getItem('username')
      if (this.username === null) {
        this.$refs.setUsername.show()
      } else {
        if (this.setUsername.username === undefined) {
          this.$http.post(`/api/sketchpads/${this.roomNumber}/members/${this.username}`).catch(error => {
            this.setUsername.error = error.data
            this.$refs.setUsername.show()
          })
        }
        this.log(`Welcome, ${this.username}!`)
      }
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
      display: flex;
      padding: 3px;
      div {
        flex-basis: 50%;
      }
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
      background-color: rgba(0, 0, 0, 0.25);
      padding-left: 1em;
      padding-right: 1em;
      div {
        width: 100%;
        text-overflow: clip;
        overflow: hidden;
      }
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
