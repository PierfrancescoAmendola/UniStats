import React from 'react';
import { act, renderHook, waitFor } from '@testing-library/react-native';
import { TIPS } from '../config/store';
import { TipsProvider, useTips } from '../store/Tips';

// A scriptable StoreKit: each test decides what the store returns and how a purchase ends.
const mockStore = {
    connected: true,
    products: TIPS.map((t, i) => ({ id: t.id, displayPrice: ['4,99 €', '9,99 €', '19,99 €'][i] })) as { id: string; displayPrice: string }[],
    onUpdate: null as null | ((p: any) => Promise<void> | void),
    onError: null as null | ((e: any) => void),
    throwOnListen: false,
    throwOnInit: false,
    request: 'ok' as 'ok' | 'throwCancel' | 'throwOther',
};

jest.mock('expo-iap', () => ({
    ErrorCode: { UserCancelled: 'user-cancelled' },
    initConnection: jest.fn(async () => {
        if (mockStore.throwOnInit) throw new Error('no store');
        return mockStore.connected;
    }),
    fetchProducts: jest.fn(async ({ skus }: { skus: string[] }) => mockStore.products.filter((p) => skus.includes(p.id))),
    finishTransaction: jest.fn(async () => undefined),
    requestPurchase: jest.fn(async () => {
        if (mockStore.request === 'throwCancel') throw { code: 'user-cancelled' };
        if (mockStore.request === 'throwOther') throw new Error('network');
    }),
    purchaseUpdatedListener: jest.fn((cb: any) => {
        if (mockStore.throwOnListen) throw new Error('no native module');
        mockStore.onUpdate = cb;
        return { remove: jest.fn() };
    }),
    purchaseErrorListener: jest.fn((cb: any) => {
        mockStore.onError = cb;
        return { remove: jest.fn() };
    }),
}));

const iap = jest.requireMock('expo-iap');
const thanks = jest.fn();

const setup = () => renderHook(useTips, { wrapper: ({ children }) => <TipsProvider onThanks={thanks}>{children}</TipsProvider> });

beforeEach(() => {
    Object.assign(mockStore, {
        connected: true,
        products: TIPS.map((t, i) => ({ id: t.id, displayPrice: ['4,99 €', '9,99 €', '19,99 €'][i] })),
        onUpdate: null,
        onError: null,
        throwOnListen: false,
        throwOnInit: false,
        request: 'ok',
    });
    jest.clearAllMocks();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
});

describe('loading the tips', () => {
    it('shows the store prices in the fixed order 5, 10, 20', async () => {
        const { result } = await setup();
        await waitFor(() => expect(result.current.storeReady).toBe(true));
        expect(result.current.tips.map((t) => [t.size, t.price, t.available])).toEqual([
            ['small', '4,99 €', true],
            ['medium', '9,99 €', true],
            ['large', '19,99 €', true],
        ]);
        expect(iap.fetchProducts).toHaveBeenCalledWith({ skus: TIPS.map((t) => t.id), type: 'in-app' });
    });

    it('keeps the fallback prices, unavailable, when the store has no connection', async () => {
        mockStore.connected = false;
        const { result } = await setup();
        await waitFor(() => expect(iap.initConnection).toHaveBeenCalled());
        expect(result.current.storeReady).toBe(false);
        expect(result.current.tips.every((t) => !t.available)).toBe(true);
        expect(await result.current.give(result.current.tips[0])).toBe('unavailable');
        expect(iap.requestPurchase).not.toHaveBeenCalled();
    });

    it('marks only the products the store returned (one missing in App Store Connect)', async () => {
        mockStore.products = mockStore.products.slice(0, 2);
        const { result } = await setup();
        await waitFor(() => expect(result.current.storeReady).toBe(true));
        expect(result.current.tips.map((t) => t.available)).toEqual([true, true, false]);
        expect(result.current.tips[2].price).toBe(TIPS[2].fallback);
    });

    it('survives a missing StoreKit module and a failing init', async () => {
        mockStore.throwOnListen = true;
        const a = await setup();
        expect(a.result.current.tips).toHaveLength(3);
        expect(await a.result.current.give(a.result.current.tips[0])).toBe('unavailable');
        await a.unmount();
        mockStore.throwOnListen = false;
        mockStore.throwOnInit = true;
        const b = await setup();
        await waitFor(() => expect(iap.initConnection).toHaveBeenCalled());
        expect(b.result.current.storeReady).toBe(false);
        await b.unmount();
    });
});

