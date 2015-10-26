var white_cache = {};
var pupil_cache = {};

function make_or_get_pupil(pupilRadius) {
	if (!pupil_cache[pupilRadius]) {
		var pupil_canvas = document.createElement("canvas");
		pupil_canvas.width = pupil_canvas.height = Math.max(pupilRadius * 2.5, 1);
		var pupil_context = pupil_canvas.getContext("2d");
		pupil_cache[pupilRadius] = pupil_canvas;
		// Pupil
		pupil_context.beginPath();
		pupil_context.arc(pupilRadius, pupilRadius, pupilRadius, 0, 2*Math.PI, false);
		pupil_context.fill();
	}
	return pupil_cache[pupilRadius];
}

function make_white(width, eyeRadius, eyeLineWidth) {
	if (!white_cache[width]) {
		var white_canvas = document.createElement("canvas");
		white_canvas.width = white_canvas.height = width;
		white_cache[width] = white_canvas;
		var white_context = white_canvas.getContext("2d");
		// Draw white
		white_context.beginPath();
		white_context.arc(width / 2, width / 2, eyeRadius, 0, 2*Math.PI, false);
		white_context.fillStyle = "#ffffff";
		white_context.fill();
		white_context.lineWidth = eyeLineWidth;
		white_context.strokeStyle = "#000000";
		white_context.stroke();
	}
	return white_cache[width];
}

function googlyEye(canvasId, posX, posY, relSize)
{
	var eyeContainer = document.getElementById("eyesContainer");
	eyeContainer.style.position = "relative";
	
	var canvas = document.createElement("canvas");
	canvas.id = canvasId;
	canvas.width = relSize/100 * eyeContainer.clientWidth;
	canvas.height = canvas.width;
	eyeContainer.appendChild(canvas);
	
	var canvasStyle = canvas.style;
	var context = canvas.getContext("2d");
	
	var halfWidth = canvas.width/2;
	
	canvasStyle.position =  "absolute";
	canvasStyle.top = Math.floor(eyeContainer.clientWidth*(posY-relSize/2)/100) + "px";
	canvasStyle.left = Math.floor(eyeContainer.clientWidth*(posX-relSize/2)/100) + "px";
	
	var eyeLineWidth = 0.2 * halfWidth;
	var eyeRadius  = halfWidth - eyeLineWidth/2;
	var pupilRadius = 0.4 * eyeRadius;
	var sideEyeRatio = 0.4; // How far the pupil can sink into the line around the eye

	var pupil_canvas = make_or_get_pupil(pupilRadius);
	var white_canvas = make_white(canvas.width, eyeRadius, eyeLineWidth);

	function drawWhite()
	{
		// Clear all
		context.clearRect(0, 0, canvas.width, canvas.height);
		// draw white
		context.drawImage(white_canvas, 0, 0);
	}
	
	function d(x,y)
	{
		return Math.sqrt(x*x + y*y);
	}
	function relDistFromCentre(x, y)
	{
		var r = d(x,y);
		return (eyeRadius-pupilRadius-(1-sideEyeRatio)*eyeLineWidth) * (1 - Math.exp( -r/(3*eyeRadius) )) / r;
	}
	
	function drawEye(x, y)
	{
		var r = relDistFromCentre(x, y);
		drawWhite();
		context.drawImage(pupil_canvas, halfWidth + r*x - pupilRadius, halfWidth + r*y - pupilRadius);
	}
	return function draw(mousePos){
		// caching offsetLeft and offsetTop is faster but they might change
		var x = mousePos.pageX - canvas.offsetLeft - halfWidth;
		var y = mousePos.pageY - canvas.offsetTop - halfWidth;
		drawEye(x, y);
	};
}
