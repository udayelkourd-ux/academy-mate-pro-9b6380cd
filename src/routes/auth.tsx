import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "تسجيل الدخول — أكاديمية ميت برو" },
      { name: "description", content: "سجّل دخولك إلى لوحة إدارة الأكاديمية." },
    ],
  }),
  component: AuthPage,
});

function AuthPage() {
  const navigate = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [loading, setLoading] = useState(false);
  const [awaitingConfirm, setAwaitingConfirm] = useState(false);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => {
      if (data.session) navigate({ to: "/dashboard", replace: true });
    });
  }, [navigate]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName },
            emailRedirectTo: window.location.origin,
          },
        });
        if (error) throw error;
        if (!data.session) {
          setAwaitingConfirm(true);
          return;
        }
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
      }
      navigate({ to: "/dashboard" });
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "حدث خطأ، حاول مجدداً");
    } finally {
      setLoading(false);
    }
  }

  async function handleGoogle() {
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
    });
    if (result.error) {
      toast.error("تعذر تسجيل الدخول عبر Google");
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-pitch px-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <Trophy className="h-6 w-6 text-primary-foreground" />
          </div>
          <CardTitle className="text-2xl font-extrabold">
            {awaitingConfirm ? "تفقد بريدك الإلكتروني" : mode === "signin" ? "تسجيل الدخول" : "إنشاء حساب"}
          </CardTitle>
          <CardDescription>
            {awaitingConfirm
              ? "أرسلنا لك رابط تأكيد. اضغط عليه ثم عد لتسجيل الدخول."
              : mode === "signin"
                ? "أهلاً بعودتك إلى أكاديمية ميت برو"
                : "أنشئ حسابك لإدارة الأكاديمية"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          {awaitingConfirm ? (
            <Button className="w-full" onClick={() => setAwaitingConfirm(false)}>
              العودة لتسجيل الدخول
            </Button>
          ) : (
            <>
              <form onSubmit={handleSubmit} className="space-y-4">
                {mode === "signup" && (
                  <div className="space-y-2">
                    <Label htmlFor="fullName">الاسم الكامل</Label>
                    <Input
                      id="fullName"
                      value={fullName}
                      onChange={(e) => setFullName(e.target.value)}
                      required
                    />
                  </div>
                )}
                <div className="space-y-2">
                  <Label htmlFor="email">البريد الإلكتروني</Label>
                  <Input
                    id="email"
                    type="email"
                    dir="ltr"
                    className="text-left"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="password">كلمة المرور</Label>
                  <Input
                    id="password"
                    type="password"
                    dir="ltr"
                    className="text-left"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                  />
                </div>
                <Button type="submit" className="w-full" disabled={loading}>
                  {loading ? "جاري..." : mode === "signin" ? "دخول" : "إنشاء الحساب"}
                </Button>
              </form>

              <div className="my-4 flex items-center gap-3 text-xs text-muted-foreground">
                <div className="h-px flex-1 bg-border" />
                أو
                <div className="h-px flex-1 bg-border" />
              </div>

              <Button type="button" variant="outline" className="w-full" onClick={handleGoogle}>
                المتابعة بحساب Google
              </Button>

              <p className="mt-4 text-center text-sm text-muted-foreground">
                {mode === "signin" ? "ليس لديك حساب؟" : "لديك حساب بالفعل؟"}{" "}
                <button
                  type="button"
                  className="font-semibold text-primary hover:underline"
                  onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                >
                  {mode === "signin" ? "إنشاء حساب" : "تسجيل الدخول"}
                </button>
              </p>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
