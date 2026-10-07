import { ExternalLink, Minus, Plus, X } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { KeyboardAvoidingView, Linking, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale, Toggle, LAYOUT } from '../components/motion';
import { BackButton } from '../components/ui';
import { computeAverage } from '../engine/average';
import { Rule, RoundingMode } from '../engine/types';
import { formatNumber } from '../i18n';
import { ScreenProps } from '../navigation/types';
import { useApp } from '../store/AppStore';
import { C, F, themed } from '../theme/tokens';
import { bonusSize, bonusTitle, ruleName } from '../utils/ruleText';

const CONF_TONE = themed(() => ({
    verified: { bg: C.mintSoft, fg: C.greenText },
    partial: { bg: C.sunSoft, fg: C.amberText },
    uncertain: { bg: C.coralSoft, fg: C.redText },
    default: { bg: C.sunSoft, fg: C.amberText },
    custom: { bg: C.violetSoft, fg: C.violetDeep },
}));

export const RulesEditScreen = (_: ScreenProps<'RulesEdit'>) => {
    const { t, lang, state, rule, setProfile } = useApp();
    const insets = useSafeAreaInsets();
    const p = state.profile;
    const bonusNameRef = useRef('');
    const bonusInput = useRef<TextInput>(null);
    const [bonusPts, setBonusPts] = useState(1);

    const edit = (patch: (r: Rule) => Rule) => {
        const next = patch(JSON.parse(JSON.stringify(rule)) as Rule);
        next.provenance = { ...next.provenance, confidence: 'custom' };
        setProfile({ customRule: next, thesisPoints: Math.min(Math.max(p.thesisPoints, next.finalExam.min), next.finalExam.max) });
    };
    const avgWith = computeAverage(state.exams, rule).avg30;
    const tone = CONF_TONE[rule.provenance.confidence];

    const chips = <V extends string | number | null>(options: { v: V; label: string }[], value: V, onPick: (v: V) => void) => (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {options.map((o) => {
                const sel = o.v === value || (typeof o.v === 'number' && typeof value === 'number' && Math.abs(o.v - value) < 1e-6);
                return (
                    <PressableScale key={String(o.v)} onPress={() => onPick(o.v)} style={[styles.chip, sel && { backgroundColor: C.violet }]}>
                        <Text style={[styles.chipTxt, sel && { color: C.white }]}>{o.label}</Text>
                    </PressableScale>
                );
            })}
        </View>
    );

    const stepper = (value: number, onChange: (v: number) => void, lo: number, hi: number) => (
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
            <PressableScale accessibilityLabel="−" onPress={() => onChange(Math.max(lo, value - 1))} style={styles.step}>
                <Minus size={16} strokeWidth={2.6} color={C.text} />
            </PressableScale>
            <Text style={styles.stepVal}>{value}</Text>
            <PressableScale accessibilityLabel="+" onPress={() => onChange(Math.min(hi, value + 1))} style={styles.step}>
                <Plus size={16} strokeWidth={2.6} color={C.text} />
            </PressableScale>
        </View>
    );

    const line = (label: string, right: React.ReactNode, last = false) => (
        <View style={[styles.line, !last && { borderBottomWidth: 1, borderBottomColor: C.line }]}>
            <Text style={styles.lineLbl}>{label}</Text>
            {right}
        </View>
    );

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.fog }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <BackButton label={t('back')} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.h1}>{t('rulesEditTitle')}</Text>
                        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.text3 }} numberOfLines={2}>
                            {ruleName(rule, t)} · {t(`level_${p.level}` as const)}
                        </Text>
                    </View>
                </View>

                <Animated.View entering={enter(0)} layout={LinearTransition} style={[styles.conf, { backgroundColor: tone.bg }]}>
                    <Text style={{ fontFamily: F.bold, fontSize: 14, color: tone.fg }}>{t(`confidence_${rule.provenance.confidence}` as const)}</Text>
                    {rule.provenance.note && <Text style={{ fontFamily: F.body, fontSize: 13, color: tone.fg }}>{t('lodeUnverified')}</Text>}
                    {rule.provenance.sources.map((s) => (
                        <PressableScale key={s.url} onPress={() => Linking.openURL(s.url).catch(() => undefined)} style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                            <ExternalLink size={14} strokeWidth={2.2} color={tone.fg} />
                            <Text style={{ fontFamily: F.semi, fontSize: 13, color: tone.fg, textDecorationLine: 'underline', flex: 1 }} numberOfLines={1}>
                                {t('source')}: {s.title}
                            </Text>
                        </PressableScale>
                    ))}
                </Animated.View>

                <Text style={styles.kicker}>{t('averageSection')}</Text>
                <Animated.View entering={enter(1)} style={[styles.card, { gap: 10 }]}>
                    <Text style={styles.lineLbl}>{t('lodeCountsAs')}</Text>
                    {chips(
                        [30, 31, 32, 33].map((v) => ({ v, label: String(v) })),
                        rule.average.lodeValue,
                        (v) => edit((r) => ({ ...r, average: { ...r.average, lodeValue: v } })),
                    )}
                    <Text style={{ fontFamily: F.body, fontSize: 13, color: C.text3 }}>
                        {t('yourAvgWith', { v: avgWith === null ? '—' : formatNumber(lang, avgWith, 2) })}
                    </Text>
                </Animated.View>
                <Animated.View entering={enter(2)} style={styles.group}>
                    {line(
                        t('arithmeticAverage'),
                        <Toggle
                            label={t('arithmeticAverage')}
                            value={rule.average.type === 'arithmetic'}
                            onChange={(v) => edit((r) => ({ ...r, average: { ...r.average, type: v ? 'arithmetic' : 'weighted' } }))}
                        />,
                    )}
                    {line(
                        t('dropWorst'),
                        stepper(rule.average.dropWorst.mode === 'none' ? 0 : rule.average.dropWorst.amount, (v) =>
                            edit((r) => ({ ...r, average: { ...r.average, dropWorst: v === 0 ? { mode: 'none', amount: 0, allowPartial: false } : { mode: r.average.dropWorst.mode === 'exams' ? 'exams' : 'cfu', amount: v, allowPartial: r.average.dropWorst.allowPartial } } })),
                            0,
                            40,
                        ),
                        true,
                    )}
                </Animated.View>

                <Text style={styles.kicker}>{t('finalSection')}</Text>
                <Animated.View entering={enter(3)} style={styles.group}>
                    {line(t('thesisMin'), stepper(rule.finalExam.min, (v) => edit((r) => ({ ...r, finalExam: { ...r.finalExam, min: Math.min(v, r.finalExam.max - 1) } })), -3, 10))}
                    {line(t('thesisMaxPoints'), stepper(rule.finalExam.max, (v) => edit((r) => ({ ...r, finalExam: { ...r.finalExam, max: Math.max(v, r.finalExam.min + 1) } })), 1, 15))}
                    <View style={[styles.line, { flexDirection: 'column', alignItems: 'stretch', gap: 8, borderBottomWidth: 1, borderBottomColor: C.line }]}>
                        <Text style={styles.lineLbl}>{t('factorLabel')}</Text>
                        {chips(
                            [
                                { v: 110 / 30, label: '110 ÷ 30' },
                                { v: 3.86, label: formatNumber(lang, 3.86, 2) },
                                { v: 4, label: '4' },
                            ],
                            rule.conversion.factor,
                            (v) => edit((r) => ({ ...r, conversion: { ...r.conversion, factor: v } })),
                        )}
                    </View>
                    <View style={[styles.line, { flexDirection: 'column', alignItems: 'stretch', gap: 8, borderBottomWidth: 1, borderBottomColor: C.line }]}>
                        <Text style={styles.lineLbl}>{t('roundingLabel')}</Text>
                        {chips(
                            (['halfUp', 'halfDown', 'truncate'] as RoundingMode[]).map((v) => ({ v, label: t(`rounding_${v}` as const) })),
                            rule.finalRounding,
                            (v) => edit((r) => ({ ...r, finalRounding: v })),
                        )}
                    </View>
                    <View style={[styles.line, { flexDirection: 'column', alignItems: 'stretch', gap: 8, borderBottomWidth: 1, borderBottomColor: C.line }]}>
                        <Text style={styles.lineLbl}>{t('lodeFrom')}</Text>
                        {chips(
                            [null, 111, 112, 113].map((v) => ({ v, label: v === null ? '110' : String(v) })),
                            rule.lode.rawThreshold,
                            (v) => edit((r) => ({ ...r, lode: { ...r.lode, rawThreshold: v, strict: false } })),
                        )}
                    </View>
                    <View style={[styles.line, { flexDirection: 'column', alignItems: 'stretch', gap: 8 }]}>
                        <Text style={styles.lineLbl}>{t('lodeMinBase')}</Text>
                        {chips(
                            [null, 102, 103, 104, 105].map((v) => ({ v, label: v === null ? t('noneLabel') : String(v) })),
                            rule.lode.minBase,
                            (v) => edit((r) => ({ ...r, lode: { ...r.lode, minBase: v } })),
                        )}
                    </View>
                </Animated.View>

                <Text style={styles.kicker}>{t('bonusSection')}</Text>
                <Animated.View entering={enter(4)} layout={LAYOUT} style={styles.group}>
                    {rule.bonuses.map((b) => (
                        <Animated.View key={b.id} entering={FadeIn} exiting={FadeOut} layout={LinearTransition} style={[styles.line, { borderBottomWidth: 1, borderBottomColor: C.line }]}>
                            <Text style={styles.lineLbl}>{bonusTitle(b, lang, t)}</Text>
                            <Text style={{ fontFamily: F.display, fontSize: 15, color: C.text }}>{bonusSize(b, lang)}</Text>
                            <PressableScale accessibilityLabel={t('remove')} hitSlop={8} onPress={() => edit((r) => ({ ...r, bonuses: r.bonuses.filter((x) => x.id !== b.id) }))}>
                                <X size={16} strokeWidth={2.4} color={C.text4} />
                            </PressableScale>
                        </Animated.View>
                    ))}
                    <View style={[styles.line, { gap: 8 }]}>
                        <TextInput
                            ref={bonusInput}
                            onChangeText={(v) => (bonusNameRef.current = v)}
                            placeholder={t('bonusName')}
                            placeholderTextColor="#9A9AAE"
                            accessibilityLabel={t('bonusName')}
                            style={{ flex: 1, fontFamily: F.semi, fontSize: 15, color: C.text, padding: 0 }}
                        />
                        {stepper(bonusPts, setBonusPts, 1, 10)}
                    </View>
                    <PressableScale
                        onPress={() => {
                            const label = bonusNameRef.current.trim() || t('customBonusDefault');
                            edit((r) => ({ ...r, bonuses: [...r.bonuses, { id: `custom-${Date.now()}`, kind: 'flag', label, points: bonusPts }] }));
                            bonusNameRef.current = '';
                            bonusInput.current?.clear();
                        }}
                        style={styles.addBonus}
                    >
                        <Plus size={18} strokeWidth={2.4} color={C.violet} />
                        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.violet }}>{t('addBonus')}</Text>
                    </PressableScale>
                </Animated.View>

                {p.customRule && (
                    <Animated.View entering={FadeIn}>
                        <PressableScale onPress={() => setProfile({ customRule: null })} style={styles.restore}>
                            <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.text }}>{t('restorePreset')}</Text>
                        </PressableScale>
                    </Animated.View>
                )}
                <Text style={{ fontFamily: F.body, fontSize: 13, lineHeight: 19, color: C.text3, textAlign: 'center' }}>{t('rulesNote')}</Text>
            </ScrollView>
        </KeyboardAvoidingView>
    );
};

const styles = themed(() => StyleSheet.create({
    h1: { fontFamily: F.display, fontSize: 22, color: C.text },
    conf: { borderRadius: 18, padding: 14, gap: 6 },
    kicker: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginTop: 4 },
    card: { backgroundColor: C.surface, borderRadius: 22, padding: 16 },
    group: { backgroundColor: C.surface, borderRadius: 22, overflow: 'hidden' },
    line: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 16, paddingVertical: 12 },
    lineLbl: { flex: 1, fontFamily: F.semi, fontSize: 15, color: C.text },
    chip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 12, backgroundColor: C.fog },
    chipTxt: { fontFamily: F.bold, fontSize: 14, color: C.text },
    step: { width: 32, height: 32, borderRadius: 10, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    stepVal: { fontFamily: F.display, fontSize: 18, color: C.text, minWidth: 26, textAlign: 'center' },
    addBonus: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingVertical: 14, borderTopWidth: 1, borderTopColor: C.line },
    restore: { height: 52, borderRadius: 18, backgroundColor: C.sun, alignItems: 'center', justifyContent: 'center' },
}));
