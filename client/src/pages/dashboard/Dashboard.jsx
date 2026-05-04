import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import { getDashboardSummary } from "../../api/dashboard";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import {
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  Lightbulb,
  TrendingDown,
  CreditCard,
  Landmark,
  Wallet,
} from "lucide-react";

// ─── DESIGN TOKENS ────────────────────────────────────────────────────────────
const T = {
  pageBg: "#0d0d14",
  cardBg: "#13111f",
  cardBorder: "2px solid #3d2d7a",
  cardBorderMuted: "2px solid #2a2040",
  cardBorderMaroon: "2px solid #7f1d3f",
  cardRadius: 14,
  cardShadow: "0 4px 24px rgba(0,0,0,0.5)",
  sectionDivider: "1px solid #2a2040",
  labelColor: "#a78bfa",
};

// ─── HELPERS ──────────────────────────────────────────────────────────────────
const fmt = (n) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(n ?? 0);

const fmtCompact = (n) => {
  if (n >= 10000000) return `₹${(n / 10000000).toFixed(1)}Cr`;
  if (n >= 100000) return `₹${(n / 100000).toFixed(1)}L`;
  if (n >= 1000) return `₹${(n / 1000).toFixed(0)}k`;
  return `₹${Math.round(n)}`;
};

const fmtDate = (d) =>
  new Date(d).toLocaleDateString("en-IN", { day: "numeric", month: "short" });

const PERIODS = [
  { label: "Monthly", value: 1 },
  { label: "Quarterly", value: 3 },
  { label: "Yearly", value: 12 },
];

const PALETTE = [
  "#7c3aed",
  "#10b981",
  "#f59e0b",
  "#ec4899",
  "#0ea5e9",
  "#8b5cf6",
];

const utilizationColor = (pct) => {
  if (pct > 70) return "#9f1239";
  if (pct > 40) return "#d97706";
  return "#059669";
};

// ─── CUSTOM TOOLTIP ───────────────────────────────────────────────────────────
const ChartTooltip = ({ active, payload, label, formatter }) => {
  if (!active || !payload?.length) return null;
  return (
    <div
      style={{
        background: "#1a1830",
        border: "2px solid #7c3aed",
        borderRadius: 10,
        padding: "8px 14px",
        fontSize: 12,
        boxShadow: "0 8px 24px rgba(0,0,0,0.5)",
      }}
    >
      <p style={{ color: "#a78bfa", margin: "0 0 4px", fontWeight: 600 }}>
        {label}
      </p>
      {payload.map((p, i) => (
        <p
          key={i}
          style={{
            color: p.color || "#e2e8f0",
            fontWeight: 700,
            margin: "2px 0",
          }}
        >
          {p.name}: {formatter ? formatter(p.value) : p.value}
        </p>
      ))}
    </div>
  );
};

