import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";

export default function Home() {
  const stats = [
    { title: "Total Users", value: "1,245", change: "+12% from last month", trend: "up" },
    { title: "Active Sessions", value: "348", change: "+24% right now", trend: "up" },
    { title: "Conversations", value: "8,920", change: "-4% from last week", trend: "down" },
  ];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      {/* Welcome Banner */}
      <div className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            Dashboard Overview
          </h2>
          <p className="text-zinc-500 dark:text-zinc-400">
            Welcome back, here is what is happening today.
          </p>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">Export Reports</Button>
          <Button>New Project</Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
        {stats.map((stat) => (
          <Card key={stat.title}>
            <CardHeader>
              <CardTitle>{stat.title}</CardTitle>
            </CardHeader>

            <CardContent>
              <div className="flex items-baseline justify-between">
                <span className="text-4xl font-semibold tracking-tight">
                  {stat.value}
                </span>

                <span
                  className={`text-xs font-medium px-2 py-0.5 rounded-full ${
                    stat.trend === "up"
                      ? "bg-emerald-50 text-emerald-700 dark:bg-emerald-950/30 dark:text-emerald-400"
                      : "bg-rose-50 text-rose-700 dark:bg-rose-950/30 dark:text-rose-400"
                  }`}
                >
                  {stat.change}
                </span>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Contents Grid */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2">
          <CardHeader>
            <CardTitle>Recent Activity</CardTitle>
            <CardDescription>
              A summary of the recent operations on the platform.
            </CardDescription>
          </CardHeader>

          <CardContent>
            <div className="space-y-4">
              {[
                {
                  text: "Server deployment succeeded",
                  time: "2 mins ago",
                  type: "success",
                },
                {
                  text: "Backup created successfully",
                  time: "1 hour ago",
                  type: "info",
                },
                {
                  text: "Database connection spike detected",
                  time: "3 hours ago",
                  type: "warning",
                },
              ].map((activity, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between py-2 border-b border-zinc-100 last:border-0 dark:border-zinc-800"
                >
                  <div className="flex items-center gap-3">
                    <span
                      className={`h-2 w-2 rounded-full ${
                        activity.type === "success"
                          ? "bg-emerald-500"
                          : activity.type === "warning"
                          ? "bg-amber-500"
                          : "bg-sky-500"
                      }`}
                    />

                    <span className="text-sm font-medium">
                      {activity.text}
                    </span>
                  </div>

                  <span className="text-xs text-zinc-400">
                    {activity.time}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Quick Actions</CardTitle>
          </CardHeader>

          <CardContent>
            <div className="flex flex-col gap-3">
              <Button variant="secondary" className="w-full justify-start">
                ⚡ Clear Server Cache
              </Button>

              <Button variant="secondary" className="w-full justify-start">
                🔄 Synchronize Database
              </Button>

              <Button variant="secondary" className="w-full justify-start">
                ⚙️ System Settings
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}