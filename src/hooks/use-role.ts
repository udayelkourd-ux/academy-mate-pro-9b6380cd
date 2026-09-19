import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export function useRole() {
  return useQuery({
    queryKey: ["my-role"],
    staleTime: 5 * 60 * 1000,
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) return null;
      const [{ data: rolesData }, { data: profile }] = await Promise.all([
        supabase.from("user_roles").select("role").eq("user_id", user.id),
        supabase.from("profiles").select("*").eq("id", user.id).single(),
      ]);
      const roles = (rolesData ?? []).map((r) => r.role);
      return {
        user,
        profile,
        roles,
        isAdmin: roles.includes("admin"),
        isCoach: roles.includes("coach"),
      };
    },
  });
}
