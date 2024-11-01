/** Routes for Lunchly */

const express = require("express");
const Customer = require("./models/customer");
const Reservation = require("./models/reservation");
const router = new express.Router();

/** Homepage: show list of customers. */
router.get("/", async (req, res, next) => {
	try {
		const customers = await Customer.all();
		return res.render("customer_list.html", { customers });
	} catch (err) {
		return next(err);
	}
});

// Search for a customer using search query
router.get("/search", async (req, res, next) => {
	try {
		const query = req.query.q;
		const customers = await Customer.search(query);
		return res.render("customer_search.html", { customers });
	} catch (err) {
		return next(err);
	}
});

// Show VIP customers with most reservations for the app
router.get("/vip", async (req, res, next) => {
	try {
		const vips = await Customer.getVIPs();
		return res.render("customer_vips.html", { vips });
	} catch (err) {
		return next(err);
	}
});

/** Form to add a new customer. */
router.get("/add/", async (req, res, next) => {
	try {
		return res.render("customer_new_form.html");
	} catch (err) {
		return next(err);
	}
});

/** Handle adding a new customer. */
router.post("/add/", async (req, res, next) => {
	try {
		const { firstName, lastName, phone, notes } = req.body;

		const customer = new Customer({ firstName, lastName, phone, notes });
		await customer.save();

		return res.redirect(`/customers/${customer.id}/`);
	} catch (err) {
		return next(err);
	}
});

/** Show a customer, given their ID. */
router.get("/:id/", async (req, res, next) => {
	try {
		const customer = await Customer.get(req.params.id);
		const reservations = await customer.getReservations();

		return res.render("customer_detail.html", { customer, reservations });
	} catch (err) {
		return next(err);
	}
});

/** Show form to edit a customer. */
router.get("/:id/edit/", async (req, res, next) => {
	try {
		const customer = await Customer.get(req.params.id);

		res.render("customer_edit_form.html", { customer });
	} catch (err) {
		return next(err);
	}
});

/** Handle editing a customer. */
router.post("/:id/edit/", async (req, res, next) => {
	try {
		const { firstName, lastName, phone, notes } = req.body;
		const customer = await Customer.get(req.params.id);
		customer.firstName = firstName;
		customer.lastName = lastName;
		customer.phone = phone;
		customer.notes = notes;
		await customer.save();

		return res.redirect(`/customers/${customer.id}/`);
	} catch (err) {
		return next(err);
	}
});

/** Handle adding a new reservation. */
router.post("/:id/add-reservation/", async (req, res, next) => {
	try {
		const customerId = req.params.id;
		const startAt = new Date(req.body.startAt);
		const numGuests = req.body.numGuests;
		const notes = req.body.notes;

		const reservation = new Reservation({
			customerId,
			startAt,
			numGuests,
			notes,
		});

		await reservation.save();

		return res.redirect(`/customers/${customerId}/`);
	} catch (err) {
		if (err.message === "Cannot make a reservation for fewer than 1 person.") {
			return res.status(400).render("error.html", { message: err.message });
		}
		return next(err);
	}
});

module.exports = router;