describe('giving a tip', () => {
    const ready = async () => {
        const hook = await setup();
        await waitFor(() => expect(hook.result.current.storeReady).toBe(true));
        return hook;
    };

    it.each([0, 1, 2])('tip %i: success finishes it as consumable and says thanks', async (i) => {
        const { result } = await ready();
        const tip = result.current.tips[i];
        let res: string | undefined;
        await act(async () => {
            const p = result.current.give(tip);
            await Promise.resolve();
            await mockStore.onUpdate!({ productId: tip.id, purchaseState: 'purchased' });
            res = await p;
        });
        expect(res).toBe('success');
        expect(iap.requestPurchase).toHaveBeenCalledWith({ type: 'in-app', request: { apple: { sku: tip.id }, google: { skus: [tip.id] } } });
        expect(iap.finishTransaction).toHaveBeenCalledWith({ purchase: { productId: tip.id, purchaseState: 'purchased' }, isConsumable: true });
        expect(thanks).toHaveBeenCalledTimes(1);
    });

    it('the same tip can be given twice (consumable)', async () => {
        const { result } = await ready();
        const tip = result.current.tips[0];
        for (let k = 0; k < 2; k++) {
            await act(async () => {
                const p = result.current.give(tip);
                await Promise.resolve();
                await mockStore.onUpdate!({ productId: tip.id, purchaseState: 'purchased' });
                expect(await p).toBe('success');
            });
        }
        expect(thanks).toHaveBeenCalledTimes(2);
    });

    it('cancel thrown by the sheet', async () => {
        mockStore.request = 'throwCancel';
        const { result } = await ready();
        expect(await result.current.give(result.current.tips[1])).toBe('cancelled');
        expect(thanks).not.toHaveBeenCalled();
    });

    it('cancel reported by the error listener', async () => {
        const { result } = await ready();
        await act(async () => {
            const p = result.current.give(result.current.tips[1]);
            await Promise.resolve();
            mockStore.onError!({ code: 'user-cancelled' });
            expect(await p).toBe('cancelled');
        });
    });

    it('other store errors', async () => {
        mockStore.request = 'throwOther';
        const { result } = await ready();
        expect(await result.current.give(result.current.tips[2])).toBe('error');
        mockStore.request = 'ok';
        await act(async () => {
            const p = result.current.give(result.current.tips[2]);
            await Promise.resolve();
            mockStore.onError!({ code: 'network-error' });
            expect(await p).toBe('error');
        });
        expect(thanks).not.toHaveBeenCalled();
    });

    it('Ask to Buy: pending now, thanks later when approved', async () => {
        const { result } = await ready();
        const tip = result.current.tips[0];
        await act(async () => {
            const p = result.current.give(tip);
            await Promise.resolve();
            await mockStore.onUpdate!({ productId: tip.id, purchaseState: 'pending' });
            expect(await p).toBe('pending');
        });
        expect(iap.finishTransaction).not.toHaveBeenCalled();
        await act(async () => {
            await mockStore.onUpdate!({ productId: tip.id, purchaseState: 'purchased' });
        });
        expect(iap.finishTransaction).toHaveBeenCalledTimes(1);
        expect(thanks).toHaveBeenCalledTimes(1);
    });

    it('ignores purchases of other products', async () => {
        await ready();
        await act(async () => {
            await mockStore.onUpdate!({ productId: 'com.other.app.product', purchaseState: 'purchased' });
        });
        expect(iap.finishTransaction).not.toHaveBeenCalled();
        expect(thanks).not.toHaveBeenCalled();
    });

    it('a stuck request does not block a new one', async () => {
        const { result } = await ready();
        const [a, b] = result.current.tips;
        let first: Promise<string> | undefined;
        await act(async () => {
            first = result.current.give(a); // StoreKit never answers this one
            await Promise.resolve();
        });
        await act(async () => {
            const second = result.current.give(b);
            await Promise.resolve();
            await mockStore.onUpdate!({ productId: b.id, purchaseState: 'purchased' });
            expect(await second).toBe('success');
        });
        expect(await first).toBe('cancelled');
    });

    it('a finishTransaction failure still thanks (the money was taken)', async () => {
        iap.finishTransaction.mockRejectedValueOnce(new Error('finish failed'));
        const { result } = await ready();
        const tip = result.current.tips[0];
        await act(async () => {
            const p = result.current.give(tip);
            await Promise.resolve();
            await mockStore.onUpdate!({ productId: tip.id, purchaseState: 'purchased' });
            expect(await p).toBe('success');
        });
        expect(thanks).toHaveBeenCalledTimes(1);
    });
});
