import { createFileRoute } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/app-shell";
import { useRole } from "@/hooks/use-role";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, UsersRound, CalendarCheck, CreditCard } from "lucide-react";

export const Route = createFileRoute("/_authenticated/dashboard")({
  head: () => ({
    meta: [
      { title: "لوحة التحكم — أكاديمية ميت برو" },
      { name: "description", content: "نظرة عامة على الأكاديمية: اللاعبون والمجموعات والتدريبات والمدفوعات." },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { data: role } = useRole();

  const { data: stats } = useQuery({
    queryKey: ["dashboard-stats"],
    queryFn: async () => {
      const weekAhead = new Date();
      weekAhead.setDate(weekAhead.getDate() + 7);
      const today = new Date().toISOString().slice(0, 10);
      const [players, groups, sessions, payments] = await Promise.all([
        supabase.from("players").select("*", { count: "exact", head: true }).eq("status", "active"),
        supabase.from("groups").select("*", { count: "exact", head: true }),
        supabase
          .from("sessions")
          .select("*", { count: "exact", head: true })
          .gte("session_date", today)
          .lte("session_date", weekAhead.toISOString().slice(0, 10)),
        supabase.from("payments").select("amount").eq("status", "pending"),
      ]);
      const pendingSum = (payments.data ?? []).reduce((s, p) => s + Number(p.amount), 0);
      return {
        players: players.count ?? 0,
        groups: groups.count ?? 0,
        sessions: sessions.count ?? 0,
        pendingPayments: pendingSum,
      };
    },
  });

  const { data: upcoming } = useQuery({
    queryKey: ["upcoming-sessions"],
    queryFn: async () => {
      const today = new Date().toISOString().slice(0, 10);
      const { data } = await supabase
        .from("sessions")
        .select("*, groups(name)")
        .gte("session_date", today)
        .order("session_date")
        .limit(5);
      return data ?? [];
    },
  });

  const cards = [
    { label: "اللاعبون النشطون", value: stats?.players ?? "—", icon: Users },
    { label: "المجموعات", value: stats?.groups ?? "—", icon: UsersRound },
    { label: "تدريبات هذا الأسبوع", value: stats?.sessions ?? "—", icon: CalendarCheck },
    { label: "مدفوعات مستحقة (₪)", value: stats?.pendingPayments ?? "—", icon: CreditCard },
  ];

  return (
    <AppShell>
      <h1 className="text-2xl font-extrabold md:text-3xl">
        أهلاً {role?.profile?.full_name || "بك"} 👋
      </h1>
      <p className="mt-1 text-muted-foreground">إليك نظرة سريعة على أكاديميتك اليوم.</p>

      <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {cards.map((c) => (
          <Card key={c.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{c.label}</CardTitle>
              <c.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-extrabold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>التدريبات القادمة</CardTitle>
        </CardHeader>
        <CardContent>
          {upcoming && upcoming.length > 0 ? (
            <ul className="divide-y">
              {upcoming.map((s) => (
                <li key={s.id} className="flex items-center justify-between py-3">
                  <div>
                    <p className="font-semibold">{s.groups?.name}</p>
                    <p className="text-sm text-muted-foreground">{s.location || "الملعب"}</p>
                  </div>
                  <div className="text-left text-sm">
                    <p className="font-medium">{s.session_date}</p>
                    <p className="text-muted-foreground">{String(s.start_time).slice(0, 5)}</p>
                  </div>
                </li>
              ))}
            </ul>
          ) : (
            <p className="py-6 text-center text-muted-foreground">
              لا توجد تدريبات قادمة. أضف تدريباً من صفحة التدريبات.
            </p>
          )}
        </CardContent>
      </Card>
    </AppShell>
  );
}
