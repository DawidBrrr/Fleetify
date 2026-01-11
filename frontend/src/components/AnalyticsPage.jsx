import { useState, useEffect } from "react";
import {
    LineChart,
    Line,
    BarChart,
    Bar,
    PieChart,
    Pie,
    Cell,
    XAxis,
    YAxis,
    CartesianGrid,
    Tooltip,
    Legend,
    ResponsiveContainer,
    Area,
    AreaChart,
    ComposedChart,
    ReferenceLine
} from "recharts";
import { analyticsApi } from "../services/api";

const Icons = {
  chart: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>,
  fuel: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M3 22V5a2 2 0 0 1 2-2h8a2 2 0 0 1 2 2v17"/><path d="M15 12h2a2 2 0 0 1 2 2v5a2 2 0 0 0 4 0V9.83a2 2 0 0 0-.59-1.42L18 4"/><path d="M6 12h6"/></svg>,
  route: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="6" cy="19" r="3"/><path d="M9 19h8.5a3.5 3.5 0 0 0 0-7h-11a3.5 3.5 0 0 1 0-7H15"/><circle cx="18" cy="5" r="3"/></svg>,
  wallet: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/></svg>,
  car: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M5 11l1.5-4.5a2 2 0 0 1 1.9-1.5h7.2a2 2 0 0 1 1.9 1.5L19 11"/><path d="M3 17h1a1 1 0 0 0 1-1v-3a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v3a1 1 0 0 0 1 1h1"/><circle cx="7.5" cy="17.5" r="1.5"/><circle cx="16.5" cy="17.5" r="1.5"/></svg>,
  gauge: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M12 2a10 10 0 1 0 10 10"/><path d="M12 12l5-5"/><path d="M12 7v5"/></svg>,
  trendUp: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>,
  prediction: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg>,
  location: <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/></svg>,
};

const COLORS = ["#05b4d9", "#10b981", "#f59e0b", "#ef4444", "#8b5cf6", "#ec4899"];

const PERIOD_OPTIONS = [
    { value: 7, label: "7 dni" },
    { value: 30, label: "30 dni" },
    { value: 90, label: "3 miesiące" },
    { value: 180, label: "6 miesięcy" },
    { value: 365, label: "Rok" },
];

function LoadingSpinner() {
    return (
        <div className="vp-chart-loading">
            <div className="vp-spinner-large"></div>
            <span>Ładowanie danych...</span>
        </div>
    );
}

function ChartCard({ title, icon, children, loading, error }) {
    return (
        <div className="vp-chart-card">
            <div className="vp-chart-card__header">
                <div className="vp-chart-card__icon">{icon}</div>
                <h5 className="vp-chart-card__title">{title}</h5>
            </div>
            <div className="vp-chart-card__body">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="vp-chart-empty">{error}</div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value, delta, icon }) {
    const isPositive = delta?.startsWith("+");
    
    return (
        <div className="vp-stat-card">
            <div className="vp-stat-card__header">
                <div className={`vp-stat-card__icon vp-stat-card__icon--${isPositive ? 'success' : 'primary'}`}>
                    {icon}
                </div>
                {delta && (
                    <span className={`vp-stat-card__trend vp-stat-card__trend--${isPositive ? 'up' : 'down'}`}>
                        {Icons.trendUp}
                        {delta}
                    </span>
                )}
            </div>
            <div className="vp-stat-card__content">
                <span className="vp-stat-card__value">{value}</span>
                <p className="vp-stat-card__label">{label}</p>
            </div>
        </div>
    );
}

