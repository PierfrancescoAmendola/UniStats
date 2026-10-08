import { BookOpen, Coffee, Heart, Pizza } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withRepeat, withSequence, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { celebrate, enter, PressableScale } from '../components/motion';
import { BackButton } from '../components/ui';
import { TipSize } from '../config/store';
import { useApp } from '../store/AppStore';
import { Tip, useTips } from '../store/Tips';
import { C, F, L, themed } from '../theme/tokens';

const LOOK: Record<TipSize, { Icon: typeof Coffee; bg: string; fg: string }> = {
    small: { Icon: Coffee, bg: L.sun, fg: L.ink },
    medium: { Icon: Pizza, bg: L.coral, fg: L.white },
    large: { Icon: BookOpen, bg: L.mint, fg: L.white },
};

/** A heart that beats softly while the screen is open. */
const Beat = () => {
    const s = useSharedValue(1);
    useEffect(() => {
        s.value = withRepeat(withSequence(withTiming(1.12, { duration: 260 }), withTiming(1, { duration: 260 }), withTiming(1, { duration: 900 })), -1);
    }, [s]);
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
    return (
        <Animated.View style={[styles.heart, a]}>
            <Heart size={34} strokeWidth={2.2} color={L.white} fill={L.white} />
        </Animated.View>
    );
};

export const SupportScreen = () => {
    const { t } = useApp();
    const { tips, give } = useTips();
    const insets = useSafeAreaInsets();
    const [busy, setBusy] = useState<string | null>(null);
    const [thanked, setThanked] = useState(false);

    const onTip = async (tip: Tip) => {
        if (busy) return;
        if (!tip.available) {
            Alert.alert(t('supportTitle'), t('tipUnavailable'));
            return;
        }
        setBusy(tip.id);
        const result = await give(tip);
        setBusy(null);
        if (result === 'success') setThanked(true);
        else if (result === 'pending') Alert.alert(t('supportTitle'), t('tipPending'));
        else if (result === 'unavailable') Alert.alert(t('supportTitle'), t('tipUnavailable'));
        else if (result === 'error') Alert.alert(t('supportTitle'), t('tipError'));
        // 'cancelled': the person closed the App Store sheet, nothing to say.
    };

    return (
        <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 28 }]}>
            <BackButton label={t('back')} />
            <Animated.View entering={enter(0)} style={styles.hero}>
                <View style={styles.blob} />
                <Beat />
                <Text style={styles.h1}>{t('supportTitle')}</Text>
                <Text style={styles.lead}>{t('supportBody')}</Text>
            </Animated.View>

            {thanked ? (
                <Animated.View entering={celebrate()} style={styles.thanks}>
                    <Heart size={28} strokeWidth={2.2} color={C.coral} fill={C.coral} />
                    <View style={{ flex: 1, gap: 2 }}>
                        <Text style={styles.thanksTitle}>{t('tipThanksTitle')}</Text>
                        <Text style={styles.thanksBody}>{t('tipThanksBody')}</Text>
                    </View>
                </Animated.View>
            ) : null}

            {tips.map((tip, i) => {
                const look = LOOK[tip.size];
                const loading = busy === tip.id;
                return (
                    <Animated.View key={tip.id} entering={enter(1 + i)}>
                        <PressableScale
                            accessibilityLabel={`${t(`tip_${tip.size}` as const)}, ${tip.price}`}
                            accessibilityState={{ busy: loading, disabled: !!busy && !loading }}
                            onPress={() => onTip(tip)}
                            style={[styles.tip, !!busy && !loading && { opacity: 0.5 }]}
                        >
                            <View style={[styles.tipIcon, { backgroundColor: look.bg }]}>
                                <look.Icon size={26} strokeWidth={2.2} color={look.fg} />
                            </View>
                            <View style={{ flex: 1, gap: 2 }}>
                                <Text style={styles.tipTitle}>{t(`tip_${tip.size}` as const)}</Text>
                                <Text style={styles.tipSub}>{t(`tipSub_${tip.size}` as const)}</Text>
                            </View>
                            <View style={styles.price}>
                                {loading ? <ActivityIndicator color={C.white} /> : <Text style={styles.priceTxt}>{tip.price}</Text>}
                            </View>
                        </PressableScale>
                    </Animated.View>
                );
            })}

            <Animated.Text entering={FadeIn.delay(450)} style={styles.note}>
                {t('tipNote')}
            </Animated.Text>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    content: { paddingHorizontal: 20, gap: 12 },
    hero: { backgroundColor: C.violet, borderRadius: 28, padding: 22, gap: 8, overflow: 'hidden', marginTop: 4 },
    blob: { position: 'absolute', right: -60, top: -60, width: 200, height: 200, borderRadius: 100, backgroundColor: C.violetGlow },
    heart: { width: 64, height: 64, borderRadius: 20, backgroundColor: C.coral, alignItems: 'center', justifyContent: 'center', marginBottom: 6 },
    h1: { fontFamily: F.display, fontSize: 30, lineHeight: 33, color: C.white },
    lead: { fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.white, opacity: 0.92 },
    thanks: { backgroundColor: C.coralSoft, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
    thanksTitle: { fontFamily: F.bold, fontSize: 17, color: C.text },
    thanksBody: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.text2 },
    tip: { backgroundColor: C.surface, borderRadius: 24, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 14 },
    tipIcon: { width: 56, height: 56, borderRadius: 18, alignItems: 'center', justifyContent: 'center' },
    tipTitle: { fontFamily: F.bold, fontSize: 17, color: C.text },
    tipSub: { fontFamily: F.body, fontSize: 13, color: C.text3 },
    price: { minWidth: 84, height: 44, borderRadius: 14, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12 },
    priceTxt: { fontFamily: F.display, fontSize: 16, color: C.white },
    note: { fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.text3, textAlign: 'center', paddingHorizontal: 10, marginTop: 4 },
}));
