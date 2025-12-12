import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api/dashboard";

const statusLabels = {
  unread: { label: "Nieprzeczytane", className: "primary" },
  read: { label: "Przeczytane", className: "secondary" },
  pending: { label: "Oczekujące", className: "warning" },
  accepted: { label: "Zaakceptowane", className: "success" },
  declined: { label: "Odrzucone", className: "danger" },
};

function NotificationCard({ notification, onAck, onRespond }) {
  const mapping = statusLabels[notification.status] || { label: notification.status, className: "secondary" };
  const isInvite = notification.type === "team_invite" && notification.status === "pending";

  return (
    <div className="card border-0 shadow-sm">
      <div className="card-body">
        <div className="d-flex justify-content-between align-items-start mb-2">
          <div>
            <p className="text-uppercase small text-muted mb-1">{notification.type}</p>
            <h5 className="mb-0">{notification.title}</h5>
          </div>
          <span className={`badge bg-${mapping.className}`}>{mapping.label}</span>
        </div>
        <p className="text-muted mb-3">{notification.body}</p>
        {notification.metadata?.manager_name && (
          <p className="small text-muted mb-3">
            Zaproszenie od: <strong>{notification.metadata.manager_name}</strong>
          </p>
        )}
        <div className="d-flex gap-2">
          {isInvite ? (
            <>
              <button className="btn btn-sm btn-success" onClick={() => onRespond(notification.id, "accept")}>
                Akceptuj
              </button>
              <button className="btn btn-sm btn-outline-danger" onClick={() => onRespond(notification.id, "decline")}>
                Odrzuć
              </button>
            </>
          ) : (
            <button className="btn btn-sm btn-outline-secondary" onClick={() => onAck(notification.id)}>
              Oznacz jako przeczytane
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

export default function NotificationsPage() {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const loadNotifications = async () => {
    setLoading(true);
    try {
      const data = await dashboardApi.fetchNotifications();
      setNotifications(data);
      setError(null);
    } catch (err) {
      console.error("Failed to load notifications", err);
      setError("Nie udało się pobrać powiadomień");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadNotifications();
  }, []);

  const handleAck = async (id) => {
    try {
      await dashboardApi.ackNotification(id);
      await loadNotifications();
    } catch (err) {
      console.error("Ack failed", err);
      alert("Nie udało się zaktualizować powiadomienia");
    }
  };

  const handleRespond = async (id, action) => {
    try {
      await dashboardApi.respondToNotification(id, action);
      await loadNotifications();
    } catch (err) {
      console.error("Respond failed", err);
      alert("Nie udało się wysłać odpowiedzi");
    }
  };

  if (loading) {
    return <div className="p-5 text-center">Ładowanie powiadomień...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <div>
          <h2 className="h3 mb-1">Powiadomienia</h2>
          <p className="text-muted">Zarządzaj zaproszeniami i alertami operacyjnymi</p>
        </div>
        <button className="btn btn-outline-secondary" onClick={loadNotifications}>
          Odśwież
        </button>
      </div>

      {notifications.length === 0 ? (
        <div className="text-center text-muted py-5">
          Brak powiadomień.
        </div>
      ) : (
        <div className="d-flex flex-column gap-3">
          {notifications.map((notification) => (
            <NotificationCard
              key={notification.id}
              notification={notification}
              onAck={handleAck}
              onRespond={handleRespond}
            />
          ))}
        </div>
      )}
    </div>
  );
}
