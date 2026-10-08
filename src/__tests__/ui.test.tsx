// Screen-level tests: keyboard, pop-ups, donations, profile rows.
import AsyncStorage from '@react-native-async-storage/async-storage';
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react-native';
import React from 'react';
import { Alert, Keyboard, Linking, Text, View } from 'react-native';
import { PressableScale, Segmented, Toggle } from '../components/motion';
import { NudgeHost, resetNudgeSession } from '../components/NudgeHost';
import { dismissKeyboardOnTap } from '../components/ui';
import { REVIEW_URL, TIPS } from '../config/store';
import { SupportScreen } from '../screens/SupportScreen';
import { AppProvider, useApp } from '../store/AppStore';
import { NUDGE } from '../store/nudges';
import { TipsProvider } from '../store/Tips';

const mockStore = { connected: true, onUpdate: null as null | ((p: any) => Promise<void>) };
jest.mock('expo-iap', () => ({
    ErrorCode: { UserCancelled: 'user-cancelled' },
    initConnection: jest.fn(async () => mockStore.connected),
    fetchProducts: jest.fn(async ({ skus }: { skus: string[] }) => skus.map((id, i) => ({ id, displayPrice: ['4,99 €', '9,99 €', '19,99 €'][i] }))),
    finishTransaction: jest.fn(async () => undefined),
    requestPurchase: jest.fn(async () => undefined),
    purchaseUpdatedListener: jest.fn((cb: any) => {
        mockStore.onUpdate = cb;
        return { remove: jest.fn() };
    }),
    purchaseErrorListener: jest.fn(() => ({ remove: jest.fn() })),
}));
jest.mock('react-native-safe-area-context', () => {
    const insets = { top: 0, bottom: 0, left: 0, right: 0 };
    return { useSafeAreaInsets: () => insets, SafeAreaProvider: ({ children }: any) => children };
});
jest.mock('@react-navigation/native', () => ({ ...jest.requireActual('@react-navigation/native'), useNavigation: () => ({ goBack: jest.fn(), navigate: jest.fn() }) }));

const DAY = 24 * 60 * 60 * 1000;

beforeEach(async () => {
    jest.clearAllMocks();
    mockStore.connected = true;
    resetNudgeSession();
    await AsyncStorage.clear();
    jest.spyOn(console, 'warn').mockImplementation(() => undefined);
    jest.spyOn(Linking, 'openURL').mockResolvedValue(true);
});
afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
});

describe('keyboard', () => {
    it('every button closes the keyboard', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        const press = jest.fn();
        await render(
            <PressableScale onPress={press}>
                <Text>Save</Text>
            </PressableScale>,
        );
        await fireEvent.press(screen.getByText('Save'));
        expect(press).toHaveBeenCalledTimes(1);
        expect(dismiss).toHaveBeenCalledTimes(1);
    });

    it('keepKeyboard leaves it open', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        await render(
            <PressableScale keepKeyboard onPress={() => undefined}>
                <Text>Grade</Text>
            </PressableScale>,
        );
        await fireEvent.press(screen.getByText('Grade'));
        expect(dismiss).not.toHaveBeenCalled();
    });

    it('segmented controls and switches close it too', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        const change = jest.fn();
        await render(
            <View>
                <Segmented options={[{ value: 'a', label: 'Con voto' }, { value: 'b', label: 'Idoneità' }]} value="a" onChange={change} />
                <Toggle value={false} onChange={change} label="Media aritmetica" />
            </View>,
        );
        await fireEvent.press(screen.getByText('Idoneità'));
        await fireEvent.press(screen.getByLabelText('Media aritmetica'));
        expect(change).toHaveBeenCalledWith('b');
        expect(change).toHaveBeenCalledWith(true);
        expect(dismiss).toHaveBeenCalledTimes(2);
    });

    it('a tap on empty space of a screen closes it', async () => {
        const dismiss = jest.spyOn(Keyboard, 'dismiss');
        await render(<View testID="root" {...dismissKeyboardOnTap} />);
        const root = screen.getByTestId('root');
        expect(root.props.onStartShouldSetResponder()).toBe(true);
        root.props.onResponderRelease();
        expect(dismiss).toHaveBeenCalledTimes(1);
    });
});

/** Writes a saved state, then mounts the app store around `ui`. */
const withSaved = async (saved: object, ui: React.ReactElement) => {
    await AsyncStorage.setItem('unistats.v1', JSON.stringify(saved));
    let ctx: ReturnType<typeof useApp> | null = null;
    const Probe = () => {
        ctx = useApp();
        return null;
    };
    await render(
        <AppProvider>
            <TipsProvider>
                <Probe />
                {ui}
            </TipsProvider>
        </AppProvider>,
    );
    await waitFor(() => expect(ctx!.state.hydrated).toBe(true));
    return () => ctx!;
};

const exams = (n: number) => Array.from({ length: n }, (_, i) => ({ id: `e${i}`, name: `E${i}`, grade: 27, lode: false, cfu: 6, date: '2026-01-01', year: 1 }));
const regular = (over: object = {}) => ({
    onboarded: true,
    language: 'it',
    exams: exams(5),
    // launches is one less: hydration counts this launch.
    nudges: { firstOpen: Date.now() - 10 * DAY, launches: NUDGE.minLaunches, lastShown: 0, reviewDone: false, tipDone: false, reviewLater: 0, tipLater: 0, ...over },
});

