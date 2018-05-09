<template>
  <div class="parent">
    <div id="sketchpadapp" ref="sketchpadapp">
      <canvas ref="sketchpad" @mouseup="sketchpad_mouseUp" @mousedown="sketchpad_mouseDown" @mousemove="sketchpad_mouseMove"></canvas>
    </div>
    <div class="panel">
      <div class="colorside" ref="colorside">
        <canvas id="color" ref="local_pen"></canvas>
      </div>
      <div class="online_box">
        <b-alert show class="header">#{{roomNumber}}</b-alert>
        <b-alert show variant="secondary" id="onlineUsers">
          <ul>
            <li v-for="user in onlineUsers" :key="user.name"><font-awesome-icon :icon="['fas', 'user']" /> {{user.name}}</li>
          </ul>
        </b-alert>
      </div>
      <div class="leftside" ref="leftside">
        <div>
        <b-button id="download"><font-awesome-icon :icon="['fas', 'download']" /></b-button>
        <b-button id="clear" @click="save()"><font-awesome-icon :icon="['fas', 'trash']" /></b-button>
          <b-button id="paint-brush" :variant="sketchpad.mode==='brush'?'success':'secondary'" @click="sketchpad.mode='brush'"><font-awesome-icon :icon="['fas', 'paint-brush']" /></b-button>
        <b-button id="square" :variant="sketchpad.mode==='square'?'success':'secondary'" @click="sketchpad.mode='square'"><font-awesome-icon :icon="['fas', 'square']" /></b-button>
        <b-button id="circle" :variant="sketchpad.mode==='circle'?'success':'secondary'" @click="sketchpad.mode='circle'"><font-awesome-icon :icon="['fas', 'circle']" /></b-button>
          <b-button id="eraser" :variant="sketchpad.mode==='eraser'?'success':'secondary'" @click="sketchpad.mode='eraser'"><font-awesome-icon :icon="['fas', 'eraser']" /></b-button>
        </div>
        <div class="slide-control"><input id="dia" v-model="pen.dia" type="range" min="1" max="30" step="0.1" />{{pen.dia}}</div>
        <div class="slide-control"><input id="r" v-model="pen.r" type="range" min="0" max="255" />{{pen.r}}</div>
        <div class="slide-control"><input id="g" v-model="pen.g" type="range" min="0" max="255" />{{pen.g}}</div>
        <div class="slide-control"><input id="b" v-model="pen.b" type="range" min="0" max="255" />{{pen.b}}</div>
      </div>
      <div id="console_box" ref="console_box">
        <div v-for="(entry, index) in console_box" :key="index">&lt;{{entry.date}}&gt; {{entry.activity}}</div>
      </div>
    </div>
  </div>
</template>

