levels.push(
{
	title: "Level 7",
	message: "Found it!",

	startX: 0,
	startY: 1.25,
	finishX: 2.625,
	finishY: 1.65,

	playerSwitchDistance: 0.5,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0.2,

	initialZoom: 1.25,
	whiteUI: true,

	referenceScore: 600,

	load: function()
	{
		new Box(-0.0375, 1.2125, 0.075, 0.075, 1).makePlayable();
		new Box(1.7625, 0, 0.075, 0.075, 1).makePlayable();

		new Box(2.5, 0.1, 0.1, 0.1, 3).setPhysicsAttributes(0.99, 0.99, 1, 0.01);
		new Box(3.55, 0.5, 0.5, 0.05);
		new Box(1.75, -0.125, 0.1, 0.1);
		new Box(-0.05, 0.5, 0.1, 0.1, 10).moveBetween(-0.05, 0.5, -0.05, 1, 0, 4);
		new Box(0.2, 1, 0.1, 0.1, 10).moveBetween(0.2, 0.5, 0.2, 1, 1, 4);
		new Box(1, 0.5, 0.1, 0.1, 10).moveBetween(0.5, 0.5, 1, 0.5, 1, 5);
		new Box(0.7, 1, 0.1, 0.1, 10).moveBetween(0.7, 1, 1.7, 1, 0, 6);
		new Box(1.5, 0.5, 0.1, 0.1, 10).moveBetween(1.5, 0.5, 2, 0, 0, 5);
		new Box(3.25, -0.5, 0.25, 0.05, 10).moveBetween(3.25, -0.5, 3.25, 0.75, 0, 10);
		new Box(2.125, 0, 1, 0.05, 10).setPhysicsAttributes(1.01, 0.99, 0.01, 0.01).moveBetween(2.125, 0, 2.125, 1.5, 0, 10, "1", true);

		new Triangle(4, 0.65);
		new Triangle(1.55, 0.7);
		new Triangle(0.55, 0.7);
		new Triangle(1.05, 0.7);
		new Triangle(1.75, 1.5);
		new Triangle(1.75, 1.6);
		new Triangle(1.75, 1.4);
		new Triangle(0.25, 1.5);
		new Text(2.625, -0.05, 0.04, 0.01, "#00CCFF", [ "Warning: Slippery" ]);
		new Text(1.8, -0.2, 0.04, 0.01, "#00CCFF", [ "Save Point" ]);
		new Trigger(3.75, 0.575, 0.1, 0.1, "1", [ new Vector(3.8, 0.675), new Vector(3.8, 0.85), new Vector(3.15, 0.85), new Vector(3.15, 0.025), new Vector(3.125, 0.025) ], false);

		new Light(2.625, 1.65, 0.5, 0, 255, 255, 0.25);
		new Light(0.5, 1.3, 0.5, 0, 255, 255, 0.35);
		new Light(0.125, 0.8, 0.5, 0, 255, 255, 0.5);
		new Light(1.7, 0.1, 0.5, 0, 255, 255, 0.5);
		new Light(1.9, 1.5, 0.5, 0, 255, 255, 0.5);
		new Light(3.8, 0.675, 0.5, 0, 255, 255, 0.5);
		new Light(3.2, 0.5, 0.5, 0, 255, 255, 0.5);
		new Light(1.3, 0.85, 0.75, 0, 255, 255, 0.5);

		new Zone(0, 1);
	}
});
