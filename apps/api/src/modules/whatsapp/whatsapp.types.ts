// Evolution API Webhook Event Types

export interface WebhookEvent {
  event: string;
  instance: string;
  data: unknown;
}

export interface MessageReceived {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  pushName: string;
  message: {
    conversation?: string;
    extendedTextMessage?: {
      text: string;
    };
    imageMessage?: {
      url: string;
      caption?: string;
      mimetype: string;
    };
    audioMessage?: {
      url: string;
      mimetype: string;
    };
    videoMessage?: {
      url: string;
      caption?: string;
      mimetype: string;
    };
    documentMessage?: {
      url: string;
      fileName: string;
      mimetype: string;
    };
    buttonsResponseMessage?: {
      selectedButtonId: string;
      selectedDisplayText: string;
    };
    listResponseMessage?: {
      singleSelectReply: {
        selectedRowId: string;
      };
      title: string;
    };
  };
  messageType: string;
  messageTimestamp: number;
}

export interface MessageUpdated {
  key: {
    remoteJid: string;
    fromMe: boolean;
    id: string;
  };
  update: {
    status: 'PENDING' | 'SENT' | 'DELIVERED' | 'READ' | 'PLAYED';
  };
}

export interface ConnectionUpdate {
  instance: string;
  state: 'open' | 'close' | 'connecting';
  statusReason?: number;
}

export interface QRCodeUpdate {
  instance: string;
  qrcode: {
    base64: string;
    code: string;
  };
}

// Parsed message for internal use
export interface ParsedMessage {
  messageId: string;
  remoteJid: string;
  phoneNumber: string;
  fromMe: boolean;
  pushName: string;
  text: string;
  mediaUrl?: string;
  mediaType?: 'image' | 'audio' | 'video' | 'document';
  buttonResponse?: {
    buttonId: string;
    displayText: string;
  };
  listResponse?: {
    rowId: string;
    title: string;
  };
  timestamp: Date;
}

// Message intent detected by chatbot
export type MessageIntent =
  | 'GREETING'
  | 'SCHEDULE_APPOINTMENT'
  | 'CHECK_AVAILABILITY'
  | 'CANCEL_APPOINTMENT'
  | 'CONFIRM_APPOINTMENT'
  | 'LIST_SERVICES'
  | 'TALK_TO_HUMAN'
  | 'UNKNOWN';

export interface IntentAnalysis {
  intent: MessageIntent;
  confidence: number;
  entities: {
    date?: string;
    time?: string;
    service?: string;
    professional?: string;
  };
}
