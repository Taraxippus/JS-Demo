var canvas, context, levelEditorDiv, menuDiv;
var scale, ratio;
var canvasTop, canvasLeft;
var scrollX = 0, lastScrollX = 0, scrollY = 0, lastScrollY = 0;
var player, ghost, ghostPlayer, background = [], boxes = [], ghostBoxes = [], dynamicBoxes = [], ghostDynamicBoxes = [],
dynamicGameobjects = [], ghostDynamicGameobjects = [], triggerListeners = [], playableBoxes = [],
lights = [], particles, zones = [], levels = [];
var score = 0, maxScore = 0, deaths = 0, totalScore = 0, referenceScore = 0, scoreTime = 0;
var startX = 0, startY = 0.75, finishX = 0.5, finishY = 0.05;
var levelIndex = 0;
var playerZone;

var gravity = -9.81;
var timeFactor = 1;
var playerSwitchDistance = 0.25;

var lastZoom = zoom = initialZoom = 1.25;
var scrollSmoothnessX = 0.2, scrollSmoothnessY = 0.0;
var bloom = 0.01, particleBloom = true;
var scaleFactor = 1;
var drawParticles = false;
var drawLights = true;
var whiteUI = true;
var drawVignette = false;
var displayFPS = false;

var timestep = 1000 / 60.0, maxTimestep = 1000 / 120.0;
var delta = 0, lastTimestamp = 0, ghostLevelTime = 0, levelTimeGhost = 0, levelTime = 0, lifeTime = 0, animationTime = 0;
var fps = 0, frames = 0, fpsTimer = 0;

var jump = false, up = false, down = false, left = false, right = false, switchPlayer = false;
var timeSinceInput = 0;
var stripePattern, stripePatternWidth, vignetteGradient;

var activeGhost = null;
var activeGhostIndex;
var activeGhostCompressionNumber;
var activeGhostLength;
var ghostInput; 
var ghostIndex = 0;
var ghostCompressionNumber = 0;
var ghostCompressionJump = false, ghostCompressionLeft = false, ghostCompressionRight = false, ghostCompressionSwitchPlayer = false;

var allowLevelEditor = false;
var levelEditor = false, liveEditor = false, levelName = "level", levelTitle = "", levelMessage = "", paramLevel = false;
var levelEditorSelection = null, levelEditorDrag = false, levelEditorScaleDrag = false, levelEditorDragX, levelEditorDragY, editorX = 0, editorY = 0;
var textInputFocus = false;

var lastLevelTransitionTimer = levelTransitionTimer = 0, showScore = false, hasShownScore = false
var levelTransitionDuration = 2;
var TransitionType = 
{
	TITLE: 0,
	LEVEL: 1,
	CREDITS: 2
};	
var transitionType = TransitionType.TITLE;

var lastDiscoveredTimer = discoveredTimer = 0, discoveredDuration = 0.5;
var pause = false, hasDrawnPause = false;

var savedData;

function onLoadMinigame()
{
	ghostInput = new Uint8Array(64);

	vectorPool = new Array((vectorPoolIndex = 800) + 1);
	for (var i = 0; i <= vectorPoolIndex; ++i)
		vectorPool[i] = new Vector();
	
	particles = new Array(128);
	for (var i = 0; i < particles.length; ++i)
		particles[i] = new Particle();

	try
	{
		savedData = JSON.parse(getCookie("savedData"));
		//savedData.levelIndex = 0;
		
		var param = window.location.href.substring(window.location.href.indexOf("#") + 1);
		if (param.startsWith("levels.push("))
		{
			eval(decodeURIComponent(param));
			savedData.levelIndex = levels.length - 1;
			paramLevel = true;
		}
	}
	catch (e) {}
	
	if (!savedData || !savedData.scores)
		savedData = { scores: [], levelIndex: 0 };
		
	if (levels.length == 0)
	{
		levels.push(
		{
			title: "No Levels Loaded",
			message: "What have you done?",
			startX: 0,
			startY: 0.5,
			finishX: 0,
			finishY: 0,
			playerSwitchDistance: 0.25,
			scrollSmoothnessX: 0.2,
			scrollSmoothnessY: 0,
			initialZoom: 1.25,
			whiteUI: true,
			referenceScore: 1.0,
			
			load: function() { new Box(- 0.075 * 0.5, 0.5 - 0.075 * 0.5, 0.075, 0.075, 1).makePlayable(); }
		});
	}
	canvas = document.getElementById("minigameCanvas");

	levelEditorDiv = document.getElementById("levelEditor");
	menuDiv = document.getElementById("menu");
	context = canvas.getContext("2d");
	
	canvas.addEventListener("mousedown", onMouseDown, true);
	canvas.addEventListener("mousemove", onMouseMove, true);
	canvas.addEventListener("mouseup", onMouseUp, true);
	canvas.addEventListener("mouseout", onMouseUp, true);
	canvas.addEventListener("wheel", onMouseWheel, true);
	canvas.addEventListener("touchstart", onTouchDown, true);
	canvas.addEventListener("touchmove", onTouchMove, true);
	canvas.addEventListener("touchend", onTouchUp, true);
	canvas.addEventListener("touchcancel", onTouchUp, true);
	window.addEventListener("resize", onResize, true);
	window.addEventListener("keydown", onKeyDown, true);
	window.addEventListener("keyup", onKeyUp, true);
	
	allowLevelEditor = getCookie("allowLevelEditor") == "true";
	document.getElementById('levelEditorMessage').style.display = allowLevelEditor ? 'inline-block' : 'none';
	syncCheckBox('drawVignette', this, 'drawVignette');
	syncCheckBox('drawLights', this, 'drawLights');
	syncCheckBox('drawParticles', this, 'drawParticles');
	syncCheckBox('drawBloom', this, 'bloom', 0.01, 0);
	syncCheckBox('scale', this, 'scaleFactor', 0.5, 1);
	syncCheckBox('fps', this, 'displayFPS');

	levelName = "level" + (levels.length + 1);
	levelTitle = "Level " + (levels.length + 1);
	
	onResize();
	loadLevel(savedData.levelIndex);
	lastLevelTransitionTimer = levelTransitionTimer = 1.5;
	levelTime = -levelTransitionDuration * 0.75;

	for (var i = 0; i < particles.length; ++i)
	{
		particles[i].spawn();
		particles[i].lifeTime = particles[i].maxLifeTime * Math.random();
	}
	
	requestAnimationFrame(loop);
}

function syncCheckBox(id, object, attribute, valTrue, valFalse)
{
	if (valTrue == undefined)
		valTrue = true;
	if (valFalse == undefined)
		valFalse = false;
	
	var box = document.getElementById(id);
	var checked = getCookie("settings." + id);
	if (checked == '')
		checked = object[attribute] == valTrue;
	else
		object[attribute] = checked == 'true' ? valTrue : valFalse;

	// I hate javascript and it's unclear type system
	box.checked = checked == 'true';
	box.onchange = function()
	{
		object[attribute] = box.checked ? valTrue : valFalse;
		
		setCookie("settings." + id, box.checked, 365);
		onResize();
	}
}

function togglePause()
{
	pause = !pause;
	menuDiv.style.display = pause ? 'block' : 'none';
	menuDiv.style.marginTop = "-" + menuDiv.clientHeight / 2 + "px";
	hasDrawnPause = false;
}

function exit()
{
	// This minigame used to be part of a larger php project

	//document.getElementById(levelIndex >= 4 ? 'minigameFormKey' : 'minigameForm').submit();
	location.href = "https://github.com/Taraxippus/taraxippus.github.io";
}

function loadLevel(levelIndex1)
{
	levelIndex = levelIndex1;
	var level = levels[levelIndex];
	
	if (!level)
	{
		levelIndex = 0;
		level = levels[levelIndex];
	}
	
	if (boxes.length > 0)
	{
		for (var i = 0; i < lights.length; ++i)
			for (var i1 = 0; i1 < lights[i].lightPathLength; ++i1)
				releaseVector(lights[i].lightPath[i1]);

		background = [];
		boxes = [];
		ghostBoxes = [];
		dynamicBoxes = [];
		ghostDynamicBoxes = [];
		playableBoxes = [];
		triggerListeners = [];
		lights = [];
		dynamicGameobjects = [];
		ghostDynamicGameobjects = [];
		zones = [];
		activeGhost = null;
		activeGhostLength = -1;
		player = ghost = null;
	}
	
	jump = up = down = left = right = switchPlayer = false;

	levelTime = 0;
	animationTime = 0;
	levelTitle = level.title;
	levelMessage = level.message;
	startX = level.startX;
	startY = level.startY;
	finishX = level.finishX;
	finishY = level.finishY;
	playerSwitchDistance = level.playerSwitchDistance;
	scrollSmoothnessX = level.scrollSmoothnessX;
	scrollSmoothnessY = level.scrollSmoothnessY;
	zoom = inititalZoom = level.initialZoom;
	whiteUI = level.whiteUI;
	referenceScore = level.referenceScore;
	
	maxScore = 0;
	level.load();
	
	score = 0; 
	deaths = 0;
	
	reset(true);
	onResize();
	sortLevel();
}

function sortLevel()
{
	boxes.sort(compareBoxes);
	ghostBoxes.sort(compareBoxes);
	dynamicBoxes.sort(compareBoxes);
	ghostDynamicBoxes.sort(compareBoxes);
	playableBoxes.sort(compareBoxes);
	
	lights.sort(compareLights);
}

function compareBoxes(a, b)
{
	if (a == b)
		return 0;
			
	else if (a.isGhost && !b.isGhost)
		return -1;
	
	else if (b.isGhost && !a.isGhost)
		return 1;
		
	return b.mass - a.mass;
}

function compareLights(a, b)
{
	return a.a == b.a ? a.radius - b.radius : a.a - b.a;
}

function reset(start)
{
	for (var i = 0; i < playableBoxes.length; ++i)
	{
		playableBoxes[i].lastX = playableBoxes[i].x = playableBoxes[i].ghost.ghostX;
		playableBoxes[i].lastY = playableBoxes[i].y = playableBoxes[i].ghost.ghostY;
		playableBoxes[i].velX = playableBoxes[i].velY = 0;
	}
	
	if (start)
	{
		if (!levelEditor)
		{
			lastScrollX = scrollX = -0.5 * ratio;
			lastScrollY = scrollY = 1 - zoom;
		}
		
		ghostPlayer = player = playableBoxes[0];
		ghost = player.ghost;
	}
	else
	{
		deaths++;

		recordGhost();

		if (activeGhost == null)
			activeGhost = new Uint8Array(512);

		for (var i = 0; i < ghostIndex; ++i)
			activeGhost[i] = ghostInput[i];
		
		activeGhostLength = ghostIndex;
		
		if ((activeGhost[0] & (1 << 7)) != 0)
		{
			activeGhostIndex = 0;
			activeGhost[1]--;
		}
		else
			activeGhostIndex = 1;
		
		for (var i = 0; i < ghostDynamicBoxes.length; ++i)
			ghostDynamicBoxes[i].ghostReset();
		
		for (var i = 0; i < ghostDynamicGameobjects.length; ++i)
			ghostDynamicGameobjects[i].ghostReset();
		
		ghost = ghostPlayer.ghost;
		ghostPlayer = player;
		
		for (var i = 0; i < lights.length; ++i)
			if (lights[i].x + lights[i].radius > scrollX && lights[i].x - lights[i].radius < scrollX + ratio)
				lights[i].needsUpdate = true;
	}
	
	ghostIndex = 0;
	ghostCompressionNumber = 0;
	ghostCompressionJump = false;
	ghostCompressionLeft = false;
	ghostCompressionRight = false;
	
	discoveredTimer = lastDiscoveredTimer = 0;
	lifeTime = 0;
	levelTimeGhost = ghostLevelTime;
	ghostLevelTime = levelTime;
}

function calculateScore()
{
	for (var i = 0; i < boxes.length; ++i)
		if (boxes[i] instanceof Triangle && boxes[i].isCollected)
			score++;
	
	scoreTime = levelTime;
	totalScore = Math.max(0, Math.ceil((referenceScore + score * 10 - deaths * 5 - scoreTime) * 10));
}

function saveData()
{
	if ((savedData.scores[levelIndex] == undefined || savedData.scores[levelIndex] < totalScore) && (!paramLevel || levelIndex != levels.length))
		savedData.scores[levelIndex] = totalScore;
	
	savedData.levelIndex = levelIndex + 1;
	
	setCookie("savedData", JSON.stringify(savedData), 365);
}

function onResize()
{	
	if (canvas.width != window.innerWidth * scaleFactor || canvas.height != window.innerHeight * scaleFactor)
	{
		canvas.width = window.innerWidth * scaleFactor;
		canvas.height = window.innerHeight * scaleFactor;
		
		canvas.style.width = window.innerWidth + "px";
		canvas.style.height = window.innerHeight + "px";
	}
	
	var lastRatio = ratio;
	zoom = Math.min(Math.max(zoom, 0.2), 5);
	
	scale = canvas.height / zoom;
	ratio = canvas.width / scale;
	
	lastScrollX = scrollX = scrollX + (lastRatio - ratio) * 0.5
	lastScrollY = scrollY = scrollY + (lastZoom - zoom) * 0.5;
	
	for (var i = 0; i < lights.length; ++i)
		if (lights[i].x + lights[i].radius > scrollX && lights[i].x - lights[i].radius < scrollX + ratio)
			lights[i].needsUpdate = true;
	
	var rect = canvas.getBoundingClientRect();
	canvasTop = rect.top;
	canvasLeft = rect.left;
	lastZoom = zoom;
	
	drawStripePattern();
	
	for (var i = 0; i < dynamicGameobjects.length; ++i)
		if (dynamicGameobjects[i].preDraw)
			dynamicGameobjects[i].preDraw();
	
	vignetteGradient = context.createRadialGradient(canvas.width * 0.5, canvas.height * 0.5, Math.max(canvas.width, canvas.height) * 0.4, canvas.width * 0.5, canvas.height * 0.5,  Math.max(canvas.width, canvas.height) * 0.6);
	vignetteGradient.addColorStop(0, "rgba(0, 68, 136, 0)");
	vignetteGradient.addColorStop(1, "rgba(0, 0, 0, 0.4)");
	
	if (levelTransitionTimer <= 0)
	{
		context.font = "bold " + Math.floor(canvas.height / 1.25 * 0.05) + "px Arial";
		context.textAlign = "left";
		context.lineWidth = scale * 0.004;
	}
	
	if (pause)
	{
		pause = false;
		
		draw(1);
		
		hasDrawnPause = false;
		pause = true;
		
		draw(1);
	}
}

function drawStripePattern()
{
	var offscreenCanvas = document.createElement("canvas");
	var size = Math.max(2, Math.round(scale * 0.025 / 2) * 2);

	offscreenCanvas.width = size;
	offscreenCanvas.height = size;
	var offscreenContext = offscreenCanvas.getContext("2d");

	offscreenContext.clearRect(0, 0, size, size);
	offscreenContext.fillStyle = "#0088BB";
	offscreenContext.beginPath();
	
	offscreenContext.moveTo(0, 0); 
	offscreenContext.lineTo(size * 0.5, 0); 
	offscreenContext.lineTo(0, size * 0.5); 
	offscreenContext.closePath();

	offscreenContext.moveTo(0, size); 
	offscreenContext.lineTo(size, 0); 
	offscreenContext.lineTo(size, size * 0.5); 
	offscreenContext.lineTo(size * 0.5, size); 
	offscreenContext.closePath();
	
	offscreenContext.fill();
	stripePattern = context.createPattern(offscreenCanvas, "repeat");
	stripePatternWidth = size / scale;
}

function loop(timestamp) 
{
    // if (timestamp < lastTimestamp + maxTimestep)
	// {
        // requestAnimationFrame(loop);
        // return;
    // }
	
	if (lastTimestamp == 0)
		lastTimestamp = timestamp - timestep * 2;

	if (!pause)
	{
		delta += (timestamp - lastTimestamp) * timeFactor;
		fpsTimer += (timestamp - lastTimestamp);
		
		frames++;
		
		if (fpsTimer >= 1000)
		{
			fpsTimer -= 1000;
			fps = frames;
			frames = 0;
		}
		
		var updates = 0;
		while (delta >= timestep)
		{
			update(timestep / 1000);
			delta -= timestep;
			if ((!levelEditor || liveEditor) && !showScore)
			{
				levelTime += timestep / 1000;
				lifeTime += timestep / 1000;
			}
			
			animationTime += timestep / 1000;

			if (++updates >= 120)
			{
				delta = 0;
				break;
			}
		}
		
		animationTime += delta / 1000;
	}

    draw(delta / timestep);
	
	lastTimestamp = timestamp;
    requestAnimationFrame(loop);
}

