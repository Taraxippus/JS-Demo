levels.push(
{
	title: "Level 8",
	message: "Wait where is Level 7?",

	startX: 0,
	startY: 0.4,
	finishX: 3,
	finishY: 0.2,

	playerSwitchDistance: 0.5,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0.2,

	initialZoom: 1.25,
	whiteUI: true,

	referenceScore: 600,

	load: function()
	{
		new Box(-0.0375, 0.3625, 0.075, 0.075, 1).makePlayable();

		new Box(-0.05, 0.8, 0.1, 0.1, 5).setPhysicsAttributes(0.99, 0.99, 1, 0.1);
		new Box(-0.5, 0.1, 1, 0.05);
		new Box(-0.8, -0.1, 0.1, 0.1);
		new Box(-1.2, -0.1, 0.1, 0.1);
		new Box(-1.2, 0.4, 0.1, 0.1);
		new Box(-0.25, 0.75, 0.5, 0.05);
		new Box(2.95, 0.1, 0.1, 0.05);
		new Box(-1.2, 0.9, 0.1, 0.1);
		new Box(0.75, 0.1, 0.2, 0.05, 10).moveBetween(0.75, 0.1, 2.5, 0.1, 0, 10, "1");

		new Text(0, 0.7, 0.03, 0.01, "#00CCFF", [ "Some Blocks Can Be Moved" ]);
		new Triangle(-0.75, 0.1);
		new Triangle(-1.15, 0.1);
		new Triangle(-1.3, 0.45);
		new Triangle(-1, 0.95);
		new Triangle(-1.15, 1.1);
		new Triangle(0, 1.25);
		new Triangle(1.475, 0.35);
		new Triangle(1.725, 0.4);
		new Triangle(1.975, 0.35);

		new Trigger(0.385, 0.165, 0.1, 0.1, "1", [ new Vector(0.435, 0.265), new Vector(0.435, 0.315), new Vector(0.585, 0.315), new Vector(0.585, 0.125), new Vector(0.75, 0.125) ], false);

		new Light(0, 1.4, 0.75, 0, 255, 255, 0.25, 0, 0);
		new Light(0, 0.5, 0.5, 0, 255, 255, 0.5, 0, 0);
		new Light(-1.15, 0.7, 0.5, 0, 255, 255, 0.5, 0, 0);
		new Light(1.225, 0.4, 0.5, 0, 255, 255, 0.5, 0, 0);
		new Light(-1.15, 0.2, 0.5, 0, 255, 255, 0.5, 0, 0);
		new Light(2.225, 0.4, 0.5, 0, 255, 255, 0.5, 0, 0);
		new Light(3, 0.4, 0.75, 0, 255, 255, 0.5, 0, 0);

		new Zone(1, -0.1, -2.15);
		new Zone(1, 1);
	}
});
