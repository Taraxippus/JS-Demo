levels.push(
{
	title: "Debug Level",
	message: "Let's debug!",

	startX: 0,
	startY: 0.75,
	finishX: -1,
	finishY: 0.05,

	playerSwitchDistance: 0.25,
	scrollSmoothnessX: 0.2,
	scrollSmoothnessY: 0,

	initialZoom: 1.25,
	whiteUI: false,

	load: function()
	{
		new Box(-0.25, 0.05, 0.075, 0.075, 1).makePlayable();
		new Box(-0.05, 0.05, 0.075, 0.075, 1).makePlayable();

		new Box(-1, 0, 1.5, 0.05);
		new Box(-3, 0.9, 10, 0.1);
		new Box(0.6, 0, 0.1, 0.1);
		new Box(0.8, 0, 0.1, 0.1);
		new Box(1, 0, 0.1, 0.1);
		new Box(1.2000000000000001, 0, 0.1, 0.1);
		new Box(1.4, 0, 0.1, 0.1);
		new Box(1.6, 0, 0.1, 0.1);
		new Box(1.8000000000000002, 0, 0.1, 0.1);
		new Box(2, 0, 0.1, 0.1);
		new Box(2.2, 0, 0.1, 0.1);
		new Box(2.4, 0, 0.1, 0.1);
		new Box(2.6, 0, 0.1, 0.1);
		new Box(2.8000000000000002, 0, 0.1, 0.1);
		new Box(-0.5, 0.05, 0.1, 0.2, 0.1);

		new Triangle(0.7, 0.15);
		new Triangle(0.9, 0.15);
		new Triangle(1.1, 0.15);
		new Triangle(1.3, 0.15);
		new Triangle(1.5, 0.15);
		new Triangle(1.7000000000000001, 0.15);
		new Triangle(1.9000000000000001, 0.15);
		new Triangle(2.1, 0.15);
		new Triangle(2.3, 0.15);
		new Triangle(2.5, 0.15);
		new Triangle(2.072618292241463, 0.9198202860051612);

		new Light(0.5, 0.5, 0.75, 0, 255, 255, 0.5, 0, 0);
		new Light(1.1, 0.5, 0.75, 0, 255, 255, 0.5, 0, 0);
		new Light(1.7000000000000001, 0.5, 0.75, 0, 255, 255, 0.5, 0, 0);
		new Light(2.3, 0.5, 0.75, 0, 255, 255, 0.5, 0, 0);

		new Zone(0, 1);
		new Zone(0.55, -0.5);
		new Zone(2.55, 1);
	}
});