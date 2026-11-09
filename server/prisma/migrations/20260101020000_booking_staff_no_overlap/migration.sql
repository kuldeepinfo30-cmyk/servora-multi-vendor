-- Refine the double-booking backstop so it is staff-aware.
-- A vendor with multiple staff must be able to run parallel bookings, so the
-- overlap guard keys on the assigned staff member. Staff-less (vendor-level)
-- bookings fall back to a vendor-scoped guard.
CREATE EXTENSION IF NOT EXISTS btree_gist;

ALTER TABLE "bookings" DROP CONSTRAINT IF EXISTS "booking_no_overlap";

ALTER TABLE "bookings" ADD CONSTRAINT "booking_staff_no_overlap"
  EXCLUDE USING gist ("staffId" WITH =, tsrange("startsAt", "endsAt") WITH &&)
  WHERE (status IN ('PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS') AND "staffId" IS NOT NULL);

ALTER TABLE "bookings" ADD CONSTRAINT "booking_vendor_no_overlap"
  EXCLUDE USING gist ("vendorId" WITH =, tsrange("startsAt", "endsAt") WITH &&)
  WHERE (status IN ('PENDING_APPROVAL', 'CONFIRMED', 'IN_PROGRESS') AND "staffId" IS NULL);
