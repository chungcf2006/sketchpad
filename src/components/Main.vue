<template>
	<div class="parent" ref="parent">
		<div id="sketchpadapp" ref="sketchpad">
			<b-alert show>Room Number: {{roomNumber}}</b-alert>
		</div>
		<div class="container" ref="container">
			<div class="colorside" ref="colorside">
				<canvas id="color" ref="local_pen"></canvas>
			</div>
			<div class="leftside" ref="leftside">
                <button id="clear" ref="clear"><font-awesome-icon :icon="['fas', 'trash']" /></button>
                <button id="view" ref="view"><font-awesome-icon :icon="['fas', 'eye']" /></button>
                <button id="download" ref="download"><font-awesome-icon :icon="['fas', 'download']" /></button>
                <input id="dia" ref="dia" v-on:click="set_dia()" type="range" min="1" max="10" step="0.1" value="5" />
                <input id="r" ref="r" v-on:click="set_r()" type="range" min="0" max="255" value="0" />
                <input id="g" ref="g" v-on:click="set_g()" type="range" min="0" max="255" value="0" />
                <input id="b" ref="b" v-on:click="set_b()" type="range" min="0" max="255" value="0" />
            </div>
            <div class="rightside" ref="rightside">
                <div class="console_box" id="console_box" ref="console_box">
					<div v-for="entry in console_box" :key="entry.date">&lt;{{entry.date}}&gt; {{entry.activity}}</div>
				</div>
            </div>
		</div>
	</div>
</template>

