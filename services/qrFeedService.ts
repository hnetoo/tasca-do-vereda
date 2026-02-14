import { Dish, MenuCategory, SystemSettings } from "../types";
import { logger } from "./logger";

export const buildFeed = (categories: MenuCategory[], dishes: Dish[], settings: SystemSettings) => {
  try {
    const safeCats = categories.filter(c => c.id && c.name);
    const validCatIds = new Set(safeCats.map(c => c.id));
    const safeDishes = dishes.filter(d => d.id && d.name && validCatIds.has(d.categoryId));
    
    const feed = {
      restaurant: { name: settings.restaurantName, logo: settings.qrMenuLogo || settings.appLogoUrl || "" },
      categories: safeCats,
      dishes: safeDishes,
      updatedAt: new Date().toISOString()
    };

    logger.info('Menu feed built successfully', { 
      categoryCount: safeCats.length, 
      dishCount: safeDishes.length 
    }, 'QR_FEED');

    return feed;
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Error building menu feed', { error: errorMsg }, 'QR_FEED');
    throw error;
  }
};

export const downloadFeed = (feed: unknown, fileName = "menu_feed.json") => {
  try {
    const blob = new Blob([JSON.stringify(feed, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = fileName;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    logger.info('Menu feed downloaded', { fileName }, 'QR_FEED');
  } catch (error: unknown) {
    const errorMsg = error instanceof Error ? error.message : String(error);
    logger.error('Error downloading menu feed', { fileName, error: errorMsg }, 'QR_FEED');
  }
};

