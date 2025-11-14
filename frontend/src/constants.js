import {
  FiShield,
  FiActivity,
  FiBell,
  FiNavigation2,
  FiUsers,
  FiTruck
} from "react-icons/fi";

export const featureCards = [
  {
    icon: FiShield,
    title: "Bezpieczeństwo danych",
    description: "Scentralizowane logowanie, SSO i pełny audyt aktywności użytkowników.",
    badge: "SLA 99.95%"
  },
  {
    icon: FiNavigation2,
    title: "Live tracking",
    description: "Podgląd telemetrii w czasie rzeczywistym i inteligentne alerty geofencingu.",
    badge: "+58% efektywności"
  },
  {
    icon: FiActivity,
    title: "Analityka predykcyjna",
    description: "Prognozy kosztów, zużycia paliwa oraz automatyczne sugestie serwisowe.",
    badge: "AI inside"
  },
  {
    icon: FiBell,
    title: "Powiadomienia omnichannel",
    description: "SMS, e-mail i push dla krytycznych zdarzeń, eskalacje SLA.",
    badge: "<2s reakcja"
  }
];

export const adminPanel = {
  role: "administrator",
  title: "Panel administratora",
  description:
    "Pełny widok floty, zarządzanie użytkownikami, kosztami i integracjami API.",
  metrics: [
    { label: "Aktywne pojazdy", value: "128" },
    { label: "Zespoły", value: "9" },
    { label: "Alerty dzienne", value: "34" }
  ],
  checklist: [
    "Live status pojazdów z kolorową segmentacją",
    "Zarządzanie politykami tankowań i serwisu",
    "Panel integracji (HR, ERP, IoT)"
  ]
};

export const employeePanel = {
  role: "pracownik",
  title: "Panel kierowcy",
  description:
    "Szybki dostęp do przypisanych aut, zgłoszeń serwisowych i historii tras.",
  metrics: [
    { label: "Twoje pojazdy", value: "2" },
    { label: "Najbliższy przegląd", value: "12 dni" },
    { label: "Otwarte zgłoszenia", value: "1" }
  ],
  checklist: [
    "Mobilne karty pojazdów z kodami QR",
    "Inteligentne przypomnienia o zadaniach",
    "Cyfrowy protokół uszkodzeń"
  ]
};