<script>
	import moment from 'moment'
	export default{
		name: 'Main',
		data () {
			return {
				roomNumber: '13F3D2',
				local_user: 'Yu',
				local_screenWidth: document.body.clientWidth,

				canvas: undefined, ctx: undefined,
				canvas_color: undefined, ctx_color: undefined,
				dia: undefined, r: undefined, b: undefined, g: undefined, a: 255,
				mouseX: 0, mouseY: 0, mouseDown: 0,
				isDrawing: undefined, lastPoint: undefined,
				date_format: 'YYYY-MM-DD HH:mm:ss',
				console_box: []
			}
		},
		methods:{
			distanceBetween (point1, point2) {
				return Math.sqrt(Math.pow(point2.x - point1.x, 2)
					+ Math.pow(point2.y - point1.y, 2));
			},
			angleBetween (point1, point2) {
				return Math.atan2( point2.x - point1.x
					, point2.y - point1.y );
			},
			drawDot(ctx, x, y, size){
				// Select a fill style
				ctx.fillStyle = "rgba("+this.r+","+this.g+","+this.b+","+(this.a/255)+")";
				//Draw a filled circle
				ctx.beginPath();
				ctx.arc(x, y, size, 0, Math.PI*2, true); 
				ctx.closePath();
				ctx.fill();
			},
			sketchpad_mouseDown (e) {
				this.isDrawing = true;
				this.lastPoint = { x: e.clientX, y:e.clientY};
				this.console_box.unshift({date: moment().format(this.date_format)});
				this.console_box.unshift({date: moment().format(this.date_format), activity: 'Key Down'});
			},
			sketchpad_mouseMove (e) {
				if (!this.isDrawing) return;
				var currentPoint = { x: e.clientX, y: e.clientY };
				var dist = this.distanceBetween(this.lastPoint, currentPoint);
				var angle = this.angleBetween(this.lastPoint, currentPoint);
				var x = null;
				var y = null;

				for (var i = 0; i < dist; i+=2) {
					x = this.lastPoint.x + (Math.sin(angle) * i);
					y = this.lastPoint.y + (Math.cos(angle) * i);
					this.drawDot(this.ctx, x, y, this.dia);
					this.console_box.unshift({date: moment().format(this.date_format), activity: "(" +  + x.toFixed(2) + ", " + y.toFixed(2) + ")"});
				}
				this.lastPoint = currentPoint;
			},
			sketchpad_mouseUp () {
				this.isDrawing = false;
				this.console_box.unshift({date: moment().format(this.date_format), activity: 'Key Up'});
			},
			clearCanvas (canvas, ctx) {
				ctx.clearRect(0, 0, 
					canvas.width, canvas.height);
			},
			set_dia () {
				console.log(this.$refs.local_pen)
				this.canvas_color.width = this.$refs.colorside.width;
				this.canvas_color.height = this.$refs.colorside.height;
				this.dia = this.$refs.dia.value;
				this.drawDot(this.ctx_color, this.$refs.colorside.width/2, this.$refs.colorside.height/2, this.dia);
				this.console_box.unshift({date: moment().format(this.date_format), activity: "Set diameter: " + this.dia});
			},
			set_b () {
				this.canvas_color.width = this.$refs.colorside.width;
				this.canvas_color.height = this.$refs.colorside.height;
				this.b = this.$refs.b.value;
				this.console_box.unshift({date: moment().format(this.date_format), activity: "Set blue: " + this.b});
			},
			set_r () {
				this.canvas_color.width = this.$refs.colorside.width;
				this.canvas_color.height = this.$refs.colorside.height;
				this.r = this.$refs.r.value;
				this.console_box.unshift({date: moment().format(this.date_format), activity: "Set green: " + this.r});
			},
			set_g () {
				this.canvas_color.width = this.$refs.colorside.width;
				this.canvas_color.height = this.$refs.colorside.height;
				this.g = this.$refs.g.value;
				this.console_box.unshift({date: moment().format(this.date_format), activity: "Set green: " + this.g});
			},
			defineSketchpad () {
				this.canvas = this.$refs.sketchpad;
				if(this.canvas.getContext){
					this.ctx = this.canvas.getContext('2d');
					this.canvas.width = 5000; 
					this.canvas.height = 5000;
				}
				if(this.ctx){
					this.canvas.addEventListener('mousedown', this.sketchpad_mouseDown, false);
					this.canvas.addEventListener('mousemove', this.sketchpad_mouseMove, false);
					this.canvas.addEventListener('mouseup', this.sketchpad_mouseUp, false);
				}
			},
			defineColor () {
				this.canvas_color = this.$refs.local_pen;
				if (this.canvas_color.getContext){
					this.ctx_color = this.canvas_color.getContext('2d');
					this.canvas_color.width = this.$refs.colorside.width;
					this.canvas_color.height = this.$refs.colorside.height;
				}
				this.drawDot(this.ctx_color, this.$refs.colorside.width/2, this.$refs.colorside.height/2, this.dia);
			}
		},
		mounted() {
			this.$refs.r.value = (Math.random()*200);
			this.$refs.g.value = (Math.random()*200);
			this.$refs.b.value = (Math.random()*200);
			this.r = this.$refs.r.value;
			this.g = this.$refs.g.value;
			this.b = this.$refs.b.value;
			this.dia = this.$refs.dia.value;

			this.defineSketchpad();
			this.defineColor();

			//on resize
			// this.clearCanvas(this.canvas_color, this.ctx_color);

			this.console_box.unshift({date: moment().format(this.date_format), activity: "welcome, " + this.local_user + "!"});
		}
	}
</script>

<style lang="scss" scoped>
	.parent{
		height: 100%;
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
		height:70%;
		background-color:#edf;
	}
	.container {
		width: 100%;
	}
	.colorside {
		float:left;
		width:15%;
		height:30%;
	}
	.leftside {
		float:left;
		width:130px;
		height:30%;
		padding:10px;
		overflow:auto;
	}
	.rightside {
		width:auto;
		height:30%;
		overflow:auto;
	}
	#sketchpad {
		float:left;
		position:relative;
	}
	input[type=range] {
		-webkit-appearance: none;
		width: 100px;
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
		width: 30px;
		height: 30px;
		margin-right: 3px;
		margin-bottom: 5px;
	}
</style>
