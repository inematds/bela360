import { MessageIntent, IntentAnalysis } from './whatsapp.types';

// Keywords for intent detection
const INTENT_KEYWORDS: Record<MessageIntent, string[]> = {
  GREETING: [
    'oi', 'olá', 'ola', 'hey', 'eai', 'e ai', 'bom dia', 'boa tarde',
    'boa noite', 'hello', 'hi', 'oie', 'oii', 'oiii'
  ],
  SCHEDULE_APPOINTMENT: [
    'agendar', 'marcar', 'reservar', 'quero horário', 'quero horario',
    'tem horário', 'tem horario', 'disponibilidade', 'quero marcar',
    'fazer agendamento', 'agendar horário', 'agendar horario'
  ],
  CHECK_AVAILABILITY: [
    'horário disponível', 'horario disponivel', 'tem vaga', 'tem disponibilidade',
    'qual horário', 'qual horario', 'horários livres', 'horarios livres',
    'quando pode', 'agenda livre'
  ],
  CANCEL_APPOINTMENT: [
    'cancelar', 'desmarcar', 'não vou', 'nao vou', 'não posso ir',
    'nao posso ir', 'cancela', 'desmarque'
  ],
  CONFIRM_APPOINTMENT: [
    'confirmar', 'confirmado', 'confirmo', 'vou sim', 'estarei lá',
    'estarei la', 'pode confirmar', 'tá confirmado', 'ta confirmado'
  ],
  LIST_SERVICES: [
    'serviços', 'servicos', 'preços', 'precos', 'tabela', 'cardápio',
    'cardapio', 'o que vocês fazem', 'o que voces fazem', 'quais serviços',
    'quais servicos', 'quanto custa', 'valores'
  ],
  TALK_TO_HUMAN: [
    'atendente', 'humano', 'pessoa', 'falar com alguém', 'falar com alguem',
    'não é robô', 'nao é robo', 'quero falar', 'atendimento humano',
    'pessoa real', 'funcionário', 'funcionario'
  ],
  UNKNOWN: [],
};

// Button/List response mappings
const BUTTON_INTENTS: Record<string, MessageIntent> = {
  schedule: 'SCHEDULE_APPOINTMENT',
  services: 'LIST_SERVICES',
  hours: 'CHECK_AVAILABILITY',
  human: 'TALK_TO_HUMAN',
  menu: 'GREETING',
  confirm: 'CONFIRM_APPOINTMENT',
  cancel: 'CANCEL_APPOINTMENT',
};

/**
 * Analyze message text to detect intent
 */
export function analyzeIntent(
  text: string,
  buttonResponse?: { buttonId: string; displayText: string },
  listResponse?: { rowId: string; title: string }
): IntentAnalysis {
  // Handle button responses
  if (buttonResponse) {
    const buttonId = buttonResponse.buttonId.split('_')[0];
    const intent = BUTTON_INTENTS[buttonId] || 'UNKNOWN';
    return {
      intent,
      confidence: 1.0,
      entities: extractEntitiesFromButton(buttonResponse.buttonId),
    };
  }

  // Handle list responses
  if (listResponse) {
    const rowId = listResponse.rowId;
    if (rowId.startsWith('service_') || rowId.startsWith('book_service_')) {
      return {
        intent: 'SCHEDULE_APPOINTMENT',
        confidence: 1.0,
        entities: {
          service: rowId.replace('book_service_', '').replace('service_', ''),
        },
      };
    }
  }

  // Normalize text for analysis
  const normalizedText = text
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remove accents
    .trim();

  // Check each intent
  let bestMatch: { intent: MessageIntent; confidence: number } = {
    intent: 'UNKNOWN',
    confidence: 0,
  };

  for (const [intent, keywords] of Object.entries(INTENT_KEYWORDS)) {
    if (intent === 'UNKNOWN') continue;

    for (const keyword of keywords) {
      const normalizedKeyword = keyword
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '');

      if (normalizedText.includes(normalizedKeyword)) {
        // Calculate confidence based on keyword match
        const confidence = keyword.length / normalizedText.length;
        const adjustedConfidence = Math.min(confidence * 2, 1.0);

        if (adjustedConfidence > bestMatch.confidence) {
          bestMatch = {
            intent: intent as MessageIntent,
            confidence: adjustedConfidence,
          };
        }
      }
    }
  }

  // Extract entities from text
  const entities = extractEntitiesFromText(normalizedText);

  return {
    intent: bestMatch.confidence > 0.1 ? bestMatch.intent : 'UNKNOWN',
    confidence: bestMatch.confidence,
    entities,
  };
}

/**
 * Extract entities (date, time, service) from text
 */
function extractEntitiesFromText(text: string): IntentAnalysis['entities'] {
  const entities: IntentAnalysis['entities'] = {};

  // Extract date patterns
  const datePatterns = [
    /(\d{1,2}\/\d{1,2}(?:\/\d{2,4})?)/,  // DD/MM or DD/MM/YYYY
    /(\d{1,2}[-]\d{1,2}(?:[-]\d{2,4})?)/,  // DD-MM or DD-MM-YYYY
    /(hoje|amanhã|amanha|segunda|terça|terca|quarta|quinta|sexta|sábado|sabado|domingo)/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      entities.date = match[1];
      break;
    }
  }

  // Extract time patterns
  const timePatterns = [
    /(\d{1,2}:\d{2})/,  // HH:MM
    /(\d{1,2}h(?:\d{2})?)/i,  // HH or HHhMM
    /(às?\s*\d{1,2}(?::\d{2})?)/i,  // às HH:MM
  ];

  for (const pattern of timePatterns) {
    const match = text.match(pattern);
    if (match) {
      entities.time = match[1].replace(/às?\s*/i, '').trim();
      break;
    }
  }

  return entities;
}

/**
 * Extract entities from button ID
 */
function extractEntitiesFromButton(buttonId: string): IntentAnalysis['entities'] {
  const entities: IntentAnalysis['entities'] = {};
  const parts = buttonId.split('_');

  if (parts.length >= 2) {
    const action = parts[0];
    const id = parts.slice(1).join('_');

    switch (action) {
      case 'confirm':
      case 'cancel':
      case 'reschedule':
        // These contain appointment ID, but we handle them differently
        break;
      case 'service':
      case 'book':
        entities.service = id;
        break;
      case 'professional':
        entities.professional = id;
        break;
    }
  }

  return entities;
}

/**
 * Generate conversation context for more complex flows
 */
export interface ConversationContext {
  step: string;
  data: Record<string, any>;
  lastUpdated: Date;
}

export function createContext(): ConversationContext {
  return {
    step: 'initial',
    data: {},
    lastUpdated: new Date(),
  };
}

export function updateContext(
  context: ConversationContext,
  step: string,
  data: Record<string, any>
): ConversationContext {
  return {
    step,
    data: { ...context.data, ...data },
    lastUpdated: new Date(),
  };
}
