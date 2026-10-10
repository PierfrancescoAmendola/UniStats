import { Minus, Plus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedNumber, enter, PressableScale, LAYOUT } from '../../components/motion';
import { BackButton } from '../../components/ui';
import { neededAverage } from '../../engine/needed';
import { decimalSeparator, formatNumber } from '../../i18n';
import { useApp } from '../../store/AppStore';
import { C, F, themed } from '../../theme/tokens';

const MIN_TARGET = 18;
const MAX_TARGET = 30;
const TARGETS = Array.from({ length: (MAX_TARGET - MIN_TARGET) * 2 + 1 }, (_, i) => MIN_TARGET + i / 2);
const CHIP_W = 62;
const CHIP_GAP = 8;

const TONES = themed(() => ({
    ok: { bg: C.mintSoft, fg: C.greenText },
    hard: { bg: C.sunSoft, fg: C.amberText },
    bad: { bg: C.coralSoft, fg: C.redText },
}));

export const NeededScreen = () => {
    const { t, lang, state, rule, avg, setProfile } = useApp();
    const insets = useSafeAreaInsets();
    const p = state.profile;
    const remaining = Math.max(1, p.totalCfu - avg.totalCfu);
    const [cfu, setCfu] = useState(30);
    const target = Math.min(MAX_TARGET, Math.max(MIN_TARGET, p.targetAverage));
    const setTarget = (v: number) => setProfile({ targetAverage: Math.min(MAX_TARGET, Math.max(MIN_TARGET, Math.round(v * 10) / 10)) });
    // Every target from 18 to 30, half a point apart, in a strip that opens on the chosen one.
    const strip = useRef<ScrollView>(null);
    const [stripW, setStripW] = useState(0);
    const centre = (w: number) => {
        const i = TARGETS.findIndex((v) => v >= target - 1e-9);
        strip.current?.scrollTo({ x: Math.max(0, i * (CHIP_W + CHIP_GAP) - (w - CHIP_W) / 2), animated: false });
    };
    const spans = [12, 30, 60, remaining].filter((v, i, a) => a.indexOf(v) === i && v <= remaining);

    const r = avg.gradedCfu ? neededAverage(avg.sum, avg.gradedCfu, target, cfu, rule.average.lodeValue) : null;
    const tone = !r ? 'hard' : r.verdict === 'impossible' ? 'bad' : r.verdict === 'guaranteed' || (r.verdict === 'reachable' && r.value < 28.5) ? 'ok' : 'hard';
    const verdictKey = !r
        ? null
        : r.verdict === 'reachable'
          ? r.value >= 28.5
              ? 'verdict_hard'
              : 'verdict_reachable'
          : (`verdict_${r.verdict}` as const);
    const shown = r ? Math.min(30, Math.max(18, r.value)) : 0;
    const exams = Math.max(1, Math.round(cfu / 9));

    const chip = (sel: boolean) => [styles.chip, sel && { backgroundColor: C.sel }];
    const chipTxt = (sel: boolean) => [styles.chipTxt, sel && { color: C.white }];

    return (
        <ScrollView style={{ backgroundColor: C.coral }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <BackButton label={t('back')} tint="rgba(20,20,31,0.12)" />
                    <Text style={styles.h1}>{t('needTitle')}</Text>
                </View>
                <Animated.View entering={enter(0)} layout={LAYOUT} style={styles.result}>
                    {r ? (
                        <>
                            <Text style={styles.intro}>{t('needIntro', { target: formatNumber(lang, target, 2), cfu })}</Text>
                            {r.verdict === 'impossible' ? (
                                <Text style={[styles.need, { color: C.redText }]}>{'> 30'}</Text>
                            ) : (
                                <AnimatedNumber value={shown} decimals={1} sep={decimalSeparator(lang)} duration={450} style={styles.need} />
                            )}
                            <Animated.View key={verdictKey} entering={FadeIn} style={[styles.verdict, { backgroundColor: TONES[tone].bg }]}>
                                <Text style={{ fontFamily: F.bold, fontSize: 14, color: TONES[tone].fg }}>{verdictKey ? t(verdictKey) : ''}</Text>
                            </Animated.View>
                        </>
                    ) : (
                        <Text style={styles.intro}>{t('noGradesYet')}</Text>
                    )}
                </Animated.View>
            </View>

            <View style={[styles.sheet, { paddingBottom: insets.bottom + 20 }]}>
                <Animated.View entering={enter(1)} style={styles.current}>
                    <Text style={{ fontFamily: F.body, fontSize: 15, color: C.text2 }}>{t('currentAverage')}</Text>
                    <Text style={{ fontFamily: F.display, fontSize: 22, color: C.text }}>{avg.avg30 === null ? '—' : formatNumber(lang, avg.avg30, 2)}</Text>
                </Animated.View>
                <Animated.View entering={enter(2)} style={{ gap: 8 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                        <Text style={styles.lbl}>{t('targetAverage')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                            <PressableScale accessibilityLabel="−" onPress={() => setTarget(target - 0.1)} style={styles.step}>
                                <Minus size={18} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                            <Text style={styles.targetNum}>{formatNumber(lang, target, 1)}</Text>
                            <PressableScale accessibilityLabel="+" onPress={() => setTarget(target + 0.1)} style={styles.step}>
                                <Plus size={18} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                        </View>
                    </View>
                    <ScrollView
                        ref={strip}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ marginHorizontal: -20 }}
                        contentContainerStyle={{ paddingHorizontal: 20, gap: CHIP_GAP }}
                        onLayout={(e) => {
                            const w = e.nativeEvent.layout.width;
                            if (!stripW) centre(w);
                            setStripW(w);
                        }}
                    >
                        {TARGETS.map((v) => {
                            const sel = Math.abs(target - v) < 1e-9;
                            return (
                                <PressableScale key={v} onPress={() => setTarget(v)} style={[chip(sel), { flex: 0, width: CHIP_W }]}>
                                    <Text style={chipTxt(sel)}>{formatNumber(lang, v, v % 1 ? 1 : 0)}</Text>
                                </PressableScale>
                            );
                        })}
                    </ScrollView>
                </Animated.View>
                <Animated.View entering={enter(3)} style={{ gap: 8 }}>
                    <Text style={styles.lbl}>{t('inNext')}</Text>
                    <View style={styles.grid}>
                        {spans.map((v) => (
                            <PressableScale key={v} onPress={() => setCfu(v)} style={chip(cfu === v)}>
                                <Text style={[...chipTxt(cfu === v), { fontSize: 13 }]}>{v === remaining && v > 60 ? t('untilEnd') : t('cfuN', { n: v })}</Text>
                            </PressableScale>
                        ))}
                    </View>
                </Animated.View>
                {r && r.verdict !== 'guaranteed' && (
                    <Animated.View entering={enter(4)} style={styles.tip}>
                        <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.violetDeep }}>
                            <Text style={{ fontFamily: F.bold }}>{t('inPractice')}</Text> {t('tipText', { n: exams, v: r.verdict === 'impossible' ? '30+' : formatNumber(lang, shown, 1) })}{' '}
                            {t('lodeNote', { v: rule.average.lodeValue })}
                        </Text>
                    </Animated.View>
                )}
            </View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    h1: { fontFamily: F.display, fontSize: 22, color: C.ink, flex: 1 },
    result: { backgroundColor: C.surface, borderRadius: 28, padding: 20, gap: 8 },
    intro: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.text2 },
    need: { fontFamily: F.display, fontSize: 80, lineHeight: 86, color: C.text, minWidth: 160 },
    verdict: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6 },
    sheet: { flex: 1, backgroundColor: C.fog, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, gap: 14 },
    current: { backgroundColor: C.surface, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    lbl: { fontFamily: F.bold, fontSize: 14, color: C.text },
    grid: { flexDirection: 'row', gap: 8 },
    chip: { flex: 1, height: 46, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4 },
    chipTxt: { fontFamily: F.display, fontSize: 15, color: C.text, textAlign: 'center' },
    step: { width: 36, height: 36, borderRadius: 12, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    targetNum: { fontFamily: F.display, fontSize: 20, color: C.text, minWidth: 48, textAlign: 'center' },
    tip: { backgroundColor: C.violetSoft, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14 },
}));
