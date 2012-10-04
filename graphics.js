
/**
 * Холст
 */
var canvas;
/**
 * Контекст холста
 */
var context;

/**
 * Модель
 */
var model = {};


/**
 * Инициализируем приложение.
 */
function init(canvasID)
{
	canvas = document.getElementById(canvasID);

	if (!canvas)
	{
		alert('Error: элемент canvas не найден!');
		return;
	}
	else if (!canvas.getContext)
	{
		alert('Error: нет метода canvas.getContext!');
		return;
	}

	context = canvas.getContext('2d');

	if (!context)
	{
		alert('Error: не удалось получить контекст!');
		return;
	}
}


/**
 * Пиксель.
 *
 * @constructor
 * @this {Pixel}
 *
 * @property {Number} x
 * @property {Number} y
 * @property {Number} red
 * @property {Number} green
 * @property {Number} blue
 * @property {Number} alpha
 *
 * @param {Number} x [optional]
 * @param {Number} y [optional]
 */
function Pixel(x, y)
{
	this.x = x;
	this.y = y;

	this.red = 0;
	this.green = 0;
	this.blue = 0;
	this.alpha = 255;
}


/**
 * Рисуем
 */
function draw()
{
	// Узнаем размеры холста
	var width = canvas.width;
	var height = canvas.height;

	// Получаем массив пикселей холста
	var imgd = context.createImageData(width, height);

	for (var y = 0; y < height; ++y)
	{
		for (var x = 0; x < width; ++x)
		{
			var offset = (y * width + x) * 4;
			var pixel = new Pixel(x, y);

			setPixelColor(pixel, model);

			imgd.data[offset + 0] = pixel.red;		// Red
			imgd.data[offset + 1] = pixel.green;    // Green
			imgd.data[offset + 2] = pixel.blue;     // Blue
			imgd.data[offset + 3] = pixel.alpha;    // Alpha
		}
	}

	// Загружаем массив пикселей обратно на холст
	context.putImageData(imgd, 0, 0);
}


/**
 * Вычислить цвет пикселя.
 *
 * @property {Pixel} pixel
 * @property {Object} model
 */
function setPixelColor(pixel, model)
{
	// Просто пример реализации, чтобы проверить работу скрипта.
	// Будет заменено другим кодов в следующих коммитах.
	var value = Math.abs(Math.cos(Math.sqrt(pixel.y * pixel.y + pixel.x * pixel.x) / 128)) * 256;

	pixel.red = value;
	pixel.green = value;
	pixel.blue = value;
}

