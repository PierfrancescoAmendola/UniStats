import { CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { StatusBar } from 'expo-status-bar';
import { Trophy } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withDelay, withTiming } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedNumber, PressableScale, rise, celebrate } from '../components/motion';
import { PrimaryButton } from '../components/ui';
import { decimalSeparator, formatNumber, formatSigned } from '../i18n';
import { ScreenProps } from '../navigation/types';
import { useApp } from '../store/AppStore';
import { L, F, TIER_COLORS, tierOf } from '../theme/tokens';

const CONFETTI_COLORS = [L.sun, L.coral, L.mint, L.violetMuted, L.mintPop, L.sky];

/** One piece of confetti falling and spinning from the top of the screen. */
const Confetto = ({ i, w, h }: { i: number; w: number; h: number }) => {
    const p = useSharedValue(0);
    const x0 = ((i * 97) % 100) / 100;
    const drift = (((i * 37) % 21) - 10) * 6;
    const size = 8 + ((i * 13) % 10);
    useEffect(() => {
        p.value = withDelay((i % 12) * 70, withTiming(1, { duration: 1800 + ((i * 53) % 900), easing: Easing.out(Easing.quad) }));
    }, [i, p]);
    const a = useAnimatedStyle(() => ({
        opacity: 1 - Math.max(0, p.value - 0.75) * 4,
        transform: [{ translateY: -40 + p.value * h * 0.75 }, { translateX: x0 * w + drift * p.value }, { rotate: `${p.value * (i % 2 ? 540 : -480)}deg` }],
    }));
    return (
        <Animated.View
            pointerEvents="none"
            style={[{ position: 'absolute', left: 0, top: 0, width: size, height: i % 3 ? size : size * 2, borderRadius: i % 4 === 0 ? size : 3, backgroundColor: CONFETTI_COLORS[i % CONFETTI_COLORS.length] }, a]}
        />
    );
};

export const MilestoneScreen = ({ navigation, route }: ScreenProps<'Milestone'>) => {
    const { t, lang, state, avg, grad } = useApp();
    const insets = useSafeAreaInsets();
    const { width, height } = useWindowDimensions();
    const exam = state.exams.find((e) => e.id === route.params.examId);
    const before = route.params.before;

    useEffect(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }, []);

    const home = () => navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
    if (!exam) return null;
    const tier = tierOf(exam.grade, exam.lode);
    const d = before !== null && avg.avg30 !== null ? avg.avg30 - before : null;
    const progress = state.profile.totalCfu ? avg.totalCfu / state.profile.totalCfu : 0;

    return (
        <View style={[styles.root, { paddingTop: insets.top + 40, paddingBottom: insets.bottom + 16 }]}>
            <StatusBar style="light" />
            {Array.from({ length: 36 }, (_, i) => (
                <Confetto key={i} i={i} w={width} h={height} />
            ))}
            <Animated.View entering={celebrate()} style={[styles.badge, { backgroundColor: TIER_COLORS[tier].bg }]}>
                <Text style={[styles.badgeNum, { color: TIER_COLORS[tier].fg }]}>{exam.grade === null ? t('passFailShort') : exam.lode ? '30L' : exam.grade}</Text>
                <Text style={[styles.badgeCfu, { color: TIER_COLORS[tier].fg }]}>{t('cfuN', { n: exam.cfu })}</Text>
            </Animated.View>
            <Animated.View entering={rise(200)} style={{ gap: 8, alignItems: 'center' }}>
                <Text style={styles.h1}>{t('savedTitle', { name: exam.name })}</Text>
                <Text style={styles.body}>{exam.grade === null ? t('savedPassFail', { cfu: exam.cfu }) : t('savedBody')}</Text>
            </Animated.View>
            <Animated.View entering={rise(320)} style={{ flexDirection: 'row', gap: 10, alignSelf: 'stretch' }}>
                <View style={[styles.tile, { backgroundColor: L.violet }]}>
                    <Text style={{ fontFamily: F.body, fontSize: 13, color: L.violetSoft }}>{t('newAverage')}</Text>
                    <AnimatedNumber value={avg.avg30 ?? 0} decimals={2} sep={decimalSeparator(lang)} duration={1200} style={styles.tileNum} />
                    {d !== null && Math.abs(d) >= 0.005 && (
                        <Text style={{ fontFamily: F.bold, fontSize: 13, color: d >= 0 ? L.mintPop : L.redPop }}>
                            {d >= 0 ? '▲' : '▼'} {formatSigned(lang, d, 2)}
                        </Text>
                    )}
                </View>
                <View style={[styles.tile, { backgroundColor: L.sun }]}>
                    <Text style={{ fontFamily: F.semi, fontSize: 13, color: L.ink }}>{t('cfu')}</Text>
                    <Text style={[styles.tileNum, { color: L.ink }]}>
                        {avg.totalCfu}
                        <Text style={{ fontSize: 15 }}>/{state.profile.totalCfu}</Text>
                    </Text>
                    <Text style={{ fontFamily: F.bold, fontSize: 13, color: L.ink }}>{t('ofDegree', { p: Math.round(progress * 100) })}</Text>
                </View>
            </Animated.View>
            {avg.avg30 !== null && (
                <Animated.View entering={rise(420)} style={styles.mint}>
                    <Trophy size={28} strokeWidth={2.2} color={L.greenDeep} />
                    <Text style={{ flex: 1, fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: L.greenDeep }}>
                        {t('milestoneLine', { base: formatNumber(lang, grad.base, 1), t: grad.thesis, g: grad.final })}
                    </Text>
                </Animated.View>
            )}
            <View style={{ flex: 1 }} />
            <Animated.View entering={rise(520)} style={{ alignSelf: 'stretch', gap: 6 }}>
                <PrimaryButton label={t('backHome')} bg={L.white} fg={L.ink} onPress={home} />
                <PressableScale onPress={() => navigation.replace('AddExam')} style={{ padding: 12 }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 16, color: L.white, textAlign: 'center' }}>{t('addAnother')}</Text>
                </PressableScale>
            </Animated.View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: L.ink, alignItems: 'center', paddingHorizontal: 24, gap: 18, overflow: 'hidden' },
    badge: { width: 140, height: 140, borderRadius: 44, alignItems: 'center', justifyContent: 'center', transform: [{ rotate: '-6deg' }], marginTop: 20 },
    badgeNum: { fontFamily: F.display, fontSize: 64 },
    badgeCfu: { fontFamily: F.bold, fontSize: 14 },
    h1: { fontFamily: F.display, fontSize: 34, lineHeight: 36, color: L.white, textAlign: 'center' },
    body: { fontFamily: F.body, fontSize: 16, lineHeight: 23, color: L.onDark2, textAlign: 'center' },
    tile: { flex: 1, borderRadius: 22, padding: 14 },
    tileNum: { fontFamily: F.display, fontSize: 30, color: L.white },
    mint: { alignSelf: 'stretch', backgroundColor: L.mint, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
});
