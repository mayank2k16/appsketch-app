import type { AxiosError } from 'axios';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createBulkPayment,
  createPayment,
  createPaymentComment,
  deletePaymentAttachment,
  deleteVendorSettlement,
  fetchBulkPayments,
  fetchPaymentAttachments,
  fetchPaymentComments,
  fetchPayments,
  fetchPendingPaymentsForEntity,
  fetchVendorSettlements,
  updatePayment,
  uploadPaymentAttachment,
} from './client';
import type { CreateBulkPaymentPayload, CreatePaymentPayload, UpdatePaymentPayload } from './types';

export const paymentKeys = {
  all: ['payments'] as const,
  list: () => [...paymentKeys.all, 'list'] as const,
  attachments: (paymentId: number) => [...paymentKeys.all, 'attachments', paymentId] as const,
  comments: (paymentId: number) => [...paymentKeys.all, 'comments', paymentId] as const,
  bulkList: () => [...paymentKeys.all, 'bulk-list'] as const,
  pendingForEntity: (entityId: string | number) => [...paymentKeys.all, 'pending-for-entity', entityId] as const,
  settlements: () => [...paymentKeys.all, 'settlements'] as const,
};

// ── Regular payments ─────────────────────────────────────────────────────

export function usePayments() {
  return useQuery<Awaited<ReturnType<typeof fetchPayments>>, AxiosError>({
    queryKey: paymentKeys.list(),
    queryFn: fetchPayments,
  });
}

export function useCreatePayment() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, CreatePaymentPayload>({
    mutationFn: (payload) => createPayment(payload),
    onSuccess: () => {
      toast.success('Payment created successfully');
      queryClient.invalidateQueries({ queryKey: paymentKeys.list() });
    },
    onError: () => toast.error('Error creating payment'),
  });
}

export function useUpdatePayment() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, UpdatePaymentPayload>({
    mutationFn: (payload) => updatePayment(payload),
    onSuccess: () => {
      toast.success('Payment updated successfully');
      queryClient.invalidateQueries({ queryKey: paymentKeys.list() });
    },
    onError: () => toast.error('Error updating payment'),
  });
}

export function usePaymentAttachments(paymentId: number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchPaymentAttachments>>, AxiosError>({
    queryKey: paymentKeys.attachments(paymentId ?? -1),
    queryFn: () => fetchPaymentAttachments(paymentId as number),
    enabled: paymentId !== null,
  });
}

export function useUploadPaymentAttachment() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, { paymentId: number; asset: { uri: string; name: string; type: string } }>({
    mutationFn: ({ paymentId, asset }) => uploadPaymentAttachment(paymentId, asset),
    onSuccess: (_data, { paymentId }) => {
      toast.success('Attachment uploaded successfully');
      queryClient.invalidateQueries({ queryKey: paymentKeys.attachments(paymentId) });
    },
    onError: () => toast.error('Error uploading attachment'),
  });
}

export function useDeletePaymentAttachment() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, { attachmentId: number; paymentId: number }>({
    mutationFn: ({ attachmentId, paymentId }) => deletePaymentAttachment(attachmentId, paymentId),
    onSuccess: (_data, { paymentId }) => {
      toast.success('Attachment deleted successfully');
      queryClient.invalidateQueries({ queryKey: paymentKeys.attachments(paymentId) });
    },
    onError: () => toast.error('Error deleting attachment'),
  });
}

export function usePaymentComments(paymentId: number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchPaymentComments>>, AxiosError>({
    queryKey: paymentKeys.comments(paymentId ?? -1),
    queryFn: () => fetchPaymentComments(paymentId as number),
    enabled: paymentId !== null,
  });
}

export function useCreatePaymentComment() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, { paymentId: number; comment: string }>({
    mutationFn: ({ paymentId, comment }) => createPaymentComment(paymentId, comment),
    onSuccess: (_data, { paymentId }) => {
      queryClient.invalidateQueries({ queryKey: paymentKeys.comments(paymentId) });
    },
    onError: () => toast.error('Error posting comment'),
  });
}

// ── Bulk payments ────────────────────────────────────────────────────────

const BULK_PAGE_SIZE = 10;

export function useBulkPayments() {
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchBulkPayments>>, AxiosError>({
    queryKey: paymentKeys.bulkList(),
    queryFn: ({ pageParam }) => fetchBulkPayments(pageParam as number),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < BULK_PAGE_SIZE ? undefined : allPages.length * BULK_PAGE_SIZE,
  });
}

export function useCreateBulkPayment() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, CreateBulkPaymentPayload>({
    mutationFn: (payload) => createBulkPayment(payload),
    onSuccess: () => {
      toast.success('Bulk Payment Added Successfully');
      queryClient.invalidateQueries({ queryKey: paymentKeys.bulkList() });
    },
    onError: () => toast.error('Error creating bulk payment'),
  });
}

export function usePendingPaymentsForEntity(entityId: string | number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchPendingPaymentsForEntity>>, AxiosError>({
    queryKey: paymentKeys.pendingForEntity(entityId ?? ''),
    queryFn: () => fetchPendingPaymentsForEntity(entityId as string | number),
    enabled: entityId !== null && entityId !== '',
  });
}

// ── Vendor settlements ───────────────────────────────────────────────────

export function useVendorSettlements() {
  return useQuery<Awaited<ReturnType<typeof fetchVendorSettlements>>, AxiosError>({
    queryKey: paymentKeys.settlements(),
    queryFn: fetchVendorSettlements,
  });
}

export function useDeleteVendorSettlement() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteVendorSettlement(id),
    onSuccess: () => {
      toast.success('Settlement deleted successfully');
      queryClient.invalidateQueries({ queryKey: paymentKeys.settlements() });
    },
    onError: () => toast.error('Error deleting settlement'),
  });
}
