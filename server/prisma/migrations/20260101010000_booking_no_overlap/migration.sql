-- Database-level guard against double-booking the same vendor's time slot.
-- Application code also uses Serializable transactions; this is the hard backstop.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" ADD CONSTRAINT "booking_no_overlap"
  EXCLUDE USING gist ("vendorId" WITH =, tsrange("startsAt", "endsAt") WITH &&)
  WHERE (status IN ('PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS'));
