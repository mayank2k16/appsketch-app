import type { AxiosError } from 'axios';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import { deleteBooking, fetchBookings, fetchDoctors, updateBooking } from './client';
import type { BookingFilters, UpdateBookingPayload } from './types';

export const bookingKeys = {
  all: ['bookings'] as const,
  list: (filters: BookingFilters) => [...bookingKeys.all, 'list', filters] as const,
  doctors: ['bookings', 'doctors'] as const,
};

export function useBookings(filters: BookingFilters) {
  return useQuery<Awaited<ReturnType<typeof fetchBookings>>, AxiosError>({
    queryKey: bookingKeys.list(filters),
    queryFn: () => fetchBookings(filters),
  });
}

export function useDoctors() {
  return useQuery<Awaited<ReturnType<typeof fetchDoctors>>, AxiosError>({
    queryKey: bookingKeys.doctors,
    queryFn: fetchDoctors,
    staleTime: 5 * 60 * 1000,
  });
}

export function useUpdateBooking() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, { id: number; payload: UpdateBookingPayload }>({
    mutationFn: ({ id, payload }) => updateBooking(id, payload),
    onSuccess: () => {
      toast.success('Booking updated.');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: () => toast.error('Could not update booking.'),
  });
}

export function useDeleteBooking() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteBooking(id),
    onSuccess: () => {
      toast.success('Booking deleted.');
      queryClient.invalidateQueries({ queryKey: bookingKeys.all });
    },
    onError: () => toast.error('Could not delete booking.'),
  });
}
