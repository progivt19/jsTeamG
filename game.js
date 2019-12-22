let
	canvas = document.getElementById('canvas'),
	ctx = canvas.getContext('2d');


ctx.fillStyle = "#000";
ctx.font = "bold 21px Calibri";


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
	// позиция птички, скорость ее постоянного снижения; то, насколько будет птичка подниматься при каждом нажатии на space; то, как быстро птичка будет достигать этой величины
	xPos, yPos, gravity, offset, offset_per_iteration,

	// пробел между препятствиями, список объектов, содержащий координаты препятствий, скорость движения препятствий(скорее булевое значение 1 - двигаются; 0 - не двигаются; значение больше 1 делают игру некрасивой)
	gap, pipe, speed,

	// счет, рекорд
	score, record = 0;


let arrayRandElement = function(arr) {
	// функция, возвращающая случайный элемент массива

	let 
		rand = Math.floor(Math.random() * arr.length);

	return arr[rand];
}


let playMusic = function() {
	// функция для включения музыки

	ost = arrayRandElement(ostList);
	ost.play();
	ost.onended = () => playMusic(); // включение следующего трека
}


let moveUp = function(e) {
	/*
	в качестве аргумента передается объект <События нажатия>, содержащий в себе информацию о нем(например, то, какая клавиша была нажата)
	выполняется гладкая анимация полета птички, за счет последовательного изменения ее положения и последующей смене кадра
	анимация(взмах крыльями) достигается переменной сменой изображений из списка state
	после выполнения операции взлета проигрывается звук взмаха
	*/

	if (e.keyCode != 32) { // is Space pressed?
		return;
	}

	cancelAnimationFrame(animation_); // закрываем предыдущий фрейм, чтобы не было неожиданных "подскоков"

	bird.src = state[1]; // взмах

	let 
		pos = yPos - offset; // та точка по Y, в которой должна будет оказаться птичка

	function _animation() {
		if (pos > yPos) {
			bird.src = state[0]; // обычное состояние
			return;
		}

		yPos-=offset_per_iteration;
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

		if (pipe[i].x == 100) {
			pipe.push({
				x: canvas.width,
				y: -1 * (Math.floor(Math.random() * (pipeUp.height-50)))
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
	yPos += gravity; // действие гравитации
	ctx.fillText("Счет: " + score, 5, 20);

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	timer = requestAnimationFrame(loop);
}


let fall = async function() {
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
			await
				sleep((game_over.duration - game_over.currentTime)*1000);

			ctx.clearRect(0, 0, canvas.width, canvas.height); // очистка канваса
			bird.src = state[0]; // смена состояния на обычное
			return reload(); // колесо сансары дало оборот
		}

		yPos += gravity;
		animation_ = requestAnimationFrame(fall_);
	}

	requestAnimationFrame(fall_);
}


function sleep(ms) {
	// как только вызов функция завершится, промис примет выполненное состояние, до тех пор код будет находиться в состоянии ожидания
	return new Promise(resolve => setTimeout(resolve, ms));
}


let start = function() {
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


let reload = function() {
	/*
	дефолтные значения переменных
	создание начального экрана при загрузке страницы или после поражения
	*/

	xPos = 10;
	yPos = 200;
	score = 0;

	gap = 95;
	gravity = 2; // 2 || 3 ; но лучше 2
	speed = 1 + (gravity%2);

	offset_ = gravity*2 + !(gravity % 2);
	offset = offset_*(10-offset_);
	offset_per_iteration = offset_;

	pipe = [];
	pipe.push({x: canvas.width, y: -1 * (Math.floor(Math.random() * (pipeUp.height-50)))}); // добавляем первое препятствие "за кадр"

	ctx.drawImage(bg, 0, 0); // рисуем фон
	ctx.drawImage(bird_default, xPos, yPos); // рисуем птичку с дефолтным начальным положением
	ctx.drawImage(get_ready, 13, 90); // рисуем надпись Get Ready

	ctx.fillText("Счет: " + score, 5, 20); // создаем текст счета

	if (record != 0) {
		ctx.fillText("Рекорд: " + record, 5, 40);
	}

	canvas.addEventListener('click', start); // присоединяем событие клика на начальном экране к функции start
}


ostList[ostList.length-1].onloadeddata = () => reload();