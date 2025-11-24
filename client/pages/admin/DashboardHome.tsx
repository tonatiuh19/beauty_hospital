import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Calendar,
  Users,
  DollarSign,
  FileText,
  TrendingUp,
  TrendingDown,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import axios from "@/lib/axios";
import {
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

interface DashboardMetrics {
  period: {
    start_date: string;
    end_date: string;
  };
  appointments: {
    total: number;
    completed: number;
    cancelled: number;
    no_show: number;
    scheduled: number;
  };
  revenue: {
    total_revenue: number;
    total_refunds: number;
    pending_amount: number;
  };
  patients: {
    new_patients: number;
  };
  contracts: {
    active_contracts: number;
  };
  topServices: Array<{
    name: string;
    category: string;
    bookings: number;
    revenue: number;
  }>;
  upcomingToday: number;
}

interface RevenueChartData {
  date: string;
  revenue: number;
  transactions: number;
}

export default function DashboardHome() {
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null);
  const [revenueChart, setRevenueChart] = useState<RevenueChartData[]>([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod] = useState<"week" | "month" | "year">("month");

  useEffect(() => {
    fetchDashboardData();
  }, []);

  useEffect(() => {
    fetchRevenueChart();
  }, [period]);

  const fetchDashboardData = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get("/admin/dashboard/metrics", {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.data.success) {
        setMetrics(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching dashboard metrics:", error);
    } finally {
      setLoading(false);
    }
  };

  const fetchRevenueChart = async () => {
    try {
      const token = localStorage.getItem("adminAccessToken");
      const response = await axios.get(
        `/admin/dashboard/revenue-chart?period=${period}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        },
      );

      if (response.data.success) {
        setRevenueChart(response.data.data);
      }
    } catch (error) {
      console.error("Error fetching revenue chart:", error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("es-MX", {
      style: "currency",
      currency: "MXN",
    }).format(amount);
  };

  const getPercentageChange = (current: number, total: number) => {
    if (total === 0) return 0;
    return ((current / total) * 100).toFixed(1);
  };

  if (loading) {
    return (
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-32 mb-2" />
                <Skeleton className="h-3 w-20" />
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }

  if (!metrics) {
    return (
      <div className="p-6">
        <Card>
          <CardContent className="p-6">
            <p className="text-center text-gray-500">
              No se pudieron cargar las métricas
            </p>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = [
    {
      title: "Citas Hoy",
      value: metrics.upcomingToday,
      icon: Clock,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      trend: null,
    },
    {
      title: "Total Citas",
      value: metrics.appointments.total,
      icon: Calendar,
      color: "text-primary",
      bgColor: "bg-primary/10",
      subtitle: `${metrics.appointments.completed} completadas`,
      trend: {
        value: getPercentageChange(
          metrics.appointments.completed,
          metrics.appointments.total,
        ),
        isPositive: true,
      },
    },
    {
      title: "Ingresos",
      value: formatCurrency(metrics.revenue.total_revenue || 0),
      icon: DollarSign,
      color: "text-green-600",
      bgColor: "bg-green-50",
      subtitle: `${formatCurrency(metrics.revenue.pending_amount || 0)} pendiente`,
      trend: {
        value: getPercentageChange(
          metrics.revenue.total_revenue - metrics.revenue.total_refunds,
          metrics.revenue.total_revenue,
        ),
        isPositive: true,
      },
    },
    {
      title: "Nuevos Pacientes",
      value: metrics.patients.new_patients,
      icon: Users,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
      trend: null,
    },
  ];

  return (
    <div className="p-4 md:p-6 space-y-4 md:space-y-6">
      {/* Header */}
      <div>
        <h1
          className="text-2xl md:text-3xl font-bold text-gray-900"
          style={{ fontFamily: "Cinzel, serif" }}
        >
          Dashboard
        </h1>
        <p className="text-sm md:text-base text-gray-500 mt-1">
          Bienvenido de vuelta! Aquí está el resumen de hoy.
        </p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-600">
                        {stat.title}
                      </p>
                      <p className="text-2xl font-bold text-gray-900 mt-2">
                        {stat.value}
                      </p>
                      {stat.subtitle && (
                        <p className="text-xs text-gray-500 mt-1">
                          {stat.subtitle}
                        </p>
                      )}
                      {stat.trend && (
                        <div className="flex items-center gap-1 mt-2">
                          {stat.trend.isPositive ? (
                            <TrendingUp className="w-4 h-4 text-green-600" />
                          ) : (
                            <TrendingDown className="w-4 h-4 text-red-600" />
                          )}
                          <span
                            className={`text-xs font-medium ${stat.trend.isPositive ? "text-green-600" : "text-red-600"}`}
                          >
                            {stat.trend.value}%
                          </span>
                        </div>
                      )}
                    </div>
                    <div className={`p-3 rounded-lg ${stat.bgColor}`}>
                      <Icon className={`w-6 h-6 ${stat.color}`} />
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          );
        })}
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 md:gap-6">
        {/* Revenue Chart */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <CardTitle
                className="text-lg md:text-xl"
                style={{ fontFamily: "Cinzel, serif" }}
              >
                Ingresos
              </CardTitle>
              <div className="flex gap-2 flex-wrap">
                {(["week", "month", "year"] as const).map((p) => (
                  <button
                    key={p}
                    onClick={() => setPeriod(p)}
                    className={`px-3 py-1 text-xs rounded-md transition-colors ${
                      period === p
                        ? "bg-primary/20 text-primary font-medium"
                        : "text-gray-600 hover:bg-gray-100"
                    }`}
                  >
                    {p === "week" ? "Semana" : p === "month" ? "Mes" : "Año"}
                  </button>
                ))}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer
              width="100%"
              height={200}
              className="md:!h-[250px]"
            >
              <LineChart data={revenueChart}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis
                  dataKey="date"
                  stroke="#888"
                  fontSize={10}
                  tickLine={false}
                  className="md:text-xs"
                />
                <YAxis
                  stroke="#888"
                  fontSize={10}
                  tickLine={false}
                  className="md:text-xs"
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "white",
                    border: "1px solid #e5e7eb",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Line
                  type="monotone"
                  dataKey="revenue"
                  stroke="#C9A159"
                  strokeWidth={2}
                  dot={false}
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Appointment Status */}
        <Card>
          <CardHeader>
            <CardTitle style={{ fontFamily: "Cinzel, serif" }}>
              Estado de Citas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-green-600" />
                <span className="text-sm text-gray-600">Completadas</span>
              </div>
              <Badge variant="secondary" className="bg-green-50 text-green-700">
                {metrics.appointments.completed}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-blue-600" />
                <span className="text-sm text-gray-600">Programadas</span>
              </div>
              <Badge variant="secondary" className="bg-blue-50 text-blue-700">
                {metrics.appointments.scheduled}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <XCircle className="w-4 h-4 text-red-600" />
                <span className="text-sm text-gray-600">Canceladas</span>
              </div>
              <Badge variant="secondary" className="bg-red-50 text-red-700">
                {metrics.appointments.cancelled}
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-orange-600" />
                <span className="text-sm text-gray-600">No Show</span>
              </div>
              <Badge
                variant="secondary"
                className="bg-orange-50 text-orange-700"
              >
                {metrics.appointments.no_show}
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Top Services */}
      <Card>
        <CardHeader>
          <CardTitle style={{ fontFamily: "Cinzel, serif" }}>
            Servicios Más Solicitados
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {metrics.topServices.map((service, index) => (
              <div
                key={index}
                className="flex items-center justify-between p-4 bg-gray-50 rounded-lg"
              >
                <div className="flex-1">
                  <p className="font-medium text-gray-900">{service.name}</p>
                  <p className="text-sm text-gray-500 capitalize">
                    {service.category.replace("_", " ")}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-gray-900">
                    {service.bookings || 0} citas
                  </p>
                  <p className="text-sm text-gray-500">
                    {formatCurrency(service.revenue || 0)}
                  </p>
                </div>
              </div>
            ))}
            {metrics.topServices.length === 0 && (
              <p className="text-center text-gray-500 py-8">
                No hay datos de servicios disponibles
              </p>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
