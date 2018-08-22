levels.push(
{
	title: "Level 3",
	message: "It Moves!",

	startX: -0.25,
	startY: 0.35,
	finishX: 0.25,
	finishY: 0.7,

	playerSwitchDistance: 0.25,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0,

	initialZoom: 1.25,
	whiteUI: true,

	referenceScore: 30,

	load: function()
	{
		new Box(-0.2875, 0.3125, 0.075, 0.075, 1).makePlayable();

		new Box(-0.55, -0.15, 0.05, 1);
		new Box(-0.5, -0.15, 1, 0.05);
		new Box(0.5, -0.15, 0.05, 1);
		new Box(-0.5, 0.8, 1, 0.05);
		new Box(0.15, 0.05, 0.2, 0.05, 10).moveBetween(0.15, 0.05, 0.15, 0.5, 0, 5, "", false);

		new Text(-0.25, 0.45, 0.04, 0.01, "#00CCFF", [ "Use R To Restart" ]);
		new Text(0.25, 0, 0.03, 0.01, "#00CCFF", [ "Some Blocks Move" ]);

		new Light(-0.35, 0.65, 1, 0, 255, 255, 0.5, 0, 0);
		new Light(0.35, 0.0, 0.75, 0, 255, 255, 0.25, 0, 0);

		new Zone(0, 1);
		
		new Background(-0.5, -0.15, 1, 1);
	}
});