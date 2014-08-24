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
var explodePoly = [
    [16.000000,0.000000],
    [7.391036,3.061467],
    [11.313708,11.313708],
    [3.061467,7.391036],
    [0.000000,16.000000],
    [-3.061467,7.391036],
    [-11.313708,11.313708],
    [-7.391036,3.061467],
    [-16.000000,0.000000],
    [-7.391036,-3.061467],
    [-11.313708,-11.313708],
    [-3.061467,-7.391036],
    [-0.000000,-16.000000],
    [3.061467,-7.391036],
    [11.313708,-11.313708],
    [7.391036,-3.061467] ];
var enemyAccel = 0.01;
var enemyDecel = 0.05;
characterWidth = 6;
var shotEvadeChance = 0.80;
var degreesToRadians = Math.PI/180;
var radarx = 480+80;
var radary = 240;
var orbitCounter = 0;

var commodities = [ "Silicon", "Tungsten", "Iron", "Helium", "Energy" ];

function Planet(name, x, y, mass, radius)
{
    this.name = name; this.x = x; this.y = y; this.mass = mass;
    this.radius = radius;
    this.prices = new Array();
    for(var i=0;i<commodities.length;i++) {
	this.prices[i] = Math.random()*16+64;
    }
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
    this.laser = false;
    this.laserLen = 0;
    this.laserCoolDown = false;
}


function drawChar(context, c, x, y) 
{
    c = c.charCodeAt(0);
    if(c > 0) {
        context.drawImage(bitfont, c*6, 0, 6,8, x, y, characterWidth, 8);
    }
}

