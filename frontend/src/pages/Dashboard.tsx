import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { DashboardAPI } from "../api/resources";
import { apiErrorMessage } from "../api/client";
import type { DashboardSummary } from "../types";
import { Badge, Card, EmptyState, ErrorBanner, Spinner, StatCard } from "../components/ui";
import { format } from "date-fns";

const STATUS_COLORS: Record<string, string> = {
  SCHEDULED: "#2563eb",
  COMPLETED: "#059669",
  CANCELLED: "#dc2626",
  NO_SHOW: "#d97706",
};

export default function Dashboard() {
  const [data, setData] = useState<DashboardSummary | null>(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    DashboardAPI.summary()
      .then((res) => setData(res.data))
      .catch((err) => setError(apiErrorMessage(err)))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="flex h-64 items-center justify-center">
        <Spinner />
      </div>
    );
  }

  if (error || !data) {
    return <ErrorBanner message={error || "Failed to load dashboard"} />;
  }

  const chartData = data.appointmentsByStatus.map((s) => ({
    name: s.status,
    value: s._count,
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold text-slate-900">Dashboard</h1>
        <p className="text-sm text-slate-500">Clinic overview at a glance</p>
      </div>

      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <StatCard label="Total Patients" value={data.totalPatients} />
        <StatCard label="Doctors on Staff" value={data.totalDoctors} />
        <StatCard label="Today's Appointments" value={data.todaysAppointments} />
        <StatCard
          label="Outstanding Balance"
          value={`$${data.outstanding.amount.toFixed(2)}`}
          hint={`${data.outstanding.count} unpaid invoice(s)`}
          accent="text-red-600"
        />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Card className="p-5 lg:col-span-2">
          <div className="mb-3 flex items-center justify-between">
            <h2 className="text-sm font-semibold text-slate-800">Upcoming appointments (today)</h2>
            <Link to="/appointments" className="text-xs font-medium text-brand-600 hover:underline">
              View all
            </Link>
          </div>
          {data.upcomingAppointments.length === 0 ? (
            <EmptyState title="No upcoming appointments today" />
          ) : (
            <ul className="divide-y divide-slate-100">
              {data.upcomingAppointments.map((a) => (
                <li key={a.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="text-sm font-medium text-slate-800">
                      {a.patient?.firstName} {a.patient?.lastName}
                    </p>
                    <p className="text-xs text-slate-500">
                      Dr. {a.doctor?.user.name} · {a.startTime}–{a.endTime}
                    </p>
                  </div>
                  <Badge label={a.status} />
                </li>
              ))}
            </ul>
          )}
        </Card>

        <Card className="p-5">
          <h2 className="mb-3 text-sm font-semibold text-slate-800">Appointments by status</h2>
          {chartData.length === 0 ? (
            <EmptyState title="No appointment data yet" />
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={chartData} dataKey="value" nameKey="name" innerRadius={45} outerRadius={75}>
                  {chartData.map((entry) => (
                    <Cell key={entry.name} fill={STATUS_COLORS[entry.name] ?? "#94a3b8"} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend />
              </PieChart>
            </ResponsiveContainer>
          )}
        </Card>
      </div>

      <Card className="p-5">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-semibold text-slate-800">Recently registered patients</h2>
          <Link to="/patients" className="text-xs font-medium text-brand-600 hover:underline">
            View all
          </Link>
        </div>
        {data.recentPatients.length === 0 ? (
          <EmptyState title="No patients yet" />
        ) : (
          <ul className="divide-y divide-slate-100">
            {data.recentPatients.map((p) => (
              <li key={p.id} className="flex items-center justify-between py-2.5">
                <Link to={`/patients/${p.id}`} className="text-sm font-medium text-slate-800 hover:text-brand-600">
                  {p.firstName} {p.lastName}
                </Link>
                <span className="text-xs text-slate-400">
                  Joined {format(new Date(p.createdAt), "MMM d, yyyy")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}
