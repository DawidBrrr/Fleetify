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

const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884d8", "#82ca9d"];

const PERIOD_OPTIONS = [
    { value: 7, label: "7 dni" },
    { value: 30, label: "30 dni" },
    { value: 90, label: "3 miesiące" },
    { value: 180, label: "6 miesięcy" },
    { value: 365, label: "Rok" },
];

function LoadingSpinner() {
    return (
        <div className="d-flex justify-content-center align-items-center p-5">
            <div className="spinner-border text-primary" role="status">
                <span className="visually-hidden">Ładowanie...</span>
            </div>
        </div>
    );
}

function ChartCard({ title, children, loading, error }) {
    return (
        <div className="card shadow-sm h-100">
            <div className="card-header bg-white border-bottom">
                <h5 className="card-title mb-0">{title}</h5>
            </div>
            <div className="card-body">
                {loading ? (
                    <LoadingSpinner />
                ) : error ? (
                    <div className="alert alert-warning mb-0">{error}</div>
                ) : (
                    children
                )}
            </div>
        </div>
    );
}

function SummaryCard({ label, value, delta, icon }) {
    const isPositive = delta?.startsWith("+");
    const deltaClass = isPositive ? "text-success" : "text-danger";
    
    return (
        <div className="card shadow-sm">
            <div className="card-body">
                <div className="d-flex justify-content-between align-items-start">
                    <div>
                        <p className="text-muted small mb-1">{label}</p>
                        <h3 className="mb-0">{value}</h3>
                        {delta && (
                            <small className={deltaClass}>
                                {delta} vs poprzedni miesiąc
                            </small>
                        )}
                    </div>
                    <span className="fs-1">{icon}</span>
                </div>
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
        <div className="analytics-page p-4">
            {/* Header */}
            <div className="d-flex justify-content-between align-items-center mb-4">
                <div>
                    <h1 className="h3 mb-1">📈 Analityka Floty</h1>
                    <p className="text-muted mb-0">Szczegółowe statystyki i wykresy</p>
                </div>
                <div className="d-flex gap-3">
                    <select
                        className="form-select"
                        value={selectedVehicle}
                        onChange={(e) => setSelectedVehicle(e.target.value)}
                        style={{ minWidth: "200px" }}
                    >
                        <option value="">Wszystkie pojazdy</option>
                        {vehicles.map((v) => (
                            <option key={v.id} value={v.id}>
                                {v.label}
                            </option>
                        ))}
                    </select>
                    <select
                        className="form-select"
                        value={period}
                        onChange={(e) => setPeriod(Number(e.target.value))}
                        style={{ minWidth: "150px" }}
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
                        icon="⛽"
                    />
                </div>
                <div className="col-md-4">
                    <SummaryCard
                        label="Przejechane km (ten miesiąc)"
                        value={summaryData.data?.current_month?.total_distance_km 
                            ? `${summaryData.data.current_month.total_distance_km.toFixed(0)} km` 
                            : "—"}
                        delta={summaryData.data?.deltas?.distance}
                        icon="🛣️"
                    />
                </div>
                <div className="col-md-4">
                    <SummaryCard
                        label="Liczba tras (ten miesiąc)"
                        value={summaryData.data?.current_month?.trips_count ?? "—"}
                        icon="📍"
                    />
                </div>
            </div>

            {/* Charts Row 1 */}
            <div className="row g-4 mb-4">
                {/* Fuel Consumption Over Time */}
                <div className="col-lg-8">
                    <ChartCard 
                        title="🛢️ Zużycie paliwa w czasie" 
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
                        title="💰 Podział kosztów" 
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
            <div className="row g-4 mb-4">
                {/* Vehicle Mileage Bar */}
                <div className="col-lg-6">
                    <ChartCard 
                        title="🚗 Przebieg wg pojazdów (Top 10)" 
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
                        title="📊 Efektywność paliwowa (l/100km)" 
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
            <div className="row g-4 mb-4">
                <div className="col-12">
                    <ChartCard 
                        title="📈 Trend kosztów miesięcznych" 
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
            <div className="row g-4">
                <div className="col-12">
                    <ChartCard 
                        title="🔮 Predykcja kosztów (regresja liniowa)" 
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
