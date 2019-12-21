let canvas = document.getElementById('canvas');
let ctx = canvas.getContext('2d');

let timer = null; // айдишник setInterval
let animation_ = null; // айдишник requestAnimationFrame

// изображения
let bg = new Image(); // фон
let pipeUp = new Image(); // верхнее препятствие
let pipeDown = new Image(); // нижнее препятствие
let get_ready = new Image(); // надпись Get Ready
let bird = new Image(); // птичка
let bird_default = new Image(); // птичка-костыль

bg.src = "assets\\background.png";
pipeUp.src = "assets\\top.png";
pipeDown.src = "assets\\bottom.png";
get_ready.src = "assets\\getready.png";

// состояния птички: стандартная, взмах, смэрть
let state = ["assets\\bird\\1.png", "assets\\bird\\2.png", "assets\\bird\\dead.png"];

bird.src = state[0];
bird_default.src = state[0];


// звук взмаха, звук увеличения количества очков, звук поражения
let fly = new Audio();
let score_audio = new Audio();
let game_over = new Audio();

fly.src = "assets\\sounds\\fly.mp3";
score_audio.src = "assets\\sounds\\score.mp3";
game_over.src = "assets\\sounds\\game_over.mp3"


// позиция птички, скорость ее постоянного снижения
let xPos, yPos, gravity;

// пробел между препятствиями, список объектов, содержащий координаты препятствий, скорость движения препятствий(скорее булевое значение 1 - двигаются; 0 - не двигаются; значение больше 1 делают игру некрасивой)
let gap, pipe, speed;

// счет, рекорд
let score, record = 0;


let moveUp = function(e) {
	/*
	в качестве аргумента передается объект <События нажатия>, содержащий в себе информацию о нем(например, то, какая клавиша была нажата)
	выполняется гладкая анимация полета птички, за счет последовательного изменения ее положения и последующей смены кадра
	анимация, взмах крыльями, достигается переменной сменой текущих изображений, прикрепленных к объекту bird
	после выполнения операций проигрывается звук взмаха
	*/

	if (e.keyCode != 32) { // is Space pressed?
		return;
	}

	bird.src = state[1]; // взмах
	pos = yPos - 25; // та точка по Y, в которой должна будет оказаться птичка

	function _animation() {
		if (pos > yPos) {
			bird.src = state[0]; // обычное состояние
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

	if (pipe.length > 4) { // оптимизация списка преград
		pipe = pipe.slice(2, pipe.length);
	}

	for(let i = 0; i < pipe.length; i++) {
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
			if (score > record) { // по умолчанию record = 0
				record = score;
			}

			return fall();
		}

		// столкновение со стеной
		if (xPos + bird.width-5 >= pipe[i].x) { // птичка вошла в позицию стены
			if (xPos+10 <= pipe[i].x + pipeUp.width) { // птичка еще не прошла через стены
				if ( (yPos+3 <= pipe[i].y + pipeUp.height) || (yPos + bird.height >= pipe[i].y + pipeUp.height + gap) ) {
					// если позиция птички по Y меньше позиции нижней части верхней стены
					// либо позиция птички по Y больше позиции верхней части нижней стены

					if (score > record) { // по умолчанию record = 0
						record = score;
					}

					return fall();
				}
			}
		}

		if(pipe[i].x == -50) {
			score++;
			score_audio.play();
		}
	}

	ctx.drawImage(bird, xPos, yPos);
	yPos += gravity; // действие гравитации
	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	timer = requestAnimationFrame(loop);
}


let fall = function() {
	document.removeEventListener('keydown', moveUp);

	if (animation_ != null) {
		cancelAnimationFrame(animation_);
	}

	cancelAnimationFrame(timer);

	game_over.play(); // проигрыш звука поражения

	gravity = 5;
	bird.src = state[2];

	let fall_ = async function() {
		// анимация падения

		ctx.drawImage(bg, 0, 0);

		for(let i = 0; i < pipe.length; i++) {
			ctx.drawImage(pipeUp, pipe[i].x, pipe[i].y);
			ctx.drawImage(pipeDown, pipe[i].x, pipe[i].y + pipeUp.height + gap);
		}

		ctx.drawImage(bird, xPos, yPos);
		ctx.fillText("Счет: " + score, 5, 20);

		if (record != 0) {
			ctx.fillText("Рекорд: " + record, 5, 40);
		}

		if (yPos > canvas.height) {
			await sleep(game_over.duration - game_over.currentTime); // пока не выполнится промис из функции, работа кода будет приостановлена
			ctx.clearRect(0, 0, canvas.width, canvas.height); // очистка канваса
			bird.src = state[0]; // смена состояния на обычное
			return reload(); // колесо сансары дало оборот
		}

		yPos += gravity;
		animation_ = requestAnimationFrame(fall_);
	}

	fall_();
}


function sleep(s) {
	// как только вызов функция завершится, промис примет выполненное состояние, до тех пор код будет находиться в состоянии ожидания
	return new Promise(resolve => setTimeout(resolve, s*1000-2400));
}


let start = function() {
	/*
	отсоединяет эту функцию от события клика по канвасу
	присваивает к событию нажатия на клавиву вызов функции moveUp
	очищает канвас от элементов предыдущего экрана
	задает вызов функции loop с интервалом в 1000/60 ms
	*/

	canvas.removeEventListener('click', start);
	document.addEventListener('keydown', moveUp);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	loop();
}


let reload = function() {
	/*
	дефолтные значения переменных
	создание начального экрана при загрузке страницы или после поражения
	*/

	gap = 90;
	gravity = 2;
	xPos = 10;
	yPos = 200;
	score = 0;
	speed = 1;
	pipe = [];
	pipe.push({x: canvas.width, y: 0}); // добавляем первое препятствие "за кадр"

	ctx.drawImage(bg, 0, 0); // рисуем фон
	ctx.drawImage(bird_default, xPos, yPos); // рисуем птичку с дефолтным начальным положением
	ctx.drawImage(get_ready, 13, 90); // рисуем надпись Get Ready

	ctx.fillText("Счет: " + score, 5, 20); // создаем текст счета

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	canvas.addEventListener('click', start); // присоединяем событие клика на начальном экране к функции start
}

game_over.onloadeddata = function() {
	ctx.fillStyle = "#000";
	ctx.font = "bold 21px Calibri";
	reload();
}