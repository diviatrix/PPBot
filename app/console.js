let rl;
let app;
class CONSOLE {
	constructor(context) {
		app = context;
		rl = require('readline').createInterface({ input: process.stdin, output: process.stdout });
		rl.on('line', async (answer) => {
			await this.parseCommand(answer);
		});
	}

	async parseCommand(userAnswer) {
		// exit command
		if (userAnswer == 'exit') { process.exit(0); }
		else if (userAnswer == 'start') { await app.start(); app.logger.log("Application started", "info"); }
		else if (userAnswer == 'stop') { await app.stop(); app.logger.log("Application stopped", "info"); }
		else if (userAnswer == 'help') { app.logger.log("Available commands: exit, help, reload, status, start, stop", "info"); }
		else if (userAnswer.startsWith('reload')) { await this.reload(); }
		else if (userAnswer.startsWith('status')) { app.logger.log("Status: " + (this.context.run ? "running" : "stopped"), "info"); }
		else app.logger.log("Unknown command, type 'help' for available commands", "warning");
	}

	async reload() {
		await this.context.cleanUp().then(async () => {
			// reinitialize
			await this.context.initialize();
			app.logger.log("Reload completed", "info");
		});
	}
}

module.exports = CONSOLE;