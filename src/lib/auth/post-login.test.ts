import { describe, it, expect, vi, afterEach, beforeEach } from "vitest";
import type { SupabaseClient, User } from "@supabase/supabase-js";
import { isAdminEmail, handlePostLogin } from "@/lib/auth/post-login";

// ─── Mock helpers ────────────────────────────────────────────

/** Creates a chainable mock that mirrors Supabase's query builder pattern. */
function mockBuilder(
  resolved: { data: unknown; error: unknown } = { data: null, error: null }
) {
  const b: Record<string, ReturnType<typeof vi.fn>> = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
    upsert: vi.fn(),
    eq: vi.fn(),
    neq: vi.fn(),
    ilike: vi.fn(),
    is: vi.fn(),
    gt: vi.fn(),
    single: vi.fn().mockResolvedValue(resolved),
    maybeSingle: vi.fn().mockResolvedValue(resolved),
  };
  // Chain methods return self
  b.select.mockReturnValue(b);
  b.insert.mockReturnValue(b);
  b.update.mockReturnValue(b);
  b.upsert.mockResolvedValue({ data: null, error: null });
  b.eq.mockReturnValue(b);
  b.neq.mockReturnValue(b);
  b.ilike.mockReturnValue(b);
  b.is.mockReturnValue(b);
  b.gt.mockReturnValue(b);
  return b;
}

type MockBuilder = ReturnType<typeof mockBuilder>;

/** Creates a mock SupabaseClient whose .from() returns builders in order. */
function makeMockClient(...builders: MockBuilder[]) {
  const fromMock = vi.fn();
  builders.forEach((b) => fromMock.mockReturnValueOnce(b));
  // Fallback for unexpected calls
  fromMock.mockReturnValue(mockBuilder());
  return { from: fromMock } as unknown as SupabaseClient;
}

/** Minimal User mock factory. */
function mockUser(overrides: Partial<User> = {}) {
  return {
    id: "user-123",
    email: "artist@example.com",
    user_metadata: { full_name: "Test Artist" },
    app_metadata: {},
    aud: "authenticated",
    created_at: "",
    ...overrides,
  } as unknown as User;
}

/** Stub supabase param (not used in helper logic). */
const stubSupabase = {} as unknown as SupabaseClient;

// ─── isAdminEmail ────────────────────────────────────────────

