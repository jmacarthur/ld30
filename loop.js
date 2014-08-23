var canvas = document.getElementsByTagName('canvas')[0];
var ctx = null;
var body = document.getElementsByTagName('body')[0];
var keysDown = new Array();
var SCREENWIDTH  = 480;
var SCREENHEIGHT = 480;
cx = SCREENWIDTH/2;
cy = SCREENWIDTH/2;
var MODE_TITLE = 0;
var MODE_PLAY  = 1;
var MODE_WIN   = 2;
var shipPoly = [ [8,0], [-8,4], [-8,-4] ];
var enemyPoly = [ [8,6], [-8,8], [-8,-8], [8,-6] ];
var enemyAccel = 0.01;
var enemyDecel = 0.05;
characterWidth = 12;
function Planet(name, x, y, mass, radius)
{
    this.name = name; this.x = x; this.y = y; this.mass = mass;
    this.radius = radius;
}

var starMap = [
//    new Planet("UNQUHEX", 51252.4729724,62263.5669664, 0.1, 64,)
    new Planet("UNQUHEX", 256,256, 0.1, 64),
    new Planet("OLAOYRI", 31161.6740694,32781.9211199, 0.1, 64),
    new Planet("ORCAMEC", 31210.6883079,346.27624567, 0.1, 64),
    new Planet("OLAOYRI", 14479.4387553,5512.81099972, 0.1, 64),
    new Planet("ILKUOUC", 17507.3398211,24201.9298703, 0.1, 64),
    new Planet("PREO",    27097.5082089,29768.19066, 0.1, 64),
    new Planet("TESAUS",  5436.93976607,79.7122271237, 0.1, 64),
    new Planet("EXQUCXEE",36710.6468034,45688.9802764, 0.1, 64),
    new Planet("TISGEAEU",53958.1179706,63367.7590348, 0.1, 64),
    new Planet("AREUCAW", 21736.1052383,2496.67420002, 0.1, 64)
];

function Explosion(x,y)
{
    this.x = x; this.y = y;
    this.timeout = 32;
}

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
    this.health = 100;
}

function drawChar(context, c, x, y) 
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, characterWidth, 16);
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
    player = { x: 128, y: 128, r: 0, speed: 1, shields: 100 };
    enemies = new Array();
    var i;
    for(i=0;i<10;i++)
	enemies.push ( new Enemy(256+64*i,128) );
    laser = false;
    laserCoolDown = 0;
    frameCounter = 0;
    deadTimeout = 0;

    planet = starMap[0];
    explosions = new Array();
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

function drawExplosions()
{
    var i;
    for(i=0;i<explosions.length;i++) {
	var e = explosions[i];
	if(e.timeOut <= 0) continue;
	console.log("Drawing explosion at"+e.x+","+e.y);
	ctx.strokeStyle = "#ffffff";
	ctx.beginPath();
	ctx.arc(cx - player.x + e.x, cy - player.y + e.y, 32-e.timeout, 0, 2*Math.PI);
	ctx.stroke();
    }
}

function drawPlanet()
{
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx - player.x + planet.x, cy - player.y + planet.y, planet.radius, 0, 2*Math.PI);
    ctx.stroke();
    textSize = planet.name.length * characterWidth;
    drawString(ctx, planet.name, cx - player.x + planet.x - textSize/2, cy - player.y + planet.y - 8);
}

function drawPlayer()
{
    drawPoly(rotatePoly(shipPoly, player.r), cx, cy);
    if(laser) {
	ctx.strokeStyle = "#ff0000";
	ctx.beginPath();
	ctx.moveTo(cx, cy);
	ctx.lineTo(cx+laserLen*Math.cos(player.r), cy+laserLen*Math.sin(player.r));
	ctx.stroke();
	laserCoolDown = 16;
    }
    if(laserCoolDown>0) laserCoolDown -=1;

}

function drawEnemy(e)
{
    drawPoly(rotatePoly(enemyPoly, e.r), cx - player.x + e.x, cy - player.y + e.y);
}

function drawStatusBar()
{
    ctx.fillStyle = "#000000";
    ctx.fillRect(480, 0, 640-480, SCREENHEIGHT);
    drawString(ctx, "Shield: "+player.shields, 480+8, 8);
}

function draw() {
    ctx.fillStyle = "#0000ff";
    ctx.fillRect(0, 0, SCREENWIDTH, SCREENHEIGHT);

    if(mode == MODE_TITLE) {
	ctx.drawImage(titleBitmap, 0, 0);
	return;
    }

    drawPlayer (player.x,player.y);
    drawPlanet();
    drawExplosions();
    for(i=0;i<enemies.length;i++) {
	if(enemies[i].health <= 0) continue;
	drawEnemy(enemies[i]);
    }
    drawStatusBar();

    if(mode == MODE_WIN) {
	ctx.drawImage(winBitmap, 0, 0);
    }
}

function processKeys() {
    if((keysDown[40] || keysDown[83]) && player.speed > 0.2) player.speed -= 0.1;
    if((keysDown[38] || keysDown[87]) && player.speed < 5.0) player.speed += 0.1;
    if(keysDown[37] || keysDown[65]) player.r -= 0.1;
    if(keysDown[39] || keysDown[68]) player.r += 0.1;
    laser = (keysDown[32] && laserCoolDown <= 0);
}

function makeExplosion(x,y)
{
    explosions.push(new Explosion(x,y));
}

