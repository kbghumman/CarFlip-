import type { Car, Investor } from "../types";
import { supabase } from "./supabase";

const CARS_STORAGE_KEY = "cars";
const INVESTORS_STORAGE_KEY = "investors";

const LOCAL_UPDATED_AT_KEY =
  "wildspeed_local_updated_at";

const SYNC_PENDING_KEY =
  "wildspeed_sync_pending";

const SYNC_DELAY_MS = 600;
const RETRY_DELAY_MS = 3000;

type CloudAppState = {
  cars: Car[];
  investors: Investor[];
};

let syncTimer:
  | ReturnType<typeof setTimeout>
  | null = null;

let retryTimer:
  | ReturnType<typeof setTimeout>
  | null = null;

let syncInProgress = false;
let syncRequestedWhileBusy = false;

function readLocalArray<T>(
  key: string
): T[] {
  try {
    const value =
      localStorage.getItem(key);

    if (!value) {
      return [];
    }

    const parsed = JSON.parse(value);

    return Array.isArray(parsed)
      ? parsed
      : [];
  } catch (error) {
    console.error(
      `Could not read ${key} from localStorage:`,
      error
    );

    return [];
  }
}

function writeLocalArray<T>(
  key: string,
  value: T[]
) {
  localStorage.setItem(
    key,
    JSON.stringify(value)
  );
}

function getLocalUpdatedAt() {
  return (
    localStorage.getItem(
      LOCAL_UPDATED_AT_KEY
    ) || ""
  );
}

function setLocalUpdatedAt(
  value: string
) {
  localStorage.setItem(
    LOCAL_UPDATED_AT_KEY,
    value
  );
}

function hasPendingSync() {
  return (
    localStorage.getItem(
      SYNC_PENDING_KEY
    ) === "true"
  );
}

function setPendingSync(
  pending: boolean
) {
  localStorage.setItem(
    SYNC_PENDING_KEY,
    pending ? "true" : "false"
  );
}

function markLocalChange() {
  setLocalUpdatedAt(
    new Date().toISOString()
  );

  setPendingSync(true);
}

export function getLocalAppState():
  CloudAppState {
  return {
    cars:
      readLocalArray<Car>(
        CARS_STORAGE_KEY
      ),

    investors:
      readLocalArray<Investor>(
        INVESTORS_STORAGE_KEY
      ),
  };
}

async function performCloudSync() {
  if (syncInProgress) {
    syncRequestedWhileBusy = true;
    return;
  }

  syncInProgress = true;

  try {
    const {
      data: { user },
      error: userError,
    } =
      await supabase.auth.getUser();

    if (userError) {
      throw userError;
    }

    if (!user) {
      return;
    }

    const state =
      getLocalAppState();

    const updatedAt =
      getLocalUpdatedAt() ||
      new Date().toISOString();

    const { error } =
      await supabase
        .from("app_state")
        .upsert(
          {
            user_id: user.id,
            cars: state.cars,
            investors:
              state.investors,
            updated_at: updatedAt,
          },
          {
            onConflict: "user_id",
          }
        );

    if (error) {
      throw error;
    }

    setPendingSync(false);

    if (retryTimer) {
      clearTimeout(retryTimer);
      retryTimer = null;
    }
  } catch (error) {
    console.error(
      "Could not sync app data to Supabase:",
      error
    );

    setPendingSync(true);

    if (!retryTimer) {
      retryTimer = setTimeout(
        () => {
          retryTimer = null;
          void performCloudSync();
        },
        RETRY_DELAY_MS
      );
    }
  } finally {
    syncInProgress = false;

    if (syncRequestedWhileBusy) {
      syncRequestedWhileBusy = false;
      void performCloudSync();
    }
  }
}

export function syncAppStateToCloud() {
  markLocalChange();

  if (syncTimer) {
    clearTimeout(syncTimer);
  }

  syncTimer = setTimeout(
    () => {
      syncTimer = null;
      void performCloudSync();
    },
    SYNC_DELAY_MS
  );
}

export async function flushCloudSync() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  await performCloudSync();
}

export async function hydrateAppStateFromCloud() {
  const {
    data: { user },
    error: userError,
  } =
    await supabase.auth.getUser();

  if (userError) {
    throw userError;
  }

  if (!user) {
    return;
  }

  const { data, error } =
    await supabase
      .from("app_state")
      .select(
        "cars, investors, updated_at"
      )
      .eq("user_id", user.id)
      .maybeSingle();

  if (error) {
    throw error;
  }

  const localUpdatedAt =
    getLocalUpdatedAt();

  const cloudUpdatedAt =
    typeof data?.updated_at ===
    "string"
      ? data.updated_at
      : "";

  const localIsNewer =
    localUpdatedAt &&
    (!cloudUpdatedAt ||
      new Date(
        localUpdatedAt
      ).getTime() >
        new Date(
          cloudUpdatedAt
        ).getTime());

  if (
    hasPendingSync() ||
    localIsNewer
  ) {
    await performCloudSync();
    return;
  }

  if (data) {
    writeLocalArray<Car>(
      CARS_STORAGE_KEY,
      Array.isArray(data.cars)
        ? data.cars
        : []
    );

    writeLocalArray<Investor>(
      INVESTORS_STORAGE_KEY,
      Array.isArray(
        data.investors
      )
        ? data.investors
        : []
    );

    if (cloudUpdatedAt) {
      setLocalUpdatedAt(
        cloudUpdatedAt
      );
    }

    setPendingSync(false);
    return;
  }

  markLocalChange();
  await performCloudSync();
}

export async function clearCloudSessionCache() {
  if (syncTimer) {
    clearTimeout(syncTimer);
    syncTimer = null;
  }

  if (retryTimer) {
    clearTimeout(retryTimer);
    retryTimer = null;
  }

  localStorage.removeItem(
    CARS_STORAGE_KEY
  );

  localStorage.removeItem(
    INVESTORS_STORAGE_KEY
  );

  localStorage.removeItem(
    LOCAL_UPDATED_AT_KEY
  );

  localStorage.removeItem(
    SYNC_PENDING_KEY
  );
}