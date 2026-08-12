import { supabaseAdmin } from "./supabase-server";

export interface User {
  id: string;
  name: string;
  surname: string;
  username: string;
  email: string;
  address: string;
  birthday: string | null;
  telephone: string | null;
  role: string;
  status: string;
  authProvider: string;
  points: number;
  rank: number | null;
  predictions: number;
  createdAt: string;
}

export interface Race {
  id: string;
  name: string;
  date: string;
  qualifyingTime: string | null;
  status: string;
  season: number;
  locked: boolean;
  resultsPublished: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface Prediction {
  id: string;
  userId: string;
  raceId: string;
  driverPredictions: unknown[];
  locked: boolean;
  submittedAt: string | null;
  createdAt: string;
  updatedAt: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapUser(row: any): User | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    surname: row.surname,
    username: row.username,
    email: row.email,
    address: row.address,
    birthday: row.birthday,
    telephone: row.telephone,
    role: row.role,
    status: row.status,
    authProvider: row.auth_provider,
    points: row.points,
    rank: row.rank,
    predictions: row.predictions_count,
    createdAt: row.created_at,
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapRace(row: any): Race | null {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name,
    date: row.date,
    qualifyingTime: row.qualifying_time,
    status: row.status,
    season: row.season,
    locked: row.locked,
    resultsPublished: row.results_published,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

// ─── User operations ───

export async function getUserById(userId: string): Promise<User | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("id", userId)
    .single();
  if (error) return null;
  return mapUser(data);
}

export async function getUserByEmail(email: string): Promise<User | null> {
  const normalizedEmail = email.toLowerCase().trim();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .eq("email", normalizedEmail)
    .single();
  if (error) return null;
  return mapUser(data);
}

export async function getUserByUsername(username: string): Promise<User | null> {
  const lower = username.toLowerCase().trim();
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .ilike("username", lower)
    .single();
  if (error) return null;
  return mapUser(data);
}

export async function updateUser(
  userId: string,
  updates: Partial<{
    status: string;
    points: number;
    rank: number;
    name: string;
    surname: string;
    username: string;
    email: string;
    address: string;
    birthday: string;
    telephone: string;
    role: string;
    predictions: number;
  }>
): Promise<User | null> {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbUpdates: Record<string, any> = {};
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.points !== undefined) dbUpdates.points = updates.points;
  if (updates.rank !== undefined) dbUpdates.rank = updates.rank;
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.surname !== undefined) dbUpdates.surname = updates.surname;
  if (updates.username !== undefined) dbUpdates.username = updates.username;
  if (updates.email !== undefined) dbUpdates.email = updates.email;
  if (updates.address !== undefined) dbUpdates.address = updates.address;
  if (updates.birthday !== undefined) dbUpdates.birthday = updates.birthday;
  if (updates.telephone !== undefined) dbUpdates.telephone = updates.telephone;
  if (updates.role !== undefined) dbUpdates.role = updates.role;
  if (updates.predictions !== undefined) dbUpdates.predictions_count = updates.predictions;

  const { data, error } = await supabaseAdmin
    .from("users")
    .update(dbUpdates)
    .eq("id", userId)
    .select()
    .single();
  if (error) return null;
  return mapUser(data);
}

export async function getAllUsers(): Promise<User[]> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("*")
    .order("created_at", { ascending: false });
  if (error) return [];
  return data.map((row: unknown) => mapUser(row)!);
}

// ─── Prediction operations ───