describe("isAdminEmail", () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  afterEach(() => {
    process.env.ADMIN_EMAIL = originalAdminEmail;
  });

  it("returns true for exact case-insensitive match", () => {
    process.env.ADMIN_EMAIL = "Admin@Test.com";
    expect(isAdminEmail("admin@test.com")).toBe(true);
    expect(isAdminEmail("ADMIN@TEST.COM")).toBe(true);
    expect(isAdminEmail("Admin@Test.com")).toBe(true);
  });

  it("returns false for non-matching email", () => {
    process.env.ADMIN_EMAIL = "admin@test.com";
    expect(isAdminEmail("other@test.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAIL env var is empty string", () => {
    process.env.ADMIN_EMAIL = "";
    expect(isAdminEmail("admin@test.com")).toBe(false);
  });

  it("returns false when ADMIN_EMAIL env var is not set", () => {
    delete process.env.ADMIN_EMAIL;
    expect(isAdminEmail("admin@test.com")).toBe(false);
  });

  it("returns false for empty email input", () => {
    process.env.ADMIN_EMAIL = "admin@test.com";
    expect(isAdminEmail("")).toBe(false);
  });
});

// ─── handlePostLogin ─────────────────────────────────────────

describe("handlePostLogin", () => {
  const originalAdminEmail = process.env.ADMIN_EMAIL;

  afterEach(() => {
    process.env.ADMIN_EMAIL = originalAdminEmail;
  });

  it("sets admin role and redirects to /admin for admin email", async () => {
    process.env.ADMIN_EMAIL = "admin@test.com";

    const profileUpsertBuilder = mockBuilder();
    const downgradeBuilder = mockBuilder(); // Step 1: downgrade previous admins
    const adminClient = makeMockClient(profileUpsertBuilder, downgradeBuilder);
    const user = mockUser({ email: "admin@test.com" });

    const result = await handlePostLogin(stubSupabase, adminClient, user);

    expect(result.redirectTo).toBe("/admin");
    expect(adminClient.from).toHaveBeenCalledWith("profiles");
    expect(profileUpsertBuilder.upsert).toHaveBeenCalledWith(
      expect.objectContaining({ id: "user-123", role: "admin" }),
      { onConflict: "id" }
    );
    // Verify previous admins get downgraded
    expect(downgradeBuilder.update).toHaveBeenCalledWith({ role: "artist" });
  });

  it("links auth user to existing artist found by email", async () => {
    process.env.ADMIN_EMAIL = "admin@other.com";

    // Step 0: profile upsert
    const profileUpsertBuilder = mockBuilder();
    // 1st from("artists") → select + ilike → found
    const selectBuilder = mockBuilder({
      data: { id: "artist-456" },
      error: null,
    });
    // 2nd from("artists") → update user_id
    const updateBuilder = mockBuilder();

    const adminClient = makeMockClient(profileUpsertBuilder, selectBuilder, updateBuilder);
    const user = mockUser({ email: "existing@artist.com" });

    const result = await handlePostLogin(stubSupabase, adminClient, user);

    expect(result.redirectTo).toBe("/artista");
    expect(selectBuilder.ilike).toHaveBeenCalledWith(
      "email",
      "existing@artist.com"
    );
    expect(updateBuilder.update).toHaveBeenCalledWith({
      user_id: "user-123",
    });
    expect(updateBuilder.eq).toHaveBeenCalledWith("id", "artist-456");
  });

  it("creates new artist record when no email match", async () => {
    process.env.ADMIN_EMAIL = "admin@other.com";

    // Step 0: profile upsert
    const profileUpsertBuilder = mockBuilder();
    // 1st from("artists") → select + ilike → not found
    const selectBuilder = mockBuilder({ data: null, error: null });
    // 2nd from("artists") → insert
    const insertBuilder = mockBuilder();

    const adminClient = makeMockClient(profileUpsertBuilder, selectBuilder, insertBuilder);
    const user = mockUser({ email: "new@artist.com" });

    const result = await handlePostLogin(stubSupabase, adminClient, user);

    expect(result.redirectTo).toBe("/artista");
    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({
        email: "new@artist.com",
        user_id: "user-123",
        name: "Test Artist",
        status: "Pendiente",
      })
    );
  });

  it("uses email prefix as name when user_metadata has no full_name", async () => {
    process.env.ADMIN_EMAIL = "admin@other.com";

    const profileUpsertBuilder = mockBuilder();
    const selectBuilder = mockBuilder({ data: null, error: null });
    const insertBuilder = mockBuilder();
    const adminClient = makeMockClient(profileUpsertBuilder, selectBuilder, insertBuilder);
    const user = mockUser({
      email: "noname@example.com",
      user_metadata: {},
    });

    await handlePostLogin(stubSupabase, adminClient, user);

    expect(insertBuilder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ name: "noname" })
    );
  });

  it("redirects with error when user has no email", async () => {
    const adminClient = makeMockClient();
    const user = mockUser({ email: undefined });

    const result = await handlePostLogin(stubSupabase, adminClient, user);

    expect(result.redirectTo).toBe("/login?error=no_email");
    // No DB calls should happen
    expect(adminClient.from).not.toHaveBeenCalled();
  });

  it("validates and associates invitation token", async () => {
    process.env.ADMIN_EMAIL = "admin@other.com";

    // Step 0: profile upsert
    const profileUpsertBuilder = mockBuilder();
    // 1st: artist email select (no match)
    const artistSelectBuilder = mockBuilder({ data: null, error: null });
    // 2nd: artist insert (new record)
    const artistInsertBuilder = mockBuilder();
    // 3rd: invitation select (valid token found)
    const invitationSelectBuilder = mockBuilder({
      data: { token: "abc123" },
      error: null,
    });
    // 4th: artist by invitation_token (found)
    const invitedArtistBuilder = mockBuilder({
      data: { id: "invited-artist-789" },
      error: null,
    });
    // 5th: artist update user_id for invited artist
    const artistUpdateBuilder = mockBuilder();
    // 6th: invitation mark used
    const invitationUpdateBuilder = mockBuilder();

    const adminClient = makeMockClient(
      profileUpsertBuilder,
      artistSelectBuilder,
      artistInsertBuilder,
      invitationSelectBuilder,
      invitedArtistBuilder,
      artistUpdateBuilder,
      invitationUpdateBuilder
    );
    const user = mockUser({ email: "invited@artist.com" });

    const result = await handlePostLogin(
      stubSupabase,
      adminClient,
      user,
      "abc123"
    );

    expect(result.redirectTo).toBe("/artista");
    // Token validation
    expect(invitationSelectBuilder.eq).toHaveBeenCalledWith("token", "abc123");
    expect(invitationSelectBuilder.is).toHaveBeenCalledWith("used_at", null);
    // Artist association
    expect(artistUpdateBuilder.update).toHaveBeenCalledWith({
      user_id: "user-123",
    });
    expect(artistUpdateBuilder.eq).toHaveBeenCalledWith(
      "id",
      "invited-artist-789"
    );
    // Mark used
    expect(invitationUpdateBuilder.update).toHaveBeenCalledWith(
      expect.objectContaining({ used_at: expect.any(String) })
    );
    expect(invitationUpdateBuilder.eq).toHaveBeenCalledWith("token", "abc123");
  });

  it("skips token association when invitation is expired/used", async () => {
    process.env.ADMIN_EMAIL = "admin@other.com";

    // Step 0: profile upsert
    const profileUpsertBuilder = mockBuilder();
    // 1st: artist email select (no match)
    const artistSelectBuilder = mockBuilder({ data: null, error: null });
    // 2nd: artist insert
    const artistInsertBuilder = mockBuilder();
    // 3rd: invitation select (not found = expired/used)
    const invitationSelectBuilder = mockBuilder({ data: null, error: null });

    const adminClient = makeMockClient(
      profileUpsertBuilder,
      artistSelectBuilder,
      artistInsertBuilder,
      invitationSelectBuilder
    );
    const user = mockUser({ email: "someone@artist.com" });

    const result = await handlePostLogin(
      stubSupabase,
      adminClient,
      user,
      "expired-token"
    );

    expect(result.redirectTo).toBe("/artista");
    // 4 from() calls: profile upsert, artist select, artist insert, invitation check
    expect(adminClient.from).toHaveBeenCalledTimes(4);
  });
});
