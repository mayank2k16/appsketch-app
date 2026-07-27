/**
 * Domains — ported from the web reference (Vite `Api/tenantAPI`
 * searchDomains/purchaseDomain/fetchUserDomains, hitting
 * `account/domains/get-available-domains/`, `account/domains/purchase-domain/`,
 * `account/custom-domains/`). Shapes mirror what
 * `HomeV3/CartPage/utils.js` (`getDomainPriceFromItem`) and
 * `Studio/Settings/Domains/index.jsx` expect from those responses.
 */

export type DomainRegisterOption = {
  years: number;
  currency?: string;
  price?: number | string;
  your_price?: number | string;
  additional_cost?: number | string;
};

export type DomainPricing = {
  premium?: boolean;
  premium_price?: number | string;
  pricing?: {
    pricing?: {
      register?: DomainRegisterOption[];
    };
    registration?: number | string | { price?: number | string };
    price?: number | string;
  };
};

export type DomainSearchResult = DomainPricing & {
  domain: string;
  available: boolean;
};

export type DomainSearchResponse = { results: DomainSearchResult[] } | DomainSearchResult[];

// Same contact shape reused for every role — matches web's `ContactForm.jsx`
// `contact` state and Cart.jsx's `contacts: { registrant, tech, admin, auxbilling }`.
export type DomainContact = {
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

export type DomainContacts = {
  registrant: DomainContact;
  tech: DomainContact;
  admin: DomainContact;
  auxbilling: DomainContact;
};

export type PurchaseDomainPayload = {
  domain: string;
  years: number;
  auto_renew: boolean;
  add_free_whoisguard: boolean;
  tenant_id: number | string;
  contacts: {
    registrant: {
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
  };
};

export type UserDomainNameserver = string;

export type UserDomain = {
  a_record?: { Name?: string };
  purchased_at?: string;
  expires_at?: string;
  provider?: string;
  sld?: string;
  tld?: string;
  status?: string;
  tenant_name?: string;
  nameservers?: UserDomainNameserver[];
};

export type UserDomainsResponse = { results: UserDomain[] } | UserDomain[];
