// App Store identifiers. The app already exists on the store (Apple ID below), so the
// review link points straight to its "Write a Review" page.

export const APP_STORE_ID = '6756898737';
export const REVIEW_URL = `https://apps.apple.com/app/id${APP_STORE_ID}?action=write-review`;

/**
 * Donations: consumable in-app purchases, created in App Store Connect with these product IDs.
 * They unlock nothing; they are a "thank you" to support the project. Prices come from the store;
 * `fallback` is shown only while the store has not answered (simulator, offline).
 */
export const TIPS = [
    { id: 'com.pierfrancesco.UniStats.tip.small', size: 'small', fallback: '4,99 €' },
    { id: 'com.pierfrancesco.UniStats.tip.medium', size: 'medium', fallback: '9,99 €' },
    { id: 'com.pierfrancesco.UniStats.tip.large', size: 'large', fallback: '19,99 €' },
] as const;

export type TipSize = (typeof TIPS)[number]['size'];
export const TIP_IDS: string[] = TIPS.map((t) => t.id);
