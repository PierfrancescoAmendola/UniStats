import { BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, useFonts } from '@expo-google-fonts/figtree';
import { DarkTheme, DefaultTheme, LinkingOptions, NavigationContainer, NavigationState } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import * as SystemUI from 'expo-system-ui';
import React, { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { Appearance, StyleSheet, useColorScheme } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import Animated, { FadeOut } from 'react-native-reanimated';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { LaunchAnimation } from './src/components/LaunchAnimation';
import { RootNavigator } from './src/navigation/RootNavigator';
import { RootParams } from './src/navigation/types';
import { AppProvider, useApp } from './src/store/AppStore';
import { applyScheme, C, PALETTES, Scheme } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

// unistats://profile, unistats://tools/grad, unistats://legal/privacy ...
const linking: LinkingOptions<RootParams> = {
    prefixes: ['unistats://'],
    config: {
        screens: {
            Intro: 'intro',
            Level: 'level',
            University: 'university',
            Rules: 'setup/rules',
            Ready: 'ready',
            Tabs: { screens: { Home: 'home', Transcript: 'transcript', Tools: 'tools', Profile: 'profile' } },
            AddExam: 'add',
            ExamDetail: 'exam/:examId',
            ImportPdf: 'import',
            GradSim: 'tools/grad',
            Needed: 'tools/needed',
            WhatIf: 'tools/whatif',
            HowCalc: 'tools/how',
            RulesEdit: 'rules',
            Legal: 'legal/:doc',
        },
    },
};

const navTheme = (s: Scheme) => {
    const base = s === 'dark' ? DarkTheme : DefaultTheme;
    return { ...base, colors: { ...base.colors, background: C.fog, primary: C.violet, card: C.fog, text: C.text } };
};

const Root = () => {
    const { state } = useApp();
    const system = useColorScheme();
    const [fontsLoaded] = useFonts({
        BricolageGrotesque_600SemiBold,
        BricolageGrotesque_800ExtraBold,
        Figtree_400Regular,
        Figtree_500Medium,
        Figtree_600SemiBold,
        Figtree_700Bold,
    });
    const ready = fontsLoaded && state.hydrated;
    const [launching, setLaunching] = useState(true);

    // Palette is swapped during render, before any child reads `C`.
    const scheme: Scheme = state.theme === 'system' ? (system === 'dark' ? 'dark' : 'light') : state.theme;
    applyScheme(scheme);

    // Native pickers and alerts follow the in-app choice.
    useEffect(() => {
        Appearance.setColorScheme(state.theme === 'system' ? null : state.theme);
    }, [state.theme]);
    useEffect(() => {
        SystemUI.setBackgroundColorAsync(PALETTES[scheme].fog).catch(() => undefined);
    }, [scheme]);

    // Switching theme remounts the navigation tree (static styles re-read the palette);
    // the navigation state is kept so the user stays on the same screen.
    const navState = useRef<NavigationState | undefined>(undefined);
    const [fade, setFade] = useState<{ color: string; id: number } | null>(null);
    const prev = useRef(scheme);
    useLayoutEffect(() => {
        if (prev.current !== scheme) {
            setFade({ color: PALETTES[prev.current].fog, id: Date.now() });
            prev.current = scheme;
        }
    }, [scheme]);
    useEffect(() => {
        if (!fade) return;
        const id = setTimeout(() => setFade(null), 30);
        return () => clearTimeout(id);
    }, [fade]);

    useEffect(() => {
        if (ready) SplashScreen.hideAsync().catch(() => undefined);
    }, [ready]);
    if (!ready) return null;
    return (
        <>
            <NavigationContainer
                key={scheme}
                theme={navTheme(scheme)}
                linking={linking}
                initialState={navState.current}
                onStateChange={(s) => {
                    navState.current = s;
                }}
            >
                <StatusBar style={launching || scheme === 'dark' ? 'light' : 'dark'} />
                <RootNavigator />
            </NavigationContainer>
            {fade && <Animated.View key={fade.id} pointerEvents="none" exiting={FadeOut.duration(380)} style={[StyleSheet.absoluteFill, { backgroundColor: fade.color }]} />}
            {launching && <LaunchAnimation onDone={() => setLaunching(false)} />}
        </>
    );
};

export default function App() {
    return (
        <GestureHandlerRootView style={{ flex: 1 }}>
            <SafeAreaProvider>
                <AppProvider>
                    <Root />
                </AppProvider>
            </SafeAreaProvider>
        </GestureHandlerRootView>
    );
}
