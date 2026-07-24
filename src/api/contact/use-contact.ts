import type { AxiosError } from 'axios';
import { useMutation } from '@tanstack/react-query';

import { createContactTicket } from './client';
import type { CreateContactTicketInput } from './types';

export function useCreateContactTicket() {
  return useMutation<void, AxiosError, CreateContactTicketInput>({
    mutationFn: createContactTicket,
  });
}