function drawString(context, string, x, y) {
    string = string.toUpperCase();
    for(i = 0; i < string.length; i++) {
	drawChar(context, string[i], x, y);
	x += characterWidth;
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
    enemies = new Array();
    var i;
    laser = false;
    laserCoolDown = 0;
    frameCounter = 0;
    deadTimeout = 0;

    planet = starMap[0];

    // Start the player in orbit around the planet
    player = { x: planet.x, y: planet.y-planet.radius-32, r: 0, speed: 3, shields: 100, radius: 8 };

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

function scalePoly(original, factor)
{
    var newPoly = new Array();
    var i;
    for(i=0;i<original.length;i++) {
	ox = original[i][0];
	oy = original[i][1];
	newPoly.push( [ox*factor, oy*factor]);
    }
    return newPoly;
}

function drawExplosions()
{
    for(i=0;i<explosions.length;i++) {
	var e = explosions[i]
	if(e.timeout <= 0) continue;
	var rotExplodePoly = scalePoly(rotatePoly(explodePoly, e.timeout * Math.PI/32), 16.0/(e.timeout+16));
	drawPoly(rotExplodePoly, cx - player.x + e.x, cy - player.y + e.y);
    }
}

function drawPlanet()
{
    var dx = planet.x - player.x;
    var dy = planet.y - player.y;
    if(Math.abs(dx) > cx+planet.radius || Math.abs(dy) > cy+planet.radius) {
	// It's off screen...
	var planetDir = Math.atan2(dy, dx);
	var r1 = cx-32;
	var r2 = cx-16;
	ctx.beginPath();
	ctx.moveTo(cx + r1*Math.cos(planetDir), cy+r1*Math.sin(planetDir));
	ctx.lineTo(cx + r2*Math.cos(planetDir), cy+r2*Math.sin(planetDir));
	ctx.stroke();
	return;
    }
    ctx.strokeStyle = "#ffffff";
    ctx.beginPath();
    ctx.arc(cx + dx, cy + dy, planet.radius, 0, 2*Math.PI);
    ctx.stroke();
    textSize = planet.name.length * characterWidth;
    drawString(ctx, planet.name, cx - player.x + planet.x - textSize/2, cy - player.y + planet.y - 4);
}

function drawLaser(sx, sy, dir, len)
{
    ctx.strokeStyle = "#ff0000";
    ctx.beginPath();
    ctx.moveTo(sx, sy);
    ctx.lineTo(sx+len*Math.cos(dir), sy+len*Math.sin(dir));
    ctx.stroke();
}


function drawPlayer()
{
    drawPoly(rotatePoly(shipPoly, player.r), cx, cy);
    if(laser) {
	drawLaser(cx,cy, player.r, laserLen);
	laserCoolDown = 16;
    }
    if(laserCoolDown>0) laserCoolDown -=1;

}

function drawEnemy(e)
{
    drawPoly(rotatePoly(enemyPoly, e.r), cx - player.x + e.x, cy - player.y + e.y);
    if(e.laser) {
	drawLaser(e.x - player.x + cx, e.y - player.y + cy, e.r, e.laserLen);
    }
}

function drawStatusBar()
{
    ctx.fillStyle = "#000000";
    ctx.fillRect(480, 0, 640-480, SCREENHEIGHT);
    drawString(ctx, "Shield: "+player.shields, 480+8, 8);
    drawString(ctx, "Speed: "+player.speed, 480+8, 8+16);
    drawString(ctx, "Orbit: "+orbitCounter, 480+8, 8+32);
    ctx.beginPath();
    var radarSize = 64;
    ctx.arc(radarx, radary, radarSize, 0, 2*Math.PI);
    ctx.moveTo(radarx-8, radary);
    ctx.lineTo(radarx+8, radary);
    ctx.moveTo(radarx, radary-8);
    ctx.lineTo(radarx, radary+8);
    ctx.stroke();
    var i;
    var radarScale = 0.1;
    for(i=0;i<enemies.length;i++) {
	if(enemies.health <= 0) continue;
	var e = enemies[i];
	ctx.beginPath();
	dx = (e.x - player.x)*radarScale;
	dy = (e.y - player.y)*radarScale;
	if(dx > radarSize || dx <-radarSize || dy > radarSize || dy <-radarSize) continue;
	if(dx*dx+dy*dy > radarSize*radarSize) continue;
	ctx.arc(dx+radarx,dy+radary, 4, 0, 2*Math.PI);
	ctx.stroke();
    }
}

function drawTradingScreen()
{
    drawString(ctx, "Welcome to "+planet.name+" trading station", 64, 64);
    var i;
    tradeHighlight = 0;
    for(var i=0;i<commodities.lengthy;i++) {
	drawString(ctx, commodities[i] + ": " + planet.price[i], 64, 128+8*i);
    }
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
    if(orbitCounter > 120) {
	drawTradingScreen();
    }
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
	target = Math.sin(dd);
	distsq = dx*dx+dy*dy;
	if(Math.abs(target) < 10*degreesToRadians && distsq<256*256) {
	    e.laser = (e.laserCoolDown <= 0);
	}
	e.r += 0.05*sgn(target);

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

	if (e.laser) {
	    e.laserCoolDown = 30;
	    var result = findClosestApproach(e.x, e.y, e.r, [player]);
	    var closest = result[0];
	    var closestDist = result[1];
	    if (closest>-1) {
		if(Math.random() < shotEvadeChance) {
		    player.shields -= 10;
		    if(player.shields < 0) killPlayer();
		    makeExplosion (player.x, player.y);
		    e.laserLen = closestDist;
		}
	    }
	}
	if (e.laserCoolDown > 0) {
	    e.laserCoolDown -= 1;
	}
    }
}

function killPlayer()
{
    if(deadTimeout == 0) deadTimeout = 32;
}

function runOrbit() {
    dx = planet.x - player.x;
    dy = planet.y - player.y;
    // If we're a long way out of orbit, don't pull the ship.
    distsq = dx*dx+dy*dy;
    if(distsq > planet.radius*planet.radius*25) return;
    // Gravity applies a force which will skew the direction of the ship
    // So, original vector:
    vx = player.speed*Math.cos(player.r);
    vy = player.speed*Math.sin(player.r);
    // Now add on the gravitational vector
    dist = Math.sqrt(distsq);
    if(dist < planet.radius) {
	makeExplosion(player.x,player.y);
	killPlayer();
    }

    // If we're just a little bit outside the radius, start the orbit counter.
    if(dist < (planet.radius+32)) {
	orbitCounter +=1;
    }
    else
    {
	orbitCounter = 0;
    }

    gx = dx * planet.mass / dist;
    gy = dy * planet.mass / dist;
    vx += gx;
    vy += gy;
    // Correct heading
    player.r = Math.atan2(vy,vx);
}

function closestApproach(direction, dx, dy)
{
    lx = Math.cos(direction);
    ly = Math.sin(direction);
    return dx*lx+dy*ly;
}

function findClosestApproach(startx, starty, direction, thingList)
{
    var closestIndex = -1;
    var closestDist = 1000;
    for(i=0;i<thingList.length;i++) {
	dx = thingList[i].x - startx;
	dy = thingList[i].y - starty;
	dist = dx*dx+dy*dy;
	cp = closestApproach(direction, dx, dy);
	linedist = dist-cp*cp;
	if(linedist < thingList[i].radius*thingList[i].radius && cp > 0 && cp < closestDist) {
	    closestDist = cp;
	    closestIndex = i;
	}
    }
    return [closestIndex, closestDist];
}

function spawnEnemies()
{
    if(enemies.length < 10) {
	var r = Math.random()*Math.PI;
	var dist = 512+Math.random()*1024;
	for(i=0;i<5;i++)
	{
	    newX = player.x + Math.cos(r)*dist;
	    newY = player.y + Math.sin(r)*dist;
	    enemies.push ( new Enemy(newX + (i%3) * 64, newY + (i/3) * 64));
	}
    }

}

function runPlayer() {
    if(deadTimeout > 0) {
	console.log( "Deadtimeout="+deadTimeout);
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
	var result = findClosestApproach(player.x, player.y, player.r, enemies);
	var closest = result[0];
	var closestDist = result[1];
	if (closest>-1) {
	    enemies[closest].health -= 10;
	    makeExplosion(enemies[closest].x, enemies[closest].y);
	    laserLen = closestDist;
	}
    }
    if(frameCounter % 32 == 0 && player.shields < 100) player.shields += 1;
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
	    spawnEnemies();
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