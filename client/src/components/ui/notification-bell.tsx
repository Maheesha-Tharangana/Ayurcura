import { useState, useEffect } from 'react';
import { Bell } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { cn, formatDate, formatTime } from '@/lib/utils';

interface Notification {
  appointmentId: string;
  message: string;
  timestamp: string;
  appointmentData?: {
    doctorName?: string;
    date?: Date;
    time?: string;
    notes?: string;
  };
  category: string;
  isRead?: boolean;
}

export function NotificationBell() {
  const [unreadCount, setUnreadCount] = useState(0);
  const [localNotifications, setLocalNotifications] = useState<Notification[]>([]);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Get stored notifications from localStorage
    const storedNotifications = localStorage.getItem('notifications');
    if (storedNotifications) {
      try {
        const parsed = JSON.parse(storedNotifications);
        setLocalNotifications(parsed);
        // Count unread notifications
        setUnreadCount(parsed.filter((n: Notification) => !n.isRead).length);
      } catch (error) {
        console.error('Failed to parse stored notifications:', error);
        // Reset notifications in case of error
        localStorage.setItem('notifications', JSON.stringify([]));
      }
    }
  }, []);

  // Mark notifications as read when opened
  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    
    if (open && unreadCount > 0) {
      const updatedNotifications = localNotifications.map(n => ({ ...n, isRead: true }));
      setLocalNotifications(updatedNotifications);
      localStorage.setItem('notifications', JSON.stringify(updatedNotifications));
      setUnreadCount(0);
    }
  };

  // Clear all notifications
  const handleClearAll = () => {
    setLocalNotifications([]);
    localStorage.setItem('notifications', JSON.stringify([]));
    setIsOpen(false);
  };

  return (
    <Popover open={isOpen} onOpenChange={handleOpenChange}>
      <PopoverTrigger asChild>
        <Button variant="ghost" size="icon" className="relative">
          <Bell className="h-5 w-5" />
          {unreadCount > 0 && (
            <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
              {unreadCount}
            </span>
          )}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-80 max-h-96 overflow-y-auto p-0" align="end">
        <div className="flex items-center justify-between p-4 border-b">
          <h3 className="font-medium">Notifications</h3>
          {localNotifications.length > 0 && (
            <Button variant="ghost" size="sm" onClick={handleClearAll} className="text-xs h-8">
              Clear All
            </Button>
          )}
        </div>
        
        {localNotifications.length === 0 ? (
          <div className="p-4 text-center text-neutral-500">
            <p>No notifications</p>
          </div>
        ) : (
          <div className="divide-y">
            {localNotifications.map((notification, index) => (
              <div 
                key={`notification-${index}`} 
                className={cn(
                  "p-4 hover:bg-neutral-50",
                  !notification.isRead && "bg-blue-50"
                )}
              >
                <p className="text-sm font-medium">{notification.message}</p>
                
                {notification.appointmentData && (
                  <div className="mt-2 text-xs text-neutral-500">
                    {notification.appointmentData.doctorName && (
                      <p>Doctor: {notification.appointmentData.doctorName}</p>
                    )}
                    {notification.appointmentData.date && (
                      <p>
                        Date: {formatDate(notification.appointmentData.date)} at{' '}
                        {notification.appointmentData.time || formatTime(notification.appointmentData.date)}
                      </p>
                    )}
                    {notification.appointmentData.notes && (
                      <p className="mt-1 text-neutral-600">
                        Note: {notification.appointmentData.notes}
                      </p>
                    )}
                  </div>
                )}
                
                <p className="mt-2 text-xs text-neutral-400">
                  {formatDate(notification.timestamp)} at {formatTime(notification.timestamp)}
                </p>
              </div>
            ))}
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}