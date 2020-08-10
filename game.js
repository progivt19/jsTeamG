let
	canvas = document.getElementById('canvas'),
	ctx = canvas.getContext('2d');


ctx.fillStyle = "#000";
ctx.font = "20px Troika"


let 
	// переменные
	timer = null, // айдишник setInterval
	animation_ = null, // айдишник requestAnimationFrame
	ost = null, // музыка

	// изображения
	bg = new Image(), // фон
	pipeUp = new Image(), // верхнее препятствие
	pipeDown = new Image(), // нижнее препятствие
	get_ready = new Image(), // надпись Get Ready
	bird = new Image(), // птичка
	bird_default = new Image(); // птичка-костыль
	state = ["assets\\bird\\1.png", "assets\\bird\\2.png", "assets\\bird\\dead.png"]; // состояния птички: стандартная, взмах, смэрть


bg.src = "assets\\background.png";
pipeUp.src = "assets\\top.png";
pipeDown.src = "assets\\bottom.png";
get_ready.src = "assets\\getready.png";
bird.src = state[0];
bird_default.src = state[0];


let
	// звук взмаха, звук увеличения количества очков, звук поражения, фоновые мелодии
	fly = new Audio(),
	score_audio = new Audio(),
	damage = new Audio(),
	game_over = new Audio(),
	ostList = document.getElementById("osts").getElementsByTagName("audio"); // получаем все объекты аудио из блока span#osts


fly.src = "assets\\sounds\\fly.mp3";
score_audio.src = "assets\\sounds\\score.mp3";
damage.src = "assets\\sounds\\damage.mp3";
game_over.src = "assets\\sounds\\game_over.mp3";


let 
	// сколько "времени" птичка не взмахивает крыльями <:
	time,

	// позиция птички, скорость падения, скорость изменения time, высота взмаха; скорость, с которой птичка полетит вверх при в взмахе
	xPos, yPos, speed_of_falling, time_speed, swing, speed_of_swing,

	// пробел между препятствиями, список объектов, содержащий координаты препятствий, скорость движения препятствий
	gap, pipe, speed,

	// счет, рекорд
	score, record = 0;


function reload() {
	/*
	дефолтные значения переменных
	создание начального экрана при загрузке страницы или после поражения
	*/

	xPos = 10;
	yPos = 200;
	score = 0;

	time = 0;

	speed_of_falling = 1;
	time_speed = 5;
	swing = 15;
	speed_of_swing = 3;

	speed = 2;
	gap = 80;
	pipe = [];
	pipe.push({x: canvas.width, y: -1 * random(0, pipeUp.height-50)}); // добавляем первое препятствие "за кадр"

	ctx.drawImage(bg, 0, 0); // рисуем фон
	ctx.drawImage(bird_default, xPos, yPos); // рисуем птичку с дефолтным начальным положением
	ctx.drawImage(get_ready, 13, 90); // рисуем надпись Get Ready

	ctx.fillText("Счет: " + score, 5, 20); // создаем текст счета

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	canvas.addEventListener('click', start); // присоединяем событие клика на начальном экране к функции start
}


let arrayRandElement = function(arr) {
	// функция, возвращающая случайный элемент массива

	return arr[random(0, arr.length-1)];
}


let playMusic = function() {
	// функция для включения музыки

	ost = arrayRandElement(ostList);
	ost.play();
	ost.onended = () => playMusic(); // включение следующего трека
}


let sleep = function(ms) {
	// как только вызов функциb завершится, промис примет выполненное состояние, до тех пор код будет находиться в состоянии ожидания
	
	return new Promise(resolve => setTimeout(resolve, ms));
}


let random = function(first, last) {
	/*
	возвращает случайное число в указанном промежутке
	*/

	let res = Math.floor(Math.random() * (last));

	if ((first + res) <= last) {
		return first + res;
	}
	else {
		return res;
	}
}


let speed_func = function(speed, t) {
	// \_(>_<)_/

	return speed + (0.00098 * t)
}


