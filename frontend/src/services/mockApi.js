const USERS = {
  admin: {
    username: "admin",
    password: "admin",
    role: "admin",
    name: "Alicja Fleet",
    email: "admin@fleetify.io",
    avatar: "https://i.pravatar.cc/120?img=47"
  },
  employee: {
    username: "user",
    password: "user",
    role: "employee",
    name: "Piotr Kierowca",
    email: "piotr.kierowca@fleetify.io",
    avatar: "https://i.pravatar.cc/120?img=55"
  }
};

const ADMIN_DASHBOARD = {
  stats: [
    { label: "Aktywne pojazdy", value: 128, delta: "+4", tone: "success" },
    { label: "Średnie zużycie paliwa", value: "6.8 l/100km", delta: "-0.3", tone: "success" },
    { label: "Alerty krytyczne", value: 5, delta: "-2", tone: "warning" },
    { label: "Dostępność floty", value: "92%", delta: "+3%", tone: "info" }
  ],
  fleetHealth: [
    { id: "WX-432", model: "Skoda Enyaq", status: "OK", location: "Warszawa HQ", battery: 82 },
    { id: "GD-218", model: "Tesla Model 3", status: "Serwis", location: "Gdańsk", battery: 54 },
    { id: "KR-019", model: "VW Crafter", status: "OK", location: "Kraków", battery: 0 }
  ],
  alerts: [
    { id: "ALT-311", type: "Serwis", severity: "warning", message: "Przegląd VW Crafter opóźniony o 5 dni." },
    { id: "ALT-312", type: "Telemetria", severity: "info", message: "Spadek jakości sygnału dla 6 urządzeń IoT." },
    { id: "ALT-313", type: "Bezpieczeństwo", severity: "danger", message: "Niespodziewany postój pojazdu KR-019." }
  ],
  costBreakdown: {
    fuel: 42,
    service: 25,
    insurance: 11,
    leasing: 22
  }
};

const EMPLOYEE_DASHBOARD = {
  assignment: {
    vehicle: {
      id: "WL-2043",
      model: "Hyundai IONIQ 5",
      vin: "KMHAA81CRNU123456",
      mileage: "18 430 km",
      battery: 74,
      tirePressure: "OK"
    },
    tasks: [
      { id: "TASK-01", label: "Odbiór klienta – lotnisko" },
      { id: "TASK-02", label: "Wizyta w serwisie partnerskim" }
    ]
  },
  trips: [
    { id: 1, route: "Warszawa ↔ Łódź", distance: "264 km", cost: "78 PLN", efficiency: "6.1 l/100km" },
    { id: 2, route: "Warszawa ↔ Poznań", distance: "580 km", cost: "122 PLN", efficiency: "6.9 l/100km" }
  ],
  reminders: [
    { id: "REM-1", message: "Kontrola opon za 12 dni", severity: "info" },
    { id: "REM-2", message: "Raport wydatków za 3 dni", severity: "warning" }
  ]
};

const delay = (ms = 650) => new Promise((resolve) => setTimeout(resolve, ms));

function buildToken(user) {
  return btoa(`${user.username}:${user.role}:${Date.now()}`);
}

function matchCredentials(username, password) {
  const allUsers = Object.values(USERS);
  return allUsers.find(
    (user) => user.username.toLowerCase() === username.toLowerCase() && user.password === password
  );
}

export async function restRequest({ method, path, body }) {
  await delay();
  const signature = `${method.toUpperCase()} ${path}`;

  switch (signature) {
    case "POST /api/login": {
      const { username, password } = body ?? {};
      const user = matchCredentials(username ?? "", password ?? "");
      if (!user) {
        const error = new Error("Nieprawidłowe dane logowania");
        error.status = 401;
        throw error;
      }
      return {
        status: 200,
        data: {
          token: buildToken(user),
          user: {
            role: user.role,
            name: user.name,
            email: user.email,
            avatar: user.avatar
          }
        }
      };
    }
    case "GET /api/dashboard/admin": {
      return { status: 200, data: ADMIN_DASHBOARD };
    }
    case "GET /api/dashboard/employee": {
      return { status: 200, data: EMPLOYEE_DASHBOARD };
    }
    default: {
      const error = new Error(`Endpoint ${signature} nie jest dostępny w trybie demo`);
      error.status = 404;
      throw error;
    }
  }
}

export const apiClient = {
  login: (body) => restRequest({ method: "POST", path: "/api/login", body }),
  fetchDashboard: (role) => restRequest({ method: "GET", path: `/api/dashboard/${role}` })
};
