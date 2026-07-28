import { CustomerService } from "./customer.service";
import { CompanyService } from "./company.service";
import { ContactService } from "./contact.service";
import { LeadService } from "./lead.service";
import { OpportunityService } from "./opportunity.service";
import { ActivityService } from "./activity.service";
import { TicketService } from "./ticket.service";
import { DocumentService } from "./document.service";

import { customers as initialCustomers } from "@/app/(app)/customers/data";
import { companies as initialCompanies } from "@/app/(app)/companies/data";
import { contacts as initialContacts } from "@/app/(app)/contacts/data";
import { leads as initialLeads } from "@/app/(app)/leads/data";
import { opportunities as initialOpportunities } from "@/app/(app)/opportunities/data";
import { activities as initialActivities } from "@/app/(app)/activities/data";
import { tickets as initialTickets } from "@/app/(app)/tickets/data";
import { documents as initialDocuments } from "@/app/(app)/documents/data";

export const customerService = new CustomerService(initialCustomers);
export const companyService = new CompanyService(initialCompanies);
export const contactService = new ContactService(initialContacts);
export const leadService = new LeadService(initialLeads);
export const opportunityService = new OpportunityService(initialOpportunities);
export const activityService = new ActivityService(initialActivities);
export const ticketService = new TicketService(initialTickets);
export const documentService = new DocumentService(initialDocuments);
