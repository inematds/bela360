"use strict";
// Shared Types for bela360
Object.defineProperty(exports, "__esModule", { value: true });
exports.NotificationStatus = exports.NotificationType = exports.AppointmentStatus = void 0;
// ============================================
// Enums
// ============================================
var AppointmentStatus;
(function (AppointmentStatus) {
    AppointmentStatus["SCHEDULED"] = "scheduled";
    AppointmentStatus["CONFIRMED"] = "confirmed";
    AppointmentStatus["COMPLETED"] = "completed";
    AppointmentStatus["CANCELLED"] = "cancelled";
    AppointmentStatus["NO_SHOW"] = "no_show";
})(AppointmentStatus || (exports.AppointmentStatus = AppointmentStatus = {}));
var NotificationType;
(function (NotificationType) {
    NotificationType["CONFIRMATION"] = "confirmation";
    NotificationType["REMINDER_24H"] = "reminder_24h";
    NotificationType["REMINDER_2H"] = "reminder_2h";
    NotificationType["NO_SHOW"] = "no_show";
    NotificationType["CUSTOM"] = "custom";
})(NotificationType || (exports.NotificationType = NotificationType = {}));
var NotificationStatus;
(function (NotificationStatus) {
    NotificationStatus["PENDING"] = "pending";
    NotificationStatus["SENT"] = "sent";
    NotificationStatus["DELIVERED"] = "delivered";
    NotificationStatus["FAILED"] = "failed";
})(NotificationStatus || (exports.NotificationStatus = NotificationStatus = {}));
//# sourceMappingURL=index.js.map