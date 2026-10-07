import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter } from '../../components/motion';
import { BackButton } from '../../components/ui';
import { formatNumber } from '../../i18n';
import { useApp } from '../../store/AppStore';
import { C, F, themed } from '../../theme/tokens';
import { factorText } from '../../utils/ruleText';

export const HowCalcScreen = () => {
    const { t, lang, rule, avg, grad } = useApp();
    const insets = useSafeAreaInsets();
    const n = (v: number, d: number) => formatNumber(lang, v, d);
    const counted = [...avg.counted].sort((a, b) => b.value * b.cfu - a.value * a.cfu);
    const top = counted.slice(0, 3);
    const rest = counted.slice(3);
    const restSum = rest.reduce((s, c) => s + c.value * c.cfu, 0);
    const lodeLabel = (v: number, lode: boolean) => (lode ? '30L' : n(v, 0));
    const dropped = rule.average.dropWorst.mode !== 'none';
    const extra = grad.raw - grad.base;
    const arith = rule.average.type === 'arithmetic';

    const step = (i: number, color: string, fg: string, title: string, sub: string, value: string) => (
        <Animated.View entering={enter(i + 1)} style={[styles.card, { flexDirection: 'row', alignItems: 'center', gap: 12 }]}>
            <View style={[styles.num, { backgroundColor: color }]}>
                <Text style={{ fontFamily: F.display, fontSize: 15, color: fg }}>{i}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.stepTitle}>{title}</Text>
                <Text style={styles.stepSub}>{sub}</Text>
            </View>
            <Text style={styles.value}>{value}</Text>
        </Animated.View>
    );

    return (
        <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 24, gap: 12 }}>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                <BackButton label={t('back')} />
                <Text style={styles.h1}>{t('howTitle')}</Text>
            </View>
            <Animated.Text entering={enter(0)} style={styles.lead}>
                {t('howIntro')}
            </Animated.Text>

            <Animated.View entering={enter(1)} style={[styles.card, { flexDirection: 'row', gap: 12 }]}>
                <View style={[styles.num, { backgroundColor: C.sun }]}>
                    <Text style={{ fontFamily: F.display, fontSize: 15, color: C.ink }}>1</Text>
                </View>
                <View style={{ flex: 1, gap: 8 }}>
                    <Text style={styles.stepTitle}>{t('step1')}</Text>
                    <View style={{ gap: 4 }}>
                        {top.map((c) => (
                            <View key={c.exam.id} style={styles.calcRow}>
                                <Text style={styles.calcTxt} numberOfLines={1}>
                                    {c.exam.name} · {lodeLabel(c.value, c.exam.lode && c.exam.grade === 30)} × {n(c.cfu, c.cfu % 1 ? 1 : 0)}
                                </Text>
                                <Text style={styles.calcVal}>{n(c.value * c.cfu, 0)}</Text>
                            </View>
                        ))}
                        {rest.length > 0 && (
                            <View style={styles.calcRow}>
                                <Text style={styles.calcTxt}>{t('moreExams', { n: rest.length })}</Text>
                                <Text style={styles.calcVal}>{n(restSum, 0)}</Text>
                            </View>
                        )}
                        <View style={[styles.calcRow, { borderTopWidth: 1, borderTopColor: C.line, paddingTop: 6 }]}>
                            <Text style={[styles.calcTxt, { fontFamily: F.bold, color: C.text }]}>{t('total')}</Text>
                            <Text style={styles.calcVal}>{n(avg.sum, 0)}</Text>
                        </View>
                    </View>
                    <Text style={styles.note}>
                        {t('step1Note', { v: rule.average.lodeValue })}
                        {dropped ? ` ${t('step1NoteDrop', { v: rule.average.dropWorst.mode === 'cfu' ? t('dropWorstCfu', { n: rule.average.dropWorst.amount }) : t('dropWorstExams', { n: rule.average.dropWorst.amount }) })}` : ''}
                    </Text>
                </View>
            </Animated.View>

            {step(2, C.coral, C.ink, t('step2'), arith ? t('step2SubArith') : t('step2Sub', { sum: n(avg.sum, 0), cfu: n(avg.gradedCfu, avg.gradedCfu % 1 ? 1 : 0) }), avg.avg30 === null ? '—' : n(avg.avg30, 2))}
            {step(3, C.violet, C.white, t('step3'), t('step3Sub', { avg: n(avg.avg30 ?? 0, 2), factor: factorText(rule, lang) }), n(grad.base, 1))}
            {step(4, C.mint, C.ink, t('step4'), t('step4Sub', { base: n(grad.base, 1), extra: n(extra, extra % 1 ? 1 : 0) }), String(grad.final))}

            <Animated.View entering={enter(5)} style={styles.dark}>
                <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.sun }}>{t('arithmeticQ', { v: n(avg.arithmetic ?? 0, 2) })}</Text>
                <Text style={{ fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.onDark2 }}>{t('arithmeticA')}</Text>
            </Animated.View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    h1: { fontFamily: F.display, fontSize: 22, color: C.text, flex: 1 },
    lead: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.text2 },
    card: { backgroundColor: C.surface, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14 },
    num: { width: 32, height: 32, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
    stepTitle: { fontFamily: F.bold, fontSize: 15, color: C.text },
    stepSub: { fontFamily: F.body, fontSize: 14, color: C.text2 },
    value: { fontFamily: F.display, fontSize: 22, color: C.violet },
    calcRow: { flexDirection: 'row', justifyContent: 'space-between', gap: 8 },
    calcTxt: { fontFamily: F.body, fontSize: 14, color: C.text2, flex: 1 },
    calcVal: { fontFamily: F.bold, fontSize: 14, color: C.text },
    note: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.text3 },
    dark: { backgroundColor: C.ink, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 14, gap: 4 },
}));
