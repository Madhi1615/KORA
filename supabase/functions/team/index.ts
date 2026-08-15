// GET  ?company_id=...                                    -> any company member: list teammates + emails
// POST { company_id, email, password, role? }              -> owner only: create a new login and add them
//
// company_members doesn't store email (that lives in auth.users, which RLS can't expose to the
// browser) — this function bridges that gap using the service role, after checking the caller
// actually belongs to (and, for invites, owns) the company they're asking about. This is how an
// admin adds a teammate without anyone needing to run SQL by hand.
import { handleOptions, jsonResponse } from "../_shared/cors.ts";
import { getAdminClient, requireCompanyMember } from "../_shared/supabaseAdmin.ts";

Deno.serve(async (req) => {
  const preflight = handleOptions(req);
  if (preflight) return preflight;

  const admin = getAdminClient();

  if (req.method === "GET") {
    const companyId = new URL(req.url).searchParams.get("company_id");
    if (!companyId) return jsonResponse({ error: "company_id is required" }, 400);

    const auth = await requireCompanyMember(req, admin, companyId);
    if (!auth) return jsonResponse({ error: "Not authorized for this company" }, 403);

    const { data: members, error } = await admin
      .from("company_members")
      .select("user_id, role, created_at")
      .eq("company_id", companyId);
    if (error) return jsonResponse({ error: error.message }, 500);

    const result = [];
    for (const member of members ?? []) {
      const { data: userResult } = await admin.auth.admin.getUserById(member.user_id);
      result.push({
        user_id: member.user_id,
        role: member.role,
        created_at: member.created_at,
        email: userResult?.user?.email ?? "(unknown)",
      });
    }

    return jsonResponse({ members: result });
  }

  if (req.method === "POST") {
    const { company_id, email, password, role } = await req.json().catch(() => ({}));
    if (!company_id || !email || !password) {
      return jsonResponse({ error: "company_id, email and password are required" }, 400);
    }
    if (password.length < 6) return jsonResponse({ error: "Password must be at least 6 characters." }, 400);

    const auth = await requireCompanyMember(req, admin, company_id);
    if (!auth) return jsonResponse({ error: "Not authorized for this company" }, 403);

    const { data: callerMembership } = await admin
      .from("company_members")
      .select("role")
      .eq("company_id", company_id)
      .eq("user_id", auth.userId)
      .maybeSingle();
    if (callerMembership?.role !== "owner") {
      return jsonResponse({ error: "Only an owner can add teammates." }, 403);
    }

    const { data: created, error: createError } = await admin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });
    if (createError || !created?.user) {
      return jsonResponse({ error: createError?.message ?? "Could not create the login." }, 500);
    }

    const { error: linkError } = await admin.from("company_members").insert({
      company_id,
      user_id: created.user.id,
      role: role === "owner" ? "owner" : "dispatcher",
    });
    if (linkError) return jsonResponse({ error: linkError.message }, 500);

    return jsonResponse({ user_id: created.user.id, email }, 201);
  }

  return jsonResponse({ error: "Method not allowed" }, 405);
});
