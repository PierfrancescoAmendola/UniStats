import { Minus, Plus, X } from 'lucide-react-native';
import React, { useEffect, useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition, useAnimatedStyle, useSharedValue, withDelay, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedNumber, enter, PressableScale } from '../../components/motion';
import { BackButton } from '../../components/ui';
import { computeAverage } from '../../engine/average';
import { baseFor } from '../../engine/graduation';
import { Exam } from '../../engine/types';
import { decimalSeparator, formatNumber, formatSigned } from '../../i18n';
import { sortByDateDesc, useApp } from '../../store/AppStore';
import { C, F, TIER_COLORS, tierOf, themed } from '../../theme/tokens';

interface Hypo {
    id: string;
    name: string;
    cfu: number;
    /** 18–30, 31 means 30 with honours. */
    grade: number;
}

const CFU_STEPS = [3, 6, 9, 12];

const ChartBar = ({ value, min, max, projected, i }: { value: number; min: number; max: number; projected: boolean; i: number }) => {
    const h = useSharedValue(0);
    const target = 10 + ((value - min) / Math.max(0.5, max - min)) * 96;
    useEffect(() => {
        h.value = withDelay(i * 35, withSpring(target, { damping: 16, stiffness: 140 }));
    }, [target, h, i]);
    const a = useAnimatedStyle(() => ({ height: h.value }));
    return <Animated.View style={[{ flex: 1, borderTopLeftRadius: 8, borderTopRightRadius: 8, borderBottomLeftRadius: 4, borderBottomRightRadius: 4, backgroundColor: projected ? C.sun : 'rgba(255,255,255,0.75)' }, a]} />;
};