// ─── MAIN ─────────────────────────────────────────────────────────────────────
export default function Dashboard() {
  const { user } = useAuth();
  const [period, setPeriod] = useState(3);
  const [recommendations, setRecommendations] = useState([]);
  const [recLoading, setRecLoading] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["dashboard", user?.id, period],
    queryFn: () => getDashboardSummary(period),
    enabled: !!user?.id,
    staleTime: 5 * 60 * 1000,
  });

  const fetchRecommendations = async () => {
    setRecLoading(true);
    setRecommendations([]);
    try {
      const res = await fetch("https://api.anthropic.com/v1/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          messages: [{ role: "user", content: buildPrompt(data, period) }],
        }),
      });
      const result = await res.json();
      const text = result.content?.[0]?.text ?? "[]";
      setRecommendations(JSON.parse(text.replace(/```json|```/g, "").trim()));
    } catch {
      setRecommendations([
        {
          title: "Error",
          detail: "Could not load recommendations. Try again.",
        },
      ]);
    } finally {
      setRecLoading(false);
    }
  };

  if (isLoading) return <Skeleton />;

  const {
    netWorth,
    summaryCards,
    emiDues,
    expenseTrend,
    categoryBreakdown,
    loanTrend,
    cardUtilization,
  } = data;
  const hasExpenseData = expenseTrend?.some((p) => p.total > 0);
  const overdueDues = emiDues?.filter((d) => d.isOverdue) ?? [];

  return (
    <div style={{ minHeight: "100vh", background: T.pageBg, color: "#e2e8f0" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse { 0%,100%{opacity:1;}50%{opacity:0.45;} }
        @keyframes fadeUp { from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:translateY(0)} }
        .dash-card { animation: fadeUp 0.3s ease both; }
        .stat-card { transition: transform 0.2s ease, box-shadow 0.2s ease; }
        .stat-card:hover { transform: translateY(-3px); box-shadow: 0 8px 28px rgba(0,0,0,0.6) !important; }
      `}</style>

      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        {/* ── Header ── */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: 12,
          }}
        >
          <div>
            <h1
              style={{
                fontSize: 24,
                fontWeight: 800,
                color: "#e2e8f0",
                margin: 0,
                letterSpacing: "-0.02em",
              }}
            >
              Dashboard
            </h1>
            <p
              style={{
                fontSize: 13,
                color: "#a78bfa",
                margin: "3px 0 0",
                fontWeight: 500,
              }}
            >
              Welcome back, {user?.fullName?.split(" ")[0]} &middot;{" "}
              {new Date().toLocaleDateString("en-IN", {
                weekday: "long",
                day: "numeric",
                month: "long",
              })}
            </p>
          </div>

          <div
            style={{
              display: "flex",
              background: "#1a1830",
              borderRadius: 12,
              padding: 4,
              gap: 3,
              border: "2px solid #3d2d7a",
              boxShadow: "0 2px 8px rgba(0,0,0,0.4)",
            }}
          >
            {PERIODS.map((p) => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                style={{
                  padding: "7px 20px",
                  borderRadius: 9,
                  fontSize: 13,
                  fontWeight: 600,
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.18s",
                  background:
                    period === p.value
                      ? "linear-gradient(135deg,#7c3aed,#6d28d9)"
                      : "transparent",
                  color: period === p.value ? "#ffffff" : "#a78bfa",
                  boxShadow:
                    period === p.value
                      ? "0 2px 8px rgba(109,40,217,0.4)"
                      : "none",
                }}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>

        {/* ── Hero ── */}
        <div
          className="dash-card"
          style={{
            background:
              "linear-gradient(135deg, #4c1d95 0%, #7c3aed 55%, #9f1239 100%)",
            borderRadius: 18,
            padding: "32px 36px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "flex-end",
            flexWrap: "wrap",
            gap: 16,
            boxShadow: "0 8px 32px rgba(76,29,149,0.45)",
            border: "2px solid rgba(196,181,253,0.35)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -50,
              top: -50,
              width: 220,
              height: 220,
              borderRadius: "50%",
              border: "45px solid rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }}
          />
          <div
            style={{
              position: "absolute",
              right: 80,
              bottom: -70,
              width: 180,
              height: 180,
              borderRadius: "50%",
              border: "35px solid rgba(255,255,255,0.04)",
              pointerEvents: "none",
            }}
          />
          <div style={{ position: "relative" }}>
            <p
              style={{
                fontSize: 11,
                fontWeight: 700,
                letterSpacing: "0.12em",
                color: "rgba(255,255,255,0.6)",
                textTransform: "uppercase",
                margin: "0 0 10px",
              }}
            >
              Total Liabilities
            </p>
            <p
              style={{
                fontSize: 46,
                fontWeight: 800,
                color: "#ffffff",
                margin: "0 0 18px",
                letterSpacing: "-0.03em",
              }}
            >
              {fmt(netWorth?.totalLiabilities)}
            </p>
            <div style={{ display: "flex", gap: 12, flexWrap: "wrap" }}>
              <HeroPill
                icon={<Landmark size={13} />}
                label="Loans"
                value={fmt(netWorth?.totalLoanOutstanding)}
              />
              <HeroPill
                icon={<CreditCard size={13} />}
                label="Cards"
                value={fmt(netWorth?.totalCardBalance)}
              />
            </div>
          </div>
          <p
            style={{
              fontSize: 12,
              color: "rgba(255,255,255,0.35)",
              textAlign: "right",
              position: "relative",
            }}
          >
            Assets tracked in Phase 6<br />
            <span style={{ color: "rgba(255,255,255,0.2)" }}>
              Real Estate · Vehicles · Cash
            </span>
          </p>
        </div>

        {/* ── Summary Cards ── */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
            gap: 14,
          }}
        >
          <StatCard
            icon={<Wallet size={15} color="#a78bfa" />}
            iconBg="linear-gradient(135deg,#2a1f4a,#1e1640)"
            iconBorder="1px solid #4c3a8a"
            label="This Month's Spend"
            value={fmt(summaryCards?.monthlySpend)}
            borderColor="#3d2d7a"
          />
          <StatCard
            icon={<Landmark size={15} color="#fda4af" />}
            iconBg="linear-gradient(135deg,#2d0a14,#3d0f1e)"
            iconBorder="1px solid #7f1d3f"
            label="Loan Outstanding"
            value={fmt(summaryCards?.totalLoanOutstanding)}
            valueColor="#fda4af"
            sub={`${summaryCards?.activeLoans} active loan${summaryCards?.activeLoans !== 1 ? "s" : ""}`}
            borderColor="#7f1d3f"
          />
          <StatCard
            icon={
              <CreditCard
                size={15}
                color={utilizationColor(summaryCards?.cardUtilizationPercent)}
              />
            }
            iconBg="linear-gradient(135deg,#1e1640,#2a1f4a)"
            iconBorder="1px solid #4c3a8a"
            label="Card Utilization"
            value={`${summaryCards?.cardUtilizationPercent ?? 0}%`}
            valueColor={utilizationColor(summaryCards?.cardUtilizationPercent)}
            sub={`${fmt(summaryCards?.totalCardBalance)} / ${fmt(summaryCards?.totalCreditLimit)}`}
            borderColor={
              summaryCards?.cardUtilizationPercent > 70 ? "#7f1d3f" : "#3d2d7a"
            }
          />
          <StatCard
            icon={<TrendingDown size={15} color="#34d399" />}
            iconBg="linear-gradient(135deg,#022c22,#064e3b)"
            iconBorder="1px solid #059669"
            label="Active Loans"
            value={summaryCards?.activeLoans ?? 0}
            sub="currently tracking"
            borderColor="#3d2d7a"
          />
        </div>

        {/* ── EMI Dues ── */}
        <Card label="Upcoming Dues">
          {emiDues?.length === 0 ? (
            <Empty
              icon={<CheckCircle2 size={20} color="#059669" />}
              msg="You're all clear — no dues this month."
            />
          ) : (
            <>
              {overdueDues.length > 0 && (
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 8,
                    padding: "10px 16px",
                    marginBottom: 14,
                    fontSize: 13,
                    color: "#fda4af",
                    background: "#2d0a14",
                    border: "2px solid #7f1d3f",
                    borderRadius: 10,
                    fontWeight: 600,
                  }}
                >
                  <AlertTriangle size={14} />
                  {overdueDues.length} payment
                  {overdueDues.length > 1 ? "s are" : " is"} overdue — action
                  needed
                </div>
              )}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))",
                  gap: 14,
                }}
              >
                {emiDues.map((due) => (
                  <DueCard key={due.loanId} due={due} />
                ))}
              </div>
            </>
          )}
        </Card>

        {/* ── Charts Row 1 ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Card label="Expense Trend">
            {!hasExpenseData ? (
              <Empty msg="No expense data for this period" small />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <BarChart
                  data={expenseTrend}
                  margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                >
                  <defs>
                    <linearGradient id="violetBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#7c3aed" />
                      <stop offset="100%" stopColor="#a78bfa" />
                    </linearGradient>
                  </defs>
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#a78bfa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#a78bfa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtCompact}
                    width={46}
                  />
                  <Tooltip
                    content={<ChartTooltip formatter={fmt} />}
                    cursor={{ fill: "rgba(124,58,237,0.06)" }}
                  />
                  <Bar
                    dataKey="total"
                    name="Spent"
                    fill="url(#violetBar)"
                    radius={[5, 5, 0, 0]}
                    maxBarSize={44}
                  />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card label="Spending by Category">
            {!categoryBreakdown?.length ? (
              <Empty msg="No category data for this period" small />
            ) : (
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 12,
                  height: 210,
                }}
              >
                <div style={{ flexShrink: 0 }}>
                  <PieChart width={150} height={150}>
                    <Pie
                      data={categoryBreakdown}
                      dataKey="amount"
                      nameKey="category"
                      cx="50%"
                      cy="50%"
                      innerRadius={44}
                      outerRadius={68}
                      paddingAngle={3}
                      startAngle={90}
                      endAngle={-270}
                    >
                      {categoryBreakdown.map((e, i) => (
                        <Cell
                          key={e.category}
                          fill={e.color || PALETTE[i % PALETTE.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<ChartTooltip formatter={fmt} />} />
                  </PieChart>
                </div>
                <div
                  style={{
                    flex: 1,
                    overflowY: "auto",
                    maxHeight: 190,
                    display: "flex",
                    flexDirection: "column",
                    gap: 10,
                  }}
                >
                  {categoryBreakdown.map((c, i) => (
                    <div
                      key={c.category}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        gap: 6,
                      }}
                    >
                      <div
                        style={{
                          display: "flex",
                          alignItems: "center",
                          gap: 7,
                          minWidth: 0,
                        }}
                      >
                        <div
                          style={{
                            width: 8,
                            height: 8,
                            borderRadius: "50%",
                            flexShrink: 0,
                            background: c.color || PALETTE[i % PALETTE.length],
                            boxShadow: `0 0 6px ${c.color || PALETTE[i % PALETTE.length]}80`,
                          }}
                        />
                        <span
                          style={{
                            fontSize: 12,
                            color: "#cbd5e1",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            fontWeight: 500,
                          }}
                        >
                          {c.category}
                        </span>
                      </div>
                      <div
                        style={{
                          display: "flex",
                          gap: 8,
                          alignItems: "center",
                          flexShrink: 0,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 12,
                            color: "#e2e8f0",
                            fontWeight: 700,
                          }}
                        >
                          {c.percentage}%
                        </span>
                        <span style={{ fontSize: 11, color: "#a78bfa" }}>
                          {fmtCompact(c.amount)}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </Card>
        </div>

        {/* ── Charts Row 2 ── */}
        <div
          style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 }}
        >
          <Card label="Loan Outstanding Trend">
            {!loanTrend?.length ? (
              <Empty msg="No active loans" small />
            ) : (
              <ResponsiveContainer width="100%" height={210}>
                <LineChart
                  data={loanTrend[0].points}
                  margin={{ top: 4, right: 4, left: -8, bottom: 0 }}
                >
                  <XAxis
                    dataKey="month"
                    tick={{ fill: "#a78bfa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: "#a78bfa", fontSize: 11 }}
                    axisLine={false}
                    tickLine={false}
                    tickFormatter={fmtCompact}
                    width={46}
                  />
                  <Tooltip content={<ChartTooltip formatter={fmt} />} />
                  <Legend
                    wrapperStyle={{
                      fontSize: 11,
                      color: "#7c3aed",
                      paddingTop: 6,
                    }}
                    iconType="circle"
                    iconSize={7}
                  />
                  {loanTrend.map((series, i) => (
                    <Line
                      key={series.loanId}
                      data={series.points}
                      dataKey="outstanding"
                      name={series.loanName}
                      stroke={PALETTE[i % PALETTE.length]}
                      strokeWidth={2.5}
                      dot={{
                        r: 3.5,
                        fill: PALETTE[i % PALETTE.length],
                        strokeWidth: 0,
                      }}
                      activeDot={{ r: 6, strokeWidth: 2, stroke: "#fff" }}
                    />
                  ))}
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>

          <Card label="Credit Card Utilization">
            {!cardUtilization?.length ? (
              <Empty msg="No active credit cards" small />
            ) : (
              <div
                style={{
                  display: "flex",
                  flexDirection: "column",
                  gap: 22,
                  paddingTop: 4,
                  justifyContent: "center",
                  minHeight: 210,
                }}
              >
                {cardUtilization.map((card) => {
                  const col = utilizationColor(card.utilizationPercent);
                  const trackBg =
                    card.utilizationPercent > 70
                      ? "#2d0a14"
                      : card.utilizationPercent > 40
                        ? "#1c1408"
                        : "#022c22";
                  const pct = Math.min(100, card.utilizationPercent);
                  return (
                    <div key={card.cardId}>
                      <div
                        style={{
                          display: "flex",
                          justifyContent: "space-between",
                          alignItems: "baseline",
                          marginBottom: 8,
                        }}
                      >
                        <span
                          style={{
                            fontSize: 13,
                            color: "#e2e8f0",
                            fontWeight: 600,
                          }}
                        >
                          {card.bankName}
                          <span
                            style={{
                              color: "#a78bfa",
                              marginLeft: 5,
                              fontWeight: 400,
                            }}
                          >
                            · {card.cardName}
                          </span>
                        </span>
                        <div
                          style={{
                            display: "flex",
                            alignItems: "center",
                            gap: 10,
                          }}
                        >
                          <span style={{ fontSize: 11, color: "#a78bfa" }}>
                            {fmt(card.currentBalance)} / {fmt(card.creditLimit)}
                          </span>
                          <span
                            style={{
                              fontSize: 13,
                              fontWeight: 800,
                              color: col,
                            }}
                          >
                            {card.utilizationPercent}%
                          </span>
                        </div>
                      </div>
                      <div
                        style={{
                          height: 8,
                          background: trackBg,
                          borderRadius: 99,
                          overflow: "hidden",
                          border: `1px solid ${col}40`,
                        }}
                      >
                        <div
                          style={{
                            height: "100%",
                            width: `${pct}%`,
                            background: `linear-gradient(90deg,${col}99,${col})`,
                            borderRadius: 99,
                            transition: "width 0.6s ease",
                          }}
                        />
                      </div>
                      {card.utilizationPercent > 70 && (
                        <p
                          style={{
                            fontSize: 11,
                            color: "#9f1239",
                            margin: "5px 0 0",
                            fontWeight: 500,
                          }}
                        >
                          High utilization — consider paying down before
                          statement date
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </Card>
        </div>

        {/* ── AI Recommendations ── */}
        <div
          className="dash-card"
          style={{
            background: T.cardBg,
            border: T.cardBorder,
            borderRadius: T.cardRadius,
            padding: "20px 22px",
            boxShadow: T.cardShadow,
          }}
        >
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              marginBottom: 16,
              paddingBottom: 14,
              borderBottom: T.sectionDivider,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 9,
                  background: "linear-gradient(135deg,#fef3c7,#fde68a)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  border: "1px solid #fcd34d",
                }}
              >
                <Lightbulb size={15} color="#d97706" />
              </div>
              <span
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#a78bfa",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                }}
              >
                Smart Recommendations
              </span>
            </div>
            <button
              onClick={fetchRecommendations}
              disabled={recLoading}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 7,
                background: "linear-gradient(135deg,#7c3aed,#6d28d9)",
                border: "none",
                borderRadius: 9,
                padding: "8px 18px",
                fontSize: 12,
                fontWeight: 600,
                color: "#ffffff",
                cursor: recLoading ? "not-allowed" : "pointer",
                opacity: recLoading ? 0.65 : 1,
                boxShadow: "0 2px 10px rgba(109,40,217,0.35)",
              }}
            >
              <RefreshCw
                size={12}
                style={{
                  animation: recLoading ? "spin 1s linear infinite" : "none",
                }}
              />
              {recLoading
                ? "Analyzing..."
                : recommendations.length === 0
                  ? "Generate"
                  : "Refresh"}
            </button>
          </div>

          {!recLoading && recommendations.length === 0 && (
            <p
              style={{
                textAlign: "center",
                padding: "20px 0",
                color: "#a78bfa",
                fontSize: 13,
                margin: 0,
              }}
            >
              Get personalized insights based on your spending patterns and loan
              costs.
            </p>
          )}

          {recLoading && (
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  style={{
                    height: 58,
                    background: "#1e1a30",
                    borderRadius: 10,
                    animation: "pulse 1.5s ease infinite",
                    border: "1px solid #3d2d7a",
                  }}
                />
              ))}
            </div>
          )}

          {!recLoading && recommendations.length > 0 && (
            <div
              style={{
                display: "grid",
                gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))",
                gap: 14,
              }}
            >
              {recommendations.map((rec, i) => (
                <div
                  key={i}
                  style={{
                    background: "#1a1830",
                    border: "1px solid #3d2d7a",
                    borderRadius: 12,
                    padding: "16px 18px",
                    borderTop: `3px solid ${PALETTE[i % PALETTE.length]}`,
                    boxShadow: "0 2px 12px rgba(0,0,0,0.4)",
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#e2e8f0",
                      margin: "0 0 6px",
                    }}
                  >
                    {rec.title}
                  </p>
                  <p
                    style={{
                      fontSize: 12,
                      color: "#a78bfa",
                      margin: 0,
                      lineHeight: 1.7,
                    }}
                  >
                    {rec.detail}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── COMPONENTS ───────────────────────────────────────────────────────────────

function Card({ children, label }) {
  return (
    <div
      className="dash-card"
      style={{
        background: T.cardBg,
        border: T.cardBorder,
        borderRadius: T.cardRadius,
        padding: "20px 22px",
        boxShadow: T.cardShadow,
      }}
    >
      {label && <SectionLabel>{label}</SectionLabel>}
      {children}
    </div>
  );
}

function SectionLabel({ children }) {
  return (
    <p
      style={{
        fontSize: 11,
        fontWeight: 700,
        color: T.labelColor,
        textTransform: "uppercase",
        letterSpacing: "0.1em",
        margin: "0 0 14px",
        paddingBottom: 12,
        borderBottom: T.sectionDivider,
      }}
    >
      {children}
    </p>
  );
}

function StatCard({
  icon,
  iconBg,
  iconBorder,
  label,
  value,
  valueColor,
  sub,
  borderColor,
}) {
  return (
    <div
      className="stat-card"
      style={{
        background: T.cardBg,
        border: `2px solid ${borderColor ?? "#3d2d7a"}`,
        borderRadius: 13,
        padding: "18px 20px",
        boxShadow: T.cardShadow,
        cursor: "default",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 14,
          paddingBottom: 12,
          borderBottom: "1px solid #2a2040",
        }}
      >
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: 9,
            background: iconBg,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
            border: iconBorder,
          }}
        >
          {icon}
        </div>
        <span
          style={{
            fontSize: 11,
            color: "#a78bfa",
            fontWeight: 700,
            textTransform: "uppercase",
            letterSpacing: "0.07em",
          }}
        >
          {label}
        </span>
      </div>
      <p
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: valueColor ?? "#e2e8f0",
          margin: "0 0 4px",
          letterSpacing: "-0.02em",
        }}
      >
        {value}
      </p>
      {sub && (
        <p
          style={{ fontSize: 11, color: "#64748b", margin: 0, fontWeight: 500 }}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

function DueCard({ due }) {
  const overdue = due.isOverdue;
  return (
    <div
      style={{
        background: overdue ? "#1a0a10" : T.cardBg,
        border: `2px solid ${overdue ? "#7f1d3f" : "#3d2d7a"}`,
        borderRadius: 13,
        padding: "16px 18px",
        boxShadow: T.cardShadow,
      }}
    >
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          marginBottom: 10,
          paddingBottom: 10,
          borderBottom: `1px solid ${overdue ? "#4d1528" : "#2a2040"}`,
        }}
      >
        <div>
          <p
            style={{
              fontSize: 13,
              fontWeight: 700,
              color: overdue ? "#fda4af" : "#e2e8f0",
              margin: 0,
            }}
          >
            {due.loanName}
          </p>
          <p style={{ fontSize: 11, color: "#a78bfa", margin: "3px 0 0" }}>
            {due.lenderName}
          </p>
        </div>
        {overdue && <AlertTriangle size={14} color="#fda4af" />}
      </div>
      <p
        style={{
          fontSize: 26,
          fontWeight: 800,
          color: overdue ? "#fda4af" : "#e2e8f0",
          margin: "0 0 12px",
          letterSpacing: "-0.02em",
        }}
      >
        {fmt(due.amount)}
      </p>
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
        }}
      >
        <span
          style={{
            fontSize: 11,
            fontWeight: 700,
            padding: "4px 10px",
            borderRadius: 6,
            background: due.isInBufferPeriod ? "#1c1408" : "#1e1640",
            color: due.isInBufferPeriod ? "#fbbf24" : "#a78bfa",
            border: due.isInBufferPeriod
              ? "1px solid #78350f"
              : "1px solid #4c3a8a",
          }}
        >
          {due.dueLabel}
        </span>
        <span
          style={{
            fontSize: 11,
            color: overdue ? "#fda4af" : "#a78bfa",
            fontWeight: overdue ? 700 : 500,
          }}
        >
          {overdue ? "Overdue · " : "Due "}
          {fmtDate(due.dueDate)}
        </span>
      </div>
    </div>
  );
}

function HeroPill({ icon, label, value }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 7,
        background: "rgba(255,255,255,0.12)",
        padding: "6px 14px",
        borderRadius: 8,
        border: "1px solid rgba(255,255,255,0.22)",
      }}
    >
      <span style={{ color: "rgba(255,255,255,0.7)" }}>{icon}</span>
      <span style={{ fontSize: 13, color: "rgba(255,255,255,0.6)" }}>
        {label}:
      </span>
      <span style={{ fontSize: 13, color: "#ffffff", fontWeight: 700 }}>
        {value}
      </span>
    </div>
  );
}

function Empty({ icon, msg, small }) {
  return (
    <div
      style={{
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 8,
        padding: small ? "24px 0" : "32px 0",
      }}
    >
      {icon}
      <p style={{ fontSize: 13, color: "#64748b", margin: 0, fontWeight: 500 }}>
        {msg}
      </p>
    </div>
  );
}

function Skeleton() {
  return (
    <div style={{ background: T.pageBg, minHeight: "100vh" }}>
      <div
        style={{
          maxWidth: 1100,
          margin: "0 auto",
          padding: "28px 20px",
          display: "flex",
          flexDirection: "column",
          gap: 20,
        }}
      >
        <style>{`@keyframes pulse{0%,100%{opacity:1;}50%{opacity:0.45;}}`}</style>
        {[60, 130, 70, 300, 300, 120].map((h, i) => (
          <div
            key={i}
            style={{
              height: h,
              background: "#1e1a30",
              borderRadius: 14,
              animation: "pulse 1.5s ease infinite",
              animationDelay: `${i * 0.08}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}

// ─── PROMPT ───────────────────────────────────────────────────────────────────
function buildPrompt(data, period) {
  const { summaryCards, categoryBreakdown, loanTrend, cardUtilization } = data;
  const label =
    period === 1 ? "this month" : period === 3 ? "this quarter" : "this year";
  const categories = categoryBreakdown
    .slice(0, 5)
    .map(
      (c) =>
        `${c.category}: ₹${c.amount.toLocaleString("en-IN")} (${c.percentage}%)`,
    )
    .join(", ");
  const loans = loanTrend
    .map(
      (l) =>
        `${l.loanName}: ₹${l.points.at(-1)?.outstanding?.toLocaleString("en-IN") ?? 0} outstanding`,
    )
    .join(", ");
  const cards = cardUtilization
    .map(
      (c) => `${c.bankName} ${c.cardName}: ${c.utilizationPercent}% utilized`,
    )
    .join(", ");

  return `You are a personal finance advisor. Financial summary for ${label}:
- Monthly spend: ₹${summaryCards.monthlySpend?.toLocaleString("en-IN")}
- Loan outstanding: ₹${summaryCards.totalLoanOutstanding?.toLocaleString("en-IN")}
- Card utilization: ${summaryCards.cardUtilizationPercent}%
- Active loans: ${summaryCards.activeLoans}
- Categories: ${categories || "None"}
- Loans: ${loans || "None"}
- Cards: ${cards || "None"}

Give exactly 4 specific, actionable recommendations covering spending and loan costs.
Return ONLY a JSON array, no markdown:
[{"title":"Short title","detail":"Specific explanation with numbers"}]`;
}
