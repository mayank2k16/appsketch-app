/**
 * Bookings — ported from Vite's `Containers/Cms/Bookings` (appointment CMS
 * patient-booking admin view) + `Api/cmsAPI.js`'s
 * `fetchDoctors`/`fetchTenantBookings`/`updateBooking`/`deleteBooking`.
 *
 * Added as its own always-visible `CMS_TABS` entry rather than conditionally
 * replacing `Orders` the way Vite does for `tenantType === "appointment"` —
 * appsketch-app has no tenant-type detection, same standing gap as the
 * marketplace tenant-ID lookup `Vendors`/`ProductRequests` already flag.
 */

export type BookingStatus = 'pending' | 'confirmed' | 'cancelled';

export type DoctorOption = {
  id: number;
  title: string;
};

export type BookingListItem = {
  id: number;
  patient_name?: string;
  patient_phone?: string;
  patient_email?: string;
  doctor_name?: string;
  entity_title?: string;
  specialization?: string;
  doctor_photo?: string;
  slot_start?: string;
  slot_end?: string;
  consultation_price?: string | number;
  quantity?: number;
  status: BookingStatus | string;
  booked_at?: string;
  notes?: string;
  hospital_name?: string;
  hospital_address?: string;
  map_link?: string;
};

export type BookingFilters = {
  filter?: 'upcoming' | 'past' | '';
  status?: string;
  doctor?: string | number;
  search?: string;
};

export type UpdateBookingPayload = {
  status: BookingStatus;
  notes: string;
};
