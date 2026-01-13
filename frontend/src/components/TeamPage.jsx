import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api/dashboard";

/* ───────────────────────────────────────────────────────── */
/*  SVG Icons                                                */
/* ───────────────────────────────────────────────────────── */
const Icons = {
  user: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 1 1-7.5 0 3.75 3.75 0 0 1 7.5 0ZM4.501 20.118a7.5 7.5 0 0 1 14.998 0A17.933 17.933 0 0 1 12 21.75c-2.676 0-5.216-.584-7.499-1.632Z"/>
    </svg>
  ),
  team: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M18 18.72a9.094 9.094 0 0 0 3.741-.479 3 3 0 0 0-4.682-2.72m.94 3.198.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0 1 12 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 0 1 6 18.719m12 0a5.971 5.971 0 0 0-.941-3.197m0 0A5.995 5.995 0 0 0 12 12.75a5.995 5.995 0 0 0-5.058 2.772m0 0a3 3 0 0 0-4.681 2.72 8.986 8.986 0 0 0 3.74.477m.94-3.197a5.971 5.971 0 0 0-.94 3.197M15 6.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Zm6 3a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Zm-13.5 0a2.25 2.25 0 1 1-4.5 0 2.25 2.25 0 0 1 4.5 0Z"/>
    </svg>
  ),
  manager: (
    <svg width="20" height="20" fill="none" stroke="currentColor" strokeWidth="1.5" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M17.982 18.725A7.488 7.488 0 0 0 12 15.75a7.488 7.488 0 0 0-5.982 2.975m11.963 0a9 9 0 1 0-11.963 0m11.963 0A8.966 8.966 0 0 1 12 21a8.966 8.966 0 0 1-5.982-2.275M15 9.75a3 3 0 1 1-6 0 3 3 0 0 1 6 0Z"/>
    </svg>
  ),
  empty: (
    <svg width="48" height="48" fill="none" stroke="currentColor" strokeWidth="1" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 0 0 2.625.372 9.337 9.337 0 0 0 4.121-.952 4.125 4.125 0 0 0-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 0 1 8.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0 1 11.964-3.07M12 6.375a3.375 3.375 0 1 1-6.75 0 3.375 3.375 0 0 1 6.75 0Zm8.25 2.25a2.625 2.625 0 1 1-5.25 0 2.625 2.625 0 0 1 5.25 0Z"/>
    </svg>
  ),
};

/* ───────────────────────────────────────────────────────── */
/*  Presence UI                                              */
/* ───────────────────────────────────────────────────────── */
const PRESENCE_UI = {
  zalogowany: { label: "Zalogowany", variant: "success" },
  dostepny: { label: "Dostępny", variant: "info" },
  niedostepny: { label: "Niedostępny", variant: "muted" },
};

function PresenceBadge({ state }) {
  const mapping = PRESENCE_UI[state] || { label: state || "Brak danych", variant: "muted" };
  return <span className={`vp-status vp-status--${mapping.variant}`}>{mapping.label}</span>;
}

/* ───────────────────────────────────────────────────────── */
/*  Person Card                                              */
/* ───────────────────────────────────────────────────────── */
function PersonCard({ person, subtitle, icon }) {
  if (!person) {
    return (
      <div className="vp-team-card vp-team-card--empty">
        <div className="vp-team-card__empty">
          Brak danych
        </div>
      </div>
    );
  }

  const profile = person.worker_profile || person.admin_profile;

  return (
    <div className="vp-team-card">
      <div className="vp-team-card__header">
        <div className="vp-team-card__avatar">
          {icon}
        </div>
        <div className="vp-team-card__info">
          <span className="vp-team-card__subtitle">{subtitle}</span>
          <h4 className="vp-team-card__name">{person.full_name}</h4>
          <p className="vp-team-card__email">{person.email}</p>
        </div>
        {person.worker_profile && (
          <PresenceBadge state={person.worker_profile.presence_state} />
        )}
      </div>
      {(profile?.department || profile?.position_title) && (
        <div className="vp-team-card__meta">
          {profile?.position_title && (
            <span className="vp-team-card__position">{profile.position_title}</span>
          )}
          {profile?.department && (
            <span className="vp-team-card__department">{profile.department}</span>
          )}
        </div>
      )}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Teammate List                                            */
/* ───────────────────────────────────────────────────────── */
function TeammateList({ teammates }) {
  if (!teammates?.length) {
    return (
      <div className="vp-empty-state">
        <div className="vp-empty-state__icon">{Icons.empty}</div>
        <h3 className="vp-empty-state__title">Brak członków zespołu</h3>
        <p className="vp-empty-state__text">Nie masz jeszcze współpracowników w swoim zespole.</p>
      </div>
    );
  }

  return (
    <div className="vp-teammates-grid">
      {teammates.map((mate) => (
        <div key={mate.id} className="vp-teammate-card">
          <div className="vp-teammate-card__avatar">
            {Icons.user}
          </div>
          <div className="vp-teammate-card__content">
            <div className="vp-teammate-card__header">
              <h5 className="vp-teammate-card__name">{mate.full_name}</h5>
              {mate.worker_profile && (
                <PresenceBadge state={mate.worker_profile.presence_state} />
              )}
            </div>
            <p className="vp-teammate-card__email">{mate.email}</p>
            {mate.worker_profile?.position_title && (
              <span className="vp-teammate-card__position">{mate.worker_profile.position_title}</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

/* ───────────────────────────────────────────────────────── */
/*  Main Component                                           */
/* ───────────────────────────────────────────────────────── */
export default function TeamPage() {
  const [team, setTeam] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    let isMounted = true;
    dashboardApi
      .fetchTeam()
      .then((payload) => {
        if (isMounted) {
          setTeam(payload);
          setLoading(false);
        }
      })
      .catch((err) => {
        console.error("Failed to load team", err);
        if (isMounted) {
          setError("Nie udało się załadować danych zespołu");
          setLoading(false);
        }
      });
    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="vp-loading-state">
        <div className="vp-spinner vp-spinner--lg"></div>
        <span>Ładowanie zespołu...</span>
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
          <h1 className="vp-dashboard-header__title">Twój zespół</h1>
          <p className="vp-dashboard-header__subtitle">
            Podgląd przełożonego oraz współpracowników wraz z ich dostępnością
          </p>
        </div>
      </header>

      {/* Manager & Me Cards */}
      <div className="vp-team-hero">
        <PersonCard person={team?.manager} subtitle="Przełożony" icon={Icons.manager} />
        <PersonCard person={team?.me} subtitle="Ty" icon={Icons.user} />
      </div>

      {/* Team Panel */}
      <div className="vp-panel">
        <div className="vp-panel__header">
          <div className="vp-panel__title-row">
            <span className="vp-panel__icon">{Icons.team}</span>
            <h3 className="vp-panel__title">Zespół</h3>
          </div>
          <div className="vp-presence-legend">
            <div className="vp-presence-legend__item">
              <span className="vp-status vp-status--success">Zalogowany</span>
              <span>Aktywny</span>
            </div>
            <div className="vp-presence-legend__item">
              <span className="vp-status vp-status--info">Dostępny</span>
              <span>W godzinach pracy</span>
            </div>
            <div className="vp-presence-legend__item">
              <span className="vp-status vp-status--muted">Niedostępny</span>
              <span>Poza godzinami</span>
            </div>
          </div>
        </div>
        <TeammateList teammates={team?.teammates || []} />
      </div>
    </div>
  );
}