function moveUp(e) {
	/*
	в качестве аргумента передается объект <События нажатия>, содержащий в себе информацию о нем(например, то, какая клавиша была нажата)
	выполняется гладкая(болиелимение) анимация полета птички, за счет последовательного изменения ее положения и последующей смене кадра
	анимация(взмах крыльями) достигается переменной сменой изображений из списка state
	после выполнения операции взлета проигрывается звук взмаха
	*/

	if (e.keyCode != 32) { // is Space pressed?
		return;
	}

	speed_of_falling = 1;
	time = 1;
	cancelAnimationFrame(animation_); // закрываем предыдущий фрейм, чтобы не было неожиданных "подскоков"

	bird.src = state[1]; // взмах

	let pos = yPos - swing; // та точка по Y, в которой должна будет оказаться птичка

	function _animation() {
		if (pos > yPos) {
			bird.src = state[0]; // обычное состояние
			return;
		}

		yPos -= speed_of_swing;
		animation_ = requestAnimationFrame(_animation);
	}

	_animation();
	fly.play();
}


function loop() {
	ctx.drawImage(bg, 0, 0);

	if (pipe.length > 4) { // оптимизация списка преград
		pipe = pipe.slice(2, pipe.length);
	}

	for(let i = 0; i < pipe.length; i++) {
		ctx.drawImage(pipeUp, pipe[i].x, pipe[i].y);
		ctx.drawImage(pipeDown, pipe[i].x, pipe[i].y + pipeUp.height + gap);

		if (pipe[i].x == 100) {
			pipe.push({
				x: canvas.width,
				y: -1 * random(0, pipeUp.height-50)
			});
		}

		// столкновение с низом
		if (yPos + bird.height >= canvas.height) {
			return fall();
		}

		// столкновение со стеной
		if (xPos + bird.width-5 >= pipe[i].x) { // птичка вошла в позицию стены
			if (xPos+10 <= pipe[i].x + pipeUp.width) { // птичка еще не прошла через стены
				if ( (yPos+3 <= pipe[i].y + pipeUp.height) || (yPos + bird.height-2 >= pipe[i].y + pipeUp.height + gap) ) {
					// если позиция птички по Y меньше позиции нижней части верхней стены
					// либо позиция птички по Y больше позиции верхней части нижней стены

					return fall();
				}
			}
		}

		pipe[i].x -= speed;

		if(pipe[i].x == -50) {
			score++;
			score_audio.play();
		}
	}

	ctx.drawImage(bird, xPos, yPos);
	speed_of_falling = speed_func(speed_of_falling, time);
	yPos += speed_of_falling;
	time = time+time_speed

	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	timer = requestAnimationFrame(loop);
}


async function fall() {
	document.removeEventListener('keydown', moveUp);

	// рисовка недорисиванного
	ctx.drawImage(bird, xPos, yPos);
	ctx.drawImage(pipeUp, pipe[pipe.length-1].x, pipe[pipe.length-1].y);
	ctx.drawImage(pipeDown, pipe[pipe.length-1].x, pipe[pipe.length-1].y + pipeUp.height + gap);
	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	if (score > record) { // по умолчанию record = 0
		record = score;
	}

	if (animation_ != null) {
		cancelAnimationFrame(animation_);
	}

	cancelAnimationFrame(timer);
	ost.pause();
	ost.currentTime = 0;  // остановка фоновой музыки

	await
		sleep(75); // пока не выполнится промис из функции, работа кода будет приостановлена
	
	damage.play(); // удар

	await
		sleep((damage.duration - damage.currentTime)*1000);

	game_over.play(); // проигрыш звука поражения
	bird.src = state[2];

	time = 1;
	speed_of_falling = 2;

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
			await
				sleep((game_over.duration - game_over.currentTime)*1000);

			ctx.clearRect(0, 0, canvas.width, canvas.height); // очистка канваса
			bird.src = state[0]; // смена состояния на обычное
			return reload(); // колесо сансары дало оборот
		}

		speed_of_falling = speed_func(speed_of_falling, time);
		yPos += speed_of_falling;
		time = time+time_speed;
		animation_ = requestAnimationFrame(fall_);
	}

	requestAnimationFrame(fall_);
}


function start() {
	/*
	включает случайную фоновую музыку
	отсоединяет эту функцию от события клика по канвасу
	присваивает к событию нажатия на клавиву вызов функции moveUp
	очищает канвас от элементов предыдущего экрана
	вызывает основную функцию loop
	*/

	playMusic();
	canvas.removeEventListener('click', start);
	document.addEventListener('keydown', moveUp);

	ctx.clearRect(0, 0, canvas.width, canvas.height);
	loop();
}


ostList[ostList.length-1].onloadeddata = () => reload();