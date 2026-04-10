import Card from "react-bootstrap/Card";
import { useEffect, useState } from "react";
import axios from "axios";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Table from "react-bootstrap/Table";
import Badge from "react-bootstrap/Badge";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend
} from "recharts";
import {
  FaUserMd,
  FaUsers,
  FaCalendarCheck,
  FaRupeeSign
} from "react-icons/fa";

function StatCard({ title, value, icon, color, subtitle }) {
  return (
    <Card
      className="h-100 border-0"
      style={{
        borderRadius: 16,
        boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)",
        transition: "transform 140ms ease, box-shadow 140ms ease"
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = "translateY(-2px)";
        e.currentTarget.style.boxShadow = "0 16px 38px rgba(16, 24, 40, 0.12)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = "translateY(0px)";
        e.currentTarget.style.boxShadow = "0 10px 30px rgba(16, 24, 40, 0.08)";
      }}
    >
      <Card.Body className="p-3 p-lg-4">
        <div className="d-flex align-items-start justify-content-between gap-2">
          <div>
            <div className="text-muted fw-semibold">{title}</div>
            <div className="d-flex align-items-baseline gap-2 mt-1">
              <div className="fs-2 fw-bold" style={{ lineHeight: 1.1 }}>
                {value}
              </div>
              {subtitle ? (
                <span className="text-muted" style={{ fontSize: 13 }}>
                  {subtitle}
                </span>
              ) : null}
            </div>
          </div>
          <div
            className="d-inline-flex align-items-center justify-content-center"
            style={{
              width: 44,
              height: 44,
              borderRadius: 14,
              background: `${color}22`,
              color
            }}
          >
            <span style={{ fontSize: 20, lineHeight: 0 }}>{icon}</span>
          </div>
        </div>
      </Card.Body>
    </Card>
  );
}

