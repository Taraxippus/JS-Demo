levels.push(
{
	title: "Level 5",
	message: "Skill",

	startX: 0,
	startY: 0.25,
	finishX: -1.2,
	finishY: 1,

	playerSwitchDistance: 0.25,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0.2,

	initialZoom: 1.25,
	whiteUI: true,

	referenceScore: 240,
	
	load: function()
	{
		new Box(-0.0375, 0.2125, 0.075, 0.075, 1).makePlayable();

		new Box(-0.25, 0, 0.5, 0.05);
		new Box(-0.5, 0, 0.1, 0.1);
		new Box(-0.75, 0.25, 0.1, 0.1);
		new Box(-0.5, 0.5, 0.1, 0.1);
		new Box(-1, 0.75, 0.1, 0.1);
		new Box(-1.25, 0.75, 0.1, 0.1);

		new Text(-0.45, -0.05, 0.03, 0.01, "#00CCFF", [ "Triangles Are Good" ]);
		new Text(0.45, -0.05, 0.03, 0.01, "#00CCFF", [ "Falling Down Is Bad" ]);
		new Triangle(-0.45, 0.15);
		new Triangle(-0.7, 0.4);
		new Triangle(-0.45, 0.65);
		new Triangle(-0.95, 0.9);
		new Triangle(0.25, 0.75);

		new Light(-0.75, 0.7, 0.75, 0, 255, 255, 0.5, 0, 0);
		new Light(0, 0.35, 0.75, 0, 255, 255, 0.5, 0, 0);
		new Light(0, 0.4, 0.75, 0, 255, 255, 0.5, 0, 0);

		new Zone(0, 1);
	}
});