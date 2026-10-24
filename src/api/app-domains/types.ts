/**
 * Domains you buy or connect, served by one of your apps — the
 * `account/app-domains/*` contract (docs/domains.md). Every endpoint returns
 * the same `DomainView`.
 */

export type DomainStage =
  | 'awaiting_dns'
  | 'building'
  | 'securing'
  | 'live'
  | 'failed'
  | 'web_unavailable';

export type DomainApp = {
  id: number;
  uuid?: string;
  title: string;
  app_type?: string;
};

export type DnsRecord = { type: string; host: string; value: string };

export type DomainDns = {
  verified: boolean;
  via: 'nameservers' | 'a_record' | null;
  nameservers: string[];
  records: DnsRecord[];
};

export type DomainCertificate = {
  status: 'none' | 'pending' | 'active' | 'error';
  issuer: string | null;
  expires_at: string | null;
  auto_renew: boolean;
};

export type DomainView = {
  id: number;
  domain: string;
  source: 'purchased' | 'connected';
  sandbox: boolean;
  app: DomainApp | null;
  stage: DomainStage;
  stage_label: string;
  detail: string;
  url: string | null;
  dns: DomainDns;
  certificate: DomainCertificate;
  purchased_at: string | null;
  expires_at: string | null;
  error: string | null;
};

/** `price` is in the cart currency (INR in India, USD elsewhere). */
export type DomainYearPrice = {
  years: number;
  price_inr: number;
  price?: number | null;
};

export type DomainSearchResult = {
  domain: string;
  available: boolean;
  premium: boolean;
  price_inr: number | null;
  price?: number | null;
  years: DomainYearPrice[];
};

export type DomainSearchResponse = {
  query: string;
  sandbox: boolean;
  results: DomainSearchResult[];
};

/** Namecheap registrant contact (all 9 required; Country = ISO 2-letter). */
export type RegistrantContact = {
  FirstName: string;
  LastName: string;
  Address1: string;
  City: string;
  StateProvince: string;
  PostalCode: string;
  Country: string;
  Phone: string;
  EmailAddress: string;
};
