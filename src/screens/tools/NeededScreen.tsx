import React, { useEffect, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedNumber, enter, PressableScale } from '../../components/motion';
import { BackButton } from '../../components/ui';
import { neededAverage } from '../../engine/needed';
import { decimalSeparator, formatNumber } from '../../i18n';
import { useApp } from '../../store/AppStore';
import { C, F, themed } from '../../theme/tokens';

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
    const target = p.targetAverage;
    // Four targets just above the current average, half a point apart.
    const start = Math.min(28.5, Math.max(18.5, Math.floor((avg.avg30 ?? 26) * 2) / 2 + 0.5));
    const targets = [0, 0.5, 1, 1.5].map((d) => start + d);
    useEffect(() => {
        if (!targets.some((v) => Math.abs(v - target) < 1e-9)) setProfile({ targetAverage: targets[1] });
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [start]);
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
                <Animated.View entering={enter(0)} layout={LinearTransition.springify()} style={styles.result}>
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
                    <Text style={styles.lbl}>{t('targetAverage')}</Text>
                    <View style={styles.grid}>
                        {targets.map((v) => (
                            <PressableScale key={v} onPress={() => setProfile({ targetAverage: v })} style={chip(Math.abs(target - v) < 1e-9)}>
                                <Text style={chipTxt(Math.abs(target - v) < 1e-9)}>{formatNumber(lang, v, v % 1 ? 1 : 0)}</Text>
                            </PressableScale>
                        ))}
                    </View>
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
                        <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: '#2A1A99' }}>
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
    tip: { backgroundColor: C.violetSoft, borderRadius: 20, paddingHorizontal: 16, paddingVertical: 14 },
}));