describe('pop-ups', () => {
    const show = async (saved: object, random = 0) => {
        jest.spyOn(Math, 'random').mockReturnValue(random);
        jest.useFakeTimers();
        const onSupport = jest.fn();
        const get = await withSaved(saved, <NudgeHost active onSupport={onSupport} />);
        await act(async () => {
            jest.advanceTimersByTime(2000);
        });
        return { get, onSupport };
    };

    it('a regular user sees the review card; "Scrivi una recensione" opens the App Store review page', async () => {
        const { get } = await show(regular());
        expect(screen.getByText('Ti piace UniStats?')).toBeTruthy();
        await fireEvent.press(screen.getByText('Scrivi una recensione'));
        expect(Linking.openURL).toHaveBeenCalledWith(REVIEW_URL);
        expect(get().state.nudges.reviewDone).toBe(true);
        expect(screen.queryByText('Ti piace UniStats?')).toBeNull();
    });

    it('"Non ora", the X and the backdrop all count as later', async () => {
        for (const target of ['Non ora', 'Chiudi', 'backdrop'] as const) {
            resetNudgeSession();
            const { get } = await show(regular());
            if (target === 'Non ora') await fireEvent.press(screen.getByText('Non ora'));
            else if (target === 'Chiudi') await fireEvent.press(screen.getByLabelText('Chiudi'));
            // The backdrop is hidden from VoiceOver (the card is modal), but a finger can still tap it.
            else await fireEvent.press(screen.getAllByLabelText('Non ora', { includeHiddenElements: true })[0]);
            expect(get().state.nudges.reviewLater).toBe(1);
            expect(get().state.nudges.reviewDone).toBe(false);
            expect(screen.queryByText('Ti piace UniStats?')).toBeNull();
            screen.unmount();
            jest.useRealTimers();
        }
    });

    it('after the review, the donation card leads to the Support screen', async () => {
        const { get, onSupport } = await show(regular({ reviewDone: true }));
        expect(screen.getByText('Aiuta UniStats a crescere')).toBeTruthy();
        await fireEvent.press(screen.getByText('Supporta il progetto'));
        expect(onSupport).toHaveBeenCalledTimes(1);
        // Done only when someone actually donates.
        expect(get().state.nudges).toMatchObject({ tipDone: false, tipLater: 1 });
    });

    it('nothing for new users, unlucky coin flips, inactive Home or before onboarding', async () => {
        for (const [saved, random, active] of [
            [regular({ launches: 1 }), 0, true],
            [{ ...regular(), exams: exams(1) }, 0, true],
            [regular({ firstOpen: Date.now() }), 0, true],
            [regular(), 0.99, true],
            [regular(), 0, false],
            [{ ...regular(), onboarded: false }, 0, true],
            [regular({ reviewDone: true, tipDone: true }), 0, true],
        ] as const) {
            resetNudgeSession();
            jest.spyOn(Math, 'random').mockReturnValue(random);
            jest.useFakeTimers();
            await withSaved(saved, <NudgeHost active={active} onSupport={jest.fn()} />);
            await act(async () => {
                jest.advanceTimersByTime(3000);
            });
            expect(screen.queryByTestId('nudge')).toBeNull();
            screen.unmount();
            jest.useRealTimers();
        }
    });

    it('only once per session, even if Home is shown again', async () => {
        await show(regular());
        await fireEvent.press(screen.getByText('Non ora'));
        screen.unmount();
        jest.useFakeTimers();
        await withSaved(regular({ lastShown: 0 }), <NudgeHost active onSupport={jest.fn()} />);
        await act(async () => {
            jest.advanceTimersByTime(3000);
        });
        expect(screen.queryByTestId('nudge')).toBeNull();
    });
});

describe('Support screen', () => {
    it('shows the three tips with store prices and thanks after a purchase', async () => {
        const get = await withSaved({ onboarded: true, language: 'it' }, <SupportScreen />);
        await waitFor(() => expect(screen.getByText('9,99 €')).toBeTruthy());
        expect(screen.getByText('4,99 €')).toBeTruthy();
        expect(screen.getByText('19,99 €')).toBeTruthy();
        expect(screen.getByText('Un caffè')).toBeTruthy();
        expect(screen.getByText('Una pizza')).toBeTruthy();
        expect(screen.getByText('Un libro di testo')).toBeTruthy();
        await fireEvent.press(screen.getByText('Una pizza'));
        const iap = jest.requireMock('expo-iap');
        expect(iap.requestPurchase).toHaveBeenCalledWith({ type: 'in-app', request: { apple: { sku: TIPS[1].id }, google: { skus: [TIPS[1].id] } } });
        await act(async () => {
            await mockStore.onUpdate!({ productId: TIPS[1].id, purchaseState: 'purchased' });
        });
        await waitFor(() => expect(screen.getByText('Grazie di cuore!')).toBeTruthy());
        expect(get().state.nudges.tipDone).toBe(false); // this test's provider has no onThanks
    });

    it('explains when donations are unavailable', async () => {
        mockStore.connected = false;
        const alert = jest.spyOn(Alert, 'alert').mockImplementation(() => undefined);
        await withSaved({ onboarded: true, language: 'it' }, <SupportScreen />);
        await fireEvent.press(screen.getByText('Un caffè'));
        expect(alert).toHaveBeenCalledWith('Supporta UniStats', expect.stringContaining('non sono disponibili'));
        const iap = jest.requireMock('expo-iap');
        expect(iap.requestPurchase).not.toHaveBeenCalled();
    });
});
