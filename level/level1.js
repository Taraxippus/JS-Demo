levels.push(
{
	title: "Level 1",
	message: "ʎʇıʌɐɹ⅁",

	startX: -0.25,
	startY: 0.35,
	finishX: 0.25,
	finishY: 0.6,

	playerSwitchDistance: 0.25,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0,

	initialZoom: 1.25,
	whiteUI: true,

	referenceScore: 20,
	
	load: function()
	{
		new Box(-0.2875, 0.3125, 0.075, 0.075, 1).makePlayable();

		new Box(-0.55, -0.15, 0.05, 1);
		new Box(-0.5,  -0.15, 1, 0.05);
		new Box(0.5,  -0.15, 0.05, 1);
		new Box(-0.5, 0.8, 1, 0.05);

		new Text(-0.25, 0.45, 0.04, 0.01, "#00CCFF", [ "Use WSAD To Move" ]);
		new Text(-0.25, 0.4125, 0.025, 0.01, "#00CCFF", [ "Press F For Fullscreen" ]);
		new Text(0.25, -0.05, 0.03, 0.01, "#00CCFF", [ "Gravity Can Change" ]);

		new Light(-0.35, 0.65, 1, 0, 255, 255, 0.5, 0, 0);
		new Light(0.25, 0.1, 0.75, 0, 255, 255, 0.25, 0, 0);

		new Zone(0, 1);
		new Zone(1, -1);
		
		new Background(-0.5, -0.15, 1, 1);
	}
});