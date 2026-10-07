import { CommonActions } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ArrowRight } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { StyleSheet, Text, useWindowDimensions, View } from 'react-native';
import Animated, {
    Easing,
    interpolate,
    interpolateColor,
    SharedValue,
    useAnimatedScrollHandler,
    useAnimatedStyle,
    useSharedValue,
    withRepeat,
    withSequence,
    withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { PressableScale } from '../../components/motion';
import { BackButton } from '../../components/ui';
import { formatNumber } from '../../i18n';
import { ScreenProps } from '../../navigation/types';
import { useApp } from '../../store/AppStore';
import { demoExams } from '../../data/demo';
import { L, F } from '../../theme/tokens';

const BG = [L.violet, L.sun, L.coral];

/** Gentle endless bobbing for decorative shapes. */
const useFloat = (amp: number, ms: number, rotate = '0deg') => {
    const v = useSharedValue(0);
    useEffect(() => {
        v.value = withRepeat(withSequence(withTiming(1, { duration: ms, easing: Easing.inOut(Easing.sin) }), withTiming(0, { duration: ms, easing: Easing.inOut(Easing.sin) })), -1);
    }, [v, ms]);
    return useAnimatedStyle(() => ({ transform: [{ translateY: (v.value - 0.5) * amp }, { rotate }] }));
};

const Parallax = ({ x, i, w, speed, style, children }: { x: SharedValue<number>; i: number; w: number; speed: number; style: any; children?: React.ReactNode }) => {
    const a = useAnimatedStyle(() => ({ transform: [{ translateX: interpolate(x.value, [(i - 1) * w, i * w, (i + 1) * w], [w * speed, 0, -w * speed]) }] }));
    return <Animated.View style={[style, a]}>{children}</Animated.View>;
};

export const IntroScreen = ({ navigation }: ScreenProps<'Intro'>) => {
    const { t, lang, state, setProfile, addExams, setOnboarded } = useApp();
    // Development only: long-press the brand to load the demo transcript and skip onboarding.
    const seedDemo = () => {
        if (!__DEV__) return;
        const cohort = new Date().getMonth() >= 8 ? new Date().getFullYear() - 1 : new Date().getFullYear() - 2;
        setProfile({ name: 'Pier', course: 'Ing. Informatica', universityId: 'sapienza', level: 'L', years: 3, totalCfu: 180, cohort, ruleId: 'default-L', customRule: null, thesisPoints: 5, bonusInput: {} });
        if (!state.exams.length) addExams(demoExams(cohort));
        setOnboarded(true);
        navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs' }] }));
    };
    const { width: W } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const x = useSharedValue(0);
    const ref = useRef<Animated.ScrollView>(null);
    const [page, setPage] = useState(0);
    const pageRef = useRef(0);
    const n = (v: number, d = 2) => formatNumber(lang, v, d);

    const onScroll = useAnimatedScrollHandler((e) => {
        x.value = e.contentOffset.x;
    });
    const bg = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(x.value, [0, W, 2 * W], BG) }));
    const ctaStyle = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(x.value, [0, W], [L.sun, L.ink]) }));
    const ctaTxt = useAnimatedStyle(() => ({ color: interpolateColor(x.value, [0, W], [L.ink, L.white]) }));
    const skipTxt = useAnimatedStyle(() => ({ color: interpolateColor(x.value, [0, W], [L.white, L.ink]) }));
    const float1 = useFloat(14, 2600, '-8deg');
    const float2 = useFloat(10, 3100, '10deg');
    const float3 = useFloat(18, 3500);

    const goTo = (p: number) => {
        ref.current?.scrollTo({ x: p * W, animated: true });
        pageRef.current = p;
        setPage(p);
    };
    const next = () => (pageRef.current < 2 ? goTo(pageRef.current + 1) : navigation.navigate('Level'));
    const cta = [t('onb1Cta'), t('next'), t('onb3Cta')][page];

    return (
        <Animated.View style={[{ flex: 1 }, bg]}>
            <StatusBar style={page === 0 ? 'light' : 'dark'} animated />
            <View style={[styles.top, { paddingTop: insets.top + 10 }]}>
                {page > 0 ? <BackButton label={t('back')} onPress={() => goTo(page - 1)} tint="rgba(20,20,31,0.08)" /> : <Text style={styles.brand} onLongPress={seedDemo}>
                        {t('appName')}
                    </Text>}
                <PressableScale onPress={() => navigation.navigate('Level')} style={{ padding: 10 }}>
                    <Animated.Text style={[styles.skip, skipTxt]}>{t('skip')}</Animated.Text>
                </PressableScale>
            </View>

            <Animated.ScrollView
                ref={ref}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                onScroll={onScroll}
                scrollEventThrottle={16}
                onMomentumScrollEnd={(e) => {
                    const p = Math.round(e.nativeEvent.contentOffset.x / W);
                    pageRef.current = p;
                    setPage(p);
                }}
            >
                {/* Page 1: welcome */}
                <View style={[styles.page, { width: W }]}>
                    <View style={styles.visual}>
                        <Parallax x={x} i={0} w={W} speed={0.25} style={[styles.circle, { left: -90, top: 10, width: 320, height: 320, backgroundColor: L.sun }]} />
                        <Parallax x={x} i={0} w={W} speed={0.45} style={[styles.circle, { right: -70, top: 190, width: 220, height: 220, backgroundColor: L.coral }]} />
                        <Parallax x={x} i={0} w={W} speed={0.12} style={{ position: 'absolute', left: 40, top: 80 }}>
                            <Animated.View style={[styles.avgCard, float1]}>
                                <Text style={styles.cardKicker}>{t('average')}</Text>
                                <Text style={styles.cardNum}>{n(27.36)}</Text>
                                <View style={styles.mintChip}>
                                    <Text style={styles.mintChipTxt}>{t('onb1Chip', { v: n(0.26) })}</Text>
                                </View>
                            </Animated.View>
                        </Parallax>
                        <Parallax x={x} i={0} w={W} speed={0.35} style={{ position: 'absolute', right: 30, top: 40 }}>
                            <Animated.View style={[styles.lodeTile, float2]}>
                                <Text style={styles.lodeTxt}>30L</Text>
                            </Animated.View>
                        </Parallax>
                    </View>
                    <View style={[styles.copy, { paddingBottom: 150 + insets.bottom }]}>
                        <Text style={[styles.title, { color: L.white }]}>{t('onb1Title')}</Text>
                        <Text style={[styles.body, { color: L.white, opacity: 0.92 }]}>{t('onb1Body')}</Text>
                    </View>
                </View>

                {/* Page 2: weighted average */}
                <View style={[styles.page, { width: W }]}>
                    <View style={[styles.visual, { paddingHorizontal: 24, justifyContent: 'center' }]}>
                        <Parallax x={x} i={1} w={W} speed={0.2} style={styles.whiteCard}>
                            <Text style={styles.kicker}>{t('onb2Kicker')}</Text>
                            <Animated.View style={[{ flexDirection: 'row', gap: 14, height: 132, alignItems: 'flex-end' }, float3]}>
                                <View style={[styles.bar, { flex: 12, backgroundColor: L.violet }]}>
                                    <Text style={[styles.barNum, { color: L.white }]}>30</Text>
                                    <Text style={[styles.barCfu, { color: L.white }]}>{t('cfuN', { n: 12 })}</Text>
                                </View>
                                <View style={[styles.bar, { flex: 6, backgroundColor: L.coral }]}>
                                    <Text style={styles.barNum}>22</Text>
                                    <Text style={styles.barCfu}>{t('cfuN', { n: 6 })}</Text>
                                </View>
                            </Animated.View>
                            <View style={[styles.rowBox, { backgroundColor: L.fog }]}>
                                <Text style={{ fontFamily: F.body, fontSize: 15, color: L.text2 }}>{t('simpleAverage')}</Text>
                                <Text style={[styles.rowNum, { color: L.text3, textDecorationLine: 'line-through' }]}>{n(26)}</Text>
                            </View>
                            <View style={[styles.rowBox, { backgroundColor: L.ink }]}>
                                <Text style={{ fontFamily: F.semi, fontSize: 15, color: L.white }}>{t('weightedAverage')}</Text>
                                <Text style={[styles.rowNum, { color: L.sun }]}>{n(27.33)}</Text>
                            </View>
                        </Parallax>
                    </View>
                    <View style={[styles.copy, { paddingBottom: 150 + insets.bottom }]}>
                        <Text style={styles.title}>{t('onb2Title')}</Text>
                        <Text style={styles.body}>{t('onb2Body')}</Text>
                    </View>
                </View>

                {/* Page 3: final grade */}
                <View style={[styles.page, { width: W }]}>
                    <View style={[styles.visual, { paddingHorizontal: 24, justifyContent: 'center', gap: 10 }]}>
                        <Parallax x={x} i={2} w={W} speed={0.1} style={[styles.eqCard, { backgroundColor: L.white }]}>
                            <View>
                                <Text style={{ fontFamily: F.semi, fontSize: 13, color: L.text3 }}>{t('graduationBase')}</Text>
                                <Text style={{ fontFamily: F.body, fontSize: 13, color: L.text3 }}>{t('baseFormula')}</Text>
                            </View>
                            <Text style={styles.eqNum}>{n(100.3, 1)}</Text>
                        </Parallax>
                        <Parallax x={x} i={2} w={W} speed={0.25} style={{ flexDirection: 'row', gap: 10 }}>
                            <View style={[styles.eqCard, { flex: 1, backgroundColor: L.sun, flexDirection: 'column', alignItems: 'flex-start' }]}>
                                <Text style={{ fontFamily: F.semi, fontSize: 13 }}>{t('thesis')}</Text>
                                <Text style={styles.eqNum}>+5</Text>
                            </View>
                            <View style={[styles.eqCard, { flex: 1, backgroundColor: L.mint, flexDirection: 'column', alignItems: 'flex-start' }]}>
                                <Text style={{ fontFamily: F.semi, fontSize: 13, color: L.greenDeep }}>{t('onTimeShort')}</Text>
                                <Text style={[styles.eqNum, { color: L.greenDeep }]}>+1</Text>
                            </View>
                        </Parallax>
                        <Parallax x={x} i={2} w={W} speed={0.4} style={[styles.eqCard, { backgroundColor: L.ink }]}>
                            <Text style={{ fontFamily: F.semi, fontSize: 15, color: L.white }}>{t('predictedGrade')}</Text>
                            <Text style={[styles.eqNum, { fontSize: 44, color: L.sun }]}>
                                106<Text style={{ fontSize: 20, color: L.text4 }}>/110</Text>
                            </Text>
                        </Parallax>
                    </View>
                    <View style={[styles.copy, { paddingBottom: 150 + insets.bottom }]}>
                        <Text style={styles.title}>{t('onb3Title')}</Text>
                        <Text style={styles.body}>{t('onb3Body')}</Text>
                    </View>
                </View>
            </Animated.ScrollView>

            <View style={[styles.bottom, { paddingBottom: insets.bottom + 16 }]}>
                <View style={styles.dots}>
                    {[0, 1, 2].map((i) => (
                        <Dot key={i} i={i} x={x} w={W} />
                    ))}
                </View>
                <PressableScale onPress={next}>
                    <Animated.View style={[styles.cta, ctaStyle]}>
                        <Animated.Text style={[styles.ctaTxt, ctaTxt]}>{cta}</Animated.Text>
                        {page === 0 && <ArrowRight size={20} strokeWidth={2.4} color={L.ink} />}
                    </Animated.View>
                </PressableScale>
            </View>
        </Animated.View>
    );
};