function update(timestep)
{		
	if (levelTransitionTimer > 0)
	{
		lastScrollX = scrollX;
		lastScrollY = scrollY;
		
		lastLevelTransitionTimer = levelTransitionTimer;
		
		if (!showScore)
			levelTransitionTimer -= timestep / levelTransitionDuration;
		
		if (transitionType != TransitionType.TITLE && levelTransitionTimer < 0.75 && lastLevelTransitionTimer > 0.75)
		{
			showScore = true;	
			hasShownScore = true;
			levelTransitionTimer = 0.75;
		}		
		else if (transitionType != TransitionType.TITLE && hasShownScore && levelTransitionTimer < 0.75)
		{
			saveData();
			loadLevel(++levelIndex);
			hasShownScore = false;
		}
		
		if (levelTransitionTimer > 0.75 && transitionType != TransitionType.TITLE)
		{
			player.lastX = player.x;
			player.lastY = player.y;
			
			player.x = lerp(player.x + player.width * 0.5, finishX, 0.075) - player.width * 0.5;
			player.y = lerp(player.y + player.height * 0.5, finishY, 0.075) - player.height * 0.5;
		}
		
		if (levelTransitionTimer > 0.25)
		{
			for (var i = 0; drawParticles && i < particles.length; ++i)
				particles[i].update(timestep);
	
			return;
		}
	}

	if (discoveredTimer > 0)
	{
		lastDiscoveredTimer = discoveredTimer;
		discoveredTimer -= timestep / discoveredDuration;
		switchPlayer = false;
	}
	
	if (levelEditor && !liveEditor)
	{
		lastScrollX = scrollX;
		lastScrollY = scrollY;
		
		if (right)
			scrollX += 0.05 * zoom;
		if (left)           
			scrollX -= 0.05 * zoom;
		                    
		if (up)             
			scrollY += 0.05 * zoom;
		if (down)           
			scrollY -= 0.05 * zoom;
		
		return;
	}

	var gravity = getGravity(player.x + player.width * 0.5, false);
	jump = gravity > 0 ? down : gravity < 0 ? up : 0;

	if (ghostCompressionLeft != left || ghostCompressionRight != right || ghostCompressionJump != jump || ghostCompressionSwitchPlayer != switchPlayer || ghostCompressionNumber == 255)
		recordGhost();
	
	else
		ghostCompressionNumber++;
	
	if (activeGhost != null && activeGhostIndex < activeGhostLength)	
		simulateGhost(timestep);
	
	if (switchPlayer)
	{
		var dist, minDist = Infinity;
		var candidate = null;
		for (var i = 0; i < playableBoxes.length; ++i)
			if (playableBoxes[i] != player)
			{
				dist = squaredDistance(player.x + player.width * 0.5, player.y + player.height * 0.5, playableBoxes[i].x + playableBoxes[i].width * 0.5, playableBoxes[i].y + playableBoxes[i].height * 0.5);
				if (dist < minDist)
				{
					minDist = dist;
					candidate = playableBoxes[i];
				}
			}
			
		if (minDist < playerSwitchDistance * playerSwitchDistance)
			player = candidate;
	}
	
	if (jump && (gravity > 0 ? player.collisionTop : player.collisionBottom))
		player.velY -= 3 * sign(gravity);
	
	jump = switchPlayer = up = down = false;

	if (left)
		player.velX -= 5 * timestep;
	if (right)
		player.velX += 5 * timestep;
			
	for (var i = 0; drawParticles && i < particles.length; ++i)
		particles[i].update(timestep);

	// var dist, distLeft = Infinity, distRight = -Infinity;
	var playerX = player.x + player.width * 0.5;
	
	for (var i = 0; i < dynamicBoxes.length; ++i)
	{
		// if (dynamicBoxes[i] instanceof Box)
		// {
			// dist = dynamicBoxes[i].x + dynamicBoxes[i].width * 0.5 - playerX;
			// if (dist > 0 && dist < ratio * 0.4 && dist > distRight)
				// distRight = dist;
			// else if (dist < 0 && dist > -ratio * 0.4 && dist < distLeft)
				// distLeft = dist;
		// }
		
		dynamicBoxes[i].update(timestep);
	}
	
	playerX = player.x + player.width * 0.5;
	
	for (var i = 0; i < dynamicGameobjects.length; ++i)
	{
		// dist = dynamicGameobjects[i].x + (dynamicGameobjects[i] instanceof Trigger ? dynamicGameobjects[i].width * 0.5 : 0) - playerX;
		// if (dist > 0 && dist < ratio * 0.4 && dist > distRight)
			// distRight = dist;
		// else if (dist < 0 && dist > -ratio * 0.4 && dist < distLeft)
			// distLeft = dist;
		
		dynamicGameobjects[i].update(timestep);
	}
	
	// dist = finishX - playerX;
	// if (dist > 0 && dist < ratio * 0.4 && dist > distRight)
		// distRight = dist;
	// else if (dist < 0 && dist > -ratio * 0.4 && dist < distLeft)
		// distLeft = dist;
		
	if (!left && !right)
		timeSinceInput += timestep;
	else
		timeSinceInput = 0;
		
	playerZone = getZone(playerX);

	lastScrollX = scrollX;
	lastScrollY = scrollY;
	
		// else if (timeSinceInput > 0)
	// {
		// if (player.velX <= 0.005 && player.velX >= 0 && distRight > 0 && distRight < ratio * 0.4)
			// scrollX = lerp(scrollX, playerX + distRight - ratio * 0.5, scrollSmoothnessX * 0.25);

		// else if (player.velX >= -0.005 && player.velX < 0 && distLeft < 0 && distLeft > -ratio * 0.4)
			// scrollX = lerp(scrollX, playerX + distLeft - ratio * 0.5, scrollSmoothnessX * 0.25);
	// }
	
	if (playerX - scrollX > ratio * 0.75)
		scrollX = lerp(scrollX, playerX - ratio * 0.75, scrollSmoothnessX);
	else if (playerX - scrollX < ratio * 0.25)
		scrollX = lerp(scrollX, playerX - ratio * 0.25, scrollSmoothnessX);
	else if (timeSinceInput > 1)
			scrollX = lerp(scrollX, playerX - ratio * 0.5, scrollSmoothnessX * 0.1);

	if (player.y + player.height - scrollY > zoom * 0.6)
		scrollY = Math.min(0.5, lerp(scrollY, player.y + player.height - 0.6 * zoom, scrollSmoothnessY));
	else if (player.y - scrollY < zoom * 0.25)
		scrollY = Math.max(-0.5, lerp(scrollY, player.y - 0.25 * zoom, scrollSmoothnessY));
	else if (timeSinceInput > 1)
		scrollY = Math.min(0.5, Math.max(-0.5, lerp(scrollY, player.y + player.width * 0.5 - zoom * 0.5, scrollSmoothnessY * 0.1)));
		
	if (player.y < -1 || player.y + player.width > 3 || discoveredTimer < 0 && lastDiscoveredTimer > 0)
		reset(false);
	
	else if (squaredDistance(player.x + player.width * 0.5, player.y + player.height * 0.5, finishX + 0.0375, finishY + 0.0375) < 0.075 * 0.075)
	{
		calculateScore();
		lastLevelTransitionTimer = levelTransitionTimer = 1;
		transitionType = levelIndex == levels.length - 1 ? TransitionType.CREDITS : TransitionType.LEVEL;
		if (levelIndex == levels.length - 1)
		{
			allowLevelEditor = true;
			setCookie("allowLevelEditor", "true", 365);
			document.getElementById('levelEditorMessage').style.display = 'inline-block';
		}
	}
}

function recordGhost()
{
	if (ghostCompressionNumber > 0)
	{
		ghostInput[ghostIndex++] = ghostCompressionLeft | ghostCompressionRight << 1 | ghostCompressionJump << 2 | ghostCompressionSwitchPlayer << 3 | 1 << 7;
		ghostInput[ghostIndex++] = ghostCompressionNumber;
	}
	else
		ghostInput[ghostIndex++] = ghostCompressionLeft | ghostCompressionRight << 1 | ghostCompressionJump << 2 | ghostCompressionSwitchPlayer << 3;
	
	ghostCompressionLeft = left;
	ghostCompressionRight = right;
	ghostCompressionJump = jump;
	ghostCompressionSwitchPlayer = switchPlayer;
	ghostCompressionNumber = 0;
}

function simulateGhost(timestep)
{
	var b = activeGhost[activeGhostIndex];
	var ghostJump = (4 & b) != 0, ghostLeft = (1 & b) != 0, ghostRight = (2 & b) != 0, ghostSwitchPlayer = (8 & b) != 0;
	
	if (activeGhostCompressionNumber > 0)
	{
		activeGhostCompressionNumber--;
		
		if (activeGhostCompressionNumber == 0)
			activeGhostIndex += 2;
	}
	else
	{
		if ((b & (1 << 7)) != 0)
			activeGhostCompressionNumber = activeGhost[activeGhostIndex + 1];
		
		else
			activeGhostIndex++;
	}		
	
	if (ghostSwitchPlayer)
	{
		var dist, minDist = Infinity;
		var candidate = null;
		for (var i = 0; i < playableBoxes.length; ++i)
			if (playableBoxes[i].ghost != ghost)
			{
				dist = squaredDistance(ghost.x + ghost.width * 0.5, ghost.y + ghost.height * 0.5, playableBoxes[i].ghost.x + playableBoxes[i].ghost.width * 0.5, playableBoxes[i].ghost.y + playableBoxes[i].ghost.height * 0.5);
				if (dist < minDist)
				{
					minDist = dist;
					candidate = playableBoxes[i].ghost;
				}
			}
			
		if (minDist < playerSwitchDistance * playerSwitchDistance)
			ghost = candidate;
	}
	
	var gravity = getGravity(ghost.x + ghost.width * 0.5, true);
	if (ghostJump && (gravity > 0 ? ghost.collisionTop : ghost.collisionBottom))
		ghost.velY -= 3 * sign(gravity);

	if (ghostLeft)
		ghost.velX -= 5 * timestep;
	if (ghostRight)
		ghost.velX += 5 * timestep;
	
	for (var i = 0; i < ghostDynamicBoxes.length; ++i)
		ghostDynamicBoxes[i].update(timestep);
		
	for (var i = 0; i < ghostDynamicGameobjects.length; ++i)
		ghostDynamicGameobjects[i].update(timestep);
	
	levelTimeGhost += timestep;
}

function draw(partial)
{	
	if (pause)
	{
		if (!hasDrawnPause)
		{
			hasDrawnPause = true;
			
			context.fillStyle = "rgba(0, 0, 0, 0.6)";
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			context.fillStyle = "#FFFFFF";
			context.shadowBlur = canvas.height * 0.05;
			context.shadowColor = "rgba(0, 0, 0, 0.5)";
			context.fillRect(canvas.height * 0.03, canvas.height * 0.03, canvas.height * 0.015, canvas.height * 0.05);
			context.fillRect(canvas.height * 0.03 + canvas.height * 0.025, canvas.height * 0.03, canvas.height * 0.015, canvas.height * 0.05);
			context.shadowBlur = 0;
		}
		
		return;
	}

	var x, y;
	var transitionTimer = lerp(lastLevelTransitionTimer, levelTransitionTimer, partial);

	if (transitionTimer > 0.75 || transitionTimer <  0.25)
	{
		context.fillStyle = "#004480";
		context.fillRect(0, 0, canvas.width, canvas.height);

		if (background.length > 0)
		{
			context.fillStyle = "#004C92";

			for (var i = 0; i < background.length; ++i)
				background[i].draw(partial);
		}
		
		if (drawParticles && particles.length > 0 && !levelEditor)
		{		
			if (bloom > 0 && particleBloom)
			{			
				context.shadowColor = "rgba(33, 109, 175, 0.5)";
				context.shadowBlur = bloom * scale;
			}
			
			context.fillStyle = "#0058a4";
			
			for (var i = 0; i < particles.length; ++i)
				particles[i].draw(partial);
			
			if (bloom > 0 && particleBloom)
				context.shadowBlur = 0;
		}
			
		context.strokeStyle = "#2266A2";
		context.setLineDash([scale * 0.05, scale * 0.025]);
		context.lineDashOffset = animationTime % 4 * 0.075 * 0.25 * scale;
		context.beginPath();

		for (var i = 0; i < zones.length - 1; ++i)
			zones[i].draw(partial);
		
		context.stroke();
					
		if (bloom > 0)
		{			
			context.shadowColor = "rgba(0, 0, 0, 0.5)";
			context.shadowBlur = bloom * scale;
		}
		
		context.setLineDash([scale * 0.025, scale * 0.005]);
		context.lineDashOffset = 0;
		
		for (var i = 0; i < dynamicGameobjects.length; ++i)
			if (!(dynamicGameobjects[i] instanceof Trigger))
				dynamicGameobjects[i].draw(partial);	
		
		context.fillStyle = stripePattern;
		x = getScreenX(animationTime % 1 * stripePatternWidth, partial), y = getScreenY(0, partial);
		context.translate(x, y);		
		for (var i = 0; i < dynamicGameobjects.length; ++i)
			if (dynamicGameobjects[i] instanceof Trigger)
				dynamicGameobjects[i].draw(partial);	
		context.translate(-x, -y);

		context.strokeStyle = "#2797BC";
		context.setLineDash([scale * 0.01, scale * 0.0025]);
		context.lineDashOffset = animationTime % 1 * 0.025 * scale;
		context.strokeRect(getScreenX(startX - 0.0375, partial), getScreenY(startY - 0.0375, partial), 0.075 * scale, -0.075 * scale);

		var size = (0.0625 + Math.sin(animationTime * 2) * 0.0125) * scale;
		var offset = (0.075 * scale - size) * 0.5;
		x = getScreenX(finishX - 0.0375, partial);
		y = getScreenY(finishY - 0.0375, partial);
		
		context.lineDashOffset = 0;
		// context.strokeStyle = "#FF8800";
		context.strokeRect(x + offset, y - offset, size, -size);
		size = (0.0625 + Math.sin(animationTime * 2 + Math.PI * 0.5) * 0.0125) * scale;
		offset = (0.075 * scale - size) * 0.5;
		context.strokeRect(x + offset, y - offset, size, -size);

		context.setLineDash([scale * 0.01, scale * 0.0025]);	
		context.lineDashOffset = animationTime % 1 * 0.025 * scale;
		context.fillStyle = "#FFFFFF";
		context.strokeStyle = "#FFC37F";

		if (bloom > 0)
			context.shadowColor = "rgba(255, 255, 255, 0.5)";
		
		if (bloom > 0)
			context.shadowColor = "rgba(255, 136, 255, 0.5)";			
		context.strokeStyle = "#FF8800";
			
		if (ghost != null)
			ghost.draw(partial);
		
		if (bloom > 0)
			context.shadowColor = "rgba(255, 255, 255, 0.5)";			
		context.strokeStyle = "#FFC37F";
				
		for (var i = 0; i < ghostBoxes.length; ++i)
			if (ghostBoxes[i] != ghost)
				ghostBoxes[i].draw(partial);
		
		if (bloom > 0)
			context.shadowColor = "rgba(255, 136, 0, 0.5)";			
		context.fillStyle = "#FF8800";
			
		if (player != null)			
			player.draw(partial);
		
		if (bloom > 0)
			context.shadowColor = "rgba(255, 255, 255, 0.5)";
				
		context.fillStyle = "#FFFFFF";
		
		for (var i = 0; i < boxes.length; ++i)
			if (boxes[i] != player)
				boxes[i].draw(partial);
					
		context.lineDashOffset = 0;
		if (bloom > 0)	
			context.shadowBlur = 0.0;	
		
		if (drawLights)
			for (var i = 0; i < lights.length; ++i)
				lights[i].draw(partial);
				
		if (drawVignette)
		{
			context.fillStyle = vignetteGradient;
			context.fillRect(0, 0, canvas.width, canvas.height);
		}
	
		context.fillStyle = levelEditor || whiteUI ? "#FFFFFF" : "#004488";
		
		if (bloom > 0)
		{			
			context.shadowColor = whiteUI ? "rgba(0, 0, 0, 0.5)" : "rgba(255, 255, 255, 0.5)";
			context.shadowBlur = bloom * canvas.height / 1.25;
		}
		
		y = transitionTimer > 0.75 ? 0.05 - (1 - transitionTimer) * 0.2 : 0.05;
		
		var ratio = canvas.width / canvas.height;
		
		context.fillText(levelTitle + " - " + levelMessage, y * 0.5 * canvas.height, y * canvas.height);

		if (!levelEditor || liveEditor)
		{				
			if (maxScore > 0)
			{
				context.fillText(score, canvas.width - 0.41 * canvas.height, y * canvas.height);
				context.beginPath();
				context.moveTo(canvas.width - (0.44 - 0.02 / triangleRatio) * canvas.height, (y + 0.005) * canvas.height); 
				context.lineTo(canvas.width - 0.44 * canvas.height, (y - 0.035) * canvas.height); 
				context.lineTo(canvas.width - (0.44 + 0.02 / triangleRatio) * canvas.height, (y + 0.005) * canvas.height); 
				context.closePath();
				context.fill();
			}
			
			context.fillText(deaths, canvas.width - 0.28 * canvas.height, y * canvas.height);	
			context.fillRect(canvas.width - 0.33 * canvas.height, (y - 0.035) * canvas.height, 0.04 * canvas.height, 0.04 * canvas.height);
			
			context.fillText(transitionTimer > 0.75 ? scoreTime.toFixed(1) : levelTime.toFixed(1), canvas.width - 0.15 * canvas.height, y * canvas.height);		
			context.beginPath();
			context.arc(canvas.width - 0.18 * canvas.height, (y - 0.015) * canvas.height, 0.02 * canvas.height, 0, Math.PI * 2);
			context.fill();
		}
		
		if (bloom > 0)	
			context.shadowBlur = 0.0;	
		
		if (discoveredTimer > 0)
		{
			var t = lerp(lastDiscoveredTimer, discoveredTimer, partial);
			context.fillStyle = "rgba(0, 68, 128, " + (1 - t) + ")";
			context.fillRect(0, 0, canvas.width, canvas.height);
		}
	}
	
	if (levelTransitionTimer > 0)
		drawLevelTransition(transitionTimer, partial);
		
	if (displayFPS)
	{
		context.fillStyle = "#FFFFFF";
		context.fillText(fps + " FPS ", 0.025 * canvas.height, 0.975 * canvas.height);
	}	
}