export const WhatIfScreen = () => {
    const { t, lang, state, rule, avg } = useApp();
    const insets = useSafeAreaInsets();
    const sep = decimalSeparator(lang);
    const [hypos, setHypos] = useState<Hypo[]>(() => [
        { id: 'h1', name: t('hypoName', { n: 1 }), cfu: 9, grade: 28 },
        { id: 'h2', name: t('hypoName', { n: 2 }), cfu: 6, grade: 27 },
    ]);
    const upd = (id: string, patch: Partial<Hypo>) => setHypos((hs) => hs.map((h) => (h.id === id ? { ...h, ...patch } : h)));

    const asExams = (hs: Hypo[]): Exam[] =>
        hs.map((h) => ({ id: h.id, name: h.name, cfu: h.cfu, grade: Math.min(30, h.grade), lode: h.grade === 31, date: '9999-12-31', year: 99 }));

    const result = useMemo(() => computeAverage([...state.exams, ...asExams(hypos)], rule), [state.exams, hypos, rule]);

    // Average after each real exam (oldest first), then after each hypothetical one.
    const series = useMemo(() => {
        const chrono = sortByDateDesc(state.exams).reverse();
        const pts: { v: number; projected: boolean }[] = [];
        for (let i = 1; i <= chrono.length; i++) {
            const a = computeAverage(chrono.slice(0, i), rule).avg30;
            if (a !== null) pts.push({ v: a, projected: false });
        }
        const past = pts.slice(-8);
        const hx = asExams(hypos);
        for (let i = 1; i <= hx.length; i++) {
            const a = computeAverage([...state.exams, ...hx.slice(0, i)], rule).avg30;
            if (a !== null) past.push({ v: a, projected: true });
        }
        return past;
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.exams, hypos, rule]);

    const vals = series.map((s) => s.v);
    const min = Math.min(...vals, 30) - 0.3;
    const max = Math.max(...vals, 18) + 0.1;
    const now = avg.avg30;
    const after = result.avg30;
    const d = now !== null && after !== null ? after - now : null;

    return (
        <ScrollView style={{ backgroundColor: C.violet }} contentContainerStyle={{ flexGrow: 1 }} keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false}>
            <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 18, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <BackButton label={t('back')} onDark />
                    <Text style={styles.h1}>{t('whatIfTitle')}</Text>
                </View>
                <Animated.View entering={enter(0)} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.tile, { backgroundColor: 'rgba(255,255,255,0.14)' }]}>
                        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.violetSoft }}>{t('average')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <AnimatedNumber value={after ?? 0} decimals={2} sep={sep} duration={400} style={[styles.tileNum, { color: C.white }]} />
                            {d !== null && Math.abs(d) >= 0.005 && (
                                <View style={[styles.mini, { backgroundColor: d >= 0 ? C.mintPop : C.redPop }]}>
                                    <Text style={{ fontFamily: F.bold, fontSize: 12, color: d >= 0 ? C.greenDeep : C.redDeep }}>{formatSigned(lang, d, 2)}</Text>
                                </View>
                            )}
                        </View>
                        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.violetSoft }}>{t('nowValue', { v: now === null ? '—' : formatNumber(lang, now, 2) })}</Text>
                    </View>
                    <View style={[styles.tile, { backgroundColor: C.sun }]}>
                        <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.ink }}>{t('graduationBase')}</Text>
                        <AnimatedNumber value={after === null ? 0 : baseFor(after, rule)} decimals={1} sep={sep} duration={400} style={styles.tileNum} />
                        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.ink }}>{t('nowValue', { v: now === null ? '—' : formatNumber(lang, baseFor(now, rule), 1) })}</Text>
                    </View>
                </Animated.View>
                <Animated.View entering={enter(1)} style={styles.chart}>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 6, height: 110 }}>
                        {series.map((s, i) => (
                            <ChartBar key={i} i={i} value={s.v} min={min} max={max} projected={s.projected} />
                        ))}
                    </View>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <Text style={styles.axis}>{t('chartStart')}</Text>
                        <Text style={styles.axis}>{t('chartToday')}</Text>
                        <Text style={[styles.axis, { color: C.sun, fontFamily: F.bold }]}>{t('simulated')}</Text>
                    </View>
                </Animated.View>
            </View>

            <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                    <Text style={styles.section}>{t('hypothetical')}</Text>
                    <PressableScale
                        onPress={() => setHypos((hs) => [...hs, { id: `h${Date.now()}`, name: t('hypoName', { n: hs.length + 1 }), cfu: 6, grade: 27 }])}
                        style={{ padding: 6 }}
                    >
                        <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.violet }}>{t('addHypo')}</Text>
                    </PressableScale>
                </View>
                {hypos.map((h) => {
                    const tier = tierOf(Math.min(30, h.grade), h.grade === 31);
                    return (
                        <Animated.View key={h.id} entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} layout={LinearTransition.springify()} style={styles.row}>
                            <View style={{ flex: 1, gap: 2 }}>
                                <TextInput defaultValue={h.name} onEndEditing={(e) => upd(h.id, { name: e.nativeEvent.text })} style={styles.name} accessibilityLabel={t('examName')} />
                                <PressableScale onPress={() => upd(h.id, { cfu: CFU_STEPS[(CFU_STEPS.indexOf(h.cfu) + 1) % CFU_STEPS.length] })} style={{ alignSelf: 'flex-start' }}>
                                    <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.violet }}>{t('cfuN', { n: h.cfu })} ↻</Text>
                                </PressableScale>
                            </View>
                            <PressableScale accessibilityLabel={t('lowerGrade')} onPress={() => upd(h.id, { grade: Math.max(18, h.grade - 1) })} style={styles.step}>
                                <Minus size={18} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                            <View style={[styles.grade, { backgroundColor: TIER_COLORS[tier].bg }]}>
                                <Text style={{ fontFamily: F.display, fontSize: 18, color: TIER_COLORS[tier].fg }}>{h.grade === 31 ? '30L' : h.grade}</Text>
                            </View>
                            <PressableScale accessibilityLabel={t('higherGrade')} onPress={() => upd(h.id, { grade: Math.min(31, h.grade + 1) })} style={styles.step}>
                                <Plus size={18} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                            <PressableScale accessibilityLabel={t('remove')} hitSlop={8} onPress={() => setHypos((hs) => hs.filter((x) => x.id !== h.id))} style={{ padding: 2 }}>
                                <X size={16} strokeWidth={2.4} color={C.text4} />
                            </PressableScale>
                        </Animated.View>
                    );
                })}
                <Text style={{ fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.text2 }}>{t('hypoNote')}</Text>
            </View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    h1: { fontFamily: F.display, fontSize: 22, color: C.white, flex: 1 },
    tile: { flex: 1, borderRadius: 22, padding: 14, gap: 2 },
    tileNum: { fontSize: 30, minWidth: 70 },
    mini: { borderRadius: 999, paddingHorizontal: 7, paddingVertical: 3 },
    chart: { backgroundColor: 'rgba(255,255,255,0.1)', borderRadius: 22, paddingHorizontal: 14, paddingTop: 14, paddingBottom: 10, gap: 8 },
    axis: { fontFamily: F.body, fontSize: 12, color: C.violetSoft },
    sheet: { flex: 1, backgroundColor: C.fog, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, gap: 10 },
    section: { fontFamily: F.display, fontSize: 20, color: C.text },
    row: { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 14, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 8 },
    name: { fontFamily: F.bold, fontSize: 15, color: C.text, padding: 0 },
    step: { width: 40, height: 44, borderRadius: 14, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    grade: { width: 52, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
}));
