import { aiService } from '../ai/ai.service.js';
import { SupportConversation } from '../models/support-conversation.model.js';
import { getCustomer, getCustomerTickets, getPayment, getRefund, getRelevantOrder, searchCompanyPolicy } from '../tools/business-data.tools.js';
import { investigateIssue } from '../investigation/investigation.service.js';
import { routeToSpecialist } from '../routing/specialist-router.js';
import type { ChatContext, ConversationStatus } from '../types/support.js';

export async function processChatMessage(context: ChatContext) {
  const customer = await getCustomer(context.customerId);
  if (!customer) {
    throw new Error(`Customer ${context.customerId} was not found`);
  }

  const conversation = await SupportConversation.findOne({ customerId: context.customerId }).sort({ updatedAt: -1 });
  const recentMessages = conversation?.messages.slice(-10).map((message) => ({ role: message.role, content: message.content })) ?? [];
  const routing = routeToSpecialist({ ...context, recentMessages });
  const issueType = routing.specialist === 'billing' ? 'payment' : routing.specialist === 'order_delivery' ? 'delivery' : null;
  const order = issueType ? await getRelevantOrder(context.customerId, issueType) : undefined;
  const payment = routing.specialist === 'billing' ? await getPayment(undefined, order?.orderId) : undefined;
  const refund = routing.specialist === 'billing' ? await getRefund(order?.orderId, payment?.paymentId) : undefined;
  const tickets = await getCustomerTickets(context.customerId);
  const policyQuery = routing.specialist === 'billing' ? 'cancelled payment refund' : routing.specialist === 'order_delivery' ? 'delivered missing delivery' : routing.specialist === 'account' ? 'account access locked' : 'technical support';
  const policies = await searchCompanyPolicy(policyQuery);
  const investigation = investigateIssue(context.message, routing, { customer, order, payment, refund, tickets, policies });
  const responseMessage = await aiService.generateResponse({ customerName: customer.name, investigation });
  const status: ConversationStatus = investigation.requiresHuman ? 'needs_human' : 'resolved';
  const now = new Date();

  const conversationDocument = conversation ?? new SupportConversation({ customerId: context.customerId, messages: [], status: 'open' });
  conversationDocument.messages.push(
    { role: 'customer', content: context.message, createdAt: now },
    { role: 'assistant', content: responseMessage, createdAt: new Date() }
  );
  conversationDocument.specialist = investigation.specialist;
  conversationDocument.currentIssue = investigation.issue;
  conversationDocument.investigation = investigation;
  conversationDocument.status = status;
  await conversationDocument.save();

  return {
    conversationId: conversationDocument._id.toString(),
    message: responseMessage,
    specialist: investigation.specialist,
    status,
    investigation,
    escalated: false
  };
}
