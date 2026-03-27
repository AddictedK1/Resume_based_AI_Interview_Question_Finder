import React from "react";
import { Link } from "react-router-dom";
import { BrainCircuit, Users, FileText, Activity, MoreHorizontal, Search } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

const stats = [
  { title: "Total Users", value: "1,245", trend: "+12% from last month", icon: Users },
  { title: "Resumes Parsed", value: "3,892", trend: "+25% from last month", icon: FileText },
  { title: "API Health", value: "99.9%", trend: "Optimal status", icon: Activity },
];

const recentUsers = [
  { name: "John Doe", email: "john@example.com", role: "Software Engineer", date: "Today" },
  { name: "Sarah Smith", email: "sarah@example.com", role: "Product Manager", date: "Yesterday" },
  { name: "Michael Lee", email: "mike@example.com", role: "Data Scientist", date: "Oct 24" },
  { name: "Emma Watson", email: "emma@example.com", role: "UX Designer", date: "Oct 23" },
  { name: "Chris Evans", email: "chris@example.com", role: "DevOps Engineer", date: "Oct 22" },
];

export default function AdminPanel() {
  return (
    <div className="min-h-screen bg-[#fdfcfb] text-foreground font-sans">
      {/* Sidebar & Navigation omitted for brevity, focusing on main layout */}
      <div className="flex">
        {/* Main Content */}
        <div className="flex-1">
          {/* Top Navbar */}
          <nav className="sticky top-0 z-40 w-full bg-white/70 backdrop-blur-md border-b border-border/40 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2 text-xl font-bold text-secondary-foreground tracking-tight">
              <BrainCircuit className="w-6 h-6 text-primary" />
              Interview Buddy Admin
            </div>
            <div className="flex items-center gap-4">
              <div className="relative">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search users..." className="h-9 w-64 pl-9 bg-muted/50 border-transparent focus:bg-white" />
              </div>
              <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold text-sm shadow-md">
                AD
              </div>
            </div>
          </nav>

          {/* Dashboard Content */}
          <main className="max-w-7xl mx-auto p-6 lg:p-8 mt-4 relative">
            
            {/* Soft background glow */}
            <div className="absolute top-0 right-1/4 w-[500px] h-[500px] bg-orange-400/5 blur-[120px] rounded-full pointer-events-none" />

            <div className="mb-8">
              <h1 className="text-3xl font-bold tracking-tight text-secondary-foreground">System Overview</h1>
              <p className="text-muted-foreground mt-1">Monitor the sentient analysis engine and user metrics.</p>
            </div>

            {/* Stats Grid */}
            <div className="grid gap-6 md:grid-cols-3 mb-8 relative z-10">
              {stats.map((stat, i) => (
                <Card key={i} className="bg-white/60 backdrop-blur-xl border-border/50 shadow-sm hover:shadow-md transition-shadow">
                  <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="text-sm font-medium text-muted-foreground">{stat.title}</CardTitle>
                    <stat.icon className="h-4 w-4 text-primary" />
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold text-secondary-foreground">{stat.value}</div>
                    <p className="text-xs text-muted-foreground mt-1">{stat.trend}</p>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Recent Users Table Area */}
            <Card className="bg-white/60 backdrop-blur-xl border-border/50 shadow-sm relative z-10 overflow-hidden">
              <CardHeader className="border-b border-border/40 pb-4">
                <div className="flex items-center justify-between">
                  <CardTitle>Recent Activity</CardTitle>
                  <Button variant="outline" size="sm">View All</Button>
                </div>
              </CardHeader>
              <CardContent className="p-0">
                <div className="relative w-full overflow-auto">
                  <table className="w-full caption-bottom text-sm">
                    <thead className="[&_tr]:border-b bg-muted/30">
                      <tr className="border-b transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted">
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">User</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground hidden sm:table-cell">Email</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground">Target Role</th>
                        <th className="h-12 px-4 text-left align-middle font-medium text-muted-foreground text-right">Joined</th>
                        <th className="h-12 px-4 align-middle font-medium text-muted-foreground w-[50px]"></th>
                      </tr>
                    </thead>
                    <tbody className="[&_tr:last-child]:border-0">
                      {recentUsers.map((user, i) => (
                        <tr key={i} className="border-b border-border/40 transition-colors hover:bg-muted/30 data-[state=selected]:bg-muted">
                          <td className="p-4 align-middle font-medium">{user.name}</td>
                          <td className="p-4 align-middle hidden sm:table-cell text-muted-foreground">{user.email}</td>
                          <td className="p-4 align-middle">
                            <span className="inline-flex items-center px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">
                              {user.role}
                            </span>
                          </td>
                          <td className="p-4 align-middle text-right text-muted-foreground">{user.date}</td>
                          <td className="p-4 align-middle">
                            <Button variant="ghost" size="icon" className="h-8 w-8">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>

          </main>
        </div>
      </div>
    </div>
  );
}
