
/**
 * Холст
 */
var canvas;
/**
 * Контекст холста
 */
var context;


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


function loadDefaultSettings()
{
	if (!defaultSettings)
	{
		alert('Error: настройки по умолчанию не найдены!');
		return;
	}

	document.getElementById('scale').value = defaultSettings.scale;
	document.getElementById('focusAngle').value = defaultSettings.focusAngle;
	document.getElementById('distance').value = defaultSettings.distance;
	document.getElementById('height').value = defaultSettings.height;
	document.getElementById('yAngle').value = defaultSettings.yAngle;
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

	/**
	 * @param {Model} model
	 */
	this.toPoint = function (model)
	{
		return new Point(
			(this.x - model.viewportWidth / 2)  / model.scale,  // X'
			(model.viewportHeight / 2 - this.y) / model.scale,  // Y'
			0                                                   // Z'
		);
	}
}


/**
 * @constructor
 * @this {Point}
 *
 * @property {Number} x
 * @property {Number} y
 * @property {Number} z
 *
 * @param {Number} x [optional]
 * @param {Number} y [optional]
 * @param {Number} z [optional]
 */
function Point(x, y, z)
{
	this.x = x;
	this.y = y;
	this.z = z;

	/**
	 * @param {Array} matrix
	 */
	this.transform = function (matrix)
	{
		return new Point(
			matrix[0][0] * this.x + matrix[0][1] * this.y + matrix[0][2] * this.z + matrix[0][3],
			matrix[1][0] * this.x + matrix[1][1] * this.y + matrix[1][2] * this.z + matrix[1][3],
			matrix[2][0] * this.x + matrix[2][1] * this.y + matrix[2][2] * this.z + matrix[2][3]
		);
	}
}


/**
 * Модель
 *
 * @constructor
 * @this {Model}
 */
function Model()
{
	this.screen = new Object();

	this.viewportWidth = canvas.width;
	this.viewportHeight = canvas.height;

	// Увеличение (наверное не нужно пока)
	this.zoom = 1.0;
	// Сколько пикселов в одном метре виртуального пространства:
	this.scale = parseInt(document.getElementById('scale').value);
	// Угол обзора (в градусах)
	this.focusAngle = parseInt(document.getElementById('focusAngle').value);
	// Угол обзора (в радианах)
	this.focusAngleRad = this.focusAngle * Math.PI / 180;
	this.focus = new Point(
		0, // X'
		0, // Y'
		-(0.5 * (this.viewportWidth / this.scale) * (1 / Math.tan(this.focusAngleRad * 0.5)))  // Z'
	);

	// Расстояние от штатива до воды (в метрах виртуального пространства)
	// т.е. сдвиг OX'Y'Z' относительно OXYZ вдоль оси OZ
	// Отрицательное значение означает, что мы над водой
	this.distance = parseFloat(document.getElementById('distance').value);
	// Высота до центра холста (в метрах виртуального пространства)
	// т.е. сдвиг OX'Y'Z' относительно OXYZ вдоль оси OY
	this.height = parseFloat(document.getElementById('height').value);
	// Поворот экрана вокруг вертикальной оси OY' (в градусах)
	this.yAngle = parseInt(document.getElementById('yAngle').value);
	// Поворот экрана вокруг вертикальной оси OY' (в радианах)
	this.yAngleRad = this.yAngle * Math.PI / 180;
	// TODO: угол наклона (поворота вокруг оси OX')

	var C = Math.cos(this.yAngleRad);
	var S = Math.sin(this.yAngleRad);

	this.directTransformMatrix = [
		[ C,  0,  S,  0             ],
		[ 0,  1,  0,  this.height   ],
		[-S,  0,  C, -this.distance ],
		[ 0,  0,  0,  1             ]
	];

	this.reverseTransformMatrix = [
		[ C,  0, -S, -S * this.distance ],
		[ 0,  1,  0, -this.height       ],
		[ S,  0,  C,  C * this.distance ],
		[ 0,  0,  0,  1                 ]
	];

	this.focusTr = this.focus.transform(this.directTransformMatrix);
}


/**
 * Рисуем
 */
function draw()
{
	// Модель
	var model = new Model();

	// Узнаем размеры холста
	var width = model.viewportWidth;
	var height = model.viewportHeight;

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
 * @property {Model} model
 */
function setPixelColor(pixel, model)
{
	var vpPoint = pixel.toPoint(model);
	var vpPointTr = vpPoint.transform(model.directTransformMatrix);

	var drawingObject = 'sky';
	var intersection = null;
	// Не уходит ли луч в линию горизонта (параллельно плоскости земли)?
	if (Math.abs(vpPointTr.y - model.focusTr.y) > 0.00001)
	{
		// f + e*t  (t >=0 )  - луч
		// fy + ey*t          - проекция луча на ось OY
		// fy + ey*t = 0      - условие пересечения луча с поверхностью.
		// t = - (fy / ey)
		// e = vp - f         - как получить вектор e

		var ey = vpPointTr.y - model.focusTr.y;
		var fy = model.focusTr.y;
		var t = -(fy / ey);

		// Точка пересечения в координатах 0"X"Y"Z"
		intersection = new Point(
			model.focusTr.x + t * (vpPointTr.x - model.focusTr.x),
			0,
			model.focusTr.z + t * (vpPointTr.z - model.focusTr.z)
		);

		// Точка пересечения в координатах 0'X'Y'Z'
		var intersectionRev = intersection.transform(model.reverseTransformMatrix);

		if (intersectionRev.z > 0)
		{
			if (intersection.z >= 0)
			{
				drawingObject = 'water';
			}
			else
			{
				drawingObject = 'sand';
			}
		}
	}

	switch (drawingObject) {
		case 'sky':
			pixel.red = 200;
			pixel.green = 200;
			pixel.blue = 220;
			break;
		case 'sand':
			pixel.red = 240;
			pixel.green = 240;
			pixel.blue = 100;
			break;
		case 'water':
			pixel.red = 100;
			pixel.green = 100;
			pixel.blue = 250;
			break;
	}
}

