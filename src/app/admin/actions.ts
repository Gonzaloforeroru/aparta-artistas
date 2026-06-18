"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { nanoid } from "nanoid";
import { uploadArtistPhoto, deleteArtistPhoto } from "@/lib/supabase/storage";
import type { ArtistType, Genre, ArtistStatus } from "@/lib/supabase/database.types";

// ═══════════════════════════════════════════
// ARTIST CRUD
// ═══════════════════════════════════════════

export async function createArtist(formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;

  // Insert artist first (to get ID for photo path)
   const { data: artistData, error } = await supabase
     .from("artists")
     .insert({
       name: formData.get("name") as string,
       email: (formData.get("email") as string) || null,
       city: formData.get("city") as string,
       type: formData.get("type") as ArtistType,
       genre: formData.get("genre") as Genre,
       phone: formData.get("phone") as string,
       price: parseInt(formData.get("price") as string) || 0,
       duration: formData.get("duration") as string,
       status: (formData.get("status") as ArtistStatus) ?? "Aprobado",
       instagram: (formData.get("instagram") as string) || null,
       tiktok: (formData.get("tiktok") as string) || null,
       youtube: (formData.get("youtube") as string) || null,
       spotify: (formData.get("spotify") as string) || null,
       website: (formData.get("website") as string) || null,
       created_by: user?.id,
     })
     .select()
     .single();

  if (error) throw error;

  // Upload photo if provided
  if (photoFile && photoFile.size > 0) {
    const uploadedUrl = await uploadArtistPhoto(photoFile, artistData.id);
    if (uploadedUrl) {
      await supabase
        .from("artists")
        .update({ photo: uploadedUrl })
        .eq("id", artistData.id);
    }
  }

  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function updateArtist(id: string, formData: FormData) {
  const supabase = await createClient();

  // Get current artist to preserve existing photo
  const { data: currentArtist } = await supabase
    .from("artists")
    .select("photo")
    .eq("id", id)
    .single();

  // Handle photo deletion
  const shouldDeletePhoto = formData.get("deletePhoto") === "true";
  const photoFile = formData.get("photo") as File | null;
  let photoUrl: string | null = currentArtist?.photo ?? null;

  if (shouldDeletePhoto) {
    // Delete photo permanently from storage
    if (currentArtist?.photo) {
      await deleteArtistPhoto(currentArtist.photo);
    }
    photoUrl = null;
  } else if (photoFile && photoFile.size > 0) {
    // Upload new photo if provided
    if (currentArtist?.photo) {
      await deleteArtistPhoto(currentArtist.photo);
    }
    const uploadedUrl = await uploadArtistPhoto(photoFile, id);
    if (uploadedUrl) {
      photoUrl = uploadedUrl;
    }
  }

   const { error } = await supabase
     .from("artists")
     .update({
       name: formData.get("name") as string,
       email: (formData.get("email") as string) || null,
       city: formData.get("city") as string,
       type: formData.get("type") as ArtistType,
       genre: formData.get("genre") as Genre,
       phone: formData.get("phone") as string,
       price: parseInt(formData.get("price") as string) || 0,
       duration: formData.get("duration") as string,
       status: formData.get("status") as ArtistStatus,
       instagram: (formData.get("instagram") as string) || null,
       tiktok: (formData.get("tiktok") as string) || null,
       youtube: (formData.get("youtube") as string) || null,
       spotify: (formData.get("spotify") as string) || null,
       website: (formData.get("website") as string) || null,
       photo: photoUrl,
     })
     .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function removeArtistPhoto(id: string) {
  const supabase = await createClient();

  const { data: artist } = await supabase
    .from("artists")
    .select("photo")
    .eq("id", id)
    .single();

  if (artist?.photo) {
    await deleteArtistPhoto(artist.photo);
  }

  const { error } = await supabase
    .from("artists")
    .update({ photo: null })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function deleteArtist(id: string) {
  const supabase = await createClient();

  // Get artist photo before deleting
  const { data: artist } = await supabase
    .from("artists")
    .select("photo")
    .eq("id", id)
    .single();

  // Delete photo from storage if exists
  if (artist?.photo) {
    await deleteArtistPhoto(artist.photo);
  }

  // Hard delete: permanently remove from database
  const { error } = await supabase
    .from("artists")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function toggleArtistActive(id: string, active: boolean) {
  const supabase = await createClient();

  const { error } = await supabase
    .from("artists")
    .update({ active })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/lista");
}

export async function approveArtist(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("artists")
    .update({
      status: "Aprobado" as ArtistStatus,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/aprobaciones");
  revalidatePath("/admin/lista");
  revalidatePath("/catalogo");
}

export async function rejectArtist(id: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const { error } = await supabase
    .from("artists")
    .update({
      status: "Rechazado" as ArtistStatus,
      approved_by: user?.id,
      approved_at: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/admin/aprobaciones");
  revalidatePath("/admin/lista");
}

// ═══════════════════════════════════════════
// INVITATIONS
// ═══════════════════════════════════════════

export async function createInvitation(nota?: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const token = nanoid(21);

  const { error } = await supabase.from("invitations").insert({
    token,
    email: nota || null,
    created_by: user.id,
  });

  if (error) throw error;

  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL!;
  const link = `${baseUrl}/registro/${token}`;

  revalidatePath("/admin/invitaciones");
  return { token, link };
}

export async function getInvitations() {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("invitations")
    .select("*")
    .order("created_at", { ascending: false });

  if (error) throw error;
  return data;
}

// ═══════════════════════════════════════════
// CSV IMPORT
// ═══════════════════════════════════════════

interface ArtistImportRow {
  name: string;
  email: string;
  city: string;
  type: ArtistType;
  genre: Genre;
  phone: string;
  price: number;
  duration: string;
  instagram?: string;
  tiktok?: string;
  youtube?: string;
  spotify?: string;
  website?: string;
}

export async function importArtists(rows: ArtistImportRow[]) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const insertData = rows.map((row) => ({
    ...row,
    status: "Aprobado" as ArtistStatus,
    active: true,
    created_by: user?.id,
  }));

  const { data, error } = await supabase
    .from("artists")
    .insert(insertData)
    .select();

  if (error) throw error;

  revalidatePath("/admin/lista");
  revalidatePath("/admin/metricas");
  revalidatePath("/catalogo");

  return { count: data.length };
}

// ═══════════════════════════════════════════
// ARTIST REGISTRATION (anon — via token)
// ═══════════════════════════════════════════

export async function registerArtistWithToken(token: string, formData: FormData) {
  // Use admin client to bypass RLS (anon users can't insert directly due to policy issues)
  const supabase = createAdminClient();

  // Validate token
  const { data: invitation } = await supabase
    .from("invitations")
    .select("*")
    .eq("token", token)
    .is("used_at", null)
    .gt("expires_at", new Date().toISOString())
    .single();

  if (!invitation) {
    throw new Error("Token inválido o expirado");
  }

  // Handle photo upload
  const photoFile = formData.get("photo") as File | null;

  // Insert artist first (to get ID for photo path)
  const { data: artistData, error: artistError } = await supabase
    .from("artists")
    .insert({
      name: formData.get("name") as string,
      city: formData.get("city") as string,
      type: formData.get("type") as ArtistType,
      genre: formData.get("genre") as Genre,
      phone: formData.get("phone") as string,
      price: parseInt(formData.get("price") as string) || 0,
      duration: formData.get("duration") as string,
      status: "Pendiente" as ArtistStatus,
      invitation_token: token,
      instagram: (formData.get("instagram") as string) || null,
      tiktok: (formData.get("tiktok") as string) || null,
      youtube: (formData.get("youtube") as string) || null,
      spotify: (formData.get("spotify") as string) || null,
      website: (formData.get("website") as string) || null,
    })
    .select()
    .single();

  if (artistError) throw artistError;

  // Upload photo if provided
  if (photoFile && photoFile.size > 0) {
    const uploadedUrl = await uploadArtistPhoto(photoFile, artistData.id);
    if (uploadedUrl) {
      // Update artist with photo URL
      await supabase
        .from("artists")
        .update({ photo: uploadedUrl })
        .eq("id", artistData.id);
    }
  }

  // Mark token as used
  const { error: tokenError } = await supabase
    .from("invitations")
    .update({ used_at: new Date().toISOString() })
    .eq("token", token);

  if (tokenError) throw tokenError;

  revalidatePath("/admin/aprobaciones");
  revalidatePath("/admin/invitaciones");
}
