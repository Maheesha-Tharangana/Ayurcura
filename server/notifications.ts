import { WebSocket } from 'ws';
import { clients } from './routes';

/**
 * Send a notification to a specific user via WebSocket
 * @param userId The ID of the user to send the notification to
 * @param notification The notification data to send
 */
export function sendNotificationToUser(userId: string, notification: any) {
  const userSocket = clients.get(userId);
  
  if (userSocket && userSocket.readyState === WebSocket.OPEN) {
    userSocket.send(JSON.stringify({
      type: 'notification',
      data: notification
    }));
    console.log(`Notification sent to user ${userId}`);
    return true;
  }
  
  console.log(`Failed to send notification to user ${userId} - client not connected`);
  return false;
}

/**
 * Send a notification to all connected users (for global announcements)
 * @param notification The notification data to send
 */
export function sendNotificationToAll(notification: any) {
  let sentCount = 0;
  
  clients.forEach((socket, userId) => {
    if (socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
      sentCount++;
    }
  });
  
  console.log(`Notification broadcast to ${sentCount} users`);
  return sentCount;
}

/**
 * Send a notification to all admin users
 * @param notification The notification data to send
 * @param adminIds List of admin user IDs
 */
export function sendNotificationToAdmins(notification: any, adminIds: string[]) {
  let sentCount = 0;
  
  adminIds.forEach(adminId => {
    const adminSocket = clients.get(adminId);
    if (adminSocket && adminSocket.readyState === WebSocket.OPEN) {
      adminSocket.send(JSON.stringify({
        type: 'notification',
        data: notification
      }));
      sentCount++;
    }
  });
  
  console.log(`Notification sent to ${sentCount} admins`);
  return sentCount;
}

/**
 * Send a notification about an appointment
 * @param appointmentId The ID of the appointment
 * @param userId The ID of the user to notify
 * @param message The notification message
 * @param appointmentData Additional appointment data
 */
export function sendAppointmentNotification(
  appointmentId: string,
  userId: string,
  message: string,
  appointmentData?: any
) {
  return sendNotificationToUser(userId, {
    appointmentId,
    message,
    timestamp: new Date().toISOString(),
    appointmentData,
    category: 'appointment'
  });
}

/**
 * Send a notification when an appointment status changes
 * @param appointmentId The ID of the appointment
 * @param userId The ID of the user to notify
 * @param oldStatus The previous status
 * @param newStatus The new status
 * @param appointmentData Additional appointment data
 */
export function sendAppointmentStatusNotification(
  appointmentId: string,
  userId: string,
  oldStatus: string,
  newStatus: string,
  appointmentData?: any
) {
  let message = '';
  
  switch (newStatus) {
    case 'confirmed':
      message = 'Your appointment has been confirmed by the doctor.';
      break;
    case 'cancelled':
      message = 'Your appointment has been cancelled.';
      break;
    case 'completed':
      message = 'Your appointment has been marked as completed.';
      break;
    default:
      message = `Your appointment status has changed from ${oldStatus} to ${newStatus}.`;
  }
  
  return sendAppointmentNotification(appointmentId, userId, message, appointmentData);
}

/**
 * Send a reminder notification for upcoming appointments
 * @param appointmentId The ID of the appointment
 * @param userId The ID of the user to notify
 * @param timeRemaining Time remaining until the appointment (e.g., "1 hour")
 * @param appointmentData Additional appointment data
 */
export function sendAppointmentReminderNotification(
  appointmentId: string,
  userId: string,
  timeRemaining: string,
  appointmentData?: any
) {
  const message = `Reminder: Your appointment is coming up in ${timeRemaining}.`;
  
  return sendAppointmentNotification(appointmentId, userId, message, appointmentData);
}