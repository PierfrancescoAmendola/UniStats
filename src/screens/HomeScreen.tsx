import { useNavigation } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import { ChevronRight, Info, Plus, Target } from 'lucide-react-native';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedNumber, Bar, enter, PressableScale } from '../components/motion';
import { GradeBadge } from '../components/ui';
import { findUniversity, shortUniName } from '../data/universities';
import { examImpact } from '../engine/average';
import { neededAverage } from '../engine/needed';
import { decimalSeparator, formatDate, formatNumber, formatSigned } from '../i18n';
import { TAB_SPACE } from '../navigation/TabBar';
import { sortByDateDesc, useApp } from '../store/AppStore';
import { C, F, tierOf, themed, currentScheme } from '../theme/tokens';
import { currentCourseYear } from '../utils/career';

export const HomeScreen = () => {
    const nav = useNavigation();
    const { t, lang, state, rule, avg, grad } = useApp();
    const insets = useSafeAreaInsets();
    const p = state.profile;
    const sep = decimalSeparator(lang);
    const uni = findUniversity(p.universityId);
    const year = currentCourseYear(p);
    const sub = [p.course, uni ? shortUniName(uni) : null, t('yearN', { n: year })].filter(Boolean).join(' · ');

    const latest = useMemo(() => sortByDateDesc(state.exams).slice(0, 3), [state.exams]);
    const lastDelta = useMemo(() => {
        const last = latest.find((e) => e.grade !== null);
        return last ? examImpact(state.exams, last.id, rule) : null;
    }, [latest, state.exams, rule]);

    const passFail = state.exams.filter((e) => e.grade === null).length;
    const graded = state.exams.length - passFail;
    const progress = p.totalCfu ? avg.totalCfu / p.totalCfu : 0;
    const need = avg.gradedCfu ? neededAverage(avg.sum, avg.gradedCfu, p.targetAverage, 30, rule.average.lodeValue) : null;
    const goalText = !need
        ? ''
        : need.verdict === 'guaranteed'
          ? t('goalReachedLine', { target: formatNumber(lang, p.targetAverage, 2) })
          : need.verdict === 'impossible'
            ? t('goalImpossibleLine', { target: formatNumber(lang, p.targetAverage, 2), cfu: 30 })
            : t('goalLine', { target: formatNumber(lang, p.targetAverage, 2), needed: formatNumber(lang, need.value, 1), cfu: 30 });

    const header = (
        <Animated.View entering={enter(0)} style={styles.header}>
            <View style={{ flex: 1 }}>
                <Text style={styles.hello}>{p.name ? t('hello', { name: p.name }) : t('helloNoName')}</Text>
                <Text style={styles.sub} numberOfLines={1}>
                    {sub}
                </Text>
            </View>
            <PressableScale accessibilityLabel={t('tabProfile')} onPress={() => nav.navigate('Tabs', { screen: 'Profile' })} style={styles.avatar}>
                <Text style={styles.avatarTxt}>{(p.name || 'U').slice(0, 1).toUpperCase()}</Text>
            </PressableScale>
        </Animated.View>
    );

    if (state.exams.length === 0) {
        return (
            <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]}>
                <StatusBar style={currentScheme() === 'dark' ? 'light' : 'dark'} />
                {header}
                <Animated.View entering={enter(1)} style={styles.emptyCard}>
                    <View style={{ width: 200, height: 150 }}>
                        <View style={[styles.emptyTile, { left: 10, top: 24, width: 110, height: 110, backgroundColor: C.violetSoft, transform: [{ rotate: '-10deg' }] }]} />
                        <View style={[styles.emptyTile, { right: 10, top: 10, width: 96, height: 96, backgroundColor: C.sunSoft, transform: [{ rotate: '8deg' }] }]} />
                        <View style={[styles.emptyTile, { left: 52, top: 30, width: 96, height: 110, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center' }]}>
                            <Text style={{ fontFamily: F.display, fontSize: 40, color: C.white }}>—</Text>
                            <Text style={{ fontFamily: F.semi, fontSize: 12, color: C.white, opacity: 0.85 }}>{t('average').toLowerCase()}</Text>
                        </View>
                    </View>
                    <Text style={styles.emptyTitle}>{t('emptyTitle')}</Text>
                    <Text style={styles.emptyBody}>{t('emptyBody')}</Text>
                    <PressableScale onPress={() => nav.navigate('AddExam')} style={styles.emptyBtn}>
                        <Plus size={20} strokeWidth={2.6} color={C.white} />
                        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.white }}>{t('addExam')}</Text>
                    </PressableScale>
                    <PressableScale onPress={() => nav.navigate('ImportPdf')} style={{ padding: 6 }}>
                        <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.violet }}>{t('orImport')}</Text>
                    </PressableScale>
                </Animated.View>
                <Animated.View entering={enter(2)} style={{ flexDirection: 'row', gap: 12 }}>
                    <View style={[styles.tip, { backgroundColor: C.sunSoft }]}>
                        <Text style={[styles.tipKicker, { color: C.amberText }]}>{t('didYouKnow')}</Text>
                        <Text style={styles.tipTxt}>{t('didYouKnowBody')}</Text>
                    </View>
                    <View style={[styles.tip, { backgroundColor: C.mintSoft }]}>
                        <Text style={[styles.tipKicker, { color: C.greenText }]}>{t('yourGoal')}</Text>
                        <Text style={styles.tipTxt}>{t('yourGoalBody', { n: p.years })}</Text>
                    </View>
                </Animated.View>
            </ScrollView>
        );
    }

    return (
        <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]} showsVerticalScrollIndicator={false}>
            <StatusBar style={currentScheme() === 'dark' ? 'light' : 'dark'} />
            {header}

            <Animated.View entering={enter(1)} style={styles.hero}>
                <View style={styles.heroBlob} />
                <View style={styles.rowBetween}>
                    <Text style={styles.heroLbl}>{t(rule.average.type === 'arithmetic' ? 'average' : 'weightedAverage')}</Text>
                    <PressableScale onPress={() => nav.navigate('HowCalc')} style={styles.howPill}>
                        <Info size={14} strokeWidth={2.4} color={C.white} />
                        <Text style={styles.howTxt}>{t('howCalculated')}</Text>
                    </PressableScale>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', gap: 12 }}>
                    <AnimatedNumber value={avg.avg30 ?? 0} decimals={2} sep={sep} style={styles.heroNum} />
                    {lastDelta !== null && Math.abs(lastDelta) >= 0.005 && (
                        <View style={[styles.delta, { backgroundColor: lastDelta >= 0 ? C.mintPop : C.redPop }]}>
                            <Text style={[styles.deltaTxt, { color: lastDelta >= 0 ? C.greenDeep : C.redDeep }]}>
                                {lastDelta >= 0 ? '▲' : '▼'} {formatNumber(lang, Math.abs(lastDelta), 2)}
                            </Text>
                        </View>
                    )}
                </View>
                <View style={{ flexDirection: 'row', gap: 16, flexWrap: 'wrap' }}>
                    <Text style={styles.heroMeta}>
                        {t('arithmetic')} <Text style={{ fontFamily: F.bold }}>{formatNumber(lang, avg.arithmetic ?? 0, 2)}</Text>
                    </Text>
                    <Text style={styles.heroMeta}>
                        <Text style={{ fontFamily: F.bold }}>{t('examsSummary', { n: graded })}</Text>
                        {passFail ? ` ${t('passFailSummary', { n: passFail })}` : ''}
                    </Text>
                </View>
            </Animated.View>

            <Animated.View entering={enter(2)} style={{ flexDirection: 'row', gap: 12 }}>
                <PressableScale onPress={() => nav.navigate('GradSim')} style={[styles.tile, { backgroundColor: C.sun }]}>
                    <Text style={[styles.tileLbl, styles.onSun]}>{t('graduationBase')}</Text>
                    <View style={{ flexDirection: 'row', alignItems: 'flex-end' }}>
                        <AnimatedNumber value={grad.base} decimals={1} sep={sep} style={[styles.tileNum, styles.onSun]} />
                        <Text style={{ fontFamily: F.display, fontSize: 15, color: C.ink, marginBottom: 6 }}>/110</Text>
                    </View>
                    <Text style={[styles.tileFoot, styles.onSun]}>{t('withThesis', { grade: grad.final })}</Text>
                </PressableScale>
                <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Transcript' })} style={[styles.tile, { backgroundColor: C.surface, gap: 6 }]}>
                    <Text style={[styles.tileLbl, { color: C.text2 }]}>{t('cfu')}</Text>
                    <Text style={styles.tileNum}>
                        {avg.totalCfu}
                        <Text style={{ fontSize: 15, color: C.text3 }}>/{p.totalCfu}</Text>
                    </Text>
                    <Bar progress={progress} color={C.mint} />
                    <Text style={[styles.tileFoot, { color: C.text3, fontFamily: F.body }]}>{t('ofDegree', { p: Math.round(progress * 100) })}</Text>
                </PressableScale>
            </Animated.View>

            {need && (
                <Animated.View entering={enter(3)}>
                    <PressableScale onPress={() => nav.navigate('Needed')} style={styles.goal}>
                        <View style={styles.goalIcon}>
                            <Target size={22} strokeWidth={2.2} color={C.ink} />
                        </View>
                        <Text style={styles.goalTxt}>{goalText}</Text>
                        <ChevronRight size={18} strokeWidth={2.4} color={C.text4} />
                    </PressableScale>
                </Animated.View>
            )}

            <Animated.View entering={enter(4)} style={[styles.rowBetween, { marginTop: 4 }]}>
                <Text style={styles.section}>{t('latestExams')}</Text>
                <PressableScale onPress={() => nav.navigate('Tabs', { screen: 'Transcript' })} style={{ padding: 4 }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.violet }}>{t('tabTranscript')}</Text>
                </PressableScale>
            </Animated.View>
            {latest.map((e, i) => {
                const d = e.grade === null ? null : examImpact(state.exams, e.id, rule);
                return (
                    <Animated.View key={e.id} entering={enter(5 + i)}>
                        <PressableScale onPress={() => nav.navigate('ExamDetail', { examId: e.id })} style={styles.examRow}>
                            <GradeBadge tier={tierOf(e.grade, e.lode)} label={e.grade === null ? t('passFailShort') : e.lode ? '30L' : String(e.grade)} size={48} fontSize={e.grade === null ? 14 : 20} />
                            <View style={{ flex: 1 }}>
                                <Text style={styles.examName} numberOfLines={1}>
                                    {e.name}
                                </Text>
                                <Text style={styles.examMeta}>
                                    {t('cfuN', { n: e.cfu })} · {formatDate(lang, e.date, 'short')}
                                </Text>
                            </View>
                            {d !== null && Math.abs(d) >= 0.005 && (
                                <Text style={{ fontFamily: F.bold, fontSize: 13, color: d >= 0 ? C.greenText : C.redText }}>{formatSigned(lang, d, 2)}</Text>
                            )}
                        </PressableScale>
                    </Animated.View>
                );
            })}
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: TAB_SPACE, gap: 12 },
    header: { flexDirection: 'row', alignItems: 'center', gap: 12 },
    hello: { fontFamily: F.display, fontSize: 28, color: C.text },
    sub: { fontFamily: F.body, fontSize: 14, color: C.text3 },
    avatar: { width: 46, height: 46, borderRadius: 16, backgroundColor: C.sun, alignItems: 'center', justifyContent: 'center' },
    avatarTxt: { fontFamily: F.display, fontSize: 18, color: C.ink },
    hero: { backgroundColor: C.violet, borderRadius: 28, padding: 20, gap: 6, overflow: 'hidden' },
    heroBlob: { position: 'absolute', right: -50, bottom: -70, width: 190, height: 190, borderRadius: 95, backgroundColor: C.violetGlow },
    rowBetween: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    heroLbl: { fontFamily: F.semi, fontSize: 14, color: C.white, opacity: 0.9 },
    howPill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,0.16)', paddingHorizontal: 10, paddingVertical: 6, borderRadius: 999 },
    howTxt: { fontFamily: F.semi, fontSize: 13, color: C.white },
    heroNum: { fontSize: 76, lineHeight: 82, color: C.white, minWidth: 200 },
    delta: { borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5, marginBottom: 14 },
    deltaTxt: { fontFamily: F.bold, fontSize: 13 },
    heroMeta: { fontFamily: F.body, fontSize: 14, color: C.white, opacity: 0.92 },
    tile: { flex: 1, borderRadius: 24, padding: 16, gap: 4 },
    tileLbl: { fontFamily: F.bold, fontSize: 13, color: C.text },
    tileNum: { fontFamily: F.display, fontSize: 34, lineHeight: 38, color: C.text },
    tileFoot: { fontFamily: F.semi, fontSize: 13, color: C.text },
    onSun: { color: C.ink },
    goal: { backgroundColor: C.ink, borderRadius: 24, paddingHorizontal: 16, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 12 },
    goalIcon: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.coral, alignItems: 'center', justifyContent: 'center' },
    goalTxt: { flex: 1, fontFamily: F.medium, fontSize: 14, lineHeight: 19, color: C.white },
    section: { fontFamily: F.display, fontSize: 20, color: C.text },
    examRow: { backgroundColor: C.surface, borderRadius: 20, padding: 12, flexDirection: 'row', alignItems: 'center', gap: 12 },
    examName: { fontFamily: F.bold, fontSize: 16, color: C.text },
    examMeta: { fontFamily: F.body, fontSize: 13, color: C.text3 },
    emptyCard: { backgroundColor: C.surface, borderRadius: 28, padding: 24, alignItems: 'center', gap: 14, marginTop: 8 },
    emptyTile: { position: 'absolute', borderRadius: 26 },
    emptyTitle: { fontFamily: F.display, fontSize: 26, lineHeight: 29, color: C.text, textAlign: 'center' },
    emptyBody: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.text2, textAlign: 'center' },
    emptyBtn: { alignSelf: 'stretch', height: 54, borderRadius: 18, backgroundColor: C.violet, flexDirection: 'row', gap: 8, alignItems: 'center', justifyContent: 'center' },
    tip: { flex: 1, borderRadius: 22, padding: 16, gap: 4 },
    tipKicker: { fontFamily: F.bold, fontSize: 13 },
    tipTxt: { fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.text },
}));
