import type { AxiosError } from 'axios';
import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query';

import { toast } from '@/lib/toast';

import {
  createInvoice,
  deleteInvoice,
  fetchAllEntities,
  fetchCompanyDetails,
  fetchInvoiceDetailsById,
  fetchInvoiceInventories,
  fetchInvoices,
  fetchProductsByInventory,
  updateInvoice,
  updateInvoiceDateAndNo,
} from './client';
import type { CreateInvoicePayload, UpdateInvoiceDateAndNoPayload } from './types';

export const invoiceKeys = {
  all: ['invoices'] as const,
  list: () => [...invoiceKeys.all, 'list'] as const,
  detail: (id: number) => [...invoiceKeys.all, 'detail', id] as const,
  inventories: () => [...invoiceKeys.all, 'inventories'] as const,
  entities: () => [...invoiceKeys.all, 'entities'] as const,
  products: (inventoryId: string | number) => [...invoiceKeys.all, 'products', inventoryId] as const,
  company: () => [...invoiceKeys.all, 'company'] as const,
};

const PAGE_SIZE = 10;

export function useInvoices() {
  return useInfiniteQuery<Awaited<ReturnType<typeof fetchInvoices>>, AxiosError>({
    queryKey: invoiceKeys.list(),
    queryFn: ({ pageParam }) => fetchInvoices(pageParam as number, PAGE_SIZE),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) =>
      lastPage.length < PAGE_SIZE ? undefined : allPages.length * PAGE_SIZE,
  });
}

export function useCreateInvoice() {
  const queryClient = useQueryClient();
  return useMutation<{ msg?: string }, AxiosError, CreateInvoicePayload>({
    mutationFn: (payload) => createInvoice(payload),
    onSuccess: (data) => {
      toast.success(data?.msg ?? 'Invoice created successfully');
      queryClient.invalidateQueries({ queryKey: invoiceKeys.list() });
    },
    onError: () => toast.error('Error creating invoice'),
  });
}

export function useUpdateInvoice() {
  const queryClient = useQueryClient();
  return useMutation<{ msg?: string }, AxiosError, { id: number; payload: CreateInvoicePayload }>({
    mutationFn: ({ id, payload }) => updateInvoice(id, payload),
    onSuccess: (data) => {
      toast.success(data?.msg ?? 'Invoice updated successfully');
      queryClient.invalidateQueries({ queryKey: invoiceKeys.list() });
    },
    onError: () => toast.error('Error updating invoice'),
  });
}

export function useUpdateInvoiceDateAndNo() {
  const queryClient = useQueryClient();
  return useMutation<unknown, AxiosError, { id: number; payload: UpdateInvoiceDateAndNoPayload }>({
    mutationFn: ({ id, payload }) => updateInvoiceDateAndNo(id, payload),
    onSuccess: () => {
      toast.success('Invoice details updated successfully');
      queryClient.invalidateQueries({ queryKey: invoiceKeys.list() });
    },
    onError: () => toast.error('Error while updating invoice field'),
  });
}

export function useDeleteInvoice() {
  const queryClient = useQueryClient();
  return useMutation<void, AxiosError, number>({
    mutationFn: (id) => deleteInvoice(id),
    onSuccess: () => {
      toast.success('Invoice deleted successfully');
      queryClient.invalidateQueries({ queryKey: invoiceKeys.list() });
    },
    onError: () => toast.error('Error deleting invoice'),
  });
}

export function useInvoiceDetails(id: number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchInvoiceDetailsById>>, AxiosError>({
    queryKey: invoiceKeys.detail(id ?? -1),
    queryFn: () => fetchInvoiceDetailsById(id as number),
    enabled: id !== null,
  });
}

export function useInvoiceInventories() {
  return useQuery<Awaited<ReturnType<typeof fetchInvoiceInventories>>, AxiosError>({
    queryKey: invoiceKeys.inventories(),
    queryFn: fetchInvoiceInventories,
  });
}

export function useAllEntities() {
  return useQuery<Awaited<ReturnType<typeof fetchAllEntities>>, AxiosError>({
    queryKey: invoiceKeys.entities(),
    queryFn: fetchAllEntities,
  });
}

export function useInvoiceProducts(inventoryId: string | number | null) {
  return useQuery<Awaited<ReturnType<typeof fetchProductsByInventory>>, AxiosError>({
    queryKey: invoiceKeys.products(inventoryId ?? ''),
    queryFn: () => fetchProductsByInventory(inventoryId as string | number),
    enabled: inventoryId !== null && inventoryId !== '',
  });
}

export function useCompanyDetails() {
  return useQuery<Awaited<ReturnType<typeof fetchCompanyDetails>>, AxiosError>({
    queryKey: invoiceKeys.company(),
    queryFn: fetchCompanyDetails,
  });
}
