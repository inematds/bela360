/**
 * Format phone number to standard format (5511999999999)
 */
export declare function formatPhone(phone: string): string;
/**
 * Format phone for display (55 11 99999-9999)
 */
export declare function formatPhoneDisplay(phone: string): string;
/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
export declare function formatDateBR(date: Date): string;
/**
 * Format time to HH:MM
 */
export declare function formatTime(date: Date): string;
/**
 * Format datetime for display
 */
export declare function formatDateTimeBR(date: Date): string;
/**
 * Format price to Brazilian currency
 */
export declare function formatCurrency(value: number): string;
/**
 * Format duration in minutes to readable string
 */
export declare function formatDuration(minutes: number): string;
/**
 * Calculate time difference in a human readable format
 */
export declare function timeAgo(date: Date): string;
/**
 * Generate a random numeric code
 */
export declare function generateCode(length?: number): string;
/**
 * Sleep for specified milliseconds
 */
export declare function sleep(ms: number): Promise<void>;
/**
 * Check if a date is today
 */
export declare function isToday(date: Date): boolean;
/**
 * Get start of day for a date
 */
export declare function startOfDay(date: Date): Date;
/**
 * Get end of day for a date
 */
export declare function endOfDay(date: Date): Date;
//# sourceMappingURL=index.d.ts.map