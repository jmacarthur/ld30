var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 480;
var SCREENHEIGHT = 480;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;
var shipPoly = [ [8,0], [-8,4], [-8,-4] ];
var enemyPoly = [ [8,8], [-8,8], [-8,-8], [8,-8] ];
var enemyAccel = 0.01;
var enemyDecel = 0.05;
function sgn(x)
{
    if(x>0) return 1;
    if(x<0) return -1;
    return 0;
}

function getImage(name)
{
    image = new Image();
    image.src = 'graphics/'+name+'.png';
    return image;
}

function Enemy(sx,sy)
{
    console.log("New enemy at "+sx+","+sy);
    this.x = sx;
    this.y = sy;
    this.r = 0;
    this.speed = 1;
    this.radius = 8;
}

function drawChar(context, c, x, y) 
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, 12, 16);
    }
}

function drawString(context, string, x, y) {
    string = string.toUpperCase();
    for(i = 0; i < string.length; i++) {
	drawChar(context, string[i], x, y);
	x += 12;
    }
}

function paintTitleBitmaps()
{
    drawString(titlectx, 'This is a demo of the JavaScript/HTML5 game loop',32,32);
    drawString(winctx, 'Your game should always have an ending',32,32);
}

function makeTitleBitmaps()
{
    titleBitmap = document.createElement('canvas');
    titleBitmap.width = SCREENWIDTH;
    titleBitmap.height = SCREENHEIGHT;
    titlectx = titleBitmap.getContext('2d');
    winBitmap = document.createElement('canvas');
    winBitmap.width = SCREENWIDTH;
    winBitmap.height = SCREENHEIGHT;
    winctx = winBitmap.getContext('2d');
    bitfont = new Image();
    bitfont.src = "graphics/bitfont.png";
    bitfont.onload = paintTitleBitmaps;
}

function resetGame()
{
    x = 128;
    y = 128;
    r = 0;
    speed = 1;
    enemies = new Array();
    var i;
    for(i=0;i<10;i++)
	enemies.push ( new Enemy(256+64*i,128) );
    laser = false;
    laserCoolDown = 0;
}

function init()
{
    mode = MODE_TITLE;
    playerImage = getImage("player");
    springSound = new Audio("audio/boing.wav");
    makeTitleBitmaps();
    ctx.lineWidth = 2;
    return true;
}

function drawPoly(poly, offsetx, offsety)
{
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.moveTo(poly[0][0]+offsetx, poly[0][1]+offsety);
    var i;
    for(i=1;i<poly.length;i++) {
	ctx.lineTo(poly[i][0]+offsetx, poly[i][1]+offsety);
    }
    ctx.lineTo(poly[0][0]+offsetx, poly[0][1]+offsety);
    ctx.stroke();
}

function rotatePoly(original, radians)
{
    var newPoly = new Array();
    var i;
    for(i=0;i<original.length;i++) {
	ox = original[i][0];
	oy = original[i][1];
	newPoly.push( [ox*Math.cos(radians) - oy*Math.sin(radians),
		      oy*Math.cos(radians) + ox*Math.sin(radians) ]);
    }
    return newPoly;
}

function drawPlayer()
{
    drawPoly(rotatePoly(shipPoly, r), x, y);
    if(laser) {
	ctx.strokeStyle = "#ff0000";
	ctx.beginPath();
	ctx.moveTo(x,y);
	ctx.lineTo(x+laserLen*Math.cos(r), y+laserLen*Math.sin(r));
	ctx.stroke();
	laserCoolDown = 16;
    }
    if(laserCoolDown>0) laserCoolDown -=1;
}

function drawEnemy(e)
{
    drawPoly(rotatePoly(enemyPoly, e.r), e.x, e.y);
}

function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    drawPlayer (x,y);
    for(i=0;i<enemies.length;i++) {
	drawEnemy(enemies[i]);
    }
    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function processKeys() {
    if(keysDown[40] || keysDown[83]) speed -= 0.1;
    if(keysDown[38] || keysDown[87]) speed += 0.1;
    if(keysDown[37] || keysDown[65]) r -= 0.1;
    if(keysDown[39] || keysDown[68]) r += 0.1;
    laser = (keysDown[32] && laserCoolDown <= 0);
    if(x < 0) x = 0;
    if(x > SCREENWIDTH - playerImage.width)  x = SCREENHEIGHT - playerImage.width;
    if(y < 0) y = 0;
    if(y > SCREENWIDTH - playerImage.height) y = SCREENHEIGHT - playerImage.height;
}

function runEnemies() {
    for(i=0;i<enemies.length;i++) {
	e = enemies[i];
	e.x += e.speed * Math.cos(e.r);
	e.y += e.speed * Math.sin(e.r);
	dx = x - e.x;
	dy = y - e.y;
	dir = Math.atan2(dy,dx);
	dd = (dir-e.r);
	e.r += 0.05*sgn(Math.sin(dd));
	dist = dx*dx+dy*dy;

	if(dist < 32*32 && e.speed>enemyDecel) {
	    e.speed -= enemyDecel;
	}
	if(dist > 64*64 && e.speed < 1) {
	    e.speed += enemyAccel;
	}

	// If I'm too close to another ship, move away
	// TODO: this is O(n^2)!
	for(j=0;j<enemies.length;j++) {
	    if(j==i) continue;
	    var e1 = enemies[j];
	    var dx = e1.x - e.x;
	    var dy = e1.y - e.y;
	    var dist = dx*dx+dy*dy;
	    if(dist < 64*64)  {
		dir = Math.atan2(dy,dx);
		dd = (dir-e.r);
		e.r -= 0.05*sgn(Math.sin(dd));
		//if(e.speed > 0.5) e.speed -= enemyDecel;
	    }
	}

    }
}

function runPlayer() {
    laserLen = 1000;
    x += speed*Math.cos(r);
    y += speed*Math.sin(r);
    if(laser) {
	// Look for enemies near the beam
	var i;
	var closestDist = 1000;
	var closest = -1;
	for(i=0;i<enemies.length;i++) {
	    dx = enemies[i].x - x;
	    dy = enemies[i].y - y;
	    lx = Math.cos(r);
	    ly = Math.sin(r);
	    dist = dx*dx+dy*dy;
	    cp = dx*lx+dy*ly;
	    linedist = dist-cp*cp;
	    if(linedist < enemies[i].radius*enemies[i].radius && cp > 0 && cp < closestDist) {
		closestDist = cp;
		closest = i;
	    }
	}
	if (closest>-1) {
	    enemies[closest].y += 256;
	    laserLen = closestDist;
	}
    }
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
	runPlayer();
	runEnemies();
    }
    draw();
    if(!stopRunloop) setTimeout('drawRepeat()',20);
}

if (canvas.getContext('2d')) {
    stopRunloop = false;
    ctx = canvas.getContext('2d');
    body.onkeydown = function (event) {
	var c = event.keyCode;
	console.log("Keydown: "+c);
	keysDown[c] = 1;
	if(c == 81) {
	    stopRunloop=true;
	}
	if(c == 32) {
	    if(mode == MODE_TITLE) {
		resetGame();
		mode = MODE_PLAY;
	    }
	}
	if(c == 82) {
	    if(mode == MODE_WIN) {
		mode = MODE_TITLE;
	    }
	}
    };

    body.onkeyup = function (event) {
	var c = event.keyCode;
        keysDown[c] = 0;
    };

    if(init()) {      
      drawRepeat();
    }
}