function TaskItem({ task }) {
  return (
    <li className="d-flex align-items-center gap-2">
      <span className="badge rounded-pill bg-fleet-cyan text-dark">#{task.id}</span>
      <span>{task.label}</span>
    </li>
  );
}

function Reminder({ reminder }) {
  return (
    <div className={`alert-pill alert-pill--${reminder.severity}`}>
      <strong className="me-2">Przypomnienie</strong>
      {reminder.message}
    </div>
  );
}

export default function EmployeeDashboard({ data, user, onLogout, showLogoutButton = true }) {
  if (!data) return null;

  return (
    <div className="section-shell p-4 p-lg-5 dashboard-section">
      <div className="dashboard-header mb-4">
        <div>
          <p className="text-uppercase text-muted small mb-1">Panel pracownika</p>
          <h2 className="h3 mb-1">Hej {(user.full_name || user.name || "").split(" ")[0]}, oto Twój dzień</h2>
          <span className="text-muted">Przydzielony pojazd oraz zadania</span>
        </div>
        <div className="d-flex align-items-center gap-3 flex-wrap">
          <div className="d-flex align-items-center gap-2">
            {user.avatar && <img src={user.avatar} alt={user.full_name || user.name} className="avatar" />}
            <div className="small text-muted">
              <div>{user.full_name || user.name}</div>
              <div>Rola: kierowca</div>
            </div>
          </div>
          {showLogoutButton && (
            <button className="btn btn-outline-secondary" onClick={onLogout}>
              Wyloguj
            </button>
          )}
        </div>
      </div>

      <div className="row g-4">
        <div className="col-12 col-xl-5">
          <div className="dashboard-panel h-100">
            <h3 className="h5 mb-3">Przydzielony pojazd</h3>
            <div className="vehicle-card">
              <div className="d-flex justify-content-between align-items-center mb-3">
                <div>
                  <p className="text-uppercase text-muted small mb-1">{data.assignment.vehicle.id}</p>
                  <h4 className="h5 mb-0">{data.assignment.vehicle.model}</h4>
                </div>
                <span className="badge bg-dark">VIN: {data.assignment.vehicle.vin.slice(-6)}</span>
              </div>
              <div className="row g-3">
                <div className="col-6">
                  <p className="text-muted small mb-1">Przebieg</p>
                  <h5>{data.assignment.vehicle.mileage}</h5>
                </div>
                <div className="col-6">
                  <p className="text-muted small mb-1">Bateria</p>
                  <div className="battery">
                    <div className="battery__level" style={{ width: `${data.assignment.vehicle.battery}%` }}></div>
                    <span>{data.assignment.vehicle.battery}%</span>
                  </div>
                </div>
                <div className="col-12">
                  <p className="text-muted small mb-1">Ciśnienie opon</p>
                  <div className="badge bg-success-subtle text-success">{data.assignment.vehicle.tirePressure}</div>
                </div>
              </div>
              <hr className="my-4" />
              <div>
                <p className="text-muted small mb-2">Dzisiejsze zadania</p>
                <ul className="list-unstyled d-flex flex-column gap-2 mb-0">
                  {data.assignment.tasks.map((task) => (
                    <TaskItem key={task.id} task={task} />
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
        <div className="col-12 col-xl-7 d-flex flex-column gap-4">
          <div className="dashboard-panel">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h3 className="h5 mb-0">Historia tras</h3>
              <button className="btn btn-sm btn-outline-secondary">Pobierz raport</button>
            </div>
            <div className="table-responsive">
              <table className="table align-middle mb-0">
                <thead>
                  <tr>
                    <th>Trasa</th>
                    <th>Dystans</th>
                    <th>Koszt paliwa</th>
                    <th>Efektywność</th>
                  </tr>
                </thead>
                <tbody>
                  {data.trips.map((trip) => (
                    <tr key={trip.id}>
                      <td className="fw-semibold">{trip.route}</td>
                      <td>{trip.distance}</td>
                      <td>{trip.cost}</td>
                      <td>{trip.efficiency}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <div className="dashboard-panel">
            <h3 className="h5 mb-3">Przypomnienia</h3>
            <div className="d-flex flex-column gap-2">
              {data.reminders.map((reminder) => (
                <Reminder key={reminder.id} reminder={reminder} />
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
