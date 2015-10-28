function draw_pupil(ctx, x, y, rad) {
	ctx.beginPath();
	ctx.arc(x, y, rad, 0, 2*Math.PI, false);
	ctx.fill();	
}

function make_pupil(pupilRadius) {
	var pupil_canvas = document.createElement("canvas");
	var size = pupil_canvas.width = pupil_canvas.height = Math.max(pupilRadius, 5) * 2.5;
	var pupil_context = pupil_canvas.getContext("2d");
	draw_pupil(pupil_context, size / 2, size / 2, pupilRadius);
	return pupil_canvas;
}

function googlyEye(pane, posX, posY, relSize)
{
	var width = relSize/100 * pane.w;
	
	var halfWidth = width / 2;
	
	var eyeLineWidth = 0.2 * halfWidth;
	var eyeRadius  = halfWidth - eyeLineWidth/2;
	var pupilRadius = 0.4 * eyeRadius;
	var sideEyeRatio = 0.4; // How far the pupil can sink into the line around the eye

	if (pane.smooth_draw) {
		var pupil_canvas = pane.pupilCache(pupilRadius, make_pupil);
	}

	var ctrX = pane.w*(posX-relSize/2)/100 + halfWidth;
	var ctrY = pane.w*(posY-relSize/2)/100 + halfWidth;

	function drawWhite()
	{
		// Draw white
		pane.white_ctx.beginPath();
		pane.white_ctx.arc(ctrX, ctrY, eyeRadius, 0, 2*Math.PI, false);
		pane.white_ctx.fillStyle = "#ffffff";
		pane.white_ctx.fill();
		pane.white_ctx.lineWidth = eyeLineWidth;
		pane.white_ctx.strokeStyle = "#000000";
		pane.white_ctx.stroke();
	}
	
	function d(x,y)
	{
		return Math.sqrt(x*x + y*y);
	}
	function relDistFromCentre(x, y)
	{
		if (x === 0 && y === 0) return 0;
		var r = d(x,y);
		return (eyeRadius-pupilRadius-(1-sideEyeRatio)*eyeLineWidth) * (1 - Math.exp( -r/(3*eyeRadius) )) / r;
	}

	var pupil_ctx = pane.pupil_ctx;
	
	function drawEye(x, y)
	{
		if (x === undefined) x = ctrX;
		if (y === undefined) y = ctrY;
		x -= ctrX;
		y -= ctrY;
		var r = relDistFromCentre(x, y);
		if (!pane.smooth_draw) {
			draw_pupil(pupil_ctx, ctrX + r*x, ctrY + r*y, pupilRadius);
		} else {
			pupil_ctx.drawImage(pupil_canvas, ctrX + r*x - pupil_canvas.width / 2, ctrY + r*y - pupil_canvas.height / 2);
		}
	}
	drawWhite();
	return drawEye;
}


function GooglyPane(w, h, eyespec, container) {
	this.eyespec = eyespec;
	this.container = container;
	container.style.position = "relative";
	this.whites_canvas = mkCanv(1);
	this.white_ctx = this.whites_canvas.getContext("2d");
	this.pupils_canvas = mkCanv(2);
	this.pupil_ctx = this.pupils_canvas.getContext("2d");

	function mkCanv(z) {
		var c = document.createElement("canvas");
		c.style.position = "absolute";
		c.style.top = 0;
		c.style.left = 0;
		c.style.zIndex = z;
		return c;
	}
	this.smooth_draw = testSmoothDrawImage();
	this.resize(w, h);
	container.appendChild(this.whites_canvas);
	container.appendChild(this.pupils_canvas);
}


GooglyPane.prototype.look = function(x, y) {
	this.curX = x;
	this.curY = y;
	// clearning subregions is slower than all at once
	this.clearPupils();
	if (x !== undefined) { // look straight when undefined
		x -= this.container.offsetLeft;
		y -= this.container.offsetTop;
	}
	for(var i = 0; i < this.eyes.length; i++) {
		this.eyes[i](x, y);
	}
};

GooglyPane.prototype.clearPupils = function() {
	this.pupil_ctx.clearRect(0, 0, this.pupils_canvas.width, this.pupils_canvas.height);
};

GooglyPane.prototype.resize = function(w, h) {
	this.whites_canvas.width = this.pupils_canvas.width = this.w = w;
	this.whites_canvas.height = this.pupils_canvas.height = this.h = h;
	this.pupil_cache = {};
	this.addEyes();
	this.look(this.curX, this.curY);
};

GooglyPane.prototype.addEyes = function() {
	var p = this;
	this.eyes = this.eyespec.map(function(par) {
		return googlyEye(p, par[1], par[2], par[3]);
	});
};

GooglyPane.prototype.pupilCache = function(key, mkfun) {
	if (this.pupil_cache[key])
		return this.pupil_cache[key];
	else
		return (this.pupil_cache[key] = mkfun(key));
};

GooglyPane.prototype.follow_mouse = function() {
	onMouseAnimation(this.look.bind(this));
};


function testSmoothDrawImage() {
	// draw a 1x1 pixel image in the middle of a 2x2 one
	// to see if smoothing is done
	var c1 = document.createElement("canvas");
	c1.width = c1.height = 1;
	c1.getContext("2d").fillRect(0, 0, 1, 1);
	var c2 = document.createElement("canvas");
	c2.width = c2.height = 2;
	var ctx2 = c2.getContext("2d");
	ctx2.drawImage(c1, 0.5, 0.5);
	return ctx2.getImageData(1, 1, 1, 1).data[3] < 255;
}

function onMouseAnimation(fn, force) {
	var req;
	window.addEventListener("mousemove", function(mousePos){
		if (req) window.cancelAnimationFrame(req);
		req = window.requestAnimationFrame(function anim_frame_listen() {
			fn(mousePos.pageX, mousePos.pageY);
			if (force) { // FPS testing
				req = window.requestAnimationFrame(anim_frame_listen);
			} else {
				req = undefined;
			}
		});
	}, false);
}

