levels.push(
{
	title: "Level 4",
	message: "Will It Move?",

	startX: -0.25,
	startY: 0.35,
	finishX: 0.25,
	finishY: 0.7,

	playerSwitchDistance: 0.25,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0,

	initialZoom: 1.25,
	whiteUI: true,

	referenceScore: 40,

	load: function()
	{
		new Box(-0.2875, 0.3125, 0.075, 0.075, 1).makePlayable();

		new Box(-0.55, -0.15, 0.05, 1);
		new Box(-0.5, -0.15, 1, 0.05);
		new Box(0.5, -0.15, 0.05, 1);
		new Box(-0.5, 0.8, 1, 0.05);
		new Box(0.15, 0.05, 0.2, 0.05, 10).moveBetween(0.15, 0.05, 0.15, 0.5, 0, 5, "platform");

		new Text(-0.1125, 0.1, 0.03, 0.01, "#00CCFF", [ "Stripy Things Can Activate Something" ]);
		new Trigger(-0.485, -0.085, 0.1, 0.1, "platform", [ new Vector(-0.435, 0.015), new Vector(-0.435, 0.075), new Vector(0.15, 0.075) ], false);

		new Light(-0.35, 0.65, 1, 0, 255, 255, 0.5, 0, 0);
		new Light(0.35, 0, 0.75, 0, 255, 255, 0.25, 0, 0);

		new Zone(0, 1);

		new Background(-0.5, -0.15, 1, 1);
	}
});