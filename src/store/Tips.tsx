import {
    ErrorCode,
    fetchProducts,
    finishTransaction,
    initConnection,
    Product,
    Purchase,
    purchaseErrorListener,
    purchaseUpdatedListener,
    requestPurchase,
} from 'expo-iap';
import React, { createContext, ReactNode, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import { TIP_IDS, TIPS, TipSize } from '../config/store';

// Donations through StoreKit / Play Billing (expo-iap), no third-party service.
// Tips are consumables: each purchase is finished as consumed, so the same tip can be given again.

export interface Tip {
    id: string;
    size: TipSize;
    /** Price localized by the store, or the fallback until it answers. */
    price: string;
    /** False until the store returned the product: buying is then disabled. */
    available: boolean;
}

export type TipResult = 'success' | 'pending' | 'cancelled' | 'unavailable' | 'error';

interface TipsCtx {
    tips: Tip[];
    storeReady: boolean;
    /** Resolves when StoreKit reports back (or at once when the store is unavailable). */
    give: (tip: Tip) => Promise<TipResult>;
}

const Ctx = createContext<TipsCtx | null>(null);

const FALLBACK: Tip[] = TIPS.map((t) => ({ id: t.id, size: t.size, price: t.fallback, available: false }));

export const TipsProvider = ({ children, onThanks }: { children: ReactNode; onThanks?: () => void }) => {
    const [tips, setTips] = useState<Tip[]>(FALLBACK);
    const [storeReady, setStoreReady] = useState(false);
    const connected = useRef(false);
    const pending = useRef<{ id: string; resolve: (r: TipResult) => void } | null>(null);
    const thanks = useRef(onThanks);
    thanks.current = onThanks;

    useEffect(() => {
        let subs: { remove: () => void }[] = [];
        try {
            subs = [
                purchaseUpdatedListener(async (purchase: Purchase) => {
                    if (!TIP_IDS.includes(purchase.productId)) return;
                    if (purchase.purchaseState === 'pending') {
                        // Ask to Buy / deferred payment: free the screen now, StoreKit finishes it later.
                        if (pending.current?.id === purchase.productId) {
                            pending.current.resolve('pending');
                            pending.current = null;
                        }
                        return;
                    }
                    try {
                        await finishTransaction({ purchase, isConsumable: true });
                    } catch (e) {
                        console.warn('finishTransaction', e);
                    }
                    thanks.current?.();
                    if (pending.current?.id === purchase.productId) {
                        pending.current.resolve('success');
                        pending.current = null;
                    }
                }),
                purchaseErrorListener((error) => {
                    if (!pending.current) return;
                    pending.current.resolve(error.code === ErrorCode.UserCancelled ? 'cancelled' : 'error');
                    pending.current = null;
                }),
            ];
        } catch (e) {
            // No StoreKit module (Expo Go, tests without mocks): tips stay unavailable.
            console.warn('Tips listeners', e);
            return;
        }
        (async () => {
            try {
                connected.current = await initConnection();
                if (!connected.current) return;
                const products = ((await fetchProducts({ skus: TIP_IDS, type: 'in-app' })) ?? []) as Product[];
                const byId = new Map(products.map((p) => [p.id, p]));
                const loaded = FALLBACK.map((t) => {
                    const p = byId.get(t.id);
                    return p ? { ...t, price: p.displayPrice, available: true } : t;
                });
                setTips(loaded);
                setStoreReady(loaded.some((t) => t.available));
            } catch (e) {
                console.warn('Tips init', e);
            }
        })();
        return () => subs.forEach((s) => s.remove());
    }, []);

    const give = useCallback(async (tip: Tip): Promise<TipResult> => {
        if (!connected.current || !tip.available) return 'unavailable';
        // A previous request that never reported back must not block a new one.
        if (pending.current) {
            pending.current.resolve('cancelled');
            pending.current = null;
        }
        const result = new Promise<TipResult>((resolve) => {
            pending.current = { id: tip.id, resolve };
        });
        try {
            await requestPurchase({ type: 'in-app', request: { apple: { sku: tip.id }, google: { skus: [tip.id] } } });
        } catch (e: any) {
            pending.current = null;
            if (e?.code === ErrorCode.UserCancelled) return 'cancelled';
            console.warn('tip purchase', e);
            return 'error';
        }
        return result;
    }, []);

    const value = useMemo(() => ({ tips, storeReady, give }), [tips, storeReady, give]);
    return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};

export const useTips = () => {
    const c = useContext(Ctx);
    if (!c) throw new Error('useTips outside TipsProvider');
    return c;
};
