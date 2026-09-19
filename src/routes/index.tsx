import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Users, CalendarCheck, CreditCard, Trophy } from "lucide-react";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "أكاديمية ميت برو — نظام إدارة أكاديميات كرة القدم" },
      {
        name: "description",
        content:
          "أدر لاعبيك ومجموعاتك وتدريباتك وحضورك ومدفوعاتك من مكان واحد. نظام عربي متكامل لأكاديميات كرة القدم.",
      },
      { property: "og:title", content: "أكاديمية ميت برو — نظام إدارة أكاديميات كرة القدم" },
      {
        property: "og:description",
        content: "أدر لاعبيك ومجموعاتك وتدريباتك وحضورك ومدفوعاتك من مكان واحد.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [signedIn, setSignedIn] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) setSignedIn(true);
    });
  }, []);

  return (
    <div className="min-h-screen bg-pitch text-pitch-foreground">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
        <div className="flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sidebar-primary">
            <Trophy className="h-5 w-5 text-sidebar-primary-foreground" />
          </div>
          <span className="text-lg font-extrabold">أكاديمية ميت برو</span>
        </div>
        <Button
          variant="secondary"
          onClick={() => navigate({ to: signedIn ? "/dashboard" : "/auth" })}
        >
          {signedIn ? "لوحة التحكم" : "تسجيل الدخول"}
        </Button>
      </header>

      {/* Hero */}
      <section className="pitch-stripes relative overflow-hidden">
        <div className="mx-auto max-w-6xl px-6 py-24 text-center md:py-32">
          <span className="inline-block rounded-full border border-sidebar-primary/40 bg-sidebar-primary/10 px-4 py-1 text-sm font-semibold text-sidebar-primary">
            نظام إدارة متكامل لأكاديميات كرة القدم
          </span>
          <h1 className="mx-auto mt-6 max-w-3xl text-4xl font-black leading-tight md:text-6xl">
            أدر أكاديميتك باحترافية <span className="text-lime-accent">من الملعب إلى المكتب</span>
          </h1>
          <p className="mx-auto mt-6 max-w-2xl text-lg text-pitch-foreground/70">
            سجّل اللاعبين، نظّم المجموعات والتدريبات، تابع الحضور، وحصّل الاشتراكات — كل ذلك من
            لوحة تحكم واحدة سهلة بالعربية.
          </p>
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Button
              size="lg"
              className="bg-sidebar-primary text-sidebar-primary-foreground hover:bg-sidebar-primary/90"
              onClick={() => navigate({ to: signedIn ? "/dashboard" : "/auth" })}
            >
              {signedIn ? "ادخل إلى لوحة التحكم" : "ابدأ الآن مجاناً"}
            </Button>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-center text-3xl font-extrabold">كل ما تحتاجه أكاديميتك</h2>
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-card p-8 text-card-foreground shadow-sm">
            <Users className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-xl font-bold">إدارة اللاعبين</h3>
            <p className="mt-2 text-muted-foreground">
              ملفات كاملة للاعبين مع بيانات أولياء الأمور والمجموعات والحالة.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-8 text-card-foreground shadow-sm">
            <CalendarCheck className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-xl font-bold">التدريبات والحضور</h3>
            <p className="mt-2 text-muted-foreground">
              جدولة الحصص التدريبية وتسجيل حضور اللاعبين بضغطة واحدة.
            </p>
          </div>
          <div className="rounded-2xl bg-card p-8 text-card-foreground shadow-sm">
            <CreditCard className="h-10 w-10 text-primary" />
            <h3 className="mt-4 text-xl font-bold">المدفوعات والاشتراكات</h3>
            <p className="mt-2 text-muted-foreground">
              تتبع الاشتراكات الشهرية والمدفوعات المستحقة لكل لاعب.
            </p>
          </div>
        </div>
      </section>

      <footer className="border-t border-sidebar-border py-8 text-center text-sm text-pitch-foreground/50">
        أكاديمية ميت برو — صُنع بحب للعبة الجميلة ⚽
      </footer>
    </div>
  );
}
