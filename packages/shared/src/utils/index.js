"use strict";
// Shared Utilities for bela360
Object.defineProperty(exports, "__esModule", { value: true });
exports.formatPhone = formatPhone;
exports.formatPhoneDisplay = formatPhoneDisplay;
exports.formatDateBR = formatDateBR;
exports.formatTime = formatTime;
exports.formatDateTimeBR = formatDateTimeBR;
exports.formatCurrency = formatCurrency;
exports.formatDuration = formatDuration;
exports.timeAgo = timeAgo;
exports.generateCode = generateCode;
exports.sleep = sleep;
exports.isToday = isToday;
exports.startOfDay = startOfDay;
exports.endOfDay = endOfDay;
/**
 * Format phone number to standard format (5511999999999)
 */
function formatPhone(phone) {
    // Remove all non-numeric characters
    const cleaned = phone.replace(/\D/g, '');
    // Add country code if missing
    if (cleaned.length === 11) {
        return `55${cleaned}`;
    }
    return cleaned;
}
/**
 * Format phone for display (55 11 99999-9999)
 */
function formatPhoneDisplay(phone) {
    const cleaned = formatPhone(phone);
    if (cleaned.length === 13) {
        return `+${cleaned.slice(0, 2)} ${cleaned.slice(2, 4)} ${cleaned.slice(4, 9)}-${cleaned.slice(9)}`;
    }
    return phone;
}
/**
 * Format date to Brazilian format (DD/MM/YYYY)
 */
function formatDateBR(date) {
    return date.toLocaleDateString('pt-BR', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    });
}
/**
 * Format time to HH:MM
 */
function formatTime(date) {
    return date.toLocaleTimeString('pt-BR', {
        hour: '2-digit',
        minute: '2-digit',
    });
}
/**
 * Format datetime for display
 */
function formatDateTimeBR(date) {
    return `${formatDateBR(date)} às ${formatTime(date)}`;
}
/**
 * Format price to Brazilian currency
 */
function formatCurrency(value) {
    return new Intl.NumberFormat('pt-BR', {
        style: 'currency',
        currency: 'BRL',
    }).format(value);
}
/**
 * Format duration in minutes to readable string
 */
function formatDuration(minutes) {
    if (minutes < 60) {
        return `${minutes} min`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
        return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
}
/**
 * Calculate time difference in a human readable format
 */
function timeAgo(date) {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);
    if (diffMins < 1)
        return 'agora';
    if (diffMins < 60)
        return `há ${diffMins} min`;
    if (diffHours < 24)
        return `há ${diffHours}h`;
    if (diffDays < 7)
        return `há ${diffDays} dias`;
    if (diffDays < 30)
        return `há ${Math.floor(diffDays / 7)} semanas`;
    if (diffDays < 365)
        return `há ${Math.floor(diffDays / 30)} meses`;
    return `há ${Math.floor(diffDays / 365)} anos`;
}
/**
 * Generate a random numeric code
 */
function generateCode(length = 6) {
    return Array.from({ length }, () => Math.floor(Math.random() * 10)).join('');
}
/**
 * Sleep for specified milliseconds
 */
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}
/**
 * Check if a date is today
 */
function isToday(date) {
    const today = new Date();
    return (date.getDate() === today.getDate() &&
        date.getMonth() === today.getMonth() &&
        date.getFullYear() === today.getFullYear());
}
/**
 * Get start of day for a date
 */
function startOfDay(date) {
    const result = new Date(date);
    result.setHours(0, 0, 0, 0);
    return result;
}
/**
 * Get end of day for a date
 */
function endOfDay(date) {
    const result = new Date(date);
    result.setHours(23, 59, 59, 999);
    return result;
}
//# sourceMappingURL=index.js.map