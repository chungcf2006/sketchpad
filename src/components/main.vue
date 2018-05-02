<template>
	<div class="parent">
		<div class="sketchpadapp" id="sketchpadapp">
			<b-alert show>Room Number: {{roomNumber}}</b-alert>
		</div>
		<div class="container">
			<div class="colorside" id="colorside">
				<canvas id="user_pen"></canvas>
			</div>
			<div class="leftside" id="leftside">
                <button id="clear"><font-awesome-icon :icon="['fas', 'trash']" /></button>
                <button id="view"><font-awesome-icon :icon="['fas', 'eye']" /></button>
                <button id="download"><font-awesome-icon :icon="['fas', 'download']" /></button>
                <input id="dia" type="range" min="1" max="10" step="0.1" value="5" />
                <input id="r" type="range" min="0" max="255" value="0" />
                <input id="g" type="range" min="0" max="255" value="0" />
                <input id="b" type="range" min="0" max="255" value="0" />
            </div>
            <div class="rightside" id="rightside">
                <div class="console_box" id="console_box"></div>
            </div>
		</div>
	</div>
</template>

<script>
	export default{
		name: 'Main',
		data () {
			return {
				roomNumber: '13F3D2',
				canvas: undefined,
				ctx: undefined
			}
		},
		methods:{
			pageInit: 
		},
		ready() {
			this.pageInit()
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
		background-color:#c29cc7;
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