function drawLevelTransition(timer, partial)
{	
	if (timer >= 0.75 || levelTransitionTimer == 0.75)
	{
		if (transitionType == TransitionType.TITLE)
		{
			timer = (1.5 - timer) / 0.75;
			var animationTimer1 = Math.pow(Math.min(1, timer * 2), 0.5);
			var animationTimer2 = timer > 0.75 ? Math.pow((1 - timer) * 4, 0.75) : animationTimer1;

			context.fillStyle = "rgba(34, 102, 162, 1.0)";
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			context.shadowColor = "rgba(0, 68, 136, 0.5)";
			context.shadowBlur = canvas.height * 0.025;	
			
			context.fillStyle = "rgba(0, 78, 156, " + animationTimer2 + ")";
			context.beginPath();
			context.arc(0.5 * canvas.width, 0.5 * canvas.height, (Math.cos(animationTime * 2 - Math.PI * 0.45) * 0.025 + 0.41) * canvas.height, 0, Math.PI * 2);
			context.fill();
			
			context.fillStyle = "rgba(0, 68, 136, " + animationTimer1 + ")";
			context.beginPath();
			context.arc(0.5 * canvas.width, 0.5 * canvas.height, (Math.cos(animationTime * 2) * 0.025 + 0.4) * canvas.height, 0, Math.PI * 2);
			context.fill();
						
			context.font = "bold " + Math.floor(canvas.height * 0.125) + "px Arial";
			context.textAlign = "center";
			context.shadowColor = "rgba(0, 0, 0, 0.5)";
			context.fillStyle = "rgba(255, 255, 255, " + animationTimer2 + ")";
			context.fillText("Blocks", canvas.width * 0.5, (0.6 - 0.1 * animationTimer1) * canvas.height);

			context.font = "bold " + Math.floor(canvas.height * 0.05) + "px Arial";
			context.fillStyle = "rgba(0, 204, 255, " + animationTimer2 + ")";
			context.fillText("v1.0", canvas.width * 0.5, (0.75 - 0.15 * animationTimer1) * canvas.height);
				
			context.font = "bold " + Math.floor(scale * 0.05) + "px Arial";
			context.textAlign = "left";
			context.shadowBlur = 0;		
		}
		else
		{
			timer = (1 - timer) * 4;
		
			context.fillStyle = "rgba(34, 102, 162, " + timer + ")";
			context.fillRect(0, 0, canvas.width, canvas.height);
			
			if (timer > 0.5)
			{
				timer = Math.pow((timer - 0.5) * 2, 0.75);
				
				var newHighscore = !savedData.scores[levelIndex] || totalScore > savedData.scores[levelIndex];

				context.fillStyle = "rgba(0, 68, 136, " + timer + ")";
				context.shadowColor = "rgba(0, 68, 136, 0.5)";
				context.shadowBlur = canvas.height * 0.025;	
				
				context.fillStyle = "rgba(0, 78, 156, " + timer + ")";
				context.beginPath();
				context.arc(0.5 * canvas.width, 0.5 * canvas.height, (Math.cos(animationTime * 0.5 - Math.PI * 0.45) * 0.025 + 0.41) * canvas.height * timer, 0, Math.PI * 2);
				context.fill();
			
				context.fillStyle = "rgba(0, 68, 136, " + timer + ")";
				context.beginPath();
				context.arc(0.5 * canvas.width, 0.5 * canvas.height, (Math.cos(animationTime * 0.5) * 0.025 + 0.4) * canvas.height * timer, 0, Math.PI * 2);
				context.fill();
				
				context.shadowColor = "rgba(0, 0, 0, 0.5)";
				context.fillStyle = "rgba(255, 255, 255, " + timer + ")";
				context.textAlign = "center";
				context.font = "bold " + Math.floor(canvas.height * 0.05) + "px Arial";

				var y = 0.25 + (1 - timer) * 0.1;
				var y1 = y + Math.cos(animationTime) * 0.01;	
				context.fillText(score, 0.5 * canvas.width - 0.15 * canvas.height, (y + 0.25) * canvas.height);
				context.beginPath();
				context.moveTo(0.5 * canvas.width - (0.15 + 0.03 / triangleRatio) * canvas.height, (y1 + 0.34) * canvas.height); 
				context.lineTo(0.5 * canvas.width - 0.15 * canvas.height, (y1 + 0.28) * canvas.height); 
				context.lineTo(0.5 * canvas.width - (0.15 - 0.03 / triangleRatio) * canvas.height, (y1 + 0.34) * canvas.height); 
				context.closePath();
				context.fill();
				
				y1 = y + Math.cos(animationTime + Math.PI * 0.25) * 0.01;
				context.fillText(scoreTime.toFixed(1), 0.5 * canvas.width, (y + 0.25) * canvas.height);		
				context.beginPath();
				context.arc(0.5 * canvas.width, (y1 + 0.31) * canvas.height, 0.03 * canvas.height, 0, Math.PI * 2);
				context.fill();
				
				y1 = y + Math.cos(animationTime + Math.PI * 0.5) * 0.01;
				context.fillText(deaths, 0.5 * canvas.width + 0.15 * canvas.height, (y + 0.25) * canvas.height);	
				context.fillRect(0.5 * canvas.width + 0.12 * canvas.height, (y1 + 0.28) * canvas.height, 0.06 * canvas.height, 0.06 * canvas.height);
					
				context.font = Math.floor(canvas.height * 0.05) + "px Arial";
				context.fillText(newHighscore ? "High Score" :  "Score", canvas.width * 0.5, y * canvas.height);	
							
				if (!newHighscore)
				{
					context.font = Math.floor(canvas.height * 0.03333) + "px Arial";
					context.fillText("High Score", canvas.width * 0.5, (y + 0.5) * canvas.height);
				}
				
				context.font = "bold " + Math.floor(canvas.height * 0.1) + "px Arial";
				context.fillStyle = "rgba(0, 204, 255, " + timer + ")";
				context.fillText(totalScore, canvas.width * 0.5, (y + 0.1) * canvas.height);
				
				if (!newHighscore)
				{
					context.font = "bold " + Math.floor(canvas.height * 0.06666) + "px Arial";
					context.fillText(savedData.scores[levelIndex], canvas.width * 0.5, (y + 0.56666) * canvas.height);
				}
				
				context.font = "bold " + Math.floor(scale * 0.05) + "px Arial";
				context.textAlign = "left";
				context.shadowBlur = 0;		
			}
		}
	}
	else if (timer > 0.25)
	{
		timer = (0.75 - timer) * 2;
				
		context.fillStyle = "#2266A2";
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		context.shadowBlur = canvas.height * 0.05;
		
		if (timer < 0.25)
		{
			context.fillStyle = "rgba(0, 68, 136, " + (1 - timer * 4) + ")";
			context.shadowColor = "rgba(0, 68, 136, 0.5)";
			context.beginPath();
			context.arc(0.5 * canvas.width, 0.5 * canvas.height, (Math.cos(animationTime * (transitionType == TransitionType.TITLE ? 2 : 0.5)) * 0.025 + 0.4 + timer * 2) * canvas.height, 0, Math.PI * 2);
			context.fill();
		}
		
		context.shadowColor = "rgba(0, 0, 0, 0.5)";
		context.fillStyle = "rgba(255, 255, 255, " + timer + ")";
		context.strokeStyle = "rgba(47, 159, 255, " + timer + ")";
		context.setLineDash([]);	
		context.textAlign = "center";
		context.lineWidth = canvas.height * 0.01;
				
		var y = 0.5 + 0.10 * Math.pow(1 - timer, 2);
		
		context.font = "bold " + Math.floor(canvas.height * 0.1) + "px Arial";
		context.fillText(transitionType == TransitionType.CREDITS ? "Thanks For Playing" : levelTitle, canvas.width * 0.5, (y - 0.05) * canvas.height);
			
		var x = canvas.width * 0.25 * Math.pow(timer, 1.5);
		context.beginPath();
		context.moveTo(canvas.width * 0.5 - x, y * canvas.height);
		context.lineTo(canvas.width * 0.5 + x, y * canvas.height);
		context.stroke();
		
		x = canvas.width * 0.25 * Math.pow(timer, 3);
		context.strokeStyle = "rgba(0, 204, 255, " + timer + ")";
		context.beginPath();
		context.moveTo(canvas.width * 0.5 - x, y * canvas.height);
		context.lineTo(canvas.width * 0.5 + x, y * canvas.height);
		context.stroke();
		
		context.font = "bold " + Math.floor(canvas.height * 0.06666) + "px Arial";
		context.fillText(transitionType == TransitionType.CREDITS ? "Restarting" : levelMessage, canvas.width * 0.5, (y + 0.1) * canvas.height);
		
		context.font = "bold " + Math.floor(scale * 0.05) + "px Arial";
		context.textAlign = "left";
		context.lineWidth = scale * 0.004;
		context.shadowBlur = 0;
	}
	else
	{
		timer *= 4;
		
		context.fillStyle = "rgba(34, 102, 162, " + timer + ")";
		context.fillRect(0, 0, canvas.width, canvas.height);
		
		if (timer > 0.5)
		{
			timer = Math.pow((timer - 0.5) * 2, 1.5);
			
			context.fillStyle = "rgba(255, 255, 255, " + timer + ")";
			context.strokeStyle = "rgba(0, 204, 255, " + timer + ")";
			context.setLineDash([]);	
			context.shadowColor = "rgba(0, 0, 0, 0.5)";
			context.shadowBlur = canvas.height * 0.05;
		
			context.textAlign = "center";
			context.lineWidth = canvas.height * 0.01;
						
			context.font = "bold " + Math.floor(canvas.height * 0.1) + "px Arial";
			context.fillText(transitionType == TransitionType.CREDITS ? "Thanks For Playing" : levelTitle, canvas.width * 0.5, 0.45 * canvas.height);
				
			context.beginPath();
			context.moveTo(canvas.width * 0.25, 0.5 * canvas.height);
			context.lineTo(canvas.width * 0.75, 0.5 * canvas.height);
			context.stroke();
			
			context.font = "bold " + Math.floor(canvas.height * 0.06666) + "px Arial";
			context.fillText(transitionType == TransitionType.CREDITS ? "Restarting" : levelMessage, canvas.width * 0.5, 0.6 * canvas.height);
			
			context.font = "bold " + Math.floor(scale * 0.05) + "px Arial";
			context.textAlign = "left";
			context.lineWidth = scale * 0.004;
			context.shadowBlur = 0;
		}
	}
}

