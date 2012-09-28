
var canvas;
var context;


/**
 * Инициализируем приложение.
 */
function init()
{
	canvas = document.getElementById('view');

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

