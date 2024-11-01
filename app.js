/** Express app for Lunchly. */
const express = require("express");
const nunjucks = require("nunjucks");
const bodyParser = require("body-parser");
const routes = require("./routes");
const Customer = require("./models/customer");
const ExpressError = require("./expressError");

const app = express();

// Parse body for urlencoded (non-JSON) data
app.use(bodyParser.urlencoded({ extended: false }));

nunjucks.configure("templates", {
	autoescape: true,
	express: app,
});

app.use("/customers/", routes);

app.get("/", async (req, res, next) => {
	try {
		const customers = await Customer.all();
		return res.render("customer_list.html", { customers });
	} catch (err) {
		return next(err);
	}
});

/** Middleware 404 handler */
app.use((req, res, next) => {
	return next(new ExpressError("Not Found", 404));
});

/** General Middleware error handler */
app.use((err, req, res, next) => {
	const status = err.status || 500;
	res.status(status);
	return res.render("error.html", { error: { status, message: err.message || "Internal Server Error" } });
});

module.exports = app;