<script>
  import moment from 'moment'
  import io from 'socket.io-client'

  export default{
    name: 'Main',
    data () {
      return {
        onlineUsers: [
          {name: 'John', status: 'drawing'},
          {name: 'Yu', status: 'idle'}
        ],
        local_user: 'Yu',
        local_screenWidth: document.body.clientWidth,
        sketchpad: {canvas: undefined, ctx: undefined, mode: 'brush'},
        pen_preview: {canvas: undefined, ctx: undefined},
        pen: {dia: 5, r: undefined, b: undefined, g: undefined, a: 255},
        mouse: {x: 0, y: 0, down: 0},
        isDrawing: undefined, lastPoint: undefined,
        date_format: 'YYYY-MM-DD HH:mm:ss',
        console_box: [],
        socket: undefined,
        pendingSend: {},
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
          this.clearCanvas(this.pen_preview.canvas, this.pen_preview.ctx)
          this.setPen(this.pen)
          this.drawDot(this.pen_preview.ctx)
        },
        deep: true
      },
      'sketchpad.mode': function () {
        if (this.sketchpad.mode === 'brush') {
          this.sketchpad.ctx.globalCompositeOperation = 'source-over'
        }
        if (this.sketchpad.mode === 'eraser') {
          this.sketchpad.ctx.globalCompositeOperation = 'destination-out'
        }
        if (this.sketchpad.mode === 'brush') {
          this.sketchpad.ctx.globalCompositeOperation = 'source-over'
        }
        if (this.sketchpad.mode === 'circle') {
          this.sketchpad.ctx.globalCompositeOperation = 'source-over'
        }
        this.log('Yu using ' + this.sketchpad.mode);
      }
    },
    methods:{
      log (content) {
        this.console_box.unshift({
          date: moment().format(this.date_format), 
          activity: content
        })
      },
      drawDot(ctx, coordinate){
        if (coordinate === undefined) {
          coordinate = {x: this.pen_preview.canvas.width/2, y: this.pen_preview.canvas.height/2}
        }
        // Select a fill style
        ctx.fillStyle = `rgba(${this.pen.r}, ${this.pen.g}, ${this.pen.b}, ${this.pen.a/255})`
        //Draw a filled circle
        ctx.beginPath();
        ctx.arc(coordinate.x, coordinate.y, this.pen.dia, 0, Math.PI*2, true);
        ctx.closePath();
        ctx.fill();
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
        this.sketchpad.ctx.save()
        this.pendingSend.pen = this.pen
        this.pendingSend.coordinates = [this.lastPoint]
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

        if(this.sketchpad.mode === 'brush' || this.sketchpad.mode === 'eraser'){
          this.draw(this.lastPoint, currentPoint)
          this.pendingSend.coordinates.push(this.lastPoint)
          this.lastPoint = currentPoint
        }else if(this.sketchpad.mode === 'square'){
          this.draw_rect(this.lastPoint, currentPoint)
        }
      },
      sketchpad_mouseUp () {
        this.sketchpad.ctx.save()
        this.isDrawing = false
        this.lastPoint = undefined
        this.log('Key Up')
        console.log(this.pendingSend)
        this.socket.emit('new_stroke', this.pendingSend)
      },
      clearCanvas (canvas, ctx) {
        ctx.clearRect(0, 0, 
          canvas.width, canvas.height);
      },
      draw_rect(last, current) {
        console.log(this.sketchpad.ctx)
        // this.sketchpad.ctx.restore()
        this.sketchpad.ctx.beginPath()
        this.sketchpad.ctx.rect(last.x, last.y, current.x-last.x, current.y-last.y)
        this.sketchpad.ctx.closePath()
        this.sketchpad.ctx.stroke()
      },
      draw (last, current) {
        console.log('draw')
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
      defineColor () {
        this.pen_preview.canvas = this.$refs.local_pen;
        this.pen_preview.canvas.width = Math.floor(this.pen_preview.canvas.offsetHeight);
        this.pen_preview.canvas.height = Math.floor(this.pen_preview.canvas.offsetHeight);
        if (this.pen_preview.canvas.getContext){
          this.pen_preview.ctx = this.pen_preview.canvas.getContext('2d');
        }
        this.drawDot(this.pen_preview.ctx);
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
          for (let i = 0; i < data.coordinates.length - 1; i++) {
            this.draw(data.coordinates[i], data.coordinates[i+1])
          }
        })
      },
      setPen (pen) {
        this.sketchpad.ctx.strokeStyle = `rgba(${pen.r}, ${pen.g}, ${pen.b}, ${pen.a/255})`
        this.sketchpad.ctx.lineWidth = pen.dia
      }
    },
    mounted() {
      if (this.$store.state.roomNumber === undefined) {
        // this.$router.push('/')
        this.$store.commit('roomNumber', {roomNumber: '123456'})
      }
      this.pen.r = Math.floor(Math.random()*256);
      this.pen.g = Math.floor(Math.random()*256);
      this.pen.b = Math.floor(Math.random()*256);

      this.defineSketchpad();
      this.defineColor();

      this.bindWebSocket()

      this.log(`Welcome, ${this.local_user}!`);
    }
  }
</script>

<style lang="scss" scoped>
  .parent{
    height: 100%;
    display: flex;
    flex-direction: column;
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
    flex-basis: 75%;
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
    width: 100%;
    flex-basis: 25%;
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
