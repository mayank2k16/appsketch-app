import { authenticatedClient } from '@/api/common/client';

import type { BookingFilters, BookingListItem, DoctorOption, UpdateBookingPayload } from './types';

export async function fetchDoctors(): Promise<DoctorOption[]> {
  const { data } = await authenticatedClient.get<{ data?: DoctorOption[] } | DoctorOption[]>(
    'api/shop/cms/doctors/'
  );
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function fetchBookings(filters: BookingFilters = {}): Promise<BookingListItem[]> {
  const params: Record<string, string | number> = {};
  if (filters.filter) params.filter = filters.filter;
  if (filters.status) params.status = filters.status;
  if (filters.doctor) params.doctor = filters.doctor;
  if (filters.search) params.search = filters.search;

  const { data } = await authenticatedClient.get<{ data?: BookingListItem[] } | BookingListItem[]>(
    'api/shop/cms/bookings/',
    { params }
  );
  return Array.isArray(data) ? data : (data?.data ?? []);
}

export async function updateBooking(id: number, payload: UpdateBookingPayload): Promise<void> {
  await authenticatedClient.patch(`api/shop/cms/bookings/${id}/`, payload);
}

export async function deleteBooking(id: number): Promise<void> {
  await authenticatedClient.delete(`api/shop/cms/bookings/${id}/`);
}