export default function AnalyticsPage() {
    const [period, setPeriod] = useState(30);
    const [selectedVehicle, setSelectedVehicle] = useState("");
    const [vehicles, setVehicles] = useState([]);
    
    const [fuelData, setFuelData] = useState({ data: [], loading: true, error: null });
    const [costData, setCostData] = useState({ data: [], loading: true, error: null });
    const [mileageData, setMileageData] = useState({ data: [], loading: true, error: null });
    const [efficiencyData, setEfficiencyData] = useState({ data: [], loading: true, error: null });
    const [trendData, setTrendData] = useState({ data: [], loading: true, error: null });
    const [summaryData, setSummaryData] = useState({ data: null, loading: true, error: null });
    const [predictionData, setPredictionData] = useState({ 
        data: null, 
        loading: true, 
        error: null 
    });

    // Pobierz listę pojazdów przy pierwszym renderze
    useEffect(() => {
        const fetchVehicles = async () => {
            try {
                const response = await analyticsApi.getVehiclesList();
                setVehicles(response.vehicles || []);
            } catch (error) {
                console.error("Failed to fetch vehicles list:", error);
            }
        };
        fetchVehicles();
    }, []);

    // Pobierz dane wykresów
    useEffect(() => {
        const fetchAllData = async () => {
            // Reset loading states
            setFuelData(prev => ({ ...prev, loading: true, error: null }));
            setCostData(prev => ({ ...prev, loading: true, error: null }));
            setMileageData(prev => ({ ...prev, loading: true, error: null }));
            setEfficiencyData(prev => ({ ...prev, loading: true, error: null }));
            setTrendData(prev => ({ ...prev, loading: true, error: null }));
            setSummaryData(prev => ({ ...prev, loading: true, error: null }));

            // Fuel Consumption
            try {
                const fuel = await analyticsApi.getFuelConsumption({ 
                    days: period, 
                    vehicleId: selectedVehicle || undefined 
                });
                setFuelData({ data: fuel.data || [], loading: false, error: null });
            } catch (error) {
                setFuelData({ data: [], loading: false, error: "Brak danych" });
            }

            // Cost Breakdown
            try {
                const cost = await analyticsApi.getCostBreakdown({ days: period });
                setCostData({ data: cost.data || [], loading: false, error: null });
            } catch (error) {
                setCostData({ data: [], loading: false, error: "Brak danych" });
            }

            // Vehicle Mileage
            try {
                const mileage = await analyticsApi.getVehicleMileage({ days: period, limit: 10 });
                setMileageData({ data: mileage.data || [], loading: false, error: null });
            } catch (error) {
                setMileageData({ data: [], loading: false, error: "Brak danych" });
            }

            // Fuel Efficiency
            try {
                const efficiency = await analyticsApi.getFuelEfficiency({ 
                    days: period, 
                    vehicleId: selectedVehicle || undefined 
                });
                setEfficiencyData({ data: efficiency.data || [], loading: false, error: null });
            } catch (error) {
                setEfficiencyData({ data: [], loading: false, error: "Brak danych" });
            }

            // Cost Trend
            try {
                const trend = await analyticsApi.getCostTrend({ 
                    months: Math.ceil(period / 30),
                    vehicleId: selectedVehicle || undefined
                });
                setTrendData({ data: trend.data || [], loading: false, error: null });
            } catch (error) {
                setTrendData({ data: [], loading: false, error: "Brak danych" });
            }

            // Fleet Summary
            try {
                const summary = await analyticsApi.getFleetSummary();
                setSummaryData({ data: summary, loading: false, error: null });
            } catch (error) {
                setSummaryData({ data: null, loading: false, error: "Brak danych" });
            }

            // Cost Prediction (regression-based)
            try {
                const prediction = await analyticsApi.getCostPrediction({ 
                    historyDays: period, 
                    predictDays: Math.max(14, Math.floor(period / 3)),
                    vehicleId: selectedVehicle || undefined
                });
                setPredictionData({ data: prediction, loading: false, error: null });
            } catch (error) {
                setPredictionData({ data: null, loading: false, error: "Brak danych do predykcji" });
            }
        };

        fetchAllData();
    }, [period, selectedVehicle]);

    const formatCurrency = (value) => `${value.toFixed(2)} zł`;
    const formatLiters = (value) => `${value.toFixed(1)} L`;

    return (
        <div className="section-shell p-4 p-lg-5 dashboard-section">
            {/* Header */}
            <div className="vp-dashboard-header">
                <div className="vp-dashboard-header__info">
                    <div className="vp-dashboard-header__badge">Analiza danych</div>
                    <h2 className="vp-dashboard-header__title">Analityka floty</h2>
                    <span className="vp-dashboard-header__subtitle">Szczegółowe statystyki i wykresy</span>
                </div>
                <div className="d-flex gap-2 flex-wrap">
                    <select
                        className="vp-select"
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        style={{ minWidth: "180px" }}
                    >
                        <option value="">Wszystkie pojazdy</option>
                        {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className="vp-select"
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        style={{ minWidth: "130px" }}
                    >
                        {PERIOD_OPTIONS.map((opt) => (
                            <option key={opt.value} value={opt.value}>
                                {opt.label}
                            </option>
                        ))}
                    </select>
                </div>
            </div>

            {/* Summary Cards */}
            <div className="row g-3 mb-4">
                <div className="col-md-4">
                    <SummaryCard
                        label="Koszty paliwa (ten miesiąc)"
                        value={summaryData.data?.current_month?.fuel_cost 
                            ? formatCurrency(summaryData.data.current_month.fuel_cost) 
                            : "—"}
                        delta={summaryData.data?.deltas?.fuel_cost}
                        icon={Icons.fuel}
                    />
                </div>
                <div className="col-md-4">
                    <SummaryCard
                        label="Przejechane km (ten miesiąc)"
                        value={summaryData.data?.current_month?.total_distance_km 
                            ? `${summaryData.data.current_month.total_distance_km.toFixed(0)} km` 
                            : "—"}
                        delta={summaryData.data?.deltas?.distance}
                        icon={Icons.route}
                    />
                </div>
                <div className="col-md-4">
                    <SummaryCard
                        label="Liczba tras (ten miesiąc)"
                        value={summaryData.data?.current_month?.trips_count ?? "—"}
                        icon={Icons.location}
                    />
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row g-3 mb-4">
                {/* Fuel Consumption Over Time */}
                <div className="col-lg-8">
                    <ChartCard 
                        title="Zużycie paliwa w czasie" 
                        icon={Icons.fuel}
                        loading={fuelData.loading}
                        error={fuelData.error}
                    >
                        {fuelData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <AreaChart data={fuelData.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(v) => new Date(v).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" })}
                                    />
                                    <YAxis yAxisId="left" orientation="left" />
                                    <YAxis yAxisId="right" orientation="right" />
                                    <Tooltip 
                                        formatter={(value, name) => [
                                            name === "liters" ? formatLiters(value) : formatCurrency(value),
                                            name === "liters" ? "Litry" : "Koszt"
                                        ]}
                                        labelFormatter={(v) => new Date(v).toLocaleDateString("pl-PL")}
                                    />
                                    <Legend />
                                    <Area 
                                        yAxisId="left"
                                        type="monotone" 
                                        dataKey="liters" 
                                        name="Litry"
                                        stroke="#0088FE" 
                                        fill="#0088FE" 
                                        fillOpacity={0.3}
                                    />
                                    <Area 
                                        yAxisId="right"
                                        type="monotone" 
                                        dataKey="cost" 
                                        name="Koszt"
                                        stroke="#00C49F" 
                                        fill="#00C49F" 
                                        fillOpacity={0.3}
                                    />
                                </AreaChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted py-5">
                                Brak danych do wyświetlenia
                            </div>
                        )}
                    </ChartCard>
                </div>

                {/* Cost Breakdown Pie */}
                <div className="col-lg-4">
                    <ChartCard 
                        title="Podział kosztów" 
                        icon={Icons.wallet}
                        loading={costData.loading}
                        error={costData.error}
                    >
                        {costData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <PieChart>
                                    <Pie
                                        data={costData.data}
                                        dataKey="amount"
                                        nameKey="category"
                                        cx="50%"
                                        cy="50%"
                                        outerRadius={80}
                                        label={({ category, percent }) => 
                                            `${category} (${(percent * 100).toFixed(0)}%)`
                                        }
                                    >
                                        {costData.data.map((entry, index) => (
                                            <Cell 
                                                key={`cell-${index}`} 
                                                fill={COLORS[index % COLORS.length]} 
                                            />
                                        ))}
                                    </Pie>
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                </PieChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted py-5">
                                Brak danych do wyświetlenia
                            </div>
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Charts Row 2 */}
            <div className="row g-3 mb-4">
                {/* Vehicle Mileage Bar */}
                <div className="col-lg-6">
                    <ChartCard 
                        title="Przebieg wg pojazdów (Top 10)" 
                        icon={Icons.car}
                        loading={mileageData.loading}
                        error={mileageData.error}
                    >
                        {mileageData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={mileageData.data} layout="vertical">
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis type="number" />
                                    <YAxis 
                                        type="category" 
                                        dataKey="vehicle_label" 
                                        width={120}
                                        tick={{ fontSize: 12 }}
                                    />
                                    <Tooltip formatter={(value) => [`${value.toFixed(0)} km`, "Przebieg"]} />
                                    <Bar dataKey="distance_km" fill="#8884d8" name="Przebieg (km)" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted py-5">
                                Brak danych do wyświetlenia
                            </div>
                        )}
                    </ChartCard>
                </div>

                {/* Fuel Efficiency Over Time */}
                <div className="col-lg-6">
                    <ChartCard 
                        title="Efektywność paliwowa (l/100km)" 
                        icon={Icons.gauge}
                        loading={efficiencyData.loading}
                        error={efficiencyData.error}
                    >
                        {efficiencyData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <LineChart data={efficiencyData.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis 
                                        dataKey="date" 
                                        tickFormatter={(v) => new Date(v).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" })}
                                    />
                                    <YAxis domain={['auto', 'auto']} />
                                    <Tooltip 
                                        formatter={(value) => [`${value} l/100km`, "Efektywność"]}
                                        labelFormatter={(v) => new Date(v).toLocaleDateString("pl-PL")}
                                    />
                                    <Legend />
                                    <Line 
                                        type="monotone" 
                                        dataKey="efficiency" 
                                        name="l/100km"
                                        stroke="#FF8042" 
                                        strokeWidth={2}
                                        dot={{ fill: "#FF8042" }}
                                    />
                                </LineChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted py-5">
                                Brak danych do wyświetlenia
                            </div>
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Charts Row 3 - Cost Trend */}
            <div className="row g-3 mb-4">
                <div className="col-12">
                    <ChartCard 
                        title="Trend kosztów miesięcznych" 
                        icon={Icons.trendUp}
                        loading={trendData.loading}
                        error={trendData.error}
                    >
                        {trendData.data.length > 0 ? (
                            <ResponsiveContainer width="100%" height={300}>
                                <BarChart data={trendData.data}>
                                    <CartesianGrid strokeDasharray="3 3" />
                                    <XAxis dataKey="month_label" />
                                    <YAxis />
                                    <Tooltip formatter={(value) => formatCurrency(value)} />
                                    <Legend />
                                    <Bar dataKey="fuel_cost" name="Paliwo" fill="#0088FE" stackId="a" />
                                    <Bar dataKey="tolls_cost" name="Opłaty drogowe" fill="#00C49F" stackId="a" />
                                </BarChart>
                            </ResponsiveContainer>
                        ) : (
                            <div className="text-center text-muted py-5">
                                Brak danych do wyświetlenia
                            </div>
                        )}
                    </ChartCard>
                </div>
            </div>

            {/* Charts Row 4 - Cost Prediction (Regression) */}
            <div className="row g-3">
                <div className="col-12">
                    <ChartCard 
                        title="Predykcja kosztów (regresja liniowa)" 
                        icon={Icons.prediction}
                        loading={predictionData.loading}
                        error={predictionData.error}
                    >
                        {predictionData.data?.historical?.length > 0 ? (
                            <>
                                {/* Model stats */}
                                <div className="row mb-3">
                                    <div className="col-md-3">
                                        <div className="bg-light rounded p-2 text-center">
                                            <small className="text-muted d-block">R² (dokładność)</small>
                                            <strong className={predictionData.data.model_stats?.r_squared > 0.7 ? "text-success" : "text-warning"}>
                                                {(predictionData.data.model_stats?.r_squared * 100 || 0).toFixed(1)}%
                                            </strong>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="bg-light rounded p-2 text-center">
                                            <small className="text-muted d-block">Trend dzienny</small>
                                            <strong className={predictionData.data.model_stats?.daily_trend > 0 ? "text-danger" : "text-success"}>
                                                {predictionData.data.model_stats?.daily_trend > 0 ? "+" : ""}
                                                {predictionData.data.model_stats?.daily_trend?.toFixed(2) || 0} zł
                                            </strong>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="bg-light rounded p-2 text-center">
                                            <small className="text-muted d-block">Śr. dzienny koszt</small>
                                            <strong>
                                                {predictionData.data.summary?.avg_daily_cost?.toFixed(2) || 0} zł
                                            </strong>
                                        </div>
                                    </div>
                                    <div className="col-md-3">
                                        <div className="bg-light rounded p-2 text-center">
                                            <small className="text-muted d-block">Prognoza ({predictionData.data.summary?.predict_days} dni)</small>
                                            <strong className="text-primary">
                                                {predictionData.data.summary?.predicted_next_period_cost?.toFixed(2) || 0} zł
                                            </strong>
                                        </div>
                                    </div>
                                </div>
                                
                                {/* Prediction chart */}
                                <ResponsiveContainer width="100%" height={350}>
                                    <ComposedChart 
                                        data={[
                                            ...predictionData.data.historical.map(h => ({
                                                date: h.date,
                                                actual_cost: h.total_cost,
                                                predicted_cost: null,
                                                is_prediction: false
                                            })),
                                            ...predictionData.data.prediction.map(p => ({
                                                date: p.date,
                                                actual_cost: null,
                                                predicted_cost: p.predicted_cost,
                                                is_prediction: true
                                            }))
                                        ]}
                                    >
                                        <CartesianGrid strokeDasharray="3 3" />
                                        <XAxis 
                                            dataKey="date" 
                                            tickFormatter={(v) => new Date(v).toLocaleDateString("pl-PL", { day: "2-digit", month: "short" })}
                                        />
                                        <YAxis />
                                        <Tooltip 
                                            formatter={(value, name) => [
                                                value ? `${value.toFixed(2)} zł` : "—",
                                                name
                                            ]}
                                            labelFormatter={(v) => new Date(v).toLocaleDateString("pl-PL")}
                                        />
                                        <Legend />
                                        <ReferenceLine 
                                            x={predictionData.data.historical[predictionData.data.historical.length - 1]?.date}
                                            stroke="#ff7300"
                                            strokeDasharray="5 5"
                                            label={{ value: "Dziś", position: "top", fill: "#ff7300" }}
                                        />
                                        <Area 
                                            type="monotone" 
                                            dataKey="actual_cost" 
                                            name="Aktualne koszty"
                                            stroke="#0088FE" 
                                            fill="#0088FE" 
                                            fillOpacity={0.3}
                                            connectNulls={false}
                                        />
                                        <Line 
                                            type="monotone" 
                                            dataKey="predicted_cost" 
                                            name="Przewidywane koszty"
                                            stroke="#FF8042" 
                                            strokeWidth={2}
                                            strokeDasharray="5 5"
                                            dot={{ fill: "#FF8042", r: 3 }}
                                            connectNulls={false}
                                        />
                                    </ComposedChart>
                                </ResponsiveContainer>
                                
                                <div className="mt-3 p-3 bg-light rounded">
                                    <small className="text-muted">
                                        <strong>ℹ️ O predykcji:</strong> Model używa regresji liniowej do przewidywania przyszłych kosztów 
                                        na podstawie {predictionData.data.model_stats?.data_points || 0} punktów danych historycznych.
                                        {" "}
                                        {predictionData.data.model_stats?.r_squared > 0.7 
                                            ? "Wysoka wartość R² wskazuje na dobrą dokładność modelu." 
                                            : "Niska wartość R² może oznaczać dużą zmienność kosztów lub niewystarczającą ilość danych."}
                                        {" Trend: "}
                                        <strong className={predictionData.data.model_stats?.daily_trend > 0 ? "text-danger" : "text-success"}>
                                            {predictionData.data.model_stats?.trend_direction}
                                        </strong>
                                    </small>
                                </div>
                            </>
                        ) : (
                            <div className="text-center text-muted py-5">
                                <p>Brak wystarczających danych do predykcji</p>
                                <small>Wymagane minimum 3 dni z zapisanymi kosztami</small>
                            </div>
                        )}
                    </ChartCard>
                </div>
            </div>
        </div>
    );
}
