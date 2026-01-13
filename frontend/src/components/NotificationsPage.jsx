import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api/dashboard";

/* ───────────────────────────────────────────────────────── */
/*  SVG Icons                                                */
/* ───────────────────────────────────────────────────────── */
const Icons = {
  bell: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M14.857 17.082a23.848 23.848 0 0 0 5.454-1.31A8.967 8.967 0 0 1 18 9.75V9A6 6 0 0 0 6 9v.75a8.967 8.967 0 0 1-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 0 1-5.714 0m5.714 0a3 3 0 1 1-5.714 0"/>
    </svg>
  ),
  invite: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
    </svg>
  ),
  check: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m4.5 12.75 6 6 9-13.5"/>
    </svg>
  ),
  x: (
    <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M6 18 18 6M6 6l12 12"/>
    </svg>
  ),
  refresh: (
    <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M16.023 9.348h4.992v-.001M2.985 19.644v-4.992m0 0h4.992m-4.993 0 3.181 3.183a8.25 8.25 0 0 0 13.803-3.7M4.031 9.865a8.25 8.25 0 0 1 13.803-3.7l3.181 3.182m0-4.991v4.99"/>
    </svg>
  ),
  inbox: (
    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="m20.25 7.5-.625 10.632a2.25 2.25 0 0 1-2.247 2.118H6.622a2.25 2.25 0 0 1-2.247-2.118L3.75 7.5M10 11.25h4M3.375 7.5h17.25c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125H3.375c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125Z"/>
    </svg>
  ),
};

/* ───────────────────────────────────────────────────────── */
/*  Status Mappings                                          */
/* ───────────────────────────────────────────────────────── */
const statusLabels = {
  unread: { label: "Nieprzeczytane", variant: "info" },
  read: { label: "Przeczytane", variant: "muted" },
  pending: { label: "Oczekujące", variant: "warning" },
  accepted: { label: "Zaakceptowane", variant: "success" },
  declined: { label: "Odrzucone", variant: "danger" },
};

const typeLabels = {
  team_invite: { label: "Zaproszenie", icon: Icons.invite },
  alert: { label: "Alert", icon: Icons.bell },
  system: { label: "System", icon: Icons.bell },
};

/* ───────────────────────────────────────────────────────── */
/*  NotificationCard                                         */
/* ───────────────────────────────────────────────────────── */
function NotificationCard({ notification, onAck, onRespond }) {
  const mapping = statusLabels[notification.status] || { label: notification.status, variant: "muted" };
  const typeMap = typeLabels[notification.type] || { label: notification.type, icon: Icons.bell };
  const isInvite = notification.type === "team_invite" && notification.status === "pending";

  return (
    <div className="vp-notification-card">
      <div className="vp-notification-card__icon">
        {typeMap.icon}
      </div>
      <div className="vp-notification-card__content">
        <div className="vp-notification-card__header">
          <div className="vp-notification-card__meta">
            <span className="vp-notification-card__type">{typeMap.label}</span>
            <span className={`vp-status vp-status--${mapping.variant}`}>{mapping.label}</span>
          </div>
          <h4 className="vp-notification-card__title">{notification.title}</h4>
        </div>
        <p className="vp-notification-card__body">{notification.body}</p>
        {notification.metadata?.manager_name && (
          <p className="vp-notification-card__manager">
            Zaproszenie od: <strong>{notification.metadata.manager_name}</strong>
          </p>
        )}
        <div className="vp-notification-card__actions">
          {isInvite ? (
            <>
              <button className="vp-btn vp-btn--success vp-btn--sm" onClick={() => onRespond(notification.id, "accept")}>
                {Icons.check} Akceptuj
              </button>
              <button className="vp-btn vp-btn--outline-danger vp-btn--sm" onClick={() => onRespond(notification.id, "decline")}>
                {Icons.x} Odrzuć
              </button>
            </>
          ) : (
            <button className="vp-btn vp-btn--outline vp-btn--sm" onClick={() => onAck(notification.id)}>
              {Icons.check} Oznacz jako przeczytane
            </button>
          )}
        </div>
      </div>
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Main Component                                           */
/* ───────────────────────────────────────────────────────── */
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
    return (
      <div className="vp-loading-state">
        <div className="vp-spinner vp-spinner--lg"></div>
        <span>Ładowanie powiadomień...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="vp-alert vp-alert--danger" style={{ margin: "1.5rem" }}>
        {error}
      </div>
    );
  }

  return (
    <div className="vp-dashboard-section">
      {/* Header */}
      <header className="vp-dashboard-header">
        <div className="vp-dashboard-header__text">
          <h1 className="vp-dashboard-header__title">Powiadomienia</h1>
          <p className="vp-dashboard-header__subtitle">
            Zarządzaj zaproszeniami i alertami operacyjnymi
          </p>
        </div>
        <button className="vp-btn vp-btn--outline" onClick={loadNotifications}>
          {Icons.refresh} Odśwież
        </button>
      </header>

      {/* Content */}
      {notifications.length === 0 ? (
        <div className="vp-empty-state">
          <div className="vp-empty-state__icon">{Icons.inbox}</div>
          <h3 className="vp-empty-state__title">Brak powiadomień</h3>
          <p className="vp-empty-state__text">Nie masz żadnych nowych powiadomień ani zaproszeń.</p>
        </div>
      ) : (
        <div className="vp-notifications-list">
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
