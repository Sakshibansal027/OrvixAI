import { aiService } from '../ai/ai.service.js';
import { SupportConversation } from '../models/support-conversation.model.js';
import { SupportTicket } from '../models/support-ticket.model.js';
import { getCustomer, getCustomerTickets, getPayment, getRefund, getRelevantOrder, searchCompanyPolicy } from '../tools/business-data.tools.js';
import { investigateIssue } from '../investigation/investigation.service.js';
import type { ChatContext, ConversationStatus } from '../types/support.js';

function getConversationalReply(
  message: string,
  firstName: string,
  conversationStatus?: ConversationStatus,
  ticketId?: string
): string | null {
  const normalized = message.toLowerCase().trim().replace(/[.!?,]+$/g, '').replace(/\s+/g, ' ');
  const compact = normalized.replace(/([a-z])\1{1,}/g, '$1');

  if (/^(h[i]+|h?ello+|helo+|hey+|namaste|namaskar|good morning|good afternoon|good evening)( there)?$/.test(compact)) {
    return `Hi ${firstName}! How can I help you today? Tell me what happened with your payment, order, account, or app.`;
  }

  if (/^(how are you(?: doing)?|how is it going|how's it going|what's up|kaise ho|aap kaise ho|kya haal hai|kya haal chaal hai)$/.test(compact)) {
    return `I’m doing well, thanks for asking, ${firstName}! What can I help you with today?`;
  }

  if (/^(?:(?:ok(?:ay)?|all right|alright|got it|understood|cool|sure|hmm+|acha|theek hai)\s+)*(?:thanks?|thank\s*(?:you|u)|thx|ok(?:ay)?|all right|alright|got it|understood|cool|sure|hmm+|acha|theek hai|ठीक है|धन्यवाद)(?:\s+(?:a lot|very much))?$/.test(compact)) {
    if (conversationStatus === 'needs_human' && ticketId) {
      return `You're welcome, ${firstName}. Support case ${ticketId} is open with the conversation context for review.`;
    }
    if (conversationStatus === 'resolved') {
      return `You're welcome, ${firstName}! Glad I could help. Let me know if anything else comes up.`;
    }
    return `Okay, ${firstName}. Whenever you're ready, tell me what happened and I'll help you look into it.`;
  }

  return null;
}

function getClarificationReply(firstName: string): string {
  return `I'm here to help, ${firstName}. Could you tell me a little more about what happened? For example, is it about a payment, an order, account access, or the app?`;
}

export async function processChatMessage(context: ChatContext) {
  const customer = await getCustomer(context.customerId);
  if (!customer) {
    throw new Error(`Customer ${context.customerId} was not found`);
  }

  const conversation = await SupportConversation.findOne({ customerId: context.customerId }).sort({ updatedAt: -1 });
  const recentMessages = conversation?.messages.slice(-10).map((message) => ({ role: message.role, content: message.content })) ?? [];
  const firstName = customer.name.split(' ')[0];
  const conversationalReply = getConversationalReply(context.message, firstName, conversation?.status, conversation?.ticketId);
  const routing = conversationalReply ? null : await aiService.classifyIntent({ ...context, recentMessages });
  if (conversationalReply || routing?.confidence === 'low') {
    const responseMessage = conversationalReply ?? getClarificationReply(firstName);
    const now = new Date();
    const conversationDocument = conversation ?? new SupportConversation({ customerId: context.customerId, messages: [], status: 'open' });
    conversationDocument.messages.push(
      { role: 'customer', content: context.message, createdAt: now },
      { role: 'assistant', content: responseMessage, createdAt: new Date() }
    );
    await conversationDocument.save();

    return {
      conversationId: conversationDocument._id.toString(),
      message: responseMessage,
      specialist: conversationDocument.specialist ?? 'technical',
      status: conversationDocument.status,
      escalated: false,
      interactionType: 'conversational' as const
    };
  }

  const issueType = routing!.specialist === 'billing' ? 'payment' : routing!.specialist === 'order_delivery' ? 'delivery' : null;
  const order = issueType ? await getRelevantOrder(context.customerId, issueType, context.message) : undefined;
  const needsOrderPaymentCheck = routing!.specialist === 'billing' || order?.status === 'cancelled';
  const payment = needsOrderPaymentCheck ? await getPayment(undefined, order?.orderId) : undefined;
  const refund = needsOrderPaymentCheck ? await getRefund(order?.orderId, payment?.paymentId) : undefined;
  const tickets = await getCustomerTickets(context.customerId);
  const policyQuery = routing!.specialist === 'billing' || order?.status === 'cancelled' ? 'cancelled payment refund' : routing!.specialist === 'order_delivery' ? 'delivered missing delivery' : routing!.specialist === 'account' ? 'account access locked' : 'technical support';
  const policies = await searchCompanyPolicy(policyQuery);
  const investigation = investigateIssue(context.message, routing!, { customer, order, payment, refund, tickets, policies });
  let supportTicket = investigation.requiresHuman && conversation?.status === 'needs_human' && conversation.currentIssue === investigation.issue && conversation.ticketId
    ? await SupportTicket.findOne({ ticketId: conversation.ticketId, status: 'open' })
    : null;
  let isNewSupportTicket = false;
  if (investigation.requiresHuman && !supportTicket) {
    isNewSupportTicket = true;
    supportTicket = new SupportTicket({
      ticketId: `TCK_${Date.now()}`,
      customerId: context.customerId,
      subject: investigation.issue,
      status: 'open',
      messages: [],
      investigation,
      createdAt: new Date()
    });
  }

  if (supportTicket) supportTicket.investigation = investigation;
  const responseMessage = await aiService.generateResponse({
    customerName: customer.name,
    customerMessage: context.message,
    recentMessages,
    investigation,
    policyEvidence: policies.map((policy) => ({ title: policy.title, content: policy.content })),
    ticketId: supportTicket?.ticketId
  });
  if (supportTicket) {
    if (isNewSupportTicket && conversation) {
      supportTicket.messages.push(...conversation.messages.map((message) => ({
        role: message.role === 'assistant' ? 'agent' : 'customer',
        content: message.content,
        createdAt: message.createdAt
      })));
    }
    supportTicket.messages.push(
      { role: 'customer', content: context.message, createdAt: new Date() },
      { role: 'agent', content: responseMessage, createdAt: new Date() }
    );
    await supportTicket.save();
  }
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
  if (supportTicket) conversationDocument.ticketId = supportTicket.ticketId;
  conversationDocument.status = status;
  await conversationDocument.save();

  return {
    conversationId: conversationDocument._id.toString(),
    message: responseMessage,
    specialist: investigation.specialist,
    status,
    investigation,
    escalated: Boolean(supportTicket),
    ...(supportTicket ? { ticketId: supportTicket.ticketId } : {})
  };
}