const Dot = ({ i, x, w }: { i: number; x: SharedValue<number>; w: number }) => {
    const a = useAnimatedStyle(() => {
        const d = Math.abs(x.value / w - i);
        const k = Math.max(0, 1 - d);
        return {
            width: 8 + 20 * k,
            opacity: 0.35 + 0.65 * k,
            backgroundColor: interpolateColor(x.value, [0, w], [L.white, L.ink]),
        };
    });
    return <Animated.View style={[{ height: 8, borderRadius: 4 }, a]} />;
};

const styles = StyleSheet.create({
    top: { position: 'absolute', left: 24, right: 24, zIndex: 2, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brand: { fontFamily: F.display, fontSize: 22, color: L.white },
    skip: { fontFamily: F.semi, fontSize: 15 },
    page: { flex: 1 },
    visual: { flex: 1, marginTop: 120 },
    copy: { paddingHorizontal: 24, gap: 14 },
    title: { fontFamily: F.display, fontSize: 40, lineHeight: 41, color: L.ink },
    body: { fontFamily: F.body, fontSize: 17, lineHeight: 25, color: L.ink },
    circle: { position: 'absolute', borderRadius: 999 },
    avgCard: { width: 230, height: 230, borderRadius: 40, backgroundColor: L.white, alignItems: 'center', justifyContent: 'center', gap: 4 },
    cardKicker: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1.3, textTransform: 'uppercase', color: L.text3 },
    cardNum: { fontFamily: F.display, fontSize: 72, color: L.ink, includeFontPadding: false },
    mintChip: { backgroundColor: L.mintSoft, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 4 },
    mintChipTxt: { fontFamily: F.semi, fontSize: 14, color: L.greenText },
    lodeTile: { width: 104, height: 104, borderRadius: 28, backgroundColor: L.ink, alignItems: 'center', justifyContent: 'center' },
    lodeTxt: { fontFamily: F.display, fontSize: 34, color: L.sun },
    whiteCard: { backgroundColor: L.white, borderRadius: 28, padding: 22, gap: 14 },
    kicker: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: L.text3 },
    bar: { height: 132, borderRadius: 16, padding: 12, justifyContent: 'space-between' },
    barNum: { fontFamily: F.display, fontSize: 32, color: L.ink },
    barCfu: { fontFamily: F.semi, fontSize: 13, color: L.ink },
    rowBox: { borderRadius: 16, paddingHorizontal: 14, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    rowNum: { fontFamily: F.display, fontSize: 22 },
    eqCard: { borderRadius: 22, paddingHorizontal: 18, paddingVertical: 16, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    eqNum: { fontFamily: F.display, fontSize: 30, color: L.ink },
    bottom: { position: 'absolute', left: 24, right: 24, bottom: 0, gap: 18 },
    dots: { flexDirection: 'row', gap: 6 },
    cta: { height: 58, borderRadius: 20, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
    ctaTxt: { fontFamily: F.bold, fontSize: 17 },
});
