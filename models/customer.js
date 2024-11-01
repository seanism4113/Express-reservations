/** Customer for Lunchly */

const db = require("../db");
const ExpressError = require("../expressError");
const Reservation = require("./reservation");

/** Customer of the restaurant. */

class Customer {
	constructor({ id, firstName, lastName, phone, notes }) {
		this.id = id;
		this.firstName = firstName;
		this.lastName = lastName;
		this.phone = phone;
		this.notes_ = notes || "";
	}

	/** find all customers. */
	static async all() {
		const results = await db.query(
			`
			SELECT id, first_name AS "firstName", last_name AS "lastName", phone, notes
       		FROM customers
       		ORDER BY last_name, first_name
			`
		);
		return results.rows.map((row) => new Customer(row));
	}

	/** get a customer by ID. */
	static async get(id) {
		const results = await db.query(
			`
			SELECT id, first_name AS "firstName", last_name AS "lastName", phone, notes 
        	FROM customers 
			WHERE id = $1
			`,
			[id]
		);

		const customer = results.rows[0];

		if (customer === undefined) {
			throw new ExpressError(`No such customer: ${id}`, 404);
		}

		return new Customer(customer);
	}

	// Search for customers
	static async search(name) {
		if (name.length === 0) return [];

		const words = name.split(" ");

		const conditions = words.map((_, index) => `(first_name ILIKE $${index + 1} OR last_name ILIKE $${index + 1})`);

		const params = words.map((word) => `%${word}%`);

		const results = await db.query(
			`
			SELECT id, first_name AS "firstName", last_name AS "lastName", phone, notes
       		FROM customers
			WHERE ${conditions}
       		ORDER BY last_name, first_name
			`,
			params
		);
		return results.rows.map((row) => new Customer(row));
	}

	static async getVIPs() {
		const results = await db.query(
			`
        	SELECT COUNT(r.customer_id) AS reservation_count, c.id, c.first_name AS "firstName", c.last_name AS "lastName"
        	FROM reservations r
        	JOIN customers c ON r.customer_id = c.id
        	GROUP BY c.id, c.first_name, c.last_name
        	ORDER BY reservation_count DESC
        	LIMIT 10
			`
		);

		return results.rows.map((row) => ({
			id: row.id,
			fullName: `${row.lastName}, ${row.firstName}`,
			reservationCount: row.reservation_count,
		}));
	}

	/** get all reservations for this customer. */
	async getReservations() {
		return await Reservation.getReservationsForCustomer(this.id);
	}

	/** save this customer. */
	async save() {
		if (this.id === undefined) {
			const result = await db.query(
				`
				INSERT INTO customers (first_name, last_name, phone, notes)
            	VALUES ($1, $2, $3, $4)
             	RETURNING id
				`,
				[this.firstName, this.lastName, this.phone, this.notes_]
			);
			this.id = result.rows[0].id;
		} else {
			await db.query(
				`
				UPDATE customers 
				SET first_name=$1, last_name=$2, phone=$3, notes=$4
            	WHERE id=$5
				`,
				[this.firstName, this.lastName, this.phone, this.notes_, this.id]
			);
		}
	}

	get fullName() {
		return `${this.lastName}, ${this.firstName}`;
	}
}

module.exports = Customer;
