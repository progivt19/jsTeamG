let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');


let timer = null;
let animation_ = null;

let bg = new Image();
let pipeUp = new Image();
let pipeDown = new Image();
let get_ready = new Image();

let bird = new Image();
let bird_default = new Image();

// изображения
bg.src = "assets\\background.png";
pipeUp.src = "assets\\top.png";
pipeDown.src = "assets\\bottom.png";
get_ready.src = "assets\\getready.png";


// птичка
let state = ["assets\\bird\\1.png", "assets\\bird\\2.png", "assets\\bird\\dead.png"];
bird.src = state[0];
bird_default.src = state[0];


// звуки
let fly = new Audio();
let score_audio = new Audio();
fly.src = "assets\\sounds\\fly.mp3";
score_audio.src = "assets\\sounds\\score.mp3";


// позиция птички
let xPos = 0;
let yPos = 0;
let gravity = 2;


// препятствия
let gap = 90;
let pipe = [];
let speed = 1; // скорость движения препятствий

pipe.push({ // добавляем первое припятствие
	x: canvas.width,
	y: 0
});


// счет
let score = 0;
let record = 0;


let moveUp = function(e) {
	if (e.keyCode != 32) {
		return;
	}

	bird.src = state[1];
	pos = yPos - 25;

	function _animation() {
		// гладкий взлет

		if (pos > yPos) {
			bird.src = state[0];
			return;
		}

		yPos-=5;
		animation_ = requestAnimationFrame(_animation);
	}

	_animation();
	fly.play();
}


let loop = function() {
	ctx.drawImage(bg, 0, 0);

	if (bird.src != state[2]) {
		for(var i = 0; i < pipe.length; i++) {
			ctx.drawImage(pipeUp, pipe[i].x, pipe[i].y);
			ctx.drawImage(pipeDown, pipe[i].x, pipe[i].y + pipeUp.height + gap);

			pipe[i].x -= speed;

			if (pipe[i].x == 100) {
				pipe.push({
					x: canvas.width,
					y: -1 * (Math.floor(Math.random() * (pipeUp.height-50)))
				});
			}

			// столкновение с низом
			if (yPos + bird.height >= canvas.height) {
				fall();
			}

			// столкновение со стеной
			if (xPos + bird.width-5 >= pipe[i].x) { // птичка вошла в позицию стены
				if (xPos+10 <= pipe[i].x + pipeUp.width) { // птичка еще не прошла через стены
					if ( (yPos+3 <= pipe[i].y + pipeUp.height) || (yPos + bird.height >= pipe[i].y + pipeUp.height + gap) ) {
						// если позиция птички по Y меньше позиции нижней части верхней стены
						// либо позиция птички по Y больше позиции верхней части нижней стены

						if (score > record) {
							record = score;
						}

						fall();
					}
				}
			}

			if(pipe[i].x == -50) {
				score++;
				score_audio.play();
			}
		}
	}

	ctx.drawImage(bird, xPos, yPos);

	yPos += gravity; // действие гравитации

	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}
}


let fall = function() {
	document.removeEventListener('keydown', moveUp);

	if (animation_ != null) {
		cancelAnimationFrame(animation_);
	}

	speed = 0;
	gravity = 4;
	bird.src = state[2];

	if (yPos > canvas.height) {
		clearInterval(timer);
		ctx.clearRect(0, 0, canvas.width, canvas.height);
		bird.src = state[0];
		return reload();
	}
}


let start = function() {
	canvas.removeEventListener('click', start);
	document.addEventListener('keydown', moveUp);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	timer = setInterval(loop, 1000/60); // 60 FPS
}


let reload = function(fall_ = false) {
	ctx.fillStyle = "#000";
	ctx.font = "bold 21px Calibri";

	pipe = [];
	gravity = 2;
	xPos = 10;
	yPos = 200;
	score = 0;
	speed = 1;
	pipe.push({x: canvas.width, y: 0});

	ctx.drawImage(bg, 0, 0);
	ctx.drawImage(bird_default, xPos, yPos);
	ctx.drawImage(get_ready, 13, 90);

	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	canvas.addEventListener('click', start);
}


score_audio.onloadeddata = function() {
	reload();
}