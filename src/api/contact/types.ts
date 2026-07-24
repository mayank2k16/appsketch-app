/**
 * Contact Us — ported from Vite's `Containers/HomeV3/ContactUs/ContactUs.jsx`,
 * which posts to the CRM ticketing endpoint (`crmApi.createTicket`) rather
 * than a dedicated "contact" backend. Same endpoint/payload shape here so
 * submissions land in the same CRM workflow as the website's form.
 */

export type CreateContactTicketInput = {
  name: string;
  email: string;
  message: string;
};
