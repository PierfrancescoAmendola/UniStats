import { BricolageGrotesque_600SemiBold, BricolageGrotesque_800ExtraBold } from '@expo-google-fonts/bricolage-grotesque';
import { Figtree_400Regular, Figtree_500Medium, Figtree_600SemiBold, Figtree_700Bold, useFonts } from '@expo-google-fonts/figtree';
import { DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { RootNavigator } from './src/navigation/RootNavigator';
import { AppProvider, useApp } from './src/store/AppStore';
import { C } from './src/theme/tokens';

SplashScreen.preventAutoHideAsync().catch(() => undefined);

const theme = { ...DefaultTheme, colors: { ...DefaultTheme.colors, background: C.fog, primary: C.violet, card: C.fog, text: C.ink } };

const Root = () => {
    const { state } = useApp();
    const [fontsLoaded] = useFonts({
        BricolageGrotesque_600SemiBold,
        BricolageGrotesque_800ExtraBold,
        Figtree_400Regular,
        Figtree_500Medium,
        Figtree_600SemiBold,
        Figtree_700Bold,
    });
    const ready = fontsLoaded && state.hydrated;
    useEffect(() => {
        if (ready) SplashScreen.hideAsync().catch(() => undefined);
    }, [ready]);
    if (!ready) return null;
    return (
        <NavigationContainer theme={theme}>
            <StatusBar style="dark" />
            <RootNavigator />
        </NavigationContainer>
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
