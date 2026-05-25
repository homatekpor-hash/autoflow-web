self.addEventListener('push', function(event) {
  const data = event.data ? event.data.json() : {};
  const options = {
    body: data.body || 'You have a new notification',
    icon: '/autoflow-logo.jpg',
    badge: '/autoflow-logo.jpg',
    vibrate: [100, 50, 100],
    data: { url: data.url || '/dashboard' },
  };
  event.waitUntil(self.registration.showNotification(data.title || 'AutoFlow Ghana', options));
});

self.addEventListener('notificationclick', function(event) {
  event.notification.close();
  event.waitUntil(clients.openWindow(event.notification.data.url));
});
