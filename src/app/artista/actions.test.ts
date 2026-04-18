import { describe, it, expect } from "vitest";
import { isProfileComplete } from "@/app/artista/utils";
import type { Artist } from "@/app/artista/actions";

/**
 * Factory for a complete artist record.
 * Override individual fields in tests to check validation.
 */
function makeArtist(overrides: Partial<Artist> = {}): Artist {
  return {
    id: "test-id",
    name: "Carlos Vives",
    city: "Bogotá",
    type: "Cantante",
    genre: "Vallenato",
    phone: "+573001234567",
    price: 500000,
    duration: "2 horas",
    status: "Pendiente",
    active: true,
    email: null,
    photo: null,
    instagram: null,
    tiktok: null,
    youtube: null,
    spotify: null,
    approved_at: null,
    approved_by: null,
    created_at: "2026-01-01T00:00:00Z",
    created_by: null,
    updated_at: "2026-01-01T00:00:00Z",
    invitation_token: null,
    user_id: null,
    ...overrides,
  };
}

describe("isProfileComplete", () => {
  it("returns true for a complete artist profile", () => {
    const artist = makeArtist();
    expect(isProfileComplete(artist)).toBe(true);
  });

  it("returns false when name is missing", () => {
    const artist = makeArtist({ name: "" });
    expect(isProfileComplete(artist)).toBe(false);
  });

  it("returns false when city is empty string", () => {
    const artist = makeArtist({ city: "" });
    expect(isProfileComplete(artist)).toBe(false);
  });

  it("returns false when price is 0", () => {
    const artist = makeArtist({ price: 0 });
    expect(isProfileComplete(artist)).toBe(false);
  });

  it("returns false when phone is null", () => {
    const artist = makeArtist({ phone: null as unknown as string });
    expect(isProfileComplete(artist)).toBe(false);
  });
});
