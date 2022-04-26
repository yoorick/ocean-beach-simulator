

function benchmark()
{
	var yAngleNode = document.getElementById('yAngle');

	var timings = new Array();

	var date;
	var startTime;
	var stopTime;

	for (var yAngle = -179; yAngle <= 180; yAngle++)
	{
		yAngleNode.value = yAngle;

		date = new Date();
		startTime = date.getTime();

		draw();

		date = new Date();
		stopTime = date.getTime();
		timings[timings.length] = stopTime - startTime;
	}

	var min = timings[0];
	var max = timings[0];
	var avg = 0;
	var sum = 0;

	var listNode = document.createElement('ul');

	for (var i = 0; i < timings.length; i++)
	{
		sum += timings[i];

		if (min > timings[i])
		{
			min = timings[i];
		}
		if (max < timings[i])
		{
			max = timings[i];
		}

		listNode.appendChild(
			document.createElement('li')
		).appendChild(
			document.createTextNode((-179 + i) + ': ' + timings[i] + ' ms')
		);
	}
	avg = sum / timings.length;

	var text = 'MAX: ' + max + ' ms\nMIN: ' + min + ' ms\nAVG: ' + avg + 'ms';
	document.body.appendChild(
		document.createElement('p')
	).appendChild(
		document.createTextNode(text)
	);
	document.body.appendChild(listNode);
}