function updateLevelEditor(object)
{
	textInputFocus = false;
	
	if (!levelEditor)
	{
		levelEditorDiv.style.display = "none";
		return;
	}
	
	levelEditorDiv.style.display = "inline";
	levelEditorSelection = object;
	//window.onbeforeunload = function closeEditorWarning() { return "Leave without saving level?" };

	if (object === undefined)
	{
		levelEditorDiv.innerHTML = "Level Editor<br><br>";
		createEditorLink("Load Level", function() { updateLevelEditor(levels); });
		createEditorLink("Save Level", saveLevel);
		createEditorLink("Export Level", exportLevel);
		createEditorLink("Reset Level", function()
		{ 
			if (levelIndex == levels.length - 1 && paramLevel)
			{
				levels.length--;
				eval(decodeURIComponent(window.location.href.substring(window.location.href.indexOf("#") + 1)));
			}
		
			loadLevel(levelIndex);
		});
		createEditorLink("Sort Level", sortLevel);
		createEditorLink("New Level", resetLevel);

		createEditorLink("Level Settings", function() { updateLevelEditor(null); });

		createEditorLink("<br>Add Box", function() { updateLevelEditor(new Box(scrollX + ratio * 0.5, scrollY + 0.5 * zoom, 0.1, 0.1)); });
		createEditorLink("Add Dynamic Box", function() { updateLevelEditor(new Box(scrollX + ratio * 0.5, scrollY + 0.5 * zoom, 0.1, 0.1, 5).setPhysicsAttributes(0.95, 0.95, 1, 0.1)); });
		createEditorLink("Add Playable Box", function() { updateLevelEditor(new Box(scrollX + ratio * 0.5, scrollY + 0.5 * zoom, 0.075, 0.075, 1).makePlayable()); });
		createEditorLink("Add Triangle", function() { updateLevelEditor(new Triangle(scrollX + ratio * 0.5, scrollY + 0.5 * zoom)); });
		
		createEditorLink("<br>Add Kinematic Box", function() { updateLevelEditor(new Box(scrollX + ratio * 0.5, scrollY + 0.5 * zoom, 0.1, 0.1, 10).moveBetween(scrollX + ratio * 0.5,  scrollY + 0.5 * zoom,  scrollX + ratio * 0.5, scrollY + 0.5 * zoom + 0.2, 0, 5, null, true)); });
		createEditorLink("Add Trigger", function() { updateLevelEditor(new Trigger(scrollX + ratio * 0.5, scrollY + 0.5, 0.1, 0.1, "id", [], false)) });
		createEditorLink("Add Searcher", function() { updateLevelEditor(new Searcher(scrollX + ratio * 0.5, scrollY + 0.5, 0.5, Math.PI / 8, Math.PI, Math.PI / 4, 0, 0.5)) });
		createEditorLink("Add Light", function() { updateLevelEditor(new Light(scrollX + ratio * 0.5, scrollY + 0.5, 0.5, 0x00, 0xFF, 0xFF, 0.5)); });
		createEditorLink("Add Text", function() { updateLevelEditor(new Text(scrollX + ratio * 0.5, scrollY + 0.5, 0.04, 0.01, "#00CCFF", [ "Text" ] )); });
		
		createEditorLink("<br>Edit Zones", function() { updateLevelEditor(zones); });	
		createEditorLink("Edit Background", function() { updateLevelEditor(background); });	
	}
	else if (object === null)
	{
		levelEditorSelection = this;
		
		levelEditorDiv.innerHTML = "Level Settings<br><br>";
		
		createEditableAttribute(this, "levelName");
		createEditableAttribute(this, "levelTitle");
		createEditableAttribute(this, "levelMessage");

		levelEditorDiv.appendChild(document.createElement("br"));

		createEditableAttribute(this, "startX");
		createEditableAttribute(this, "startY");
		createEditableAttribute(this, "finishX");
		createEditableAttribute(this, "finishY");

		levelEditorDiv.appendChild(document.createElement("br"));

		createEditableAttribute(this, "playerSwitchDistance");
		createEditableAttribute(this, "scrollSmoothnessX");
		createEditableAttribute(this, "scrollSmoothnessY");
		createEditableAttribute(this, "initialZoom");
		createEditableAttribute(this, "whiteUI");

		levelEditorDiv.appendChild(document.createElement("br"));

		createEditableAttribute(this, "referenceScore");

		createEditorLink("<br>Reset View", function()
		{ 
			zoom = initialZoom; 
			scrollX = -0.5 * ratio;
			scrollY = 1 - zoom;
			onResize();
		});
		createEditableAttribute(this, "editorX");
		createEditableAttribute(this, "editorY");
		createEditorLink("Move Everything", function() 
		{ 
			for (var i = 0; i < boxes.length; ++i) { boxes[i].x += editorX; boxes[i].y += editorY; if (boxes[i].updateRays) boxes[i].updateRays(); if (boxes[i].isKinematic) { boxes[i].moveRay.x += editorX; boxes[i].moveRay.y += editorY; } }
			for (var i = 0; i < dynamicGameobjects.length; ++i) { dynamicGameobjects[i].x += editorX; dynamicGameobjects[i].y += editorY; if (dynamicGameobjects[i] instanceof Trigger) for (var i1 = 0; i1 < dynamicGameobjects[i].connection.length; ++i1) { dynamicGameobjects[i].connection[i1].x += editorX; dynamicGameobjects[i].connection[i1].y += editorY; } }
			for (var i = 0; i < lights.length; ++i) { lights[i].x += editorX; lights[i].y += editorY; lights[i].needsUpdate = true; }
			for (var i = 0; i < background.length; ++i) { background[i].x += editorX; background[i].y += editorY; }
			
			startX += editorX;
			startY += editorY;
			finishX += editorX;
			finishY += editorY;
		});
	}
	else if (object instanceof Box)
	{
		levelEditorDiv.innerHTML = (object.mass > 0 ? (object.isPlayable ? "Playable Box" : (object.isKinematic ? "Kinematic Box" : "Dynamic Box")) : "Box") + " Nr. " + (indexOf(boxes, object)) + "<br><br>";
		
		createEditableAttribute(object, "x");
		createEditableAttribute(object, "y");
		createEditableAttribute(object, "width");
		createEditableAttribute(object, "height");
		createEditorLink("Round", function() { object.x = Math.round(object.x * 200) / 200; object.y = Math.round(object.y * 200) / 200; object.width = Math.round(object.width * 200) / 200; object.height = Math.round(object.height * 200) / 200; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });

		if (object.isPlayable)
		{
			createEditorLink("<br>Move to start", function() { object.x = startX - object.width * 0.5; object.y = startY - object.width * 0.5; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });
		}
		
		if (object.isKinematic)
		{
			levelEditorDiv.appendChild(document.createElement("br"));
			
			object.x1 = object.moveRay.x;
			object.y1 = object.moveRay.y;
			object.x2 = object.moveRay.x + object.moveRay.dx;
			object.y2 = object.moveRay.y + object.moveRay.dy;

			createEditableAttribute(object, "moveRay.x");
			createEditableAttribute(object, "moveRay.y");
			createEditableAttribute(object, "moveRay.dx");
			createEditableAttribute(object, "moveRay.dy");
			
			createEditableAttribute(object, "moveTimer");
			createEditableAttribute(object, "moveDuration");
			createEditableAttribute(object, "isActivated");
			createEditableAttribute(object, "triggerId");
			createEditableAttribute(object, "loop");
		}
		if (object.mass > 0)
		{
			levelEditorDiv.appendChild(document.createElement("br"));

			createEditableAttribute(object, "mass");
			createEditableAttribute(object, "velX");
			createEditableAttribute(object, "velY");
		}
		
		levelEditorDiv.appendChild(document.createElement("br"));

		createEditableAttribute(object, "frictionX");
		createEditableAttribute(object, "frictionY");
		createEditableAttribute(object, "bouncynessX");
		createEditableAttribute(object, "bouncynessY");
		
		createEditorLink("<br>Copy", function() { updateLevelEditor(object.copy()); });
		createEditorLink("Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
		onAttributeChanged();
	}
	else if (object instanceof Triangle)
	{
		levelEditorDiv.innerHTML = "Triangle" + " Nr. " + (indexOf(boxes, object)) + "<br><br>";
		
		createEditableAttribute(object, "x");
		createEditableAttribute(object, "y");
		createEditableAttribute(object, "size");

		createEditorLink("Round", function() { object.x = Math.round(object.x * 200) / 200; object.y = Math.round(object.y * 200) / 200; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });
				
		createEditorLink("<br>Copy", function() { updateLevelEditor(object.copy()); });
		createEditorLink("Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
		onAttributeChanged();
	}
	else if (object instanceof Light)
	{
		levelEditorDiv.innerHTML = "Light" + " Nr. " + (indexOf(lights, object)) + "<br><br>";

		createEditableAttribute(object, "x");
		createEditableAttribute(object, "y");
		createEditableAttribute(object, "radius");
		createEditorLink("Round", function() { object.x = Math.round(object.x * 200) / 200; object.y = Math.round(object.y * 200) / 200; object.radius = Math.round(object.radius * 200) / 200; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });
		
		levelEditorDiv.appendChild(document.createElement("br"));
		
		createEditableAttribute(object, "r");
		createEditableAttribute(object, "g");
		createEditableAttribute(object, "b");
		createEditableAttribute(object, "a");

		levelEditorDiv.appendChild(document.createElement("br"));

		createEditableAttribute(object, "angle");
		createEditableAttribute(object, "rotation");
		
		createEditableAttribute(object, "optimizedPoints");
		createEditableAttribute(object, "lightPathLength");

		createEditorLink("<br>Copy", function() { updateLevelEditor(object.copy()); });
		createEditorLink("Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
	}
	else if (object instanceof Searcher)
	{
		levelEditorDiv.innerHTML = "Searcher" + " Nr. " + (indexOf(dynamicGameobjects, object)) + "<br><br>";

		createEditableAttribute(object, "x");
		createEditableAttribute(object, "y");
		createEditableAttribute(object, "radius");
		createEditorLink("Round", function() { object.x = Math.round(object.x * 200) / 200; object.y = Math.round(object.y * 200) / 200; object.radius = Math.round(object.radius * 200) / 200; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });
		
		levelEditorDiv.appendChild(document.createElement("br"));
		
		createEditableAttribute(object, "angle");
		createEditableAttribute(object, "rotation");
		createEditableAttribute(object, "rotationAngle");
		createEditableAttribute(object, "rotationOffset");
		createEditableAttribute(object, "rotationSpeed");

		createEditorLink("<br>Copy", function() { updateLevelEditor(object.copy()); });
		createEditorLink("Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
	}
	else if (object instanceof Trigger)
	{
		levelEditorDiv.innerHTML = "Trigger " + " Nr. " + (indexOf(dynamicGameobjects, object)) + "<br><br>";

		createEditableAttribute(object, "x");
		createEditableAttribute(object, "y");
		createEditableAttribute(object, "width");
		createEditableAttribute(object, "height");
		createEditorLink("Round", function() { object.x = Math.round(object.x * 200) / 200; object.y = Math.round(object.y * 200) / 200; object.width = Math.round(object.width * 200) / 200; object.height = Math.round(object.height * 200) / 200; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });
		
		levelEditorDiv.appendChild(document.createElement("br"));
		
		createEditableAttribute(object, "id");
		createEditableAttribute(object, "isActivated");
		createEditableAttribute(object, "isInverted");
					
		levelEditorDiv.appendChild(document.createElement("br"));
		
		for (var i = 0; i < object.connection.length; ++i)
		{
			createEditableAttribute(object, "connection." + i + ".x");
			createEditableAttribute(object, "connection." + i + ".y");
		}

		createEditorLink("Add Connection Point", function() { object.connection.push(object.connection.length == 0 ? new Vector(object.x + object.width * 0.5, object.y + object.height) : new Vector(object.connection[object.connection.length - 1].x, object.connection[object.connection.length - 1].y)); updateLevelEditor(object); });
		if (object.connection.length > 0)
			createEditorLink("Remove Connecion Point", function() { object.connection.length--; updateLevelEditor(object); } );
		
		createEditorLink("<br>Copy", function() { updateLevelEditor(object.copy()); });
		createEditorLink("Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
	}
	else if (object instanceof Text)
	{
		levelEditorDiv.innerHTML = "Txt " + " Nr. " + (indexOf(dynamicGameobjects, object)) + "<br><br>";

		createEditableAttribute(object, "x");
		createEditableAttribute(object, "y");
		createEditorLink("Round", function() { object.x = Math.round(object.x * 200) / 200; object.y = Math.round(object.y * 200) / 200; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });

		levelEditorDiv.appendChild(document.createElement("br"));

		createEditableAttribute(object, "textHeight");
		createEditableAttribute(object, "textSpacing");
		createEditableAttribute(object, "textColor");
		
		levelEditorDiv.appendChild(document.createElement("br"));

		for (var i = 0; i < object.text.length; ++i)
			createEditableAttribute(object, "text." + i);

		createEditorLink("Add Line", function() { object.text.push(""); updateLevelEditor(object); onAttributeChanged();  });
		if (object.text.length > 0)
			createEditorLink("Remove Line", function() { object.text.length--; updateLevelEditor(object); onAttributeChanged();  } );
		
		createEditorLink("<br>Copy", function() { updateLevelEditor(object.copy()); });
		createEditorLink("Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
	}
	else if (object instanceof Zone)
	{
		levelEditorDiv.innerHTML = "Zone " + (indexOf(zones, object)) + "<br><br>";

		if (object == zones[0])
			createEditableAttribute(object, "x");

		createEditableAttribute(object, "width");
		createEditableAttribute(object, "gravityModifier");
		
		createEditorLink("<br>Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
	}
	else if (object instanceof Background)
	{
		levelEditorDiv.innerHTML = "Background " + (indexOf(background, object)) + "<br><br>";

		createEditableAttribute(object, "x");
		createEditableAttribute(object, "y");
		createEditableAttribute(object, "width");
		createEditableAttribute(object, "height");
		createEditorLink("Round", function() { object.x = Math.round(object.x * 200) / 200; object.y = Math.round(object.y * 200) / 200; object.width = Math.round(object.width * 200) / 200; object.height = Math.round(object.height * 200) / 200; onAttributeChanged(); updateLevelEditor(levelEditorSelection); });
				
		createEditorLink("<br>Copy", function() { updateLevelEditor(object.copy()); });
		createEditorLink("Remove", function() { object.remove(); onAttributeChanged(); updateLevelEditor(); });
	}
	else if (object == zones)
	{
		levelEditorDiv.innerHTML = "Zones<br><br>";
		
		var tag;
		for (var i = 0; i < zones.length; ++i)
			createEditorLink("Edit Zone " + i, updateLevelEditorWithArg(zones[i]));
		
		createEditorLink("<br>Add Zone", function() { new Zone(1, 1); updateLevelEditor(zones); });
	}
	else if (object == background)
	{
		levelEditorDiv.innerHTML = "Background<br><br>";
		
		var tag;
		for (var i = 0; i < background.length; ++i)
			createEditorLink("Edit Background Rect " + i, updateLevelEditorWithArg(background[i]));
		
		createEditorLink("<br>Add Background Rect", function() { new Background(0, 0, 1, 1); updateLevelEditor(background); });
	}
	else if (object == levels)
	{
		levelEditorDiv.innerHTML = "Load Level<br><br>";
		
		var tag;
		for (var i = 0; i < levels.length; ++i)
			createEditorLink("Load " + levels[i].title, loadLevelEditor(i));	
	}
}

function loadLevelEditor(levelIndex1)
{
	return function(e) { loadLevel(levelIndex1); };
}

function updateLevelEditorWithArg(arg)
{
	return function(e) { updateLevelEditor(arg); };
}

function createEditorLink(text, func)
{
	var tag = document.createElement("a");
	tag.innerHTML = text + "<br>";
	tag.onclick = func;
	tag.className = "levelEditorLink";
	tag.href = "javascript:void(0)";
	levelEditorDiv.appendChild(tag);
	return tag;
}

function createEditableAttribute(obj, id)
{
	var attribute = id;
	var index;
	while ((index = attribute.indexOf(".")) != -1)
	{
		obj = obj[attribute.substring(0, index)];
		attribute = attribute.substring(index + 1, attribute.length);
	}

	var tag = document.createElement("label");
	tag.for = attribute;
	tag.innerHTML = id + ": ";
	levelEditorDiv.appendChild(tag);

	var checkbox = typeof(obj[attribute]) == "boolean";
	
	tag = document.createElement("input");
	tag.type = checkbox ? "checkbox" : "text";
	if (checkbox)
		tag.checked = obj[attribute];
	tag.id = id;
	tag.value = obj[attribute];
	tag.addEventListener(checkbox ? "change" : "input", changeAttribute);
	if (!checkbox)
		tag.addEventListener("keypress", onInputKeyPressed);
	
	tag.addEventListener("focus", function() { textInputFocus = true; });
	tag.addEventListener("blur", function() { textInputFocus = false; });
	levelEditorDiv.appendChild(tag);
	
	levelEditorDiv.appendChild(document.createElement("br"));
}

function onInputKeyPressed(event)
{
	event = event || window.event;
	
	if (event.keyCode == 13)
	{
		var obj = levelEditorSelection, attribute = event.target.id;
		var index;
		while ((index = attribute.indexOf(".")) != -1)
		{
			obj = obj[attribute.substring(0, index)];
			attribute = attribute.substring(index + 1, attribute.length);
		}
		
		event.target.value = obj[attribute];
	}
}

function changeAttribute(event)
{
	event = event || window.event;
	
	var obj = levelEditorSelection, attribute = event.target.id;
	var index;
	while ((index = attribute.indexOf(".")) != -1)
	{
		obj = obj[attribute.substring(0, index)];
		attribute = attribute.substring(index + 1, attribute.length);
	}
	
	var orgValue = obj[attribute];
	
	try
	{	
		if (typeof obj[attribute] == "string")
			obj[attribute] = event.target.value;
		
		else if (typeof obj[attribute] == "boolean")
			obj[attribute] = event.target.checked;
		
		else
		{
			
			if (event.target.value.length == 0)
				obj[attribute] = 0;
			
			else if (event.target.value.endsWith("pi"))
				obj[attribute] = Math.PI * eval(event.target.value.substr(0, event.target.value.length - 2));
			
			else
				obj[attribute] = eval(event.target.value);
			
			if (isNaN(obj[attribute]))
				obj[attribute] = orgValue;
		}
	}
	catch (err)
	{
		obj[attribute] = orgValue;
	}
	
	onAttributeChanged();
}

function onAttributeChanged()
{
	var updateEditor = false;
	if (levelEditorSelection instanceof Box)
	{
		if (levelEditorSelection.isKinematic)
		{
			levelEditorSelection.moveTimer = Math.min(levelEditorSelection.loop ? 2 : 1, Math.max(0, levelEditorSelection.moveTimer));
			
			var point = levelEditorSelection.moveTimer > 1 ? levelEditorSelection.moveRay.getVector(2 - levelEditorSelection.moveTimer) : levelEditorSelection.moveRay.getVector(levelEditorSelection.moveTimer);
			if (point.x != levelEditorSelection.x || point.y != levelEditorSelection.y)
			{				
				if (levelEditorSelection.lastX == levelEditorSelection.x && levelEditorSelection.lastY == levelEditorSelection.y)
				{
					levelEditorSelection.x = point.x;
					levelEditorSelection.y = point.y;
				}
				else
				{
					levelEditorSelection.moveRay.x += levelEditorSelection.x - point.x;
					levelEditorSelection.moveRay.y += levelEditorSelection.y - point.y;
					updateEditor = !levelEditorDrag;
				}
			}	
		}
			
		if (levelEditorSelection.mass > 0)
			levelEditorSelection.lastX = levelEditorSelection.x;
			levelEditorSelection.lastY = levelEditorSelection.y;
			
			
		levelEditorSelection.updateRays();
		
		for (var i = 0; i < lights.length; ++i)
			if (lights[i].x + lights[i].radius > levelEditorSelection.x && lights[i].x - lights[i].radius < levelEditorSelection.x + levelEditorSelection.width)		
				lights[i].needsUpdate = true;
	}	
	else if (levelEditorSelection instanceof Triangle)
	{
		levelEditorSelection.lastX = levelEditorSelection.x;
		levelEditorSelection.lastY = levelEditorSelection.y;		
		
		for (var i = 0; i < lights.length; ++i)
			if (lights[i].x + lights[i].radius > levelEditorSelection.x && lights[i].x - lights[i].radius < levelEditorSelection.x + levelEditorSelection.width)		
				lights[i].needsUpdate = true;
	}
	else if (levelEditorSelection instanceof Light)
	{
		levelEditorSelection.lastRotation = levelEditorSelection.rotation;
		levelEditorSelection.needsUpdate = true;
	}
	else if (levelEditorSelection instanceof Zone)
	{
		for (var i = 0; i < zones.length; ++i)
		{
			if (i != 0)
				zones[i].x = zones[i - 1].maxX;
			
			zones[i].maxX = zones[i].x + zones[i].width;
		}
	}
	else if (levelEditorSelection instanceof Searcher)
	{
		levelEditorSelection.light.needsUpdate = true;
		levelEditorSelection.light.x = levelEditorSelection.x;
		levelEditorSelection.light.y = levelEditorSelection.y;
		levelEditorSelection.light.angle = levelEditorSelection.angle;
		levelEditorSelection.light.lastRotation = levelEditorSelection.light.rotation = levelEditorSelection.getLightRotation();
		levelEditorSelection.light.radius = levelEditorSelection.radius * 1.5;
	}
	else if (levelEditorSelection instanceof Trigger)
	{
		levelEditorSelection.updateTrigger();
	}
	else if (levelEditorSelection instanceof Text)
	{
		levelEditorSelection.preDraw();
	}
	else if (levelEditorSelection == null)
	{
		for (var i = 0; i < lights.length; ++i)
			if (lights[i].x + lights[i].radius > scrollX && lights[i].x - lights[i].radius < scrollX + ratio)
				lights[i].needsUpdate = true;
	}
	
	if (updateEditor)
		updateLevelEditor(levelEditorSelection);
}

function resetLevel()
{	
	for (var i = 0; i < lights.length; ++i)
		for (var i1 = 0; i1 < lights[i].lightPathLength; ++i1)
			releaseVector(lights[i].lightPath[i1]);

	levelEditor = true;
	background = [];
	boxes = [];
	ghostBoxes = [];
	dynamicBoxes = [];
	ghostDynamicBoxes = [];
	triggerListeners = [];
	playableBoxes = [];
	lights = [];
	dynamicGameobjects = [];
	ghostDynamicGameobjects = [];
	zones = [];
	activeGhost = null;
	activeGhostLength = -1;
	player = ghost = null;

	levelName = "level" + (levels.length + 1);
	levelTitle = "Level " + (levels.length + 1);
	levelMessage = "";
	
	startX = 0;
	startY = 0.75;
	finishX = 0.5;
	finishY = 0.05;
	playerSwitchDistance = 0.25;
	scrollSmoothnessX = 0.2;
	scrollSmoothnessY = 0;
	initialZoom = 1.25;
	whiteUI = true;	
	
	score = 0;
	deaths = 0;
	maxScore = 0;
}

function saveLevel()
{
	var i = window.location.href.indexOf("#");
	var href = window.location.href;
	if (i != -1)
		href = window.location.href.substring(0, i);
	
	window.location.href = href + "#" + encodeURIComponent(exportLevel(true).replace(/\n/g, "").replace(/\t/g, ""));
	if (window.location.href.length > 2000)
		alert("Level is to complex to be saved to the url. Use export instead.");
	
	paramLevel = true;
}

function exportLevel(link)
{
	if (playableBoxes.length == 0)
	{
		alert("Invalid Level", "There are no playable boxes.");
		return;
	}
	
	if (zones.length == 0)
		new Zone(0, 1);
	
	sortLevel();
	
	var data = "levels.push(\n{\n\ttitle: \"" + levelTitle + "\",\n\tmessage: \"" + levelMessage + "\",\n\n\tstartX: " + startX + ",\n\tstartY: " + startY + ",\n\tfinishX: " + finishX + ",\n\tfinishY: " + finishY + ",\n\n\tplayerSwitchDistance: " + playerSwitchDistance + ",\n\tscrollSmoothnessX: " + scrollSmoothnessX + ",\n\tscrollSmoothnessY: " + scrollSmoothnessY + ",\n\n\tinitialZoom: " + initialZoom + ",\n\twhiteUI: " + whiteUI + ",\n\n\treferenceScore: " + referenceScore + ",\n\n\tload: function()\n\t{\n";
	
	for (var i = 0; i < playableBoxes.length; ++i)
		data += playableBoxes[i].export();
	
	data += "\n";
		
	for (var i = 0; i < boxes.length; ++i)
		if (boxes[i] instanceof Box && !boxes[i].isPlayable && !boxes[i].isKinematic)
			data += boxes[i].export();		
	
	for (var i = 0; i < boxes.length; ++i)
		if (boxes[i] instanceof Box && boxes[i].isKinematic)
			data += boxes[i].export();
		
	data += "\n";
			
	for (var i = 0; i < boxes.length; ++i)
		if (boxes[i] instanceof Triangle)
			data += boxes[i].export();
	
	for (var i = 0; i < dynamicGameobjects.length; ++i)
		data += dynamicGameobjects[i].export();
	
	for (var i = 0; i < lights.length; ++i)
	{
		if (i == 0)
			data += "\n";

		data += lights[i].export();
	}
	
	data += "\n";

	for (var i = 0; i < zones.length; ++i)
		data += zones[i].export(i == 0);	
	
	for (var i = 0; i < background.length; ++i)
	{
		if (i == 0 )
			data += "\n";
		
		data += background[i].export();
	}
	
	data += "\t}\n});";
	
	if (link == true)
		return data;

	var file = new Blob([data], {type: "text/javascript"});
	
    if (window.navigator.msSaveOrOpenBlob)
        window.navigator.msSaveOrOpenBlob(file, levelName + ".js");
	
    else 
	{ 
        var a = document.createElement("a"),
        url = URL.createObjectURL(file);
        a.href = url;
        a.download = levelName + ".js";
        document.body.appendChild(a);
        a.click();
        setTimeout(function()
		{
            document.body.removeChild(a);
            window.URL.revokeObjectURL(url);  
        }, 0); 
    }
}

function enableFullscreen()
{
	if (canvas.requestFullscreen)
		canvas.requestFullscreen();
	
	else if (canvas.webkitRequestFullscreen)
		canvas.webkitRequestFullscreen();
	
	else if (canvas.webkitEnterFullscreen)
		canvas.webkitEnterFullscreen();
	
	else if (canvas.webkitRequestFullScreen)
		canvas.webkitRequestFullScreen();
		
	else if (canvas.mozRequestFullScreen)
		canvas.mozRequestFullScreen();
	
	else if (canvas.msRequestFullscreen)
		canvas.msRequestFullscreen();
}

var lightRay = new Ray();
var tracedRay = null;
var tracedBox = null;

function Light(x, y, radius, r, g, b, a, angle, rotation)
{
	lights.push(this);
	
	this.x = x;
	this.y = y;
	this.r = r;
	this.g = g;
	this.b = b;
	this.a = a;
	this.radius = radius;
	this.blocked = false;
	this.angle = angle == undefined ? 0 : angle;
	this.lastRotation = this.rotation = rotation == undefined ? 0 : rotation;
			
	this.needsUpdate = true;
	
	this.lightPath = [];
	this.lightPathLength = 0;
	this.corners = [ new Vector(), new Vector(), new Vector(), new Vector() ];
	this.optimizedPoints = 0;
		
	this.draw = function (partial)
	{		
		if (this.x + this.radius < scrollX || this.x - this.radius > scrollX + ratio)
			return;
	
		if (this.needsUpdate || scrollX != lastScrollX || scrollY != lastScrollY)
		{
			var x = getScreenX(this.x, partial);
			var y = getScreenY(this.y, partial);
			this.lightGradient = context.createRadialGradient(x, y, 0, x, y, this.radius * scale);
			this.lightGradient.addColorStop(0, "rgba(" + this.r + ", " + this.g + ", " + this.b + ", " + this.a + ")");
			this.lightGradient.addColorStop(1, "rgba(0, 68, 128, 0)");
			
			// this.lightGradient.addColorStop(0, "rgba(255, 0, 0, 0.5)");
			// this.lightGradient.addColorStop(1, "rgba(255, 0, 0, 0.5)");
		}
		
		var containsDynamicBox = false;
		if (!levelEditor || liveEditor)
			for (var i = 0; i < dynamicBoxes.length; ++i)
				if ((!(dynamicBoxes[i] instanceof Box) || Math.abs(dynamicBoxes[i].lastX - dynamicBoxes[i].x) + Math.abs(dynamicBoxes[i].lastY - dynamicBoxes[i].y) + Math.abs(dynamicBoxes[i].velX) + Math.abs(dynamicBoxes[i].velY) > 0.00001) && this.x + this.radius > dynamicBoxes[i].x && this.x - this.radius < dynamicBoxes[i].x + dynamicBoxes[i].width)		
				{
					containsDynamicBox = true;
					break;
				}
		
		if (containsDynamicBox)		
		{
			this.updatelightPath();
			this.needsUpdate = true;
		}
		else if (this.needsUpdate)
		{
			this.updatelightPath();
			this.needsUpdate = false;
		}
			
		if (this.blocked)
		{
			if (levelEditor && (levelEditorSelection == this || levelEditorSelection instanceof Searcher && levelEditorSelection.light == this))
			{
				context.fillStyle = levelEditorSelection == this ? "#00FFFF" : "#FF0000";

				var x = getScreenX(this.x, partial);
				var y = getScreenY(this.y, partial);
					
				context.fillRect(x - 3, y - 3, 6, 6);
			}
			
			return;		
		}
		
		context.fillStyle = this.lightGradient;
		context.beginPath();

		if (this.angle != 0)
		{
			var rot = lerp(this.lastRotation, this.rotation, partial);
			
			var vec1 = this.rayTraceShadowPoint(this.x, this.y + this.radius, -rot + this.angle * 0.5 - 0.000000001);
			var vec2 = this.rayTraceShadowPoint(this.x, this.y + this.radius, -rot - this.angle * 0.5 + 0.000000001);

			context.moveTo(getScreenX(this.x, partial), getScreenY(this.y, partial)); 
			context.lineTo(getScreenX(vec1.x, partial), getScreenY(vec1.y, partial)); 
			
			for (var i = 0; i < this.lightPathLength; ++i)
				if (isAngleInRange(this.lightPath[i].angle, rot - this.angle * 0.5, rot + this.angle * 0.5))
					context.lineTo(getScreenX(this.lightPath[i].x, partial), getScreenY(this.lightPath[i].y, partial)); 
			
			context.lineTo(getScreenX(vec2.x, partial), getScreenY(vec2.y, partial)); 
		
			releaseVector(vec1);
			releaseVector(vec2);
		}
		else
		{
			context.moveTo(getScreenX(this.lightPath[0].x, partial), getScreenY(this.lightPath[0].y, partial));
				
			for (var i = 1; i < this.lightPathLength; ++i)
				context.lineTo(getScreenX(this.lightPath[i].x, partial), getScreenY(this.lightPath[i].y, partial));		
		}

		context.closePath();
		context.fill();
		
		if (levelEditor && (levelEditorSelection == this || levelEditorSelection instanceof Searcher && levelEditorSelection.light == this))
		{
			context.fillStyle = levelEditorSelection == this ? "rgba(0, 255, 255, 0.5)" :"rgba(255, 0, 0, 0.5)";
			context.strokeStyle = context.fillStyle;

			for (var i = 0; i < this.lightPathLength; ++i)
				if (this.angle == 0 || isAngleInRange(this.lightPath[i].angle, lerp(this.lastRotation, this.rotation, partial) - this.angle * 0.5, lerp(this.lastRotation, this.rotation, partial) + this.angle * 0.5))
					context.fillRect(getScreenX(this.lightPath[i].x, partial) - 1.5, getScreenY(this.lightPath[i].y, partial) - 1.5, 3, 3);
			
			var x = getScreenX(this.x, partial);
			var y = getScreenY(this.y, partial);
				
			context.fillRect(x - 3, y - 3, 6, 6);

			context.beginPath();
			
			if (levelEditorSelection != this)
			{
				context.arc(x, y, levelEditorSelection.radius * scale, 0, Math.PI * 2);
				
				var tmp = new Ray(x, y, x, y - levelEditorSelection.radius * scale);
				tmp.rotate((levelEditorSelection.rotationAngle + levelEditorSelection.angle) * 0.5 + levelEditorSelection.rotation);
				context.moveTo(x, y);
				context.lineTo(x + tmp.dx, y + tmp.dy);
				tmp.rotate(-levelEditorSelection.rotationAngle - levelEditorSelection.angle);
				context.moveTo(x, y);
				context.lineTo(x + tmp.dx, y + tmp.dy);
			}
			else
				context.arc(x, y, this.radius * scale, 0, Math.PI * 2);
			
			context.stroke();
		}
	};
	
	this.updatelightPath = function()
	{
		this.corners[0].set(this.x - this.radius, this.y - this.radius);
		this.corners[1].set(this.x + this.radius, this.y - this.radius);
		this.corners[2].set(this.x - this.radius, this.y + this.radius);
		this.corners[3].set(this.x + this.radius, this.y + this.radius);

		this.blocked = false;
		
		for (var i = 0; i < this.lightPathLength; ++i)
		{
			this.lightPath[i] = null;
			releaseVector(this.lightPath[i]);
		}
		
		//this.lightPath = [];
		this.lightPathLength = 0;
		this.optimizedPoints = 0;
				
		var lastTracedRay = null;
		var lastTracedBox = null;
		var vec;

		for (var i = 0; i < boxes.length; ++i)
		{
			if (this.x + this.radius < boxes[i].x || this.x - this.radius > boxes[i].x + boxes[i].width || boxes[i].mass <= -2)		
				continue;
			
			if (this.x >= boxes[i].rays[0].x && this.x <= boxes[i].rays[1].x && this.y >= boxes[i].rays[0].y && this.y <= boxes[i].rays[2].y)
			{
				this.blocked = true;
				return;
			}
			
			for (var i1 = 0; i1 < boxes[i].rays.length; ++i1)
			{
				for (var i3 = -1; i3 <= 1; i3 += 2)
				{
					lastTracedRay = tracedRay;
					lastTracedBox = tracedBox;
					this.lightPath[this.lightPathLength++] = this.rayTraceShadowPoint(boxes[i].rays[i1].x, boxes[i].rays[i1].y, 0.0001 * i3);
				}
				
				if (tracedRay != null && lastTracedRay == tracedRay && squaredDistance(this.lightPath[this.lightPathLength - 1].x, this.lightPath[this.lightPathLength - 1].y, boxes[i].rays[i1].x, boxes[i].rays[i1].y) > 0.0005)
				{
					releaseVector(this.lightPath[--this.lightPathLength]);
					releaseVector(this.lightPath[--this.lightPathLength]);
					this.optimizedPoints += 2;
				}
				else if (lastTracedBox == tracedBox && lastTracedRay != tracedRay && (tracedRay == boxes[i].rays[i1] || boxes[i].rays[i1] == lastTracedRay))
				{
					releaseVector(this.lightPath[--this.lightPathLength]);
					releaseVector(this.lightPath[--this.lightPathLength]);
					this.lightPath[this.lightPathLength++] = obtainVector(boxes[i].rays[i1].x, boxes[i].rays[i1].y);
					this.optimizedPoints++;
				}
				else if (tracedRay == null && this.lightPath[this.lightPathLength - 2].angle >= this.radius * 1.5 || Math.abs(this.lightPath[this.lightPathLength - 2].angle - this.lightPath[this.lightPathLength - 1].angle) < 0.002)
				{
					releaseVector(this.lightPath[--this.lightPathLength]);
					this.optimizedPoints++;
				}
				else if (lastTracedRay == null && this.lightPath[this.lightPathLength - 1].angle >= this.radius * 1.5)
				{
					releaseVector(this.lightPath[this.lightPathLength - 2]);
					this.lightPath[this.lightPathLength - 2] = this.lightPath[this.lightPathLength - 1];
					this.lightPathLength--;
					this.optimizedPoints++;
				}
			}
		}
		
		for (var i = 0; i < this.corners.length; ++i)
		{
			vec = this.rayTraceShadowPoint(this.corners[i].x, this.corners[i].y, 0);
			if (tracedBox == null)
				this.lightPath[this.lightPathLength++] = vec;
		}
		
		this.lightPath.length = this.lightPathLength;
		
		for (var i = 0; i < this.lightPathLength; ++i)
			calcAngle(this.lightPath[i], this.x, this.y);
	
		this.lightPath.sort(function compareVector(a, b)
		{
			return a.angle - b.angle;
		});
	};
	this.rayTraceShadowPoint = function(x, y, rotate)
	{
		var t = Infinity, t1;
		
		tracedRay = null;
		tracedBox = null;

		lightRay.set(this.x, this.y, x, y);
		lightRay.rotate(rotate);
		lightRay.normalize();
		for (var i = 0; i < boxes.length; ++i)
		{		
			if (this.x + this.radius < boxes[i].x || this.x - this.radius > boxes[i].x + boxes[i].width || boxes[i].mass <= -2)		
				continue;
			
			for (var i1 = 0; i1 < boxes[i].rays.length; ++i1)
			{
				t1 = lightRay.intersection(boxes[i].rays[i1]);
				if (t1 <= t)
				{
					t = t1;
					tracedRay = boxes[i].rays[i1];
					tracedBox = boxes[i];
				}
			}
		}
				
		if (t == Infinity)
		{
			tracedRay = null;
			tracedBox = null;
			t = this.radius * 1.5;
		}
		
		var vec = lightRay.getVector(t);
		vec.angle = t;
		return vec;
	};
	
	this.copy = function()
	{
		var copy = new Light(this.x, this.y, this.radius, this.r, this.g, this.b, this.a, this.angle, this.rotation);
		copy.y += 0.1;
		return copy;
	}
	
	this.remove = function()
	{
		removeFromArray(lights, this);
	
		for (var i = 0; i < this.lightPathLength; ++i)
			releaseVector(this.lightPath[i]);
	};
	
	this.export = function()
	{
		if (this.owner)
			return "";
		
		return "\t\tnew Light(" + this.x + ", " + this.y + ", " + this.radius + ", " + this.r + ", " + this.g + ", " + this.b + ", " + this.a + (this.angle != 0 || this.rotation != 0 ? ", " + this.angle + ", " + this.rotation : "") + ");\n"
	}
}

function Box(x, y, width, height, mass, ghostParent)
{	
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.isGhost = ghostParent != undefined;
	
	if (this.isGhost)
		ghostBoxes.push(this);
	
	else
		boxes.push(this);

	this.frictionX = 0.95;
	this.frictionY = 0.95;
	this.bouncynessX = 0.01;
	this.bouncynessY = 0.01;
		
	if (mass == undefined || mass == 0)
	{
		this.mass = 0;
	}
	else
	{
		this.lastX = x;
		this.lastY = y;
		this.velX = 0;
		this.velY = 0;
		this.mass = mass;
		this.needsRayUpdate = true;
		this.collisionTop = this.collisionLeft = this.collisionBottom = this.collisionRight = false;
		this.lastCollisionTop = this.lastCollisionLeft = this.lastCollisionBottom = this.lastCollisionRight = false;

		if (this.isGhost)
		{
			this.ghostX = x;
			this.ghostY = y;
			this.ghostVelX = this.velX;
			this.ghostVelY = this.velY;
			this.ghostParent = ghostParent;		
			ghostDynamicBoxes.push(this);
		}
		else
		{		
			this.ghost = new Box(x, y, width, height, mass, this);
			dynamicBoxes.push(this);
		}
	}
	
	this.rays =
	[
		new Ray(x, y, x + width, y),
		new Ray(x + width, y, x + width, y + height),
		new Ray(x, y + height, x, y),
		new Ray(x + width, y + height, x, y + height)
	];
	
	this.update = function(timestep)
	{
		this.lastX = this.x;
		this.lastY = this.y;
		
		if (this.isKinematic)
		{
			if (this.isActivated && (this.loop || this.moveTimer < 1))
			{
				this.moveTimer += timestep / this.moveDuration;
				if (this.moveTimer >= 2)
					this.moveTimer -= 2;
				if (!this.loop && this.moveTimer > 1)
					this.moveTimer = 1;
				
				var pos = this.moveTimer > 1 ? this.moveRay.getVector(2 - this.moveTimer) : this.moveRay.getVector(this.moveTimer);	
				this.x = pos.x;
				this.y = pos.y;
				releaseVector(pos);
				
				if (this.moveTimer > 1)
				{
					this.velX = -this.moveRay.dx / this.moveDuration;
					this.velY = -this.moveRay.dy / this.moveDuration;
				}
				else
				{
					this.velX = this.moveRay.dx / this.moveDuration;
					this.velY = this.moveRay.dy / this.moveDuration;
				}
				
				this.collisionTop = this.collisionLeft = this.collisionBottom = this.collisionRight = false;
			}
			else
				this.velX = this.velY = 0;
		}
		else
		{
			var gravity = getGravity(this.x + this.width * 0.5, this.isGhost);
			var onGround = gravity <= 0 ? this.collisionBottom && this.velY >= 0 && this.velY <= -gravity * timestep : this.collisionTop && this.velY <= 0 && this.velY >= -gravity * timestep;
			
			if (!levelEditor || !levelEditorDrag || this != levelEditorSelection)
			{		
				this.velY += gravity * timestep;
			
				this.x += this.velX * timestep;
				this.y += this.velY * timestep;
			}
			
			this.lastCollisionTop = this.collisionTop;
			this.lastCollisionLeft = this.collisionLeft;
			this.lastCollisionBottom = this.collisionBottom;
			this.lastCollisionRight = this.collisionRight;
			this.collisionTop = this.collisionLeft = this.collisionBottom = this.collisionRight = false;

			if (this.isGhost)
				for (var i = 0; i < ghostBoxes.length; ++i)
					if (ghostBoxes[i] != this && ghostBoxes[i].mass >= 0 && (ghostBoxes[i].mass == 0 || ghostBoxes[i].isGhost))
						this.resolveAABBCollision(ghostBoxes[i], timestep);
				
			for (var i = 0; i < boxes.length; ++i)
				if (boxes[i] != this && boxes[i].mass >= 0 && (boxes[i].mass == 0 || boxes[i].isGhost == this.isGhost))
					this.resolveAABBCollision(boxes[i], timestep);
				
			if (this.y < -100)
				this.velY = 0;
			
			else if (this.y > 100)
				this.velY = 0;
			
			if (onGround && this.collisionBottom && this.velY <= -gravity * timestep)
			{
				this.collisionBottom = true;
				this.velY = 0;
			}
		}
		
		if (this.x != this.lastX || this.y != this.lastY)
			this.updateRays(this.x, this.y);
	},
	
	this.resolveAABBCollision = function(box, timestep)
	{
		var pUp, pLeft, pDown, pRight;
		
		pRight = box.x + box.width - this.x;
		pLeft = this.x + this.width - box.x;
		
		if (pRight > 0 && pLeft > 0)
		{
			pUp = box.y + box.height - this.y;
			pDown = this.y + this.height - box.y;
		
			if (pUp > 0 && pDown > 0)
			{
				var pMin = Math.min(pUp, pDown, pRight, pLeft);
				
				if (pUp == pMin)
				{					
					if (box.mass > 0 && !box.isKinematic && !box.collisionBottom && !box.lastCollisionBottom)
					{
						var p = (this.velY * this.mass + box.velY * box.mass);
						this.velY = -p * box.mass / (this.mass + box.mass) * (1 - box.bouncynessY);
						box.velY = p * this.mass / (this.mass + box.mass) * (1 - this.bouncynessY);
						
						this.y += pUp * box.mass / (this.mass + box.mass);
						box.y -= pUp * this.mass / (this.mass + box.mass);
						
						this.velX += (box.velX - this.velX) * (1 - box.frictionX);
						box.velX += (this.velX - box.velX) * (1 - this.frictionX);
					}
					else
					{					
						this.velY *= -this.bouncynessY - box.bouncynessY;
						this.y += pUp;
						
						this.collisionBottom = true;
						
						if (box.isKinematic && box.isActivated)
						{
							box.collisionTop = true;
							this.velX += (box.velX - this.velX) * (1 - this.frictionX * box.frictionX);
						}
						else
							this.velX *= box.frictionX * this.frictionX;
					}
				}
				else if (pDown == pMin)
				{
					if (box.mass > 0 && !box.isKinematic && !box.collisionTop && !box.lastCollisionTop)
					{
						var p = (this.velY * this.mass + box.velY * box.mass);
						this.velY = -p * box.mass / (this.mass + box.mass) * (1 - box.bouncynessY);
						box.velY = p * this.mass / (this.mass + box.mass) * (1 - this.bouncynessY);
						
						this.y -= pDown * box.mass / (this.mass + box.mass);
						box.y += pDown * this.mass / (this.mass + box.mass);
						
						this.velX += (box.velX - this.velX) * (1 - box.frictionX);
						box.velX += (this.velX - box.velX) * (1 - this.frictionX);
					}
					else
					{
						this.velY *= -this.bouncynessY - box.bouncynessY;
						this.y -= pDown;
						
						this.collisionTop = true;	
						
						if (box.isKinematic && box.isActivated)
						{
							box.collisionBottom = true;
							this.velX += (box.velX - this.velX) * (1 - this.frictionX * box.frictionX);
						}
						else
							this.velX *= box.frictionX * this.frictionX;
					}				
				}
				if (pRight == pMin)
				{
					if (box.mass > 0 && !box.isKinematic && !box.collisionLeft && !box.lastCollisionLeft)
					{
						var p = (this.velX * this.mass + box.velX * box.mass);
						this.velX = -p * box.mass / (this.mass + box.mass) * (1 - box.bouncynessX);
						box.velX = p * this.mass / (this.mass + box.mass) * (1 - this.bouncynessX);
						
						this.x += pRight * box.mass / (this.mass + box.mass);
						box.x -= pRight * this.mass / (this.mass + box.mass);	

						this.velY += (box.velY - this.velY) * (1 - box.frictionY);
						box.velY += (this.velY - box.velY) * (1 - this.frictionY);
					}
					else
					{		
						this.velX *= -this.bouncynessX - box.bouncynessX;
						this.x += pRight;
						
						this.collisionLeft = true;	
						
						if (box.isKinematic && box.isActivated)
						{
							box.collisionRight = true;
							this.velY += (box.velY - this.velY) * (1 - this.frictionY * box.frictionY);
						}
						else
							this.velY *= box.frictionY * this.frictionY;
					}				
				}
				else if (pLeft == pMin)
				{
					if (box.mass > 0 && !box.isKinematic && !box.collisionRight && !box.lastCollisionRight)
					{
						var p = (this.velX * this.mass + box.velX * box.mass);
						this.velX = -p * box.mass / (this.mass + box.mass) * (1 - box.bouncynessX);
						box.velX = p * this.mass / (this.mass + box.mass) * (1 - this.bouncynessX);
						
						this.x -= pLeft * box.mass / (this.mass + box.mass);
						box.x += pLeft * this.mass / (this.mass + box.mass);
						
						this.velY += (box.velY - this.velY) * (1 - box.frictionY);
						box.velY += (this.velY - box.velY) * (1 - this.frictionY);
					}
					else
					{					
						this.velX *= -this.bouncynessX - box.bouncynessX;
						this.x -= pLeft;
						
						this.collisionRight = true;	
						if (box.isKinematic && box.isActivated)
						{
							box.collisionRight = true;
							this.velY += (box.velY - this.velY) * (1 - this.frictionY * box.frictionY);
						}
						else
							this.velY *= box.frictionY * this.frictionY;
					}				
				}
			}
		}
	};
	
	this.updateRays = function(x, y)
	{
		x = x || this.x;
		y = y || this.y;
		
		this.rays[0].set(x, y, x + this.width, y);
		this.rays[1].set(x + this.width, y, x + this.width, y + this.height);
		this.rays[2].set(x, y + this.height, x, y);
		this.rays[3].set(x + this.width, y + this.height, x, y + this.height);
	}
	
	this.setPhysicsAttributes = function(frictionX, frictionY, bouncynessX, bouncynessY)
	{
		if (!this.isGhost && this.ghost)
			this.ghost.setPhysicsAttributes(frictionX, frictionY, bouncynessX, bouncynessY);
			
		this.frictionX = frictionX;
		this.frictionY = frictionY;
		this.bouncynessX = bouncynessX;
		this.bouncynessY = bouncynessY;
		
		return this;
	};
	
	this.makePlayable = function()
	{
		if (this.mass == 0)
			return this;
		
		this.isPlayable = true;
		playableBoxes.push(this);
		
		return this;
	}
	
	this.moveBetween = function(x1, y1, x2, y2, moveTimer, moveDuration, triggerId, loop)
	{
		if (this.mass == 0)
			return this;

		this.isKinematic = true;
		this.triggerId = triggerId == undefined ? "" : triggerId;
		this.loop = loop == undefined ? true : loop;
		this.isActivated = isTriggerActivated(triggerId, this.isGhost);
		this.moveDuration = moveDuration;
		this.moveTimer = moveTimer;
		this.moveRay = new Ray(x1, y1, x2, y2);
		
		if (!this.isGhost)
		{
			this.ghost.ghostIsActivated = this.isActivated;
			this.ghost.ghostMoveTimer = this.moveTimer;
			
			this.ghost.moveBetween(x1, y1, x2, y2, moveTimer, moveDuration, triggerId, loop);
		}
		
		triggerListeners.push(this);

		return this;
	}
	
	this.ghostReset = function()
	{
		if (!this.isGhost)
			return;
		
		this.lastX = this.x = this.ghostX;
		this.lastY = this.y = this.ghostY;
		this.velX = this.ghostVelX;
		this.velY = this.ghostVelY;
		
		this.ghostX = this.ghostParent.x;
		this.ghostY = this.ghostParent.y;
		this.ghostVelX = this.ghostParent.velX;
		this.ghostVelY = this.ghostParent.velY;
		
		if (this.isKinematic)
		{
			this.isActivated = this.ghostIsActivated;
			this.moveTimer = this.ghostMoveTimer
			
			this.ghostIsActivated = this.ghostParent.isActivated;
			this.ghostMoveTimer = this.ghostParent.moveTimer;
		}
	}
	
	this.draw = function(partial)
	{
		if (!this.needsRayUpdate && (this.lastX + this.width < lastScrollX || this.lastX > lastScrollX + ratio))
			return;
	
		var drawX, drawY;
		var movedFlag = this.lastX != this.x || this.lastY != this.y || this.velX != 0 || this.velY != 0;
	
		if (this.mass > 0 && (movedFlag || this.needsRayUpdate))
		{
			this.needsRayUpdate = movedFlag;
			 
			if (!levelEditor || liveEditor)
				this.updateRays(lerp(this.lastX, this.x, partial), lerp(this.lastY, this.y, partial));
			
			drawX = getScreenX(this.lastX, this.x, partial);
			drawY = getScreenY(this.lastY, this.y, partial);
		}
		else 
		{
			drawX = getScreenX(this.x, partial);
			drawY = getScreenY(this.y, partial);
		}

		if (levelEditor && this.isKinematic && !this.isGhost)
		{
			context.beginPath();
			context.moveTo(getScreenX(this.moveRay.x + this.width * 0.5, partial), getScreenY(this.moveRay.y + this.height * 0.5, partial));
			context.lineTo(getScreenX(this.moveRay.x + this.moveRay.dx + this.width * 0.5, partial), getScreenY(this.moveRay.y + this.moveRay.dy + this.height * 0.5, partial));
			context.stroke();
		}
		
		var playable = this.isPlayable && this != player && !this.isGhost;

		if (playable)
		{
			context.fillStyle = "#FFC37F";
			context.strokeStyle = "#FF8800";
		}
			
		if (!this.isGhost)
			context.fillRect(drawX - 0.5, drawY + 0.5, this.width * scale + 1, -this.height * scale - 1);		
		
		if (!levelEditor && this.isGhost && activeGhost != null && activeGhostIndex < activeGhostLength || !this.isGhost && this.mass != 0 && !this.isKinematic && !playable && this != player && (levelEditor || Math.abs(player.x + player.width * 0.5 - this.x - this.width * 0.5) < 0.25) || (!levelEditor || liveEditor) && playable && squaredDistance(player.x + player.width * 0.5, player.y + player.height * 0.5, this.x + this.width * 0.5, this.y + this.height * 0.5) < playerSwitchDistance * playerSwitchDistance || levelEditor && levelEditorSelection == this)
			context.strokeRect(drawX, drawY, this.width * scale, -this.height * scale);
		
		if (playable)
		{
			context.fillStyle = "#FFFFFF";
			context.strokeStyle = "#FFC37F";
		}
			
		if (levelEditor && levelEditorSelection == this && this.mass > 0)
		{
			context.fillStyle = "#00FFFF";

			if (this.collisionBottom)
				context.fillRect(drawX, drawY, this.width * scale, -3);
			if (this.collisionTop)
				context.fillRect(drawX, drawY - this.height * scale, this.width * scale, 3);
			if (this.collisionLeft)
				context.fillRect(drawX, drawY, 3, -this.height * scale);
			if (this.collisionRight)
				context.fillRect(drawX + this.width * scale, drawY, -3, -this.height * scale);
			
			context.fillStyle = "#FFFFFF";
		}
	};
	
	this.copy = function()
	{
		if (this.isGhost)
			return this.ghostParent.copy();
		
		var copy = new Box(this.x, this.y, this.width, this.height, this.mass);
		copy.y += 0.1;
		
		if (this.isPlayable)
			copy.makePlayable();
		
		else if (this.isKinematic)
			copy.moveBetween(this.moveRay.x, this.moveRay.y, this.moveRay.x + this.moveRay.dx, this.moveRay.y + this.moveRay.dy, this.moveTimer, this.moveDuration, this.triggerId, this.loop);
	
		copy.setPhysicsAttributes(this.frictionX, this.frictionY, this.bouncynessX, this.bouncynessY);
	
		return copy;
	};
	
	this.remove = function()
	{
		if (this.isGhost)
			removeFromArray(ghostBoxes, this);
		
		else
		{
			if (this.ghost)
				this.ghost.remove();
			
			removeFromArray(boxes, this);
		}
		
		if (this.mass > 0)
		{
			if (this.isGhost)			
				removeFromArray(ghostDynamicBoxes, this);

			else
				removeFromArray(dynamicBoxes, this);
		}
		
		if (this.isPlayable)
			removeFromArray(playableBoxes, this);
		
		if (this.isKinematic)
			removeFromArray(triggerListeners, this);
		
		if (this == player)
			player = null;
		if (this == ghost)
			ghost = null;
	};
	
	this.export = function()
	{
		var data = "\t\tnew Box(" + this.x + ", " + this.y + ", " + this.width + ", " + this.height + (this.mass > 0 ?  ", " + this.mass : "") + ")";
		
		if (this.bouncynessX != 0.01 || this.bouncynessY != 0.01 || this.frictionX != 0.95 || this.frictionY != 0.95)
			data += ".setPhysicsAttributes(" + this.frictionX + ", " + this.frictionY + ", " + this.bouncynessX + ", " + this.bouncynessY + ")";

		if (this.isPlayable)
			data += ".makePlayable()";
		
		else if (this.isKinematic)
			data += ".moveBetween(" + this.moveRay.x + ", " + this.moveRay.y + ", " + (this.moveRay.x + this.moveRay.dx) + ", " + (this.moveRay.y + this.moveRay.dy) + ", " + this.moveTimer + ", " + this.moveDuration + (this.triggerId.length > 0 || !loop ? ", \"" + this.triggerId + "\", " + this.loop : "") + ")";
		
		return data + ";\n"
	};
}

var triangleRatio = 0.5 * Math.sqrt(3);
var widthPulse = 0;

function Triangle(x, y, size)
{
	boxes.push(this);
	dynamicBoxes.push(this);
	maxScore++;
	
	this.size = size == undefined ? 0.05 : size;
	this.lastX = this.x = x; 
	this.lastY = this.y = y;
	this.lastWidth = this.width = this.size;
	this.lastHeight = this.height = this.size * triangleRatio;
	this.mass = -1;
	this.lastRotation = this.rotation = Math.random() * Math.PI * 2;
	this.isCollected = false;
	this.widthPulse = (widthPulse -= Math.PI / 4);

	this.rays =
	[
		new Ray(x + this.width * 0.5, y + this.height, x + this.width, y),
		new Ray(x + this.width, y, x, y),
		new Ray(x, y, x + this.width * 0.5, y + this.height),
	];
	
	this.update = function(timestep)
	{
		this.lastX = this.x;
		this.lastY = this.y;
		this.lastRotation = this.rotation;
		this.lastWidth = this.width;
		this.lastHeight = this.height;
		
		if (this.isCollected)
		{
			this.x = lerp(this.x, scrollX + ratio - 0.44 * zoom, 0.04);
			this.y = lerp(this.y, scrollY + zoom * 0.95, 0.04);

			this.rotation *= 0.9;
			this.width *= 0.98;
			this.height = this.width * triangleRatio;
			
			if (this.width <= 0.005)
			{
				score++;		
				this.remove();
			}
		}
		else
		{
			this.rotation += timestep;

			this.width = (Math.cos(levelTime * 2.5 + this.widthPulse) * 0.25 + 1.25) * this.size;
			this.height = this.width * triangleRatio;
			
			var x1 = this.x - player.x - player.width * 0.5;
			var y1 = this.y - player.y - player.height * 0.5;

			if (x1 * x1 + y1 * y1 < this.size * this.size * 4 && !levelEditor)
			{
				this.mass = -2;
				this.rotation %= Math.PI * 2;
				this.lastRotation %= Math.PI * 2;
				this.isCollected = true;
			}
		}
	}
	
	this.draw = function(partial)
	{
		if (levelEditor && !liveEditor)
		{
			this.lastX = this.x;
			this.lastY = this.y;
		}
		
		var x = lerp(this.lastX, this.x, partial);
		var y = lerp(this.lastY, this.y, partial);
		var width = lerp(this.lastWidth, this.width, partial);
		var height = lerp(this.lastHeight, this.height, partial);

		this.rays[0].set(x, y + height * 2 / 3, x + width * 0.5, y - height * 1 / 3);
		this.rays[1].set(x + width * 0.5, y - height * 1 / 3, x - width * 0.5, y - height * 1 / 3);
		this.rays[2].set(x - width * 0.5, y - height * 1 / 3, x, y + height * 2 / 3);
		
		var rot = lerp(this.lastRotation, this.rotation, partial);
		for (var i = 0; i < this.rays.length; ++i)
			this.rays[i].rotateAround(x, y, rot);
		
		context.beginPath();
		context.moveTo(getScreenX(this.rays[0].x, partial), getScreenY(this.rays[0].y, partial)); 
		for (var i = 1; i < this.rays.length; ++i)
			context.lineTo(getScreenX(this.rays[i].x, partial), getScreenY(this.rays[i].y, partial)); 
		context.closePath();
		context.fill();
		
		if (!this.isCollected && (!levelEditor || liveEditor) && Math.abs(player.x + player.width * 0.5 - this.x - this.width * 0.5) < 0.25 || levelEditor && levelEditorSelection == this)
			context.stroke();
	}
	
	this.copy = function()
	{
		var copy = new Triangle(this.x, this.y, this.size);
		copy.y += 0.1;
		return copy;
	};
	
	this.remove = function()
	{
		removeFromArray(boxes, this);
		removeFromArray(dynamicBoxes, this);
		if (!this.isCollected)
			maxScore--;
	};
	
	this.export = function()
	{
		return "\t\tnew Triangle(" + this.x + ", " + this.y + (this.size != 0.05 ? ", " + this.size : "") + ");\n"
	};
}

function Searcher(x, y, radius, angle, rotation, rotationAngle, rotationOffset, rotationSpeed, ghostParent)
{
	this.isGhost = ghostParent != undefined;
	this.x = x;
	this.y = y;
	this.radius = radius;
	this.angle = angle;
	this.rotation = rotation;
	this.rotationAngle = rotationAngle;
	this.rotationOffset = rotationOffset;
	this.rotationSpeed = rotationSpeed;
	
	this.getLightRotation = function()
	{
		return Math.cos((this.isGhost ? levelTimeGhost : levelTime) * this.rotationSpeed + this.rotationOffset) * this.rotationAngle * 0.5 + this.rotation;
	};
	
	if (this.isGhost)
	{
		this.ghostParent = ghostParent;
		this.light = this.ghostParent.light;
		ghostDynamicGameobjects.push(this);
	}
	else
	{
		this.light = new Light(this.x, this.y, radius * 1.5, 0xFF, 0x22, 0x11, 0.75, this.angle, this.getLightRotation());
		this.light.owner = this;
		dynamicGameobjects.push(this);
		
		// this.ghost = new Searcher(x, y, radius, angle, rotation, rotationAngle, rotationOffset, rotationSpeed, this);
	}
	
	this.update = function(timestep)
	{
	    var box = player;
		var rot = this.getLightRotation();
		
		if (this.isGhost)
			box = ghost;
			
		else
		{
			this.light.lastRotation = this.light.rotation;
			this.light.rotation = rot;
		}
		
		var vec, t;
		var flag = false;
		for (var i = 0; i < box.rays.length; i++)
		{
			vec = this.light.rayTraceShadowPoint(box.rays[i].x, box.rays[i].y, 0);
			t = vec.angle;
			calcAngle(vec, this.light.x, this.light.y);
			if (isAngleInRange(vec.angle, rot - this.angle * 0.5, rot + this.angle * 0.5) && tracedBox == box && t <= this.radius)
			{
				flag = true;
				break;
			}
			releaseVector(vec);
		}
		
		if (flag && lastDiscoveredTimer <= 0)
			lastDiscoveredTimer = discoveredTimer = 1;
	};
	
	this.ghostReset = function() {}
	
	this.draw = function(partial)
	{
		if (drawLights || this.isGhost)
			return;
			
		var shadow = context.shadowBlur;
		context.shadowBlur = 0;
		this.light.draw(partial);
		context.shadowBlur = shadow;
	};
	
	this.copy = function()
	{
		if (this.isGhost)
			return this.ghostParent.copy();
		
		return new Searcher(this.x, this.y + 0.1, this.radius, this.angle, this.rotation, this.rotationAngle, this.rotationOffset, this.rotationSpeed);
	};
	
	this.remove = function()
	{
		if (!this.isGhost)
			this.ghost.remove();
		
		this.light.remove();
		removeFromArray(this.isGhost ? ghostDynamicGameobjects : dynamicGameobjects, this);
	};
	
	this.export = function()
	{
		return "\t\tnew Searcher(" + this.x + ", " + this.y + ", " + this.radius + ", " + this.angle + ", " + this.rotation + ", " + this.rotationAngle + ", " + this.rotationOffset + ", " + this.rotationSpeed + ");\n";	
	};
}

function Trigger(x, y, width, height, id, connection, inverted, ghostParent)
{
	this.isGhost = ghostParent != undefined;
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	this.id = id;
	this.connection = connection;
	this.isInverted = inverted;
	this.isActivated = inverted;
	this.lastLineDashOffset = this.lineDashOffset = 0;
	
	if (this.isGhost)
	{
		ghostDynamicGameobjects.push(this);
		this.ghostParent = ghostParent;
	}
	else
	{
		dynamicGameobjects.push(this);	
		this.ghost = new Trigger(x, y, width, height, id, connection, inverted, this);
	}
		
	this.update = function(timestep)
	{
		var lastIsAcitvated = this.isActivated;
		this.isActivated = this.isInverted;
		
		if (this.isGhost)
		{
			for (var i = 0; i < ghostDynamicBoxes.length; ++i)
				if (ghostDynamicBoxes[i].mass > 0 && ghostDynamicBoxes[i].x + ghostDynamicBoxes[i].width > this.x && ghostDynamicBoxes[i].x < this.x + this.width && ghostDynamicBoxes[i].y + ghostDynamicBoxes[i].height > this.y && ghostDynamicBoxes[i].y < this.y + this.height)
				{
					this.isActivated = !this.isInverted;
					break;
				}
		}
		else
			for (var i = 0; i < dynamicBoxes.length; ++i)
				if (dynamicBoxes[i].mass > 0 && dynamicBoxes[i].x + dynamicBoxes[i].width > this.x && dynamicBoxes[i].x < this.x + this.width && dynamicBoxes[i].y + dynamicBoxes[i].height > this.y && dynamicBoxes[i].y < this.y + this.height)
				{
					this.isActivated = !this.isInverted;
					break;
				}
			
		if (this.isActivated != lastIsAcitvated)
			this.updateTrigger();
		
		this.lastLineDashOffset = this.lineDashOffset;
		
		if (this.isActivated)
			this.lineDashOffset -= timestep;
	};
	
	this.updateTrigger = function()
	{
		for (var i = 0; i < triggerListeners.length; ++i)
			if (triggerListeners[i].isGhost == this.isGhost && triggerListeners[i].triggerId == this.id)
				triggerListeners[i].isActivated = this.isActivated;
	};
	
	this.updateTrigger();
	
	this.ghostReset = function() {}
	
	this.draw = function(partial)
	{
		if (this.connection.length < 2 && (this.x + this.width < lastScrollX || this.x > lastScrollX + ratio))
			return;
					
		context.lineDashOffset = lerp(this.lastLineDashOffset, this.lineDashOffset, partial) % 1 * 0.03 * scale;
		context.fillRect((this.x - animationTime % 1 * stripePatternWidth + 0.005) * scale, -(this.y + 0.005) * scale, (this.width - 0.01) * scale, -(this.height - 0.01) * scale);
		
		if (this.isActivated)
			context.strokeStyle = "#2797BC";
	
		context.strokeRect((this.x - animationTime % 1 * stripePatternWidth) * scale, -this.y * scale, this.width * scale, -this.height * scale);
		
		if (connection.length >= 2)
		{
			context.beginPath();
			context.moveTo((connection[0].x - animationTime % 1 * stripePatternWidth) * scale, -connection[0].y * scale);
			for (var i = 1; i < connection.length; ++i)
				context.lineTo((connection[i].x - animationTime % 1 * stripePatternWidth) * scale, -connection[i].y * scale);
			
			context.stroke();
			
			context.fillStyle = context.strokeStyle;
			context.fillRect((connection[connection.length - 1].x - animationTime % 1 * stripePatternWidth - 0.01) * scale, -(connection[connection.length - 1].y - 0.01) * scale, 0.02 * scale, -0.02 * scale);
			
			if (!this.isActivated)
				context.fillStyle = stripePattern;
		}
		
		if (this.isActivated)
			context.strokeStyle = "#2266A2";
	};
	
	this.copy = function()
	{
		if (this.isGhost)
			return this.ghostParent.copy();
		
		var copy = new Trigger(this.x, this.y, this.width, this.height, this.id, this.connection, this.isInverted);
		copy.y += 0.1;
		return copy;
	};
	
	this.remove = function()
	{
		if (!this.isGhost)
			this.ghost.remove();
		
		removeFromArray(this.isGhost ? ghostDynamicGameobjects : dynamicGameobjects, this);
	};
	
	this.export = function()
	{
		var data = "\t\tnew Trigger(" + this.x + ", " + this.y + ", " + this.width + ", " + this.height + ", \"" + this.id + "\", [";
		
		for (var i1 = 0; i1 < this.connection.length; ++i1)
		{
			if (i1 != 0)
				data += ",";
			data += " new Vector(" + this.connection[i1].x + ", " + this.connection[i1].y + ")";
		}
		
		return data + " ], " + this.isInverted + ");\n";
	};
}

function Text(x, y, textHeight, textSpacing, textColor, text)
{
	this.x = x;
	this.y = y;
	this.text = text;
	
	this.textHeight = textHeight;
	this.textSpacing = textSpacing;
	this.textColor = textColor;

	this.width = 0;
	this.height = 0;
	this.textCanvas = null;
	
	dynamicGameobjects.push(this);
	
	this.update = function(timestep) {}
	
	this.preDraw = function()
	{
		var textHeight = Math.floor(scale * this.textHeight);
		var textSpacing = this.textSpacing * scale;
		
		context.font = textHeight + "px Arial";
	
		this.width = 0;
		for (var i = 0; i < this.text.length; ++i)
			this.width = Math.max(this.width, Math.ceil(context.measureText(this.text[i]).width));
	
		this.height = textHeight * this.text.length + (this.text.length - 1) * textSpacing;
	
		this.width = Math.max(4, this.width + bloom * scale * 0.5);
		this.height = Math.max(4, this.height + bloom * scale * 0.5);
		
		this.textCanvas = document.createElement("canvas");
		this.textCanvas.width = this.width;
		this.textCanvas.height = this.height;
		var offscreenContext = this.textCanvas.getContext("2d");

		offscreenContext.clearRect(0, 0, this.width, this.height);		
		
		// offscreenContext.fillStyle = "#FF8800";	
		// offscreenContext.fillRect(0, 0, this.width, this.height);		

		offscreenContext.fillStyle = this.textColor;		
		offscreenContext.textAlign = "center";
		offscreenContext.textBaseline = "top";
		offscreenContext.font = textHeight + "px Arial";

		if (bloom > 0)
		{			
			offscreenContext.shadowColor = "rgba(0, 0, 0, 0.25)";
			offscreenContext.shadowBlur = bloom * scale * 0.5;
		}
		
		for (var i = 0; i < this.text.length; ++i)
			offscreenContext.fillText(this.text[i], this.width * 0.5, i * (textHeight + textSpacing));
		
		context.font = "bold " + Math.floor(canvas.height / 1.25 * 0.05) + "px Arial";
		
		this.width /= scale;
		this.height /= scale;
	};
	this.preDraw();
	
	this.draw = function(partial)
	{
		if (this.text.length < 1 || (this.x + this.width * 0.5 < lastScrollX || this.x - this.width * 0.5 > lastScrollX + ratio))
			return;
		
		context.drawImage(this.textCanvas, getScreenX(this.x - this.width * 0.5, partial), getScreenY(this.y + this.height * 0.5, partial));
		
		if (levelEditor && levelEditorSelection == this)
			context.strokeRect(getScreenX(this.x - this.width * 0.5, partial), getScreenY(this.y - this.height * 0.5, partial), this.width * scale, -this.height * scale);
	};
	
	this.copy = function()
	{
		var text1 = new Array(this.text.length);
		for (var i = 0; i < text1.length; ++i)
			text1[i] = this.text[i];
		return new Text(this.x, this.y + 0.1, this.textHeight, this.textSpacing, this.textColor, text1);
	};
	
	this.remove = function()
	{
		this.textCanvas = null;
		
		removeFromArray(dynamicGameobjects, this);
	};
	
	this.export = function()
	{
		var data = "\t\tnew Text(" + this.x + ", " + this.y + ", " + this.textHeight + ", " + this.textSpacing + ", \"" + this.textColor + "\", [";
			
		for (var i = 0; i < this.text.length; ++i)
		{
			if (i != 0)
				data += ",";
			data += " \"" + this.text[i] + "\"";
		}
			
		return data + " ]);\n";
	};
}

function isTriggerActivated(triggerId, isGhost)
{
	if (isGhost)
	{
		for (var i = 0; i < ghostDynamicGameobjects.length; ++i)
			if (ghostDynamicGameobjects[i] instanceof Trigger && ghostDynamicGameobjects[i].id == triggerId)
				return ghostDynamicGameobjects[i].isActivated;
	}
	else		
		for (var i = 0; i < dynamicGameobjects.length; ++i)
			if (dynamicGameobjects[i] instanceof Trigger && dynamicGameobjects[i].id == triggerId)
				return dynamicGameobjects[i].isActivated;
			
	return true;
}

var vectorPool;
var vectorPoolIndex = -1;	
		
function obtainVector(x, y)
{
	if (vectorPoolIndex < 0)
		return new Vector(x, y);
	
	var vec = vectorPool[vectorPoolIndex];
	vectorPool[vectorPoolIndex--] = null;
	vec.set(x, y);

	return vec;
}

function releaseVector(vec)
{
	if (vec == null)
		return;
	
	//if (vectorPoolIndex >= vectorPool.length - 1)
		//return;
	
	vectorPool[++vectorPoolIndex] = vec;
}
		
function Vector(x, y)
{
	this.set = function(x, y)
	{
		this.x = x;
		this.y = y;
		this.angle = 0;
	}
	
	this.set(x, y);
}

function calcAngle(vec, x1, y1)
{
	var x = vec.x - x1;
	var y = vec.y - y1;
	
	vec.angle = x < 0 ? 2 * Math.PI - Math.acos(y / Math.sqrt(x * x + y * y)) : Math.acos(y / Math.sqrt(x * x + y * y));
}

function squaredDistance(x1, y1, x2, y2)
{
	if (x2 == undefined)
	{
		x2 = y1.x;
		y2 = y1.y;
		y1 = x1.y;
		x1 = x1.x;
	}
	return (x1 - x2) * (x1 - x2) + (y1 - y2) * (y1 - y2);
}

function Ray(x1, y1, x2, y2)
{
	this.set = function(x1, y1, x2, y2)
	{
		this.x = x1;
		this.y = y1;
		this.dx = x2 - x1;
		this.dy = y2 - y1;
	};
	this.set(x1, y1, x2, y2);
	
	this.rotate = function(rad)
	{
		if (rad == 0)
			return;
	
		var cos = Math.cos(rad);
        var sin = Math.sin(rad);

		var x = this.dx * cos - this.dy * sin; 
		var y = this.dx * sin + this.dy * cos;
		
		this.dx = x;
		this.dy = y;
	};
	
	this.rotateAround = function(x1, y1, rad)
	{
		if (rad == 0)
			return;
		
		this.rotate(rad);
		
		this.x -= x1;
		this.y -= y1;
		
		var cos = Math.cos(rad);
        var sin = Math.sin(rad);

		var x = this.x * cos - this.y * sin; 
		var y = this.x * sin + this.y * cos;
		
		this.x = x + x1;
		this.y = y + y1;
	};
	
	this.normalize = function()
	{
		var length = Math.sqrt(this.dx * this.dx + this.dy * this.dy);
		this.dx /= length;
		this.dy /= length;
	};
	
	this.getVector = function(t)
	{
		return obtainVector(this.x + t * this.dx, this.y + t * this.dy);
	};
	
	this.intersection = function(ray)
	{
		// x + t1 * dx = x2 + t2 * dx2
		// y + t1 * dy = y2 + t2 * dy2
		// t1 = (x2 + t2 * dx2 - x) / dx 
		// y + (x2 + t2 * dx2 - x) / dx * dy = y2 + t2 * dy2
		// y + (x2 - x) / dx * dy - y2 = t2 * dy2 - t2 * dx2 / dx * dy
		// (y + (x2 - x) / dx * dy - y2) / (dy2 - dx2 / dx * dy) = t2
		
		var t1, t2;
		
		if (this.dx == 0)
		{
			if (ray.dx == 0 || this.dx / ray.dx == this.dy / ray.dy)
				return Infinity;
		
			t2 = (this.x + (ray.y - this.y) / this.dy * this.dx - ray.x) / (ray.dx - ray.dy / this.dy * this.dx);
			t1 = (ray.y + t2 * ray.dy - this.y) / this.dy;
		}
		else
		{
			if (this.dy == 0 && ray.dy == 0 || this.dx / ray.dx == this.dy / ray.dy)
				return Infinity;
		
			t2 = (this.y + (ray.x - this.x) / this.dx * this.dy - ray.y) / (ray.dy - ray.dx / this.dx * this.dy);
			t1 = (ray.x + t2 * ray.dx - this.x) / this.dx;
		}
		
		if (t1 < 0 || t2 < 0 || t2 > 1)
			return Infinity;
			
		return t1;
	};
}

function Zone(width, gravityModifier, x)
{
	zones.push(this);
	
	if (zones.length == 1)
		this.x = x == undefined ? 0 : x;
	else
		this.x = zones[zones.length - 2].maxX;
	
	this.width = width;
	this.maxX = this.x + this.width;
	this.gravityModifier = gravityModifier;
	this.ghostGravityModifier = this.gravityModifier;
	
	this.draw = function(partial)
	{
		var x = getScreenX(this.maxX);
		
		if (x < 0 || x > ratio * scale)
			return;
		
		context.moveTo(x, getScreenY(2, partial));
		context.lineTo(x, getScreenY(-2, partial));
	}
	
	this.remove = function()
	{
		removeFromArray(zones, this);
	}
	
	this.export = function(first)
	{
		return "\t\tnew Zone(" + this.width + ", " + this.gravityModifier + (first && this.x != 0 ? ", " + this.x : "") + ");\n";
	};
}

function Background(x, y, width, height)
{
	background.push(this);
	
	this.x = x;
	this.y = y;
	this.width = width;
	this.height = height;
	
	this.draw = function(partial)
	{		
		if (this.x + this.width < lastScrollX || this.x > lastScrollX + ratio)
			return;
		
		if (levelEditorSelection == this)
			context.fillStyle = "#0058a4";
		
		context.fillRect(getScreenX(this.x, partial), getScreenY(this.y, partial), this.width * scale + 0.5, -this.height * scale - 0.5);
		
		if (levelEditorSelection == this)
			context.fillStyle = "#004c92";
	}
	
	this.copy = function()
	{
		return new Background(this.x, this.y + 0.1, this.width, this.height);
	}
	
	this.remove = function()
	{
		removeFromArray(background, this);
	}
	
	this.export = function()
	{
		return "\t\tnew Background(" + this.x + ", " + this.y + ", " + this.width + ", " + this.height + ");\n";
	};
}

function Particle()
{
	this.x = this.y = this.lastX = this.lastY = 0;
	this.driftX = 1, this.driftY = 1;
	this.velX = this.velY = 0;
	this.lifeTime = this.maxLifeTime = 0;
	this.size = this.lastSize = this.startSize = 0;
	
	this.spawn = function()
	{
		this.lastX = this.x = (Math.random() * 1.5 - 0.5) * ratio + scrollX;
		this.lastY = this.y = (Math.random() * 1.1 - 0.05) * zoom + scrollY;
		this.velX = Math.random() * 0.1;
		this.velY = -getZone(this.x).gravityModifier * (Math.random() * 0.1 + 0.05);
		this.lifeTime = this.maxLifeTime = 5 + Math.random() * 5;
		this.lastSize = this.size = this.startSize = 0.005 + Math.random() * 0.01;
		this.driftX = 1.0 - Math.random() * 0.02;
		this.driftY = 1.0 - Math.random() * 0.01;
	};
	
	this.update = function(timestep)
	{
		this.lifeTime -= timestep;
		
		if (this.lifeTime < 0)
			this.spawn();
		
		this.lastSize = this.size;
		this.lastX = this.x;
		this.lastY = this.y;
		
		this.x += this.velX * timestep;
		this.y += this.velY * timestep;
		this.size = this.lifeTime / this.maxLifeTime * this.startSize;
		
		var dx = this.x - player.x - player.width * 0.5;
		var dy = this.y - player.y - player.height * 0.5;
		var dist = Math.max(0, 0.4 - Math.sqrt(dx * dx + dy * dy));
		
		this.velX += sign(dx) * dist * timestep * 1;
		this.velY += sign(dy) * dist * timestep * 1;
		this.velX *= this.driftX;
		this.velY *= this.driftY;	
	};
	
	this.draw = function(partial)
	{
		var x = getScreenX(this.lastX, this.x, partial);
		var y = getScreenY(this.lastY, this.y, partial);
		var size = lerp(this.lastSize, this.size, partial) * scale;

		if (x + size < 0 || x - size > ratio * scale)
			return;
	
		//context.moveTo(x + size, y);
		//context.arc(x, y, size, 0, Math.PI * 2);
		//context.rect(x - size, y + size, size * 2, -size * 2);
		context.fillRect(x - size, y + size, size * 2, -size * 2);
	}
}

function getZone(worldX)
{
	if (zones.length == 0)
		new Zone(0, 1);
	
	for (var i = 0; i < zones.length; ++i)
		if (worldX < zones[i].maxX)
			return zones[i];
		
	return zones[zones.length - 1];
}

function getGravity(worldX, isGhost)
{
	return isGhost ? getZone(worldX).ghostGravityModifier * gravity : getZone(worldX).gravityModifier * gravity;
}

function getScreenX(lastWorldX, worldX, partial)
{
	if (partial == undefined)
	{
		if (worldX == undefined)
			return (lastWorldX - scrollX) * scale;
	
		partial = worldX;
		worldX = lastWorldX;
	}
	else if (levelEditor && !liveEditor || levelTransitionTimer > 0.25)
		lastWorldX = worldX;
	
	return lerp(lastWorldX - lastScrollX, worldX - scrollX, partial) * scale;
}

function getScreenY(lastWorldY, worldY, partial)
{
	if (partial == undefined)
	{
		if (worldY == undefined)
			return (zoom - lastWorldY - scrollY) * scale;
		
		partial = worldY;
		worldY = lastWorldY;
	}
	else if (levelEditor && !liveEditor || levelTransitionTimer > 0.25)
		lastWorldY = worldY;
		
	return (zoom - lerp(lastWorldY - lastScrollY, worldY - scrollY, partial)) * scale;
}

function lerp(a, b, partial)
{
	return a * (1 - partial) + b * partial;
}

function sign(a)
{
	return a < 0 ? -1 : (a > 0 ? 1 : 0);
}

function isAngleInRange(n, a, b)
{
	n = (Math.PI * 2 + (n % (Math.PI * 2))) % (Math.PI * 2);
	a = (Math.PI * 20000 + a) % (Math.PI * 2);
	b = (Math.PI * 20000 + b) % (Math.PI * 2);

	if (a < b)
		return a <= n && n <= b;
	
	return a <= n || n <= b;
}

function indexOf(array, obj)
{
	for (var i = 0; i < array.length; ++i)
		if (array[i] == obj)
			return i;
		
	return -1;
}

function removeFromArray(array, obj)
{
	for (var i = 0; i < array.length; ++i)
		if (array[i] == obj)
		{			
			array.splice(i, 1);
			break;
		}
}

function onMouseDown(event)
{
	if (showScore)
	{
		showScore = false;
		return;
	}
	
	if (!levelEditor)
		return;
	
    event = event || window.event;
	
	var x = (event.pageX * scaleFactor - canvasLeft) / scale + scrollX;
	var y = zoom - (event.pageY * scaleFactor - canvasTop) / scale + scrollY;
	
	selectLevelEditor(x, y, event.shiftKey);
}

function selectLevelEditor(x, y, scale)
{
	var selected = null;
	var distance, selectedDistance = Infinity;
	
	if (levelEditorSelection == background || levelEditorSelection instanceof Background)		
		for (var i = 0; i < background.length; ++i)
			if (x > background[i].x && x < background[i].x + background[i].width && y > background[i].y && y < background[i].y + background[i].height)
			{
				selected = background[i];
				break;
			}
		
	if (selected == null)
		for (var i = 0; i < boxes.length; ++i)
			if (boxes[i] instanceof Triangle ? squaredDistance(x, y, boxes[i].x, boxes[i].y) < boxes[i].size * boxes[i].size : x > boxes[i].x && x < boxes[i].x + boxes[i].width && y > boxes[i].y && y < boxes[i].y + boxes[i].height)
			{
				selected = boxes[i];
				break;
			}
		
	if (selected == null)
		for (var i = 0; i < dynamicGameobjects.length; ++i)
			if (dynamicGameobjects[i] instanceof Trigger && x > dynamicGameobjects[i].x && x < dynamicGameobjects[i].x + dynamicGameobjects[i].width && y > dynamicGameobjects[i].y && y < dynamicGameobjects[i].y + dynamicGameobjects[i].height)
			{
				selected = dynamicGameobjects[i];
				break;
			}
			else if (dynamicGameobjects[i] instanceof Text && x > dynamicGameobjects[i].x - dynamicGameobjects[i].width * 0.5 && x < dynamicGameobjects[i].x + dynamicGameobjects[i].width * 0.5 && y > dynamicGameobjects[i].y - dynamicGameobjects[i].height * 0.5 && y < dynamicGameobjects[i].y + dynamicGameobjects[i].height * 0.5)
			{
				selected = dynamicGameobjects[i];
				break;
			}
			else if ((distance = squaredDistance(dynamicGameobjects[i].x, dynamicGameobjects[i].y, x, y)) < dynamicGameobjects[i].radius * dynamicGameobjects[i].radius * 0.25 && distance < selectedDistance)
			{
				selectedDistance = distance;
				selected = dynamicGameobjects[i];
			}
	
	if (selected == null)	
		for (var i = 0; i < lights.length; ++i)
			if (!lights[i].owner && (distance = squaredDistance(lights[i].x, lights[i].y, x, y)) < lights[i].radius * lights[i].radius * 0.25 && distance < selectedDistance)
			{
				selectedDistance = distance;
				selected = lights[i];
			}
			
	if (selected == levelEditorSelection)
	{
		levelEditorDrag = true;
		levelEditorScaleDrag = scale && (selected.width != undefined || selected.radius != undefined);
		levelEditorDragX = x;
		levelEditorDragY = y;
	}
	else if (selected == null)
		updateLevelEditor()
	else
		updateLevelEditor(selected);
}

function onMouseUp(event)
{
	event = event || window.event;
	
	if (levelEditorDrag)
	{
		levelEditorDrag = levelEditorScaleDrag = false;

		if (levelEditor)
			updateLevelEditor(levelEditorSelection);
	}
}

function onMouseMove(event)
{
	event = event || window.event;

	if (levelEditor && levelEditorDrag)
	{
		var x = (event.pageX * scaleFactor - canvasLeft) / scale + scrollX;
		var y = zoom - (event.pageY * scaleFactor - canvasTop) / scale + scrollY;
	
		updateLevelEditorDrag(x, y);
	}
}

function updateLevelEditorDrag(x, y)
{
	if (levelEditorScaleDrag)
	{
		if (levelEditorSelection.width != undefined)
		{
			levelEditorSelection.width += x - levelEditorDragX;
			levelEditorSelection.height += y - levelEditorDragY;
			
			levelEditorSelection.width = Math.max(levelEditorSelection.width, 0.01);
			levelEditorSelection.height = Math.max(levelEditorSelection.height, 0.01);
		}
		else
		{
			levelEditorSelection.radius += Math.sqrt(squaredDistance(levelEditorSelection.x, levelEditorSelection.y, x, y)) - Math.sqrt(squaredDistance(levelEditorSelection.x, levelEditorSelection.y, levelEditorDragX, levelEditorDragY));					
			levelEditorSelection.radius = Math.max(levelEditorSelection.radius, 0.01);
		}
	}
	else if (levelEditorSelection == null)
	{
		scrollX -= x - levelEditorDragX;
		scrollY -= y - levelEditorDragY;
		x = levelEditorDragX;
		y = levelEditorDragY;
	}
	else
	{		
		levelEditorSelection.x += x - levelEditorDragX;
		levelEditorSelection.y += y - levelEditorDragY;
	}
		
	levelEditorDragX = x;
	levelEditorDragY = y;
		
	onAttributeChanged();
}
	
function onMouseWheel(event)
{
	event = event || window.event;
	
	if (levelEditor)
	{
		zoom += event.deltaY * 0.005;
		onResize();
	}
}

function onKeyDown(event)
{
	if (showScore)
	{
		if (event.keyCode == 82)
		{
			transitionType = TransitionType.LEVEL;
			levelIndex--;
		}
		
		showScore = false;
		return;
	}
	
	if (levelEditor && textInputFocus)
		return;
	
	event = event || window.event;

	if (!levelEditor && event.keyCode == 32)
		up = down = true;
	
	else if (event.keyCode == 38 || event.keyCode == 87)
		up = true;
	
	else if (event.keyCode == 40 || event.keyCode == 83)
		down = true;
	
	else if (event.keyCode == 37 || event.keyCode == 65)
		left = true;
	
	else if (event.keyCode == 39 || event.keyCode == 68)
		right = true;
	
	else if (event.keyCode == 69)
		switchPlayer = true;
	
	else if (event.keyCode == 82)
		loadLevel(levelIndex);
	
	
	else if (!levelEditor && allowLevelEditor && event.keyCode == 13)
	{
		calculateScore();
		levelTransitionTimer = lastLevelTransitionTimer = 1;
		transitionType = levelIndex == levels.length - 1 ? TransitionType.CREDITS : TransitionType.LEVEL;
		if (levelIndex == levels.length - 1)
		{
			allowLevelEditor = true;
			setCookie("allowLevelEditor", "true", 365);
			document.getElementById('levelEditorMessage').style.display = 'inline-block';
		}
	}
	
	
	else if (levelEditor && event.keyCode == 109)
	{
		zoom += 0.1;
		onResize();
	}
	else if (levelEditor && event.keyCode == 107)
	{
		zoom -= 0.1;
		onResize();
	}		
	else if (event.keyCode == 70)
	{
		if (!document.fullscreenElement && !document.webkitFullscreenElement && !document.webkitCurrentFullscreenElement && !document.mozFullScreenElement && !document.msFullscreenElement)
			enableFullscreen();
	}
	else if (event.keyCode == 84)
	{
		displayFPS = !displayFPS;
		document.getElementById("fps").checked = displayFPS;
	}
	else if (allowLevelEditor && (event.keyCode == 191 || event.keyCode == 220 || event.keyCode == 163))
	{		
		if (levelEditor && player == null)
		{
			if (playableBoxes.length > 0)
			{
				reset(false);
				levelEditor = false;
			}
			else
				alert("There are no playable boxes! Can't resume game.");
		}
		else
			levelEditor = !levelEditor;
		
		updateLevelEditor();
	}
	else if (event.keyCode == 189)
	{
		if (levelEditor && !liveEditor && player == null)
		{
			if (playableBoxes.length > 0)
			{
				reset(false);
				liveEditor = true;
			}
			else
				alert("There are no playable boxes! Can't resume game.");
		}
		else if (levelEditor)
			liveEditor = !liveEditor;
	}
	else if (event.keyCode == 27)
	{
		if (levelEditor)
		{
			if (levelEditorSelection instanceof Zone)
				updateLevelEditor(zones);

			else if (levelEditorSelection instanceof Background)
				updateLevelEditor(backgrounds);
			
			else if (levelEditorSelection == null)
				togglePause();

			else
				updateLevelEditor();
		}
		else
			togglePause();
	}
	else if (event.keyCode == 46)	
		if (levelEditor && levelEditorSelection && levelEditorSelection.remove)
		{
			levelEditorSelection.remove(); 
			onAttributeChanged();
			updateLevelEditor();
		}
}

function onKeyUp(event)
{	
	event = event || window.event;

	if (event.keyCode == 37 || event.keyCode == 65)
		left = false;
	
	else if (event.keyCode == 39 || event.keyCode == 68)
		right = false;
	
	else if (!levelEditor && event.keyCode == 32)
		up = down = false;
	
	else if (event.keyCode == 38 || event.keyCode == 87)
		up = false;
	
	else if (event.keyCode == 40 || event.keyCode == 83)
		down = false;
}

var zoomGestureInitialDist, zoomGestureInitialZoom;

function onTouchDown(event)
{
	event = event || window.event;

    event.preventDefault();
    event.stopPropagation();
	
	if (showScore)
	{
		showScore = false;
		return;
	}
	
	var x = (event.changedTouches[0].pageX * scaleFactor - canvasLeft) / canvas.width;
	var y = (event.changedTouches[0].pageY * scaleFactor - canvasTop) / canvas.height;
	
	if (levelEditor)
	{
		if (event.touches.length == 2)
		{
			zoomGestureInitialDist = Math.sqrt(squaredDistance(event.touches[0].pageX, event.touches[0].pageY, event.touches[1].pageX, event.touches[1].pageY)) / canvas.height;
			zoomGestureInitialZoom = zoom;
			
			if (levelEditorDrag)
			{
				levelEditorDrag = levelEditorScaleDrag = false;

				if (levelEditor)
					updateLevelEditor(levelEditorSelection);
			}
		}
		else
			selectLevelEditor(scrollX + x * ratio, scrollY + (1 - y) * zoom, false);
	
	}
	else
	{
		if (x < 0.25)
			left = true;
		else if (x > 0.75)
			right = true;
		else
			switchPlayer = true;
		
		if (y < 0.5)
			up = true;
	
		else if (y > 0.5)
			down = true;
	}
	
		
	if (event.targetTouches.length == 3)
	{		
		if (levelEditor && player == null)
		{
			if (playableBoxes.length > 0)
			{
				reset(false);
				levelEditor = false;
			}
			else
				alert("There are no playable boxes! Can't resume game.");
		}
		else
			levelEditor = !levelEditor;
		
		updateLevelEditor();
		
		left = right = up = down = false;
	}
}

function onTouchMove(event)
{
	event = event || window.event;

    event.preventDefault();
    event.stopPropagation();
	
	if (levelEditor)
	{
		if (levelEditorDrag)
		{
			var x = scrollX + (event.changedTouches[0].pageX * scaleFactor - canvasLeft) / scale;
			var y = scrollY + zoom - (event.changedTouches[0].pageY * scaleFactor - canvasTop) / scale;
	
			updateLevelEditorDrag(x, y);
		}
		else if (event.touches.length == 2)
		{
			var dist = Math.sqrt(squaredDistance(event.touches[0].pageX, event.touches[0].pageY, event.touches[1].pageX, event.touches[1].pageY)) / canvas.height;
			zoom += zoomGestureInitialZoom + (dist - zoomGestureInitialDist) * 0.5;
			onResize();
		}
	}
}

function onTouchUp(event)
{
	event = event || window.event;

    event.preventDefault();
    event.stopPropagation();
	
	left = right = false;
	
	if (levelEditor)
		up = down = false;
		
	if (levelEditorDrag)
	{
		levelEditorDrag = levelEditorScaleDrag = false;

		if (levelEditor)
			updateLevelEditor(levelEditorSelection);
	}
}

function setCookie(name, value, exdays)
{
    var d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    var expires = "expires="+ d.toUTCString();
    document.cookie = name + "=" + value + ";" + expires + ";path=/";
} 

function getCookie(name1)
{
    var name = name1 + "=";
    var decodedCookie = decodeURIComponent(document.cookie);
    var ca = decodedCookie.split(';');
    for(var i = 0; i <ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') {
            c = c.substring(1);
        }
        if (c.indexOf(name) == 0) {
            return c.substring(name.length, c.length);
        }
    }
    return "";
} 
