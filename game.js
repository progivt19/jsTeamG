let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let bg = new Image();
let pipeUp = new Image();
let pipeDown = new Image();
let get_ready = new Image();
let logo = new Image();

let bird = new Image();
let death = new Image();


// основная часть
bg.src = "assets\\background.png";
pipeUp.src = "assets\\top.png";
pipeDown.src = "assets\\bottom.png";
get_ready.src = "assets\\getready.png";
logo.src = "assets\\logo.png";


// птичка
let state = ["assets\\bird\\1.png", "assets\\bird\\2.png"];
death.src = "assets\\bird\\dead.png"
bird.src = state[0];


// звуки
let fly = new Audio();
let score_audio = new Audio();
fly.src = "assets\\sounds\\fly.mp3";
score_audio.src = "assets\\sounds\\score.mp3";


// позиция птички
let xPos = 10;
let yPos = 150;
let gravity = 2;


// препятствия
let gap = 90;
let pipe = [];

pipe.push({
	x : canvas.width,
	y : Math.floor(Math.random() * pipeUp.height) - pipeUp.height
})


score = 0;


function moveUp() {
	fly.play();
	bird.src = state[1];

	pos = yPos - 25;

	function _animation() {
		if (pos > yPos) {
			bird.src = state[0];
			return;
		}

		yPos-=5;
		requestAnimationFrame(_animation);
	}

	_animation();
}


function loop() {
	ctx.drawImage(bg, 0, 0);

	for(var i = 0; i < pipe.length; i++) {
		ctx.drawImage(pipeUp, pipe[i].x, pipe[i].y);
		ctx.drawImage(pipeDown, pipe[i].x, pipe[i].y + pipeUp.height + gap);

		pipe[i].x--;

		if(pipe[i].x == 100) {
			pipe.push({
				x : canvas.width,
				y : Math.floor(Math.random() * (pipeUp.height+25)) - pipeUp.height
			});
		}

		// отслеживание прикосновений
		if (
			xPos + bird.width-5 >= pipe[i].x &&
			xPos <= pipe[i].x + pipeUp.width-5 &&
				(yPos+5 <= pipe[i].y + pipeUp.height || yPos + bird.height >= pipe[i].y + pipeUp.height + gap) || 
				yPos + bird.height-20 >= canvas.height
			) {
				return location.reload()
			}

		if(pipe[i].x == -10) {
			score++;
			score_audio.play();
		}
	}

	ctx.drawImage(bird, xPos, yPos);

	yPos += gravity;
	ctx.fillStyle = "#000";
	ctx.font = "24px Verdana";
	ctx.fillText("Счет: " + score, 10, canvas.height - 20);
}


window.onload = function() {
	document.addEventListener('keydown', moveUp);
	setInterval(loop, 1000/60); // 60 FPS
}