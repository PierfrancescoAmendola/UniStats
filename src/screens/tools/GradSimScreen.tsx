import { useNavigation } from '@react-navigation/native';
import { Minus, Plus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedNumber, enter, PressableScale, Toggle, pop } from '../../components/motion';
import { BackButton } from '../../components/ui';
import { MAX_GRADE } from '../../engine/graduation';
import { Bonus } from '../../engine/types';
import { decimalSeparator, formatNumber, translateLoose } from '../../i18n';
import { useApp } from '../../store/AppStore';
import { C, F, themed } from '../../theme/tokens';
import { bonusSize, bonusTitle, factorText, ruleName } from '../../utils/ruleText';

const Seg = ({ value, color }: { value: number; color: string }) => {
    const w = useSharedValue(0);
    useEffect(() => {
        w.value = withSpring(Math.max(0, value) / MAX_GRADE, { damping: 20, stiffness: 120 });
    }, [value, w]);
    const a = useAnimatedStyle(() => ({ width: `${w.value * 100}%` }));
    return <Animated.View style={[{ height: 10, backgroundColor: color }, a]} />;
};

export const GradSimScreen = () => {
    const nav = useNavigation();
    const { t, lang, state, rule, avg, grad, setProfile } = useApp();
    const insets = useSafeAreaInsets();
    const p = state.profile;
    const sep = decimalSeparator(lang);
    const input = p.bonusInput;
    const setInput = (id: string, v: number | boolean | undefined) => setProfile({ bonusInput: { ...input, [id]: v } });
    const { min, max } = rule.finalExam;
    const thesisVals = Array.from({ length: Math.floor(max - min) + 1 }, (_, i) => min + i);
    const lineOf = (b: Bonus) => grad.bonuses.find((l) => l.id === b.id);
    const pts = (v: number) => formatNumber(lang, v, v % 1 ? 1 : 0);

    const renderBonus = (b: Bonus) => {
        const pointsNow = lineOf(b)?.points ?? 0;
        const title = bonusTitle(b, lang, t);
        const right = <Text style={styles.bonusPts}>+{pts(pointsNow)}</Text>;
        if (b.kind === 'flag') {
            return (
                <View key={b.id} style={styles.bonusRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bonusTitle}>
                            {title} · {bonusSize(b, lang)}
                        </Text>
                    </View>
                    <Toggle label={title} value={input[b.id] === true} onChange={(v) => setInput(b.id, v)} />
                </View>
            );
        }
        if (b.kind === 'onTime' || b.kind === 'onTimePercent' || b.kind === 'careerTable') {
            const labels = b.kind === 'careerTable' ? b.sessions : b.tiers.map((x) => x.label);
            return (
                <View key={b.id} style={[styles.bonusRow, { flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bonusTitle}>{b.kind === 'careerTable' ? t('bonusKind_careerTable') : title}</Text>
                            {b.kind === 'onTime' && b.minAvg30 != null && <Text style={styles.bonusSub}>{t('bonusMinAvg', { v: formatNumber(lang, b.minAvg30, 0) })}</Text>}
                        </View>
                        {right}
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                        {labels.map((l, i) => {
                            const sel = input[b.id] === i;
                            return (
                                <PressableScale key={l} onPress={() => setInput(b.id, sel ? undefined : i)} style={[styles.chip, sel && { backgroundColor: C.sel }]}>
                                    <Text style={[styles.chipTxt, sel && { color: C.white }]}>{translateLoose(lang, l)}</Text>
                                </PressableScale>
                            );
                        })}
                    </View>
                </View>
            );
        }
        if (b.kind === 'mobility') {
            const cfu = typeof input[b.id] === 'number' ? (input[b.id] as number) : 0;
            return (
                <View key={b.id} style={styles.bonusRow}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bonusTitle}>{t('cfuAbroad')}</Text>
                        <Text style={styles.bonusSub}>{b.tiers.map((x) => `≥${x.cfuGte} → +${pts(x.points)}`).join(' · ')}</Text>
                    </View>
                    <PressableScale accessibilityLabel="−" onPress={() => setInput(b.id, Math.max(0, cfu - 6))} style={styles.stepBtn}>
                        <Minus size={16} strokeWidth={2.6} color={C.text} />
                    </PressableScale>
                    <Text style={[styles.bonusPts, { minWidth: 30, textAlign: 'center' }]}>{cfu}</Text>
                    <PressableScale accessibilityLabel="+" onPress={() => setInput(b.id, Math.min(60, cfu + 6))} style={styles.stepBtn}>
                        <Plus size={16} strokeWidth={2.6} color={C.text} />
                    </PressableScale>
                </View>
            );
        }
        // Bonuses read from the transcript: shown, not editable.
        return (
            <View key={b.id} style={styles.bonusRow}>
                <View style={{ flex: 1 }}>
                    <Text style={styles.bonusTitle}>{title}</Text>
                    <Text style={styles.bonusSub}>
                        {bonusSize(b, lang)} · {t('fromTranscript')}
                    </Text>
                </View>
                {right}
            </View>
        );
    };

    const gamma = rule.model === 'multiplicative' && rule.multiplier;

    return (
        <ScrollView style={{ backgroundColor: C.sun }} contentContainerStyle={{ flexGrow: 1 }} showsVerticalScrollIndicator={false}>
            <View style={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 18, gap: 14 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <BackButton label={t('back')} tint="rgba(20,20,31,0.1)" />
                    <Text style={styles.h1}>{t('qGrad')}</Text>
                </View>
                <Animated.View entering={enter(0)} style={styles.result}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' }}>
                        <View style={{ flexShrink: 0 }}>
                            <Text style={{ fontFamily: F.body, fontSize: 14, color: C.text4 }}>{t('predictedFinal')}</Text>
                            <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                                <AnimatedNumber value={grad.final} duration={500} style={styles.final} />
                                <Text style={{ fontFamily: F.display, fontSize: 24, color: C.text4, marginBottom: 12 }}>/110</Text>
                            </View>
                        </View>
                        {grad.lodePossible && (
                            <Animated.View entering={pop()} style={styles.lodePill}>
                                <Text style={{ fontFamily: F.display, fontSize: 13, color: C.ink, textAlign: 'center' }}>{grad.lodeAutomatic ? t('lodeAutomatic') : t('lodePossible')}</Text>
                            </Animated.View>
                        )}
                    </View>
                    <View style={styles.segTrack}>
                        <Seg value={grad.base} color={C.violetMuted} />
                        <Seg value={Math.max(0, grad.raw - grad.base - grad.bonusTotal)} color={C.sun} />
                        <Seg value={grad.bonusTotal} color={C.mintBright} />
                    </View>
                    <View style={{ flexDirection: 'row', gap: 14, flexWrap: 'wrap' }}>
                        {[
                            [C.violetMuted, t('baseShort', { v: formatNumber(lang, grad.base, 1) })],
                            [C.sun, t('thesisShort', { v: pts(grad.thesis) })],
                            [C.mintBright, t('bonusShort', { v: pts(grad.bonusTotal) })],
                        ].map(([c, l]) => (
                            <View key={c} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                <View style={{ width: 10, height: 10, borderRadius: 3, backgroundColor: c }} />
                                <Text style={{ fontFamily: F.body, fontSize: 13, color: C.onDark2 }}>{l}</Text>
                            </View>
                        ))}
                    </View>
                </Animated.View>
            </View>

            <View style={styles.sheet}>
                <Animated.View entering={enter(1)} style={[styles.card, { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }]}>
                    <View style={{ flex: 1 }}>
                        <Text style={styles.bonusTitle}>{t('graduationBase')}</Text>
                        <Text style={styles.bonusSub}>
                            {rule.model === 'multiplicative' ? t('baseLineMult') : t('baseLine', { avg: formatNumber(lang, avg.avg30 ?? 0, 2), factor: factorText(rule, lang) })}
                        </Text>
                    </View>
                    <AnimatedNumber value={grad.base} decimals={1} sep={sep} style={{ fontSize: 24, minWidth: 70, textAlign: 'right' }} />
                </Animated.View>

                <Animated.View entering={enter(2)} style={[styles.card, { gap: 10 }]}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.bonusTitle}>{t('thesisPoints')}</Text>
                            <Text style={styles.bonusSub}>{t('thesisRange', { min: pts(min), max: pts(max) })}</Text>
                        </View>
                        <Text style={{ fontFamily: F.display, fontSize: 24, color: C.text }}>
                            {grad.thesis >= 0 ? '+' : ''}
                            {pts(grad.thesis)}
                        </Text>
                    </View>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 5 }}>
                        {thesisVals.map((v) => {
                            const sel = Math.abs(p.thesisPoints - v) < 1e-9;
                            return (
                                <PressableScale key={v} scaleTo={0.88} onPress={() => setProfile({ thesisPoints: v })} style={[styles.tp, sel && { backgroundColor: C.sel }]}>
                                    <Text style={[styles.tpTxt, sel && { color: C.sun }]}>{v}</Text>
                                </PressableScale>
                            );
                        })}
                    </View>
                </Animated.View>

                {gamma && (
                    <Animated.View entering={enter(3)} style={[styles.card, { gap: 8 }]}>
                        <Text style={styles.bonusTitle}>{t('gammaLabel')}</Text>
                        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
                            {gamma.gammaTiers.map((g, i) => {
                                const sel = input.gamma === i;
                                return (
                                    <PressableScale key={g.label} onPress={() => setInput('gamma', sel ? undefined : i)} style={[styles.chip, sel && { backgroundColor: C.sel }]}>
                                        <Text style={[styles.chipTxt, sel && { color: C.white }]}>{translateLoose(lang, g.label)}</Text>
                                    </PressableScale>
                                );
                            })}
                        </View>
                    </Animated.View>
                )}

                <Animated.View entering={enter(4)} style={[styles.card, { paddingVertical: 4 }]}>
                    {rule.bonuses.length ? rule.bonuses.map(renderBonus) : <Text style={[styles.bonusSub, { paddingVertical: 12 }]}>{t('noBonuses')}</Text>}
                </Animated.View>

                <Animated.View entering={FadeIn.delay(400)} style={{ gap: 6, alignItems: 'center', paddingBottom: insets.bottom + 12 }}>
                    <PressableScale onPress={() => nav.navigate('RulesEdit')} style={{ padding: 4 }}>
                        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.text2, textAlign: 'center' }}>
                            {t('rulesLine', { name: ruleName(rule, t) })} — <Text style={{ fontFamily: F.bold, color: C.violet }}>{t('change')}</Text>
                        </Text>
                    </PressableScale>
                    <Text style={{ fontFamily: F.body, fontSize: 12, color: C.text3, textAlign: 'center' }}>{t('disclaimer')}</Text>
                </Animated.View>
            </View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    h1: { fontFamily: F.display, fontSize: 22, color: C.ink, flex: 1 },
    result: { backgroundColor: C.ink, borderRadius: 28, padding: 18, gap: 12 },
    final: { fontSize: 72, lineHeight: 78, color: C.sun, minWidth: 120 },
    lodePill: { backgroundColor: C.sun, borderRadius: 14, paddingHorizontal: 10, paddingVertical: 6, marginBottom: 14, marginLeft: 10, flexShrink: 1 },
    segTrack: { height: 10, borderRadius: 5, backgroundColor: C.inkLine, overflow: 'hidden', flexDirection: 'row' },
    sheet: { flex: 1, backgroundColor: C.fog, borderTopLeftRadius: 32, borderTopRightRadius: 32, padding: 20, gap: 12 },
    card: { backgroundColor: C.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14 },
    bonusRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 10 },
    bonusTitle: { fontFamily: F.bold, fontSize: 15, color: C.text },
    bonusSub: { fontFamily: F.body, fontSize: 13, color: C.text3 },
    bonusPts: { fontFamily: F.display, fontSize: 18, color: C.text },
    chip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 12, backgroundColor: C.fog },
    chipTxt: { fontFamily: F.semi, fontSize: 13, color: C.text },
    tp: { minWidth: 38, flexGrow: 1, height: 40, borderRadius: 12, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    tpTxt: { fontFamily: F.display, fontSize: 16, color: C.text },
    stepBtn: { width: 34, height: 34, borderRadius: 11, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
}));
