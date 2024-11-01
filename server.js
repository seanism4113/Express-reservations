/** Start server for Lunchly. */

const app = require("./app");

app.listen(3000, () => {
	console.log("Running server on localhost:3000");
});
