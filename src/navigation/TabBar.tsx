import { BottomTabBarProps } from '@react-navigation/bottom-tabs';
import { BookOpen, Calculator, House, Plus, User } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale, SPRING, tap } from '../components/motion';
import { useApp } from '../store/AppStore';
import { C, F, themed } from '../theme/tokens';

const ICONS = { Home: House, Transcript: BookOpen, Tools: Calculator, Profile: User } as const;
// Each area keeps its own colour: Home violet, Transcript white, Tools sun, Profile mint.
const ACTIVE = themed(() => ({
    Home: { bg: C.violet, fg: C.white },
    Transcript: { bg: C.white, fg: C.ink },
    Tools: { bg: C.sun, fg: C.ink },
    Profile: { bg: C.mint, fg: C.greenDeep },
}));
type TabName = keyof typeof ICONS;

const TabItem = ({ name, label, focused, onPress }: { name: TabName; label: string; focused: boolean; onPress: () => void }) => {
    const p = useSharedValue(focused ? 1 : 0);
    // Read outside the worklet: ACTIVE is a themed proxy and cannot cross to the UI thread.
    const activeBg = ACTIVE[name].bg;
    useEffect(() => {
        p.value = withSpring(focused ? 1 : 0, SPRING);
    }, [focused, p]);
    const pill = useAnimatedStyle(() => ({
        backgroundColor: interpolateColor(p.value, [0, 1], ['rgba(0,0,0,0)', activeBg]),
        paddingHorizontal: 13 + p.value * 3,
    }));
    const lbl = useAnimatedStyle(() => ({ opacity: p.value, maxWidth: p.value * 110, marginLeft: p.value * 6 }));
    const Icon = ICONS[name];
    const fg = focused ? ACTIVE[name].fg : C.text4;
    return (
        <Pressable accessibilityRole="tab" accessibilityLabel={label} accessibilityState={{ selected: focused }} onPress={onPress} hitSlop={4}>
            <Animated.View style={[styles.item, pill]}>
                <Icon size={22} strokeWidth={2} color={fg} />
                <Animated.View style={[{ overflow: 'hidden' }, lbl]}>
                    <Text numberOfLines={1} style={[styles.lbl, { color: fg }]}>
                        {label}
                    </Text>
                </Animated.View>
            </Animated.View>
        </Pressable>
    );
};

export const TabBar = ({ state, navigation }: BottomTabBarProps) => {
    const { t } = useApp();
    const insets = useSafeAreaInsets();
    const labels: Record<TabName, string> = { Home: t('tabHome'), Transcript: t('tabTranscript'), Tools: t('tabTools'), Profile: t('tabProfile') };
    const go = (i: number) => {
        const route = state.routes[i];
        const ev = navigation.emit({ type: 'tabPress', target: route.key, canPreventDefault: true });
        if (state.index !== i && !ev.defaultPrevented) {
            tap();
            navigation.navigate(route.name);
        }
    };
    const items = state.routes.map((r, i) => (
        <TabItem key={r.key} name={r.name as TabName} label={labels[r.name as TabName]} focused={state.index === i} onPress={() => go(i)} />
    ));
    return (
        <View pointerEvents="box-none" style={[styles.wrap, { bottom: Math.max(insets.bottom - 6, 14) }]}>
            <View style={styles.bar}>
                {items.slice(0, 2)}
                <PressableScale accessibilityLabel={t('addExam')} scaleTo={0.88} onPress={() => navigation.getParent()?.navigate('AddExam')} style={styles.fab}>
                    <Plus size={24} strokeWidth={2.6} color={C.ink} />
                </PressableScale>
                {items.slice(2)}
            </View>
        </View>
    );
};

const styles = themed(() => StyleSheet.create({
    wrap: { position: 'absolute', left: 16, right: 16 },
    bar: {
        height: 68, backgroundColor: C.ink, borderRadius: 24, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-around', paddingHorizontal: 6,
        shadowColor: '#14141F', shadowOpacity: 0.18, shadowRadius: 18, shadowOffset: { width: 0, height: 8 }, elevation: 8,
    },
    item: { height: 48, borderRadius: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'center' },
    lbl: { fontFamily: F.bold, fontSize: 14 },
    fab: { width: 52, height: 52, borderRadius: 18, backgroundColor: C.sun, alignItems: 'center', justifyContent: 'center' },
}));

/** Space to leave under scrolling content so the floating bar never covers it. */
export const TAB_SPACE = 120;