export async function savePrediction(
  userId: string,
  raceId: string,
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  driverPredictions: any
) {
  const { error } = await supabaseAdmin.from("predictions").upsert(
    {
      user_id: userId,
      race_id: raceId,
      driver_predictions: driverPredictions,
      updated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,race_id" }
  );
  if (error) throw new Error(`Failed to save prediction: ${error.message}`);
  return { success: true };
}

export async function getPrediction(
  userId: string,
  raceId: string
): Promise<Prediction | null> {
  const { data, error } = await supabaseAdmin
    .from("predictions")
    .select("*")
    .eq("user_id", userId)
    .eq("race_id", raceId)
    .single();
  if (error) return null;
  return {
    id: data.id,
    userId: data.user_id,
    raceId: data.race_id,
    driverPredictions: data.driver_predictions || [],
    locked: data.locked,
    submittedAt: data.submitted_at,
    createdAt: data.created_at,
    updatedAt: data.updated_at,
  };
}

export async function submitPrediction(userId: string, raceId: string) {
  const { error } = await supabaseAdmin
    .from("predictions")
    .update({
      locked: true,
      submitted_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", userId)
    .eq("race_id", raceId);
  if (error) throw new Error(`Failed to submit prediction: ${error.message}`);
  return { success: true };
}

export async function getAllPredictionsForRace(raceId: string) {
  const { data, error } = await supabaseAdmin
    .from("predictions")
    .select("user_id, driver_predictions, users(username)")
    .eq("race_id", raceId);
  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((row: any) => ({
    userId: row.user_id,
    username: row.users?.username || "Unknown",
    data: row.driver_predictions,
  }));
}

// ─── Race operations ───

export async function getRace(raceId: string): Promise<Race | null> {
  const { data, error } = await supabaseAdmin
    .from("races")
    .select("*")
    .eq("id", raceId)
    .single();
  if (error) return null;
  return mapRace(data);
}

export async function getActiveRace(): Promise<Race | null> {
  const { data, error } = await supabaseAdmin
    .from("races")
    .select("*")
    .in("status", ["upcoming", "qualifying", "waiting_race", "racing"])
    .order("date", { ascending: true })
    .limit(1)
    .single();
  if (error) return null;
  return mapRace(data);
}

export async function updateRace(
  raceId: string,
  updates: Partial<{
    name: string;
    date: string;
    qualifyingTime: string;
    status: string;
    locked: boolean;
    resultsPublished: boolean;
  }>
) {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const dbUpdates: Record<string, any> = { updated_at: new Date().toISOString() };
  if (updates.name !== undefined) dbUpdates.name = updates.name;
  if (updates.date !== undefined) dbUpdates.date = updates.date;
  if (updates.qualifyingTime !== undefined) dbUpdates.qualifying_time = updates.qualifyingTime;
  if (updates.status !== undefined) dbUpdates.status = updates.status;
  if (updates.locked !== undefined) dbUpdates.locked = updates.locked;
  if (updates.resultsPublished !== undefined) dbUpdates.results_published = updates.resultsPublished;

  const { data, error } = await supabaseAdmin
    .from("races")
    .update(dbUpdates)
    .eq("id", raceId)
    .select()
    .single();
  if (error) throw new Error(`Failed to update race: ${error.message}`);
  return mapRace(data);
}

// ─── Race results operations ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveRaceResults(raceId: string, results: any) {
  const { error } = await supabaseAdmin
    .from("race_results")
    .upsert({ race_id: raceId, results }, { onConflict: "race_id" });
  if (error) throw new Error(`Failed to save race results: ${error.message}`);
  return { success: true };
}

// ─── Score operations ───

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function saveUserRaceScore(userId: string, raceId: string, scoreData: any) {
  const { error } = await supabaseAdmin.from("user_race_scores").upsert(
    {
      user_id: userId,
      race_id: raceId,
      score_data: scoreData,
      calculated_at: new Date().toISOString(),
    },
    { onConflict: "user_id,race_id" }
  );
  if (error) throw new Error(`Failed to save score: ${error.message}`);
  return { success: true };
}

export async function getUserRaceScore(userId: string, raceId: string) {
  const { data, error } = await supabaseAdmin
    .from("user_race_scores")
    .select("*")
    .eq("user_id", userId)
    .eq("race_id", raceId)
    .single();
  if (error) return null;
  return {
    userId: data.user_id,
    raceId: data.race_id,
    ...data.score_data,
    calculatedAt: data.calculated_at,
  };
}

// ─── DigitAlb token operations ───

export async function getDigitAlbTokensUsed(userId: string): Promise<number> {
  const { count, error } = await supabaseAdmin
    .from("digitalb_tokens")
    .select("*", { count: "exact", head: true })
    .eq("user_id", userId);
  if (error) return 0;
  return count || 0;
}

export async function deployDigitAlbToken(userId: string, raceId: string) {
  const { error } = await supabaseAdmin
    .from("digitalb_tokens")
    .insert({ user_id: userId, race_id: raceId });
  if (error) throw new Error(`Failed to deploy token: ${error.message}`);
  return { success: true };
}

// ─── Boost operations ───

export async function applyRaiffeisenBoost(userId: string, raceId: string) {
  const pred = await getPrediction(userId, raceId);
  if (pred) {
    const updatedPredictions = pred.driverPredictions || [];
    await supabaseAdmin
      .from("predictions")
      .update({
        driver_predictions: updatedPredictions,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", userId)
      .eq("race_id", raceId);
  }
  return { success: true, pointsAdded: 15 };
}

// ─── Leaderboard operations ───

export async function getLeaderboard(limit = 50) {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id, username, points, predictions_count")
    .eq("status", "active")
    .neq("role", "admin")
    .order("points", { ascending: false })
    .limit(limit);
  if (error) return [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return data.map((u: any, i: number) => ({
    rank: i + 1,
    id: u.id,
    username: u.username,
    points: u.points || 0,
    predictions: u.predictions_count || 0,
  }));
}

export async function getUserRank(userId: string): Promise<number | null> {
  const { data, error } = await supabaseAdmin
    .from("users")
    .select("id")
    .eq("status", "active")
    .order("points", { ascending: false });
  if (error) return null;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const idx = data.findIndex((u: any) => u.id === userId);
  return idx >= 0 ? idx + 1 : null;
}
