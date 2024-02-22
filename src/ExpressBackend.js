import express from "express";
import path from "path";
import fs from "fs";

export class ExpressBackend {
	constructor(port) {
		this.app = express();
		this.port = port || 3001;
		this.filePath = path.join(path.resolve(), "/storage", "/pp.json");
		this.start();
	}

	start() {
		this.app.get("/pp", (req, res) => {
			fs.readFile(this.filePath, "utf8", (err, data) => {
				if (err) {
					console.error(err);
					res.status(500).send("Internal Server Error");
					return;
				}

				const jsonData = JSON.parse(data);
				res.json(jsonData);
			});
		});

		this.app.get("/", (req, res) => {
			res.sendFile(path.join(path.resolve(), "public", "index.html"));
		});

		this.app.use(express.static(path.join(path.resolve(), "public")));

		this.app.listen(this.port, () => {
			console.log("\x1b[35m[Express Backend]\x1b[0m: Server is running on port:", this.port);
		});
	}
}