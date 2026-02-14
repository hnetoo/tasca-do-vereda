import { SystemSettings, Dish, MenuCategory } from "../types";
import { buildFeed } from "./qrFeedService";
import { logger } from "./logger";

// Tauri (optional) - save locally when storage is unavailable
let writeTextFile: typeof import("@tauri-apps/plugin-fs").writeTextFile;
let save: typeof import("@tauri-apps/plugin-dialog").save;

const initTauriModules = async () => {
    if (typeof window !== 'undefined' && (window as unknown as { __TAURI_INTERNALS__: unknown }).__TAURI_INTERNALS__) {
        try {
            const fs = await import("@tauri-apps/plugin-fs");
            const dialog = await import("@tauri-apps/plugin-dialog");
            writeTextFile = fs.writeTextFile;
            save = dialog.save;
            return true;
        } catch (e) {
            console.error("Failed to load Tauri modules for FeedPublisher", e);
            return false;
        }
    }
    return false;
};

export async function publishFeedHybrid(
  categories: MenuCategory[],
  dishes: Dish[],
  settings: SystemSettings
) {
  const feed = buildFeed(categories, dishes, settings);

  // Fallback: salvar localmente via Tauri
  try {
    if (!writeTextFile || !save) {
        await initTauriModules();
    }

    if (writeTextFile && save) {
      const suggested = "menu_feed.json";
      const target = await save({
        defaultPath: suggested,
        filters: [{ name: "JSON", extensions: ["json"] }],
      });
      if (target) {
        await writeTextFile(target, JSON.stringify(feed, null, 2));
        logger.info("Feed JSON salvo localmente", { path: target }, "FeedPublisher");
        return { success: true, path: target };
      }
    }
  } catch (e) {
    logger.error("Falha ao salvar feed JSON localmente", e, "FeedPublisher");
  }

  return { success: false, message: "Não foi possível publicar o feed JSON." };
}

