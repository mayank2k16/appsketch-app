import { client } from '@/api/common/client';

import type { CreateContactTicketInput } from './types';

// Matches the web contact form's payload exactly (`crmApi.createTicket`) —
// `workflow_Config`/`tenant`/`channel` are fixed values the CRM workflow
// expects, not per-request data. Uses the unauthenticated `client` since the
// public contact form must work for guests, same as the website.
export async function createContactTicket(input: CreateContactTicketInput): Promise<void> {
  await client.post('crm/workflows/1/tickets/create/', {
    customer_name: input.name,
    description: input.message,
    workflow_Config: 1,
    tenant: 1,
    channel: 'WEBSITE',
    attributes: { ...input },
  });
}