function purge()
{
    var newEnemies = new Array();
    var i;
    for(i=0;i<enemies.length;i++) {
	if(enemies[i].health > 0)
	    newEnemies.push(enemies[i]);
    }
    enemies = newEnemies;
    var newExplosions = new Array();
    for(i=0;i<explosions.length;i++) {
	if(explosions[i].timeout > 0)
	    newExplosions.push(explosions[i]);
    }
    explosions = newExplosions;
}

function runExplosions()
{
    var i;
    for(i=0;i<explosions.length;i++) {
	if(explosions[i].timeout > 0)
	    explosions[i].timeout -= 1;
    }
}

function collide(e1, e2)
{
    e1.health -= 10;
    e2.health -= 10;
    var midx = (e1.x+e2.x)/2;
    var midy = (e1.y+e2.y)/2;
    var dx = e1.x - midx;
    var dy = e1.y - midy;
    // Repulsive kick:
    e1.x += dx;
    e1.y += dy;
    e2.x -= dx;
    e2.y -= dy;
    makeExplosion(midx, midy);
}

function runEnemies() {
    var i;
    for(i=0;i<enemies.length;i++) {
	e = enemies[i];
	if(e.health <= 0) continue;
	e.x += e.speed * Math.cos(e.r);
	e.y += e.speed * Math.sin(e.r);
	dx = player.x - e.x;
	dy = player.y - e.y;
	dir = Math.atan2(dy,dx);
	dd = (dir-e.r);
	e.r += 0.05*sgn(Math.sin(dd));
	distsq = dx*dx+dy*dy;

	if(distsq < 32*32 && e.speed>enemyDecel) {
	    e.speed -= enemyDecel;
	}
	if(distsq > 64*64 && e.speed < 1) {
	    e.speed += enemyAccel;
	}

	// If I'm too close to another ship, move away
	// TODO: this is O(n^2)!
	for(j=0;j<enemies.length;j++) {
	    if(j==i) continue;
	    var e1 = enemies[j];
	    if(e1.health <= 0) continue;
	    var dx = e1.x - e.x;
	    var dy = e1.y - e.y;
	    var dist = dx*dx+dy*dy;
	    if(dist < 64*64)  {
		dir = Math.atan2(dy,dx);
		dd = (dir-e.r);
		e.r -= 0.05*sgn(Math.sin(dd));
		//if(e.speed > 0.5) e.speed -= enemyDecel;
	    }
	    if(dist < 8*8) {
		collide(e, e1)
	    }
	}
	// Collisions with player
	if(distsq < 8*8) {
	    collide(e, player);
	}
    }
}

function killPlayer()
{
    deadTimeout = 32;
}

function runOrbit() {
    dx = planet.x - player.x;
    dy = planet.y - player.y;
    // Gravity applies a force which will skew the direction of the ship
    // So, original vector:
    vx = player.speed*Math.cos(player.r);
    vy = player.speed*Math.sin(player.r);
    // Now add on the gravitational vector
    dist = Math.sqrt(dx*dx+dy*dy);
    if(dist < planet.radius) {
	makeExplosion(player.x,player.y);
	killPlayer();
    }
    gx = dx * planet.mass / dist;
    gy = dy * planet.mass / dist;
    vx += gx;
    vy += gy;
    // Correct heading
    player.r = Math.atan2(vy,vx);
}

function runPlayer() {
    if(deadTimeout > 0) {
	deadTimeout -=1;
	if(deadTimeout <= 0) {
	    mode = MODE_TITLE;
	}
	return;
    }
    laserLen = 1000;
    player.x += player.speed*Math.cos(player.r);
    player.y += player.speed*Math.sin(player.r);
    if(laser) {
	// Look for enemies near the beam
	var i;
	var closestDist = 1000;
	var closest = -1;
	for(i=0;i<enemies.length;i++) {
	    dx = enemies[i].x - player.x;
	    dy = enemies[i].y - player.y;
	    lx = Math.cos(player.r);
	    ly = Math.sin(player.r);
	    dist = dx*dx+dy*dy;
	    cp = dx*lx+dy*ly;
	    linedist = dist-cp*cp;
	    if(linedist < enemies[i].radius*enemies[i].radius && cp > 0 && cp < closestDist) {
		closestDist = cp;
		closest = i;
	    }
	}
	if (closest>-1) {
	    enemies[closest].health -= 10;
	    makeExplosion(enemies[closest].x, enemies[closest].y);
	    laserLen = closestDist;
	}
    }

    runOrbit();
}

function updateStar()
{
    // This makes 'planet' point to nearest entry in the starmap. It doesn't need to
    // be run every cycle - 1/100 or something would be fine.
    var closestDistsq;
    var closest = 0;
    var i;
    for(i=0;i<starMap.length;i++) {
	dx = starMap[i].x - player.x;
	dy = starMap[i].y - player.y;
	distsq = dx*dx+dy*dy;
	if(i==0 || distsq < closestDistsq) {
	    closestDistsq = distsq;
	    closest = i;
	}
    }
    planet = starMap[closest];
    console.log("At "+player.x+","+player.y+", closest planet is "+planet.name+", "+Math.sqrt(closestDistsq)+" miles away");
}

function drawRepeat() {
    if(mode != MODE_TITLE) {
	processKeys();
	runPlayer();
	runEnemies();
	runExplosions();
	frameCounter += 1;
	if(frameCounter % 128 == 0) {
	    updateStar();
	}
	if(frameCounter % 64 == 0) {
	    purge();
	}
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