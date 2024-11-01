/** Reservation for Lunchly */
const moment = require("moment");
const db = require("../db");
const ExpressError = require("../expressError");

/** A reservation for a party */
class Reservation {
	constructor({ id, customerId, numGuests, startAt, notes }) {
		this.id = id;
		this._customerId = customerId;
		this.numGuests = numGuests;
		this.startAt = startAt;
		this.notes_ = notes || "";
	}

	/** formatter for startAt */
	getformattedStartAt() {
		return moment(this.startAt).format("MMMM Do YYYY, h:mm a");
	}

	get customerId() {
		return this._customerId;
	}
	set customerId(value) {
		if (this._customerId !== undefined) {
			throw new ExpressError("Customer ID cannot be changed once set", 400);
		}
		this._customerId = value;
	}

	get numGuests() {
		return this._numGuests;
	}

	set numGuests(value) {
		if (value < 1) {
			throw new ExpressError("Cannot make a reservation for fewer that 1 person", 400);
		}
		this._numGuests = value;
	}

	get startAt() {
		return this._startAt;
	}

	set startAt(value) {
		if (!(value instanceof Date || isNaN(value))) {
			throw new ExpressError("Start Date and time must be completed", 400);
		}
		this._startAt = value;
	}

	/** given a customer id, find their reservations. */
	static async getReservationsForCustomer(customerId) {
		const results = await db.query(
			`
			SELECT id, customer_id AS "customerId", num_guests AS "numGuests", start_at AS "startAt", notes AS "notes"
         	FROM reservations 
         	WHERE customer_id = $1
		 	`,
			[customerId]
		);

		return results.rows.map((row) => new Reservation(row));
	}

	async save() {
		if (this.id === undefined) {
			const result = await db.query(
				`
				INSERT INTO reservations (customer_id, start_at, num_guests, notes)
				VALUES ($1, $2, $3, $4)
				RETURNING id
				`,
				[this._customerId, this._startAt, this._numGuests, this.notes_]
			);

			this.id = result.rows[0].id;
		} else {
			await db.query(
				`
				UPDATE reservations
				SET num_guests = $1, start_at = $2, notes = $3
				WHERE id=$4 AND customer_id=$5
				`,
				[this._numGuests, this._startAt, this.notes_, this.id, this._customerId]
			);
		}
	}
}

module.exports = Reservation;
