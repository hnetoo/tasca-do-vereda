import { SystemSettings } from "../types";
import { logger } from "./logger";

export async function fetchMenuFromFeed(settings: SystemSettings) {
  try {
    const base = settings.qrMenuCloudUrl || "";
    const url = base ? `${base.replace(/\/+$/, "")}/menu_feed.json` : "/menu_feed.json";
    const res = await fetch(url, { cache: "no-cache" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    return {
      settings: json.restaurant ? { restaurantName: json.restaurant.name, appLogoUrl: json.restaurant.logo } : null,
      categories: Array.isArray(json.categories) ? json.categories : [],
      dishes: Array.isArray(json.dishes) ? json.dishes : [],
    };
  } catch (e: unknown) {
    logger.error("Failed to fetch menu feed", e, "feedFetch");
    return { settings: null, categories: [], dishes: [] };
  }
}

