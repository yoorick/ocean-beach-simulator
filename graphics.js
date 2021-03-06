
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
	document.getElementById('waveLength').value = defaultSettings.waveLength;
	document.getElementById('waveHeight').value = defaultSettings.waveHeight;
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
 * Конвертировать пискель в точку в виртуальном пространестве.
 * Координаты новой точки принадлежат системе O'X'Y'Z'
 *
 * @param {Model} model
 */
Pixel.prototype.toPoint = function (model)
{
	return new Point(
		(this.x - model.viewportWidthHalf)  * model.scaleFraс,  // X'
		(model.viewportHeightHalf - this.y) * model.scaleFraс,  // Y'
		0                                                       // Z'
	);
}


/**
 * Точка.
 *
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
}


/**
 * Преобразовать координаты точки из одной системы координат в другую,
 * с использованием матрицы преобразования.
 *
 * @param {Array} matrix
 */
Point.prototype.transform = function (matrix)
{
	return new Point(
		matrix[0][0] * this.x + matrix[0][1] * this.y + matrix[0][2] * this.z + matrix[0][3],
		matrix[1][0] * this.x + matrix[1][1] * this.y + matrix[1][2] * this.z + matrix[1][3],
		matrix[2][0] * this.x + matrix[2][1] * this.y + matrix[2][2] * this.z + matrix[2][3]
	);
}


/**
 * Преобразовать координаты точки из одной системы координат в другую,
 * с использованием матрицы преобразования,
 * но отбросить координаты X и Y, вернув точку (0, 0, Z).
 *
 * @param {Array} matrix
 */
Point.prototype.transformOnlyZ = function (matrix)
{
	return new Point(
		0,
		0,
		matrix[2][0] * this.x + matrix[2][1] * this.y + matrix[2][2] * this.z + matrix[2][3]
	);
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
	this.viewportWidthHalf = this.viewportWidth * 0.5;
	this.viewportHeight = canvas.height;
	this.viewportHeightHalf = this.viewportHeight * 0.5;

	// Увеличение (наверное не нужно пока)
	this.zoom = 1.0;
	// Сколько пикселов в одном метре виртуального пространства:
	this.scale = parseInt(document.getElementById('scale').value);
	this.scaleFraс = 1 / this.scale;
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

	this.waveLength = parseFloat(document.getElementById('waveLength').value);
	this.waveHeight = parseFloat(document.getElementById('waveHeight').value);

	// Коэффициент для волнового уравнения
	this.waveLengthCoef = 2 * Math.PI / this.waveLength;
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

	var offset = 0;
	var pixel = new Pixel(0, 0);

	for (var y = 0; y < height; ++y)
	{
		pixel.y = y;

		for (var x = 0; x < width; ++x, offset += 4)
		{
//			offset = (y * width + x) * 4;
			pixel.x = x;

			setPixelColor(pixel, model);

			imgd.data[offset    ] = pixel.red;		// Red
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
	// TODO: Этот хак не совместим с возможностью "наклона головы" вниз/вверх,
	// но значительно увеличивает производительность и совместим с текущей моделью.
	// В случае с "наклоном головы" можно проверять условие (ey < 0).
	if (pixel.y < model.viewportHeightHalf)
	{
		setSkyColor(pixel, model);
		return;
	}

	var vpPoint = pixel.toPoint(model);
	var vpPointTr = vpPoint.transform(model.directTransformMatrix);

	// f + e*t  (t >=0 )  - луч
	// fy + ey*t          - проекция луча на ось OY
	// fy + ey*t = 0      - условие пересечения луча с поверхностью.
	// t = - (fy / ey)
	// e = vp - f         - как получить вектор e

	var ey = model.focusTr.y - vpPointTr.y;

	// Не уходит ли луч в линию горизонта (параллельно плоскости земли)?
	if (ey > 0.00001 || ey < -0.00001)
	{
//		var fy = model.focusTr.y;
		var t = model.focusTr.y / ey;

		// Точка пересечения в координатах 0"X"Y"Z"
		var intersection = new Point(
			model.focusTr.x + t * (vpPointTr.x - model.focusTr.x),
			0,
			model.focusTr.z + t * (vpPointTr.z - model.focusTr.z)
		);

		// Точка пересечения в координатах 0'X'Y'Z'
		var intersectionRev = intersection.transformOnlyZ(model.reverseTransformMatrix);

		if (intersectionRev.z > 0)
		{
			if (intersection.z >= 0)
			{
				setWaterColor(pixel, model, intersection);
				return;
			}
			else
			{
				setSandColor(pixel, model);
				return;
			}
		}
	}

	setSkyColor(pixel, model);
}


/**
 * Закрасить небо.
 *
 * @property {Pixel} pixel
 * @property {Model} model
 */
function setSkyColor(pixel, model)
{
	pixel.red = 200;
	pixel.green = 200;
	pixel.blue = 220;
}


/**
 * Закрасить песок.
 *
 * @property {Pixel} pixel
 * @property {Model} model
 */
function setSandColor(pixel, model)
{
	pixel.red = 240;
	pixel.green = 240;
	pixel.blue = 100;
}


/**
 * Закрасить воду.
 *
 * @property {Pixel} pixel
 * @property {Model} model
 * @property {Point} intersect
 */
function setWaterColor(pixel, model, intersect)
{
	// Расстояние от наблюдателя до точки пересечения
	var radius = Math.sqrt(Math.pow((intersect.x - model.focusTr.x), 2) + Math.pow((intersect.z - model.focusTr.z), 2));
	// amp должен быть <= 1.0
	// TODO: Число 10 подобрано экспериментально, возможно его можно как-то еще параметризовать.
	var amp = (radius > 10 ? 10 / radius : 1) * model.waveHeight;
	// Коэффициент с которым накладывается маска на основной цвет
	var coef = amp * Math.sin(model.waveLengthCoef * intersect.z);

	pixel.red = 50 + 50 * coef;
	pixel.green = 50 + 50 * coef;
	pixel.blue = 180  + 70 * coef;
}

