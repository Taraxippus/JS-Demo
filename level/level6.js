levels.push(
{
	title: "Level 6",
	message: "Hide and Seek",

	startX: -0.25,
	startY: 0.175,
	finishX: 2.45,
	finishY: 0.075,

	playerSwitchDistance: 0.5,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0,

	initialZoom: 1.25,
	whiteUI: true,

	referenceScore: 120,

	load: function()
	{
		new Box(-0.2875, 0.135, 0.075, 0.075, 1).makePlayable();
		new Box(-0.45, -0.125, 0.075, 0.075, 1).makePlayable();

		new Box(-0.5, -0.225, 3, 0.05);
		new Box(-0.5, -0.025, 3, 0.05);
		new Box(-0.5, 0.875, 0.5, 0.05);
		new Box(-0.55, -0.225, 0.05, 1.15);
		new Box(2.5, -0.225, 0.05, 1.15);
		new Box(2, 0.875, 0.5, 0.05);
		new Box(0, 0.475, 2, 0.05);
		new Box(-0.05, 0.475, 0.05, 0.4);
		new Box(2, 0.475, 0.05, 0.4);

		new Text(-0.25, 0.26, 0.03, 0.01, "#00CCFF", [ "Red Lights Are Evil" ]);
		new Searcher(0.25, 0.474, 0.5, 0.39269908169872414, 3.141592653589793, 0.7853981633974483, 0, 0.5);
		new Searcher(1.75, 0.474, 0.5, 0.39269908169872414, 3.141592653589793, 0.7853981633974483, 4.71238898038469, 0.5);
		new Searcher(0.75, 0.474, 0.5, 0.39269908169872414, 3.141592653589793, 0.7853981633974483, 1.5707963267948965, 0.5);
		new Searcher(1.25, 0.474, 0.5, 0.39269908169872414, 3.141592653589793, 0.7853981633974483, 3.141592653589793, 0.5);

		new Light(-0.3, 0.625, 0.75, 0, 255, 255, 0.5, 0, 0);
		new Light(2.3, 0.625, 0.75, 0, 255, 255, 0.5, 0, 0);
		new Light(1, -0.026, 1, 0, 255, 255, 0.5, 0, 0);

		new Zone(0, 1);

		new Background(-0.55, -0.225, 0.55, 1.1);
		new Background(2, -0.225, 0.5, 1.1);
		new Background(0, -0.175, 2, 0.65);
	}
});