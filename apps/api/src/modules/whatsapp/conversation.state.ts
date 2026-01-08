'use client';

import { Redis } from 'ioredis';
import { env } from '../../config';

// Initialize Redis for conversation state
const redis = new Redis(env.REDIS_URL || 'redis://localhost:6379');

// Conversation state interface
export interface ConversationState {
  step: ConversationStep;
  data: BookingData;
  lastMessageAt: Date;
  expiresAt: Date;
}

export type ConversationStep =
  | 'initial'
  | 'selecting_service'
  | 'selecting_professional'
  | 'selecting_date'
  | 'selecting_time'
  | 'confirming_booking'
  | 'completed';

export interface BookingData {
  serviceId?: string;
  serviceName?: string;
  professionalId?: string;
  professionalName?: string;
  date?: string; // YYYY-MM-DD
  time?: string; // HH:MM
  appointmentId?: string;
}

// State key format: conversation:{businessId}:{clientPhone}
function getStateKey(businessId: string, clientPhone: string): string {
  return `conversation:${businessId}:${clientPhone}`;
}

// TTL for conversation state (30 minutes)
const STATE_TTL_SECONDS = 30 * 60;

/**
 * Get conversation state for a client
 */
export async function getConversationState(
  businessId: string,
  clientPhone: string
): Promise<ConversationState | null> {
  try {
    const key = getStateKey(businessId, clientPhone);
    const data = await redis.get(key);

    if (!data) {
      return null;
    }

    const state = JSON.parse(data) as ConversationState;

    // Check if expired
    if (new Date(state.expiresAt) < new Date()) {
      await redis.del(key);
      return null;
    }

    return state;
  } catch (error) {
    console.error('Error getting conversation state:', error);
    return null;
  }
}

/**
 * Set conversation state for a client
 */
export async function setConversationState(
  businessId: string,
  clientPhone: string,
  step: ConversationStep,
  data: Partial<BookingData> = {}
): Promise<ConversationState> {
  try {
    const key = getStateKey(businessId, clientPhone);
    const existingState = await getConversationState(businessId, clientPhone);

    const now = new Date();
    const expiresAt = new Date(now.getTime() + STATE_TTL_SECONDS * 1000);

    const state: ConversationState = {
      step,
      data: {
        ...(existingState?.data || {}),
        ...data,
      },
      lastMessageAt: now,
      expiresAt,
    };

    await redis.setex(key, STATE_TTL_SECONDS, JSON.stringify(state));

    return state;
  } catch (error) {
    console.error('Error setting conversation state:', error);
    throw error;
  }
}

/**
 * Clear conversation state for a client
 */
export async function clearConversationState(
  businessId: string,
  clientPhone: string
): Promise<void> {
  try {
    const key = getStateKey(businessId, clientPhone);
    await redis.del(key);
  } catch (error) {
    console.error('Error clearing conversation state:', error);
  }
}

/**
 * Update just the booking data without changing step
 */
export async function updateConversationData(
  businessId: string,
  clientPhone: string,
  data: Partial<BookingData>
): Promise<ConversationState | null> {
  const existingState = await getConversationState(businessId, clientPhone);

  if (!existingState) {
    return null;
  }

  return setConversationState(businessId, clientPhone, existingState.step, data);
}
