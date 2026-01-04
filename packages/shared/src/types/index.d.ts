export declare enum AppointmentStatus {
    SCHEDULED = "scheduled",
    CONFIRMED = "confirmed",
    COMPLETED = "completed",
    CANCELLED = "cancelled",
    NO_SHOW = "no_show"
}
export declare enum NotificationType {
    CONFIRMATION = "confirmation",
    REMINDER_24H = "reminder_24h",
    REMINDER_2H = "reminder_2h",
    NO_SHOW = "no_show",
    CUSTOM = "custom"
}
export declare enum NotificationStatus {
    PENDING = "pending",
    SENT = "sent",
    DELIVERED = "delivered",
    FAILED = "failed"
}
export interface Business {
    id: string;
    name: string;
    phone: string;
    address?: string;
    workingHours: WorkingHours;
    slotDuration: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface WorkingHours {
    [day: string]: {
        enabled: boolean;
        start: string;
        end: string;
        breakStart?: string;
        breakEnd?: string;
    };
}
export interface Service {
    id: string;
    businessId: string;
    name: string;
    description?: string;
    duration: number;
    price: number;
    active: boolean;
    order: number;
    createdAt: Date;
    updatedAt: Date;
}
export interface Client {
    id: string;
    businessId: string;
    phone: string;
    name: string;
    notes?: string;
    tags: string[];
    lastVisit?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface Appointment {
    id: string;
    businessId: string;
    clientId: string;
    serviceId: string;
    datetime: Date;
    status: AppointmentStatus;
    notes?: string;
    confirmedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
export interface BlockedSlot {
    id: string;
    businessId: string;
    startTime: Date;
    endTime: Date;
    reason?: string;
    recurring: boolean;
    createdAt: Date;
}
export interface Notification {
    id: string;
    businessId: string;
    appointmentId?: string;
    phone: string;
    type: NotificationType;
    status: NotificationStatus;
    content: string;
    sentAt?: Date;
    deliveredAt?: Date;
    createdAt: Date;
}
export interface ApiResponse<T = unknown> {
    success: boolean;
    data?: T;
    error?: {
        code: string;
        message: string;
        details?: unknown;
    };
    meta?: {
        page?: number;
        limit?: number;
        total?: number;
    };
}
export interface PaginationParams {
    page?: number;
    limit?: number;
    sort?: string;
    order?: 'asc' | 'desc';
}
export interface AuthTokens {
    accessToken: string;
    refreshToken: string;
}
export interface JWTPayload {
    businessId: string;
    phone: string;
    iat: number;
    exp: number;
}
export interface WhatsAppMessage {
    from: string;
    to: string;
    body: string;
    timestamp: Date;
}
export interface BotState {
    step: string;
    data: Record<string, unknown>;
    lastActivity: Date;
}
//# sourceMappingURL=index.d.ts.map