export default function Dashboard() {
  const API_BASE_URL = (
    import.meta.env.VITE_API_BASEURL ||
    import.meta.env.api_baseurl ||
    "http://localhost:5000/api"
  ).replace(/\/+$/, "");

  const [stats, setStats] = useState({
    doctors: 0,
    patients: 0,
    appointments: 0,
    revenue: 0
  });
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  useEffect(() => {
    let isActive = true;

    const fetchStats = async () => {
      setStatsLoading(true);
      setStatsError("");
      try {
        const res = await axios.get(`${API_BASE_URL}/dashboard/stats`);
        const payload = res?.data?.data || {};

        const next = {
          doctors: Number(payload.totalDoctors || 0),
          patients: Number(payload.totalPatients || 0),
          appointments: Number(payload.totalAppointmentsToday || 0),
          revenue: Number(payload.totalRevenue || 0)
        };

        if (isActive) setStats(next);
      } catch (err) {
        console.error("Failed to fetch dashboard stats", err);
        if (isActive) {
          setStatsError("Failed to load dashboard analytics.");
          setStats({ doctors: 0, patients: 0, appointments: 0, revenue: 0 });
        }
      } finally {
        if (isActive) setStatsLoading(false);
      }
    };

    fetchStats();
    return () => {
      isActive = false;
    };
  }, [API_BASE_URL]);
  const appointmentsPerMonth = [
    { month: "Jan", appointments: 38 },
    { month: "Feb", appointments: 42 },
    { month: "Mar", appointments: 55 },
    { month: "Apr", appointments: 47 },
    { month: "May", appointments: 60 },
    { month: "Jun", appointments: 66 },
    { month: "Jul", appointments: 62 },
    { month: "Aug", appointments: 70 },
    { month: "Sep", appointments: 64 },
    { month: "Oct", appointments: 78 },
    { month: "Nov", appointments: 73 },
    { month: "Dec", appointments: 84 }
  ];

  const revenueByMonth = [
    { month: "Jan", revenue: 140000 },
    { month: "Feb", revenue: 160000 },
    { month: "Mar", revenue: 210000 },
    { month: "Apr", revenue: 180000 },
    { month: "May", revenue: 240000 },
    { month: "Jun", revenue: 260000 }
  ];

  const specializationData = [
    { name: "Cardiology", value: 6 },
    { name: "Orthopedics", value: 5 },
    { name: "Pediatrics", value: 4 },
    { name: "Dermatology", value: 3 },
    { name: "Other", value: 10 }
  ];

  const pieColors = ["#1976d2", "#2e7d32", "#ed6c02", "#9c27b0", "#607d8b"];

  const recentAppointments = [
    { id: "APT-1042", patient: "Amit S.", doctor: "Dr. S. Roy", time: "10:30 AM", status: "Confirmed" },
    { id: "APT-1043", patient: "Priya K.", doctor: "Dr. M. Das", time: "11:15 AM", status: "Pending" },
    { id: "APT-1044", patient: "Rahul P.", doctor: "Dr. A. Sen", time: "01:00 PM", status: "Confirmed" },
    { id: "APT-1045", patient: "Sneha D.", doctor: "Dr. N. Paul", time: "03:10 PM", status: "Cancelled" }
  ];

  const latestPatients = [
    { name: "Suman B.", phone: "+91 98xxxxxx12", date: "Today" },
    { name: "Nisha R.", phone: "+91 97xxxxxx45", date: "Today" },
    { name: "Imran A.", phone: "+91 99xxxxxx10", date: "Yesterday" },
    { name: "Kavya M.", phone: "+91 96xxxxxx08", date: "Yesterday" }
  ];

  const recentPayments = [
    { invoice: "INV-9007", patient: "Amit S.", amount: 1200, method: "UPI" },
    { invoice: "INV-9008", patient: "Priya K.", amount: 850, method: "Cash" },
    { invoice: "INV-9009", patient: "Rahul P.", amount: 2400, method: "Card" }
  ];

  function statusVariant(status) {
    if (status === "Confirmed") return "success";
    if (status === "Pending") return "warning";
    if (status === "Cancelled") return "danger";
    return "secondary";
  }

  return (
    <>
      <div className="d-flex align-items-center justify-content-between mb-3">
        <div>
          <h3 className="mb-1">Dashboard</h3>
          <div className="text-muted">Overview & analytics</div>
          {statsLoading ? (
            <div className="text-muted" style={{ fontSize: 13 }}>
              Loading stats...
            </div>
          ) : statsError ? (
            <div className="text-danger" style={{ fontSize: 13 }}>
              {statsError}
            </div>
          ) : null}
        </div>
      </div>

      <Row className="g-3 g-lg-4">
        <Col xs={12} md={6} xl={3}>
          <StatCard
            title="Doctors"
            value={stats.doctors}
            subtitle="active"
            icon={<FaUserMd />}
            color="#1976d2"
          />
        </Col>
        <Col xs={12} md={6} xl={3}>
          <StatCard
            title="Patients"
            value={stats.patients}
            subtitle="registered"
            icon={<FaUsers />}
            color="#2e7d32"
          />
        </Col>
        <Col xs={12} md={6} xl={3}>
          <StatCard
            title="Appointments"
            value={stats.appointments}
            subtitle="today"
            icon={<FaCalendarCheck />}
            color="#ed6c02"
          />
        </Col>
        <Col xs={12} md={6} xl={3}>
          <StatCard
            title="Revenue"
            value={stats.revenue.toLocaleString("en-IN")}
            subtitle="₹ total"
            icon={<FaRupeeSign />}
            color="#9c27b0"
          />
        </Col>
      </Row>

      <Row className="g-3 g-lg-4 mt-1">
        <Col xs={12} lg={7}>
          <Card className="border-0" style={{ borderRadius: 16, boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)" }}>
            <Card.Body className="p-3 p-lg-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="fw-semibold">Appointments per month</div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  Last 12 months
                </span>
              </div>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <LineChart data={appointmentsPerMonth} margin={{ left: 6, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeef3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="appointments"
                      stroke="#1976d2"
                      strokeWidth={3}
                      dot={false}
                      activeDot={{ r: 6 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={5}>
          <Card className="border-0" style={{ borderRadius: 16, boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)" }}>
            <Card.Body className="p-3 p-lg-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="fw-semibold">Doctor specialization</div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  Breakdown
                </span>
              </div>
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={specializationData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={95}
                      paddingAngle={2}
                    >
                      {specializationData.map((_, index) => (
                        <Cell key={index} fill={pieColors[index % pieColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend verticalAlign="bottom" height={24} />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      <Row className="g-3 g-lg-4 mt-1">
        <Col xs={12} lg={6}>
          <Card className="border-0" style={{ borderRadius: 16, boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)" }}>
            <Card.Body className="p-3 p-lg-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="fw-semibold">Revenue</div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  Last 6 months
                </span>
              </div>
              <div style={{ width: "100%", height: 260 }}>
                <ResponsiveContainer>
                  <BarChart data={revenueByMonth} margin={{ left: 6, right: 6 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#eaeef3" />
                    <XAxis dataKey="month" tickLine={false} axisLine={false} />
                    <YAxis tickLine={false} axisLine={false} />
                    <Tooltip />
                    <Bar dataKey="revenue" fill="#9c27b0" radius={[10, 10, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card.Body>
          </Card>
        </Col>

        <Col xs={12} lg={6}>
          <Card className="border-0" style={{ borderRadius: 16, boxShadow: "0 10px 30px rgba(16, 24, 40, 0.08)" }}>
            <Card.Body className="p-3 p-lg-4">
              <div className="d-flex align-items-center justify-content-between mb-3">
                <div className="fw-semibold">Recent activity</div>
                <span className="text-muted" style={{ fontSize: 13 }}>
                  Today
                </span>
              </div>

              <div className="mb-3">
                <div className="text-muted fw-semibold mb-2">Recent appointments</div>
                <div className="table-responsive">
                  <Table hover className="align-middle mb-0" size="sm">
                    <thead>
                      <tr className="text-muted">
                        <th>ID</th>
                        <th>Patient</th>
                        <th>Doctor</th>
                        <th>Time</th>
                        <th className="text-end">Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {recentAppointments.map((a) => (
                        <tr key={a.id}>
                          <td className="fw-semibold">{a.id}</td>
                          <td>{a.patient}</td>
                          <td>{a.doctor}</td>
                          <td>{a.time}</td>
                          <td className="text-end">
                            <Badge bg={statusVariant(a.status)}>{a.status}</Badge>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </Table>
                </div>
              </div>

              <Row className="g-3">
                <Col xs={12} md={6}>
                  <div className="text-muted fw-semibold mb-2">Latest patients</div>
                  <div className="table-responsive">
                    <Table className="align-middle mb-0" size="sm">
                      <thead>
                        <tr className="text-muted">
                          <th>Name</th>
                          <th>Phone</th>
                          <th className="text-end">When</th>
                        </tr>
                      </thead>
                      <tbody>
                        {latestPatients.map((p) => (
                          <tr key={p.name}>
                            <td className="fw-semibold">{p.name}</td>
                            <td className="text-muted">{p.phone}</td>
                            <td className="text-end text-muted">{p.date}</td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Col>
                <Col xs={12} md={6}>
                  <div className="text-muted fw-semibold mb-2">Recent payments</div>
                  <div className="table-responsive">
                    <Table className="align-middle mb-0" size="sm">
                      <thead>
                        <tr className="text-muted">
                          <th>Invoice</th>
                          <th>Patient</th>
                          <th className="text-end">Amount</th>
                        </tr>
                      </thead>
                      <tbody>
                        {recentPayments.map((p) => (
                          <tr key={p.invoice}>
                            <td className="fw-semibold">{p.invoice}</td>
                            <td>{p.patient}</td>
                            <td className="text-end fw-semibold">
                              ₹{p.amount.toLocaleString("en-IN")} <span className="text-muted">({p.method})</span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </Table>
                  </div>
                </Col>
              </Row>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </>
  );
}

