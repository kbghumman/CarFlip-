import type { Car, Investor } from "../types";
import { supabase } from "./supabase";

const CARS_STORAGE_KEY = "cars";
const INVESTORS_STORAGE_KEY = "investors";

type CloudAppState = {
  cars: Car[];
  investors: Investor[];
};

function readLocalArray<T>(key: string): T[] {
  try {
    const value = localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    console.error(`Could not read ${key} from localStorage:`, error);
    return [];
  }
}

function writeLocalArray<T>(key: string, value: T[]) {
  localStorage.setItem(key, JSON.stringify(value));
}

export function getLocalAppState(): CloudAppState {
  return {
    cars: readLocalArray<Car>(CARS_STORAGE_KEY),
    investors: readLocalArray<Investor>(INVESTORS_STORAGE_KEY),
  };
}

export async function syncAppStateToCloud() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    console.error("Could not read the signed-in user:", userError);
    return;
  }

  if (!user) {
    return;
  }

  const state = getLocalAppState();

  const { error } = await supabase
    .from("app_state")
    .upsert(
      {
        user_id: user.id,
        cars: state.cars,
        investors: state.investors,
        updated_at: new Date().toISOString(),
      },
      {
        onConflict: "user_id",
      }
    );

  if (error) {
    console.error("Could not sync app data to Supabase:", error);
  }
}

export async function hydrateAppStateFromCloud() {
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return;
  }

  const { data, error } = await supabase
    .from("app_state")
    .select("cars, investors")
    .eq("user_id", user.id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (data) {
    writeLocalArray<Car>(
      CARS_STORAGE_KEY,
      Array.isArray(data.cars) ? data.cars : []
    );

    writeLocalArray<Investor>(
      INVESTORS_STORAGE_KEY,
      Array.isArray(data.investors) ? data.investors : []
    );

    return;
  }

  // The first device keeps its existing local data and uploads it.
  await syncAppStateToCloud();
}

export async function clearCloudSessionCache() {
  localStorage.removeItem(CARS_STORAGE_KEY);
  localStorage.removeItem(INVESTORS_STORAGE_KEY);
  }