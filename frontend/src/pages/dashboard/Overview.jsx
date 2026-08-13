import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
  CategoryScale,
  LinearScale,
  BarElement,
  PointElement,
  LineElement,
} from "chart.js";
import { Bar, Pie, Doughnut, Line } from "react-chartjs-2";
import { useQuery } from "@tanstack/react-query";
import { useAuth } from "../../context/AuthContext";
import * as coursesApi from "../../api/courses";
import * as statsApi from "../../api/stats";
import * as donationsApi from "../../api/donations";
import Card from "../../components/ui/Card";

ChartJS.register(ArcElement, Tooltip, Legend, CategoryScale, LinearScale, BarElement, PointElement, LineElement);

const ROLE_COLORS = {
  head_admin: "hsl(224, 89%, 60%)",
  moderator: "hsl(280, 70%, 60%)",
  instructor: "hsl(160, 60%, 45%)",
  student: "hsl(35, 90%, 55%)",
  donor: "hsl(340, 75%, 55%)",
};

function StatCard({ label, value }) {
  return (
    <Card className="text-center">
      <p className="text-2xl font-bold text-brand">{value ?? "—"}</p>
      <p className="mt-1 text-sm text-slate-500">{label}</p>
    </Card>
  );
}

const STAFF_ROLES = ["head_admin", "moderator"];

export default function Overview() {
  const { user } = useAuth();
  const isStaff = STAFF_ROLES.includes(user?.role);

  const { data: courses = [] } = useQuery({ queryKey: ["courses"], queryFn: coursesApi.listCourses });

  const { data: userStats } = useQuery({
    queryKey: ["stats", "users"],
    queryFn: statsApi.userStats,
    enabled: isStaff,
  });
  const { data: courseStats } = useQuery({
    queryKey: ["stats", "courses"],
    queryFn: statsApi.courseStats,
    enabled: isStaff,
  });
  const { data: donationSummary } = useQuery({
    queryKey: ["donations", "summary"],
    queryFn: donationsApi.donationSummary,
    enabled: isStaff,
  });

  const { data: myDonations = [] } = useQuery({
    queryKey: ["my-donations"],
    queryFn: donationsApi.myDonations,
    enabled: user?.role === "donor",
  });

  const { data: campaigns = [] } = useQuery({
    queryKey: ["campaigns"],
    queryFn: donationsApi.listCampaigns,
    enabled: user?.role === "donor",
  });

  const published = courses.filter((c) => c.is_published).length;
  const drafts = courses.length - published;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-slate-900">Welcome, {user?.full_name}</h1>
        <p className="text-sm text-slate-500 capitalize">{user?.role?.replace("_", " ")} dashboard</p>
      </div>

      {isStaff ? (
        <>
          {/* KPI cards */}
          <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            <StatCard label="Total users" value={userStats?.total_users} />
            <StatCard label="Active users" value={userStats?.active_users} />
            <StatCard label="Inactive users" value={userStats?.inactive_users} />
            <StatCard label="New today" value={userStats?.new_today} />
            <StatCard label="New this month" value={userStats?.new_this_month} />
            <StatCard label="Total courses" value={courseStats?.total_courses} />
            <StatCard label="Total enrollments" value={courseStats?.total_enrollments} />
            <StatCard label="Completion rate" value={courseStats ? `${courseStats.completion_rate}%` : undefined} />
            <StatCard label="Total resources" value={courseStats?.total_resources} />
            <StatCard label="Active campaigns" value={donationSummary?.active_campaigns} />
            <StatCard label="Total donations" value={donationSummary?.total_donations} />
            <StatCard
              label="Total raised"
              value={donationSummary ? `$${donationSummary.total_raised.toLocaleString()}` : undefined}
            />
          </div>

          {/* Charts */}
          <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
            <Card title="Registration trend (last 14 days)">
              {userStats?.registration_trend && (
                <Line
                  data={{
                    labels: userStats.registration_trend.map((d) => d.date.slice(5)),
                    datasets: [
                      {
                        label: "New users",
                        data: userStats.registration_trend.map((d) => d.count),
                        borderColor: "hsl(224, 89%, 60%)",
                        backgroundColor: "hsla(224, 89%, 60%, 0.15)",
                        fill: true,
                        tension: 0.3,
                      },
                    ],
                  }}
                  options={{ responsive: true, plugins: { legend: { display: false } } }}
                />
              )}
            </Card>

            <Card title="Users by role">
              {userStats?.by_role && (
                <Pie
                  data={{
                    labels: Object.keys(userStats.by_role).map((r) => r.replace("_", " ")),
                    datasets: [
                      {
                        data: Object.values(userStats.by_role),
                        backgroundColor: Object.keys(userStats.by_role).map((r) => ROLE_COLORS[r] || "#ccc"),
                      },
                    ],
                  }}
                  options={{ responsive: true }}
                />
              )}
            </Card>

            <Card title="Active vs inactive users">
              {userStats && (
                <Doughnut
                  data={{
                    labels: ["Active", "Inactive"],
                    datasets: [
                      {
                        data: [userStats.active_users, userStats.inactive_users],
                        backgroundColor: ["hsl(150, 60%, 50%)", "hsl(0, 0%, 85%)"],
                      },
                    ],
                  }}
                  options={{ responsive: true }}
                />
              )}
            </Card>

            <Card title="Course status">
              <Bar
                data={{
                  labels: ["Published", "Draft"],
                  datasets: [
                    {
                      label: "Courses",
                      data: [published, drafts],
                      backgroundColor: ["hsl(224, 89%, 60%)", "hsl(224, 20%, 80%)"],
                      borderRadius: 6,
                    },
                  ],
                }}
                options={{ responsive: true, plugins: { legend: { display: false } } }}
              />
            </Card>
          </div>
        </>
      ) : user?.role === "donor" ? (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Donations made" value={myDonations.length} />
          <StatCard
            label="Total given"
            value={`$${myDonations.reduce((sum, d) => sum + d.amount, 0).toLocaleString()}`}
          />
          <StatCard label="Active campaigns" value={campaigns.length} />
          <StatCard label="Your role" value="Donor" />
        </div>
      ) : (
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
          <StatCard label="Total courses" value={courses.length} />
          <StatCard label="Published" value={published} />
          <StatCard label="Your role" value={user?.role?.replace("_", " ")} />
        </div>
      )}
    </div>
  );
}
