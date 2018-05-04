<template>
	<div class="parent">
		<div id="sketchpadapp" >
			<canvas ref="sketchpad"  @mouseup="sketchpad_mouseUp" @mousedown="sketchpad_mouseDown" @mousemove="sketchpad_mouseMove"></canvas>
		</div>
		<div class="panel">
			<div class="colorside" ref="colorside">
				<canvas id="color" ref="local_pen"></canvas>
			</div>
			<div class="leftside" ref="leftside">
        <b-button id="clear"><font-awesome-icon :icon="['fas', 'trash']" /></b-button>
        <b-button id="view"><font-awesome-icon :icon="['fas', 'eye']" /></b-button>
				<b-button id="download"><font-awesome-icon :icon="['fas', 'download']" /></b-button>
				<div>
					<b-button id="paint-brush" :variant="sketchpad.mode==='brush'?'success':'secondary'" @click="sketchpad.mode='brush'"><font-awesome-icon :icon="['fas', 'paint-brush']" /></b-button>
	        <b-button id="eraser" :variant="sketchpad.mode==='eraser'?'success':'secondary'" @click="sketchpad.mode='eraser'"><font-awesome-icon :icon="['fas', 'eraser']" /></b-button>
				</div>
        <div class="slide-control"><input id="dia" v-model="pen.dia" type="range" min="1" max="10" step="0.1" />{{pen.dia}}</div>
        <div class="slide-control"><input id="r" v-model="pen.r" type="range" min="0" max="255" />{{pen.r}}</div>
        <div class="slide-control"><input id="g" v-model="pen.g" type="range" min="0" max="255" />{{pen.g}}</div>
        <div class="slide-control"><input id="b" v-model="pen.b" type="range" min="0" max="255" />{{pen.b}}</div>
      </div>
      <div class="rightside" ref="rightside">
        <div class="console_box" id="console_box" ref="console_box">
					<div v-for="(entry, index) in console_box" :key="index">&lt;{{entry.date}}&gt; {{entry.activity}}</div>
				</div>
      </div>
			<b-alert show class="header">Room Number: {{roomNumber}}</b-alert>
		</div>
	</div>
</template>

<script>
	import moment from 'moment'
	export default{
		name: 'Main',
		data () {
			return {
				local_user: 'Yu',
				local_screenWidth: document.body.clientWidth,
				sketchpad: {canvas: undefined, ctx: undefined, mode: 'brush'},
				pen_preview: {canvas: undefined, ctx: undefined},
				pen: {dia: 5, r: undefined, b: undefined, g: undefined, a: 255},
				mouse: {x: 0, y: 0, down: 0},
				isDrawing: undefined, lastPoint: undefined,
				date_format: 'YYYY-MM-DD HH:mm:ss',
				console_box: []
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
			}
		},
		methods:{
			log (content) {
				this.console_box.unshift({date: moment().format(this.date_format), activity: content})
			},
			distanceBetween (point1, point2) {
				return Math.sqrt(Math.pow(point2.x - point1.x, 2) + Math.pow(point2.y - point1.y, 2));
			},
			angleBetween (point1, point2) {
				return Math.atan2( point2.x - point1.x, point2.y - point1.y );
			},
			drawDot(ctx, coordinate){
				if (coordinate === undefined) {
					coordinate = {x: this.pen_preview.canvas.width/2, y: this.pen_preview.canvas.height/2}
				}
				// Select a fill style
				ctx.fillStyle = `rgba(${this.pen.r}, ${this.pen.g}, ${this.pen.b}, ${this.pen.a/255})`;
				//Draw a filled circle
				ctx.beginPath();
				ctx.arc(coordinate.x, coordinate.y, this.pen.dia, 0, Math.PI*2, true);
				ctx.closePath();
				ctx.fill();
			},
			sketchpad_mouseDown (e) {
				this.isDrawing = true;
				this.lastPoint = { x: e.clientX, y:e.clientY};
			},
			sketchpad_mouseMove (e) {
				if (!this.isDrawing) return;
				var currentPoint = { x: e.clientX, y: e.clientY };
				if (this.lastPoint === undefined) {
					this.lastPoint = currentPoint
				}
				var dist = this.distanceBetween(this.lastPoint, currentPoint);
				var angle = this.angleBetween(this.lastPoint, currentPoint);

				for (var i = 0; i < dist; i+=2) {
					const coordinate = {
						x: this.lastPoint.x + (Math.sin(angle) * i),
						y: this.lastPoint.y + (Math.cos(angle) * i)
					}
					this.drawDot(this.sketchpad.ctx, coordinate);
					// this.log(`(${coordinate.x.toFixed(2)}, ${coordinate.y.toFixed(2)})`);
				}
				this.lastPoint = currentPoint;
			},
			sketchpad_mouseUp () {
				this.isDrawing = false;
				this.log('Key Up');
			},
			clearCanvas (canvas, ctx) {
				ctx.clearRect(0, 0, canvas.width, canvas.height);
			},
			defineSketchpad () {
				this.sketchpad.canvas = this.$refs.sketchpad;
				this.sketchpad.canvas.width = this.sketchpad.canvas.offsetWidth;
				this.sketchpad.canvas.height = this.sketchpad.canvas.offsetHeight;
				if(this.sketchpad.canvas.getContext){
					this.sketchpad.ctx = this.sketchpad.canvas.getContext('2d');
				}
			},
			defineColor () {
				this.pen_preview.canvas = this.$refs.local_pen;
				this.pen_preview.canvas.width = this.pen_preview.canvas.offsetWidth;
				this.pen_preview.canvas.height = this.pen_preview.canvas.offsetHeight;
				if (this.pen_preview.canvas.getContext){
					this.pen_preview.ctx = this.pen_preview.canvas.getContext('2d');
				}
				this.drawDot(this.pen_preview.ctx);
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

			//on resize
			// this.clearCanvas(this.pen_preview.canvas, this.pen_preview.ctx);

			this.log(`Welcome, ${this.local_user}!`);
		}
	}
</script>

<style lang="scss" scoped>
	.parent{
		height: 100%;
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
		height:75%;
		background-color:#edf;
		canvas {
			width: 100%;
			height: 100%;
		}
	}
	.panel {
		display: flex;
		width: 100%;
		height: 25%;
		.colorside {
			flex-basis: 15%;
			canvas {
				width: 100%;
				height: 100%;
			}
		}
		.leftside {
			flex-basis: 15%;
			padding: 10px;
			.slide-control {
				display: flex;
				width: 100%;
				input {
					flex-basis: 90%;
				}
			}
		}
		.rightside {
			flex-basis: 75%;
		}
	}

	#sketchpad {
		float:left;
		position:relative;
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
