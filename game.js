let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');
let timer = null;

let bg = new Image();
let pipeUp = new Image();
let pipeDown = new Image();
let get_ready = new Image();
// let logo = new Image();

let bird = new Image();
let death = new Image();


// изображения
bg.src = "assets\\background.png";
pipeUp.src = "assets\\top.png";
pipeDown.src = "assets\\bottom.png";

let ready = ["", "assets\\getready.png"];
get_ready.src = ready[1];
// logo.src = "assets\\logo.png";


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
let xPos, yPos;
let gravity = 2;


// препятствия
let gap = 90;
let pipe = [];

pipe.push({ // добавляем первое припятствие
	x : canvas.width,
	y : 0
});


// счет
score = 0;
record = 0;


function moveUp(e) {
	if (e.keyCode != 32) {
		return;
	}

	bird.src = state[1];

	pos = yPos - 25;

	function _animation() {
		// гладкий взлет вверх

		if (pos > yPos) {
			bird.src = state[0];
			return;
		}

		yPos-=5;
		requestAnimationFrame(_animation);
	}

	_animation();
	fly.play();
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
				y : -1 * (Math.floor(Math.random() * (pipeUp.height-50)))
			});
		}

		// столкновение с низом
		if (yPos + bird.height >= canvas.height) {
			return location.reload()
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

					return reload()
				}
			}
		}

		if(pipe[i].x == -50) {
			score++;
			score_audio.play();
		}
	}

	ctx.drawImage(bird, xPos, yPos);

	yPos += gravity;

	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}
}


function start() {
	get_ready.src = ready[0];
	document.addEventListener('keydown', moveUp)
	document.removeEventListener('click', start)

	timer = setInterval(loop, 1000/60); // 60 FPS
}


function reload() {
	if (timer != null) {
		clearInterval(timer);
	}

	document.removeEventListener('keydown', moveUp)

	pipe = [];
	xPos = 10;
	yPos = 180;
	score = 0;
	pipe.push({x : canvas.width, y : 0});

	ctx.drawImage(bg, 0, 0);
	ctx.drawImage(bird, xPos, yPos);

	get_ready.src = ready[1];
	ctx.drawImage(get_ready, 13, 100);

	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	document.addEventListener('click', start);
}


window.onload = function() {
	ctx.fillStyle = "#000";
	ctx.font = "bold 21px Calibri";
	reload();
}