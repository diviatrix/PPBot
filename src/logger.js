export class Logger {
	constructor(levels) {
		this.levels = levels || ["info", "error", "warning"];
		this.colors = {
			"normal": "\u001b[0m",
			"info": "\u001b[38;5;46m",
			"warning": "\u001b[38;5;226m", 
			"error": "\u001b[38;5;196m",
			"debug": "\u001b[38;5;21m"
		};
		this.log("Logger initialized.", this.colors.utility);
	}

	log(message, color) {
		if (!color) color = "normal";
		const callerName = new Error().stack?.split("\n")[2]?.trim().split(" ")[1];
		const selectedColor = this.colors[color] || this.colors.normal;
		console.log(`> ${selectedColor}[${callerName}]: ${this.colors.normal + message}`);
	}
}
