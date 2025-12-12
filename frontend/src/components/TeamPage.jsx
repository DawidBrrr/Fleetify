import { useEffect, useState } from "react";
import { dashboardApi } from "../services/api/dashboard";

const PRESENCE_UI = {
  zalogowany: { label: "Zalogowany", className: "success" },
  dostepny: { label: "Dostępny", className: "info" },
  niedostepny: { label: "Niedostępny", className: "secondary" },
};

function PresenceBadge({ state }) {
  const mapping = PRESENCE_UI[state] || { label: state || "Brak danych", className: "secondary" };
  return <span className={`badge bg-${mapping.className}`}>{mapping.label}</span>;
}

function PersonCard({ person, subtitle }) {
  if (!person) {
    return (
      <div className="card border-0 shadow-sm h-100">
        <div className="card-body text-muted text-center py-5">
          Brak danych
        </div>
      </div>
    );
  }

  const profile = person.worker_profile || person.admin_profile;

  return (
    <div className="card border-0 shadow-sm h-100">
      <div className="card-body">
        <div className="d-flex align-items-center justify-content-between mb-2">
          <div>
            <p className="text-uppercase text-muted small mb-1">{subtitle}</p>
            <h5 className="mb-0">{person.full_name}</h5>
            <small className="text-muted">{person.email}</small>
          </div>
          {person.worker_profile && (
            <PresenceBadge state={person.worker_profile.presence_state} />
          )}
        </div>
        {profile?.department && (
          <div className="text-muted small">{profile.department}</div>
        )}
        {person.worker_profile?.manager_id && subtitle !== "Przełożony" && (
          <div className="text-muted small">ID przełożonego: {person.worker_profile.manager_id}</div>
        )}
      </div>
    </div>
  );
}

function TeammateList({ teammates }) {
  if (!teammates?.length) {
    return (
      <div className="text-center text-muted py-4">
        Brak innych członków zespołu
      </div>
    );
  }

  return (
    <div className="row g-3">
      {teammates.map((mate) => (
        <div key={mate.id} className="col-md-6">
          <div className="card border-0 shadow-sm h-100">
            <div className="card-body">
              <div className="d-flex justify-content-between align-items-center mb-1">
                <h6 className="mb-0">{mate.full_name}</h6>
                {mate.worker_profile && (
                  <PresenceBadge state={mate.worker_profile.presence_state} />
                )}
              </div>
              <small className="text-muted d-block mb-2">{mate.email}</small>
              {mate.worker_profile?.position_title && (
                <div className="text-muted small">{mate.worker_profile.position_title}</div>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

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
    return <div className="p-5 text-center">Ładowanie zespołu...</div>;
  }

  if (error) {
    return <div className="alert alert-danger m-4">{error}</div>;
  }

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="mb-4">
        <h2 className="h3 mb-1">Twój zespół</h2>
        <p className="text-muted">Podgląd przełożonego oraz współpracowników wraz z ich dostępnością</p>
      </div>

      <div className="row g-4 mb-4">
        <div className="col-md-6">
          <PersonCard person={team?.manager} subtitle="Przełożony" />
        </div>
        <div className="col-md-6">
          <PersonCard person={team?.me} subtitle="Ty" />
        </div>
      </div>

      <div className="dashboard-panel">
        <div className="d-flex justify-content-between align-items-center mb-3">
          <h3 className="h5 mb-0">Zespół</h3>
          <div className="d-flex gap-2 align-items-center text-muted small">
            <PresenceBadge state="zalogowany" />
            <span>Aktywny</span>
            <PresenceBadge state="dostepny" />
            <span>W godzinach pracy</span>
            <PresenceBadge state="niedostepny" />
            <span>Poza godzinami</span>
          </div>
        </div>
        <TeammateList teammates={team?.teammates || []} />
      </div>
    </div>
  );
}
