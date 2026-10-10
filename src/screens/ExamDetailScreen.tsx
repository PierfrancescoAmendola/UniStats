import { ArrowRight } from 'lucide-react-native';
import React, { useEffect, useMemo, useRef } from 'react';
import { Alert, Keyboard, ScrollView, StyleSheet, Text, TextInput, useWindowDimensions, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Bar, enter, PressableScale, pop } from '../components/motion';
import { BackButton } from '../components/ui';
import { computeAverage } from '../engine/average';
import { baseFor } from '../engine/graduation';
import { formatDate, formatNumber, formatSigned } from '../i18n';
import { ScreenProps } from '../navigation/types';
import { useApp } from '../store/AppStore';
import { C, F, TIER_COLORS, tierOf, themed } from '../theme/tokens';

// Header colour per grade tier: the tier's strong colour, with readable text on top.
const HEAD = themed(() => ({
    low: { bg: C.coral, fg: C.ink, blob: '#FF8A7A' },
    mid: { bg: C.sun, fg: C.ink, blob: '#FFD970' },
    good: { bg: C.violet, fg: C.white, blob: C.violetGlow },
    top: { bg: C.mint, fg: C.greenDeep, blob: C.mintBright },
    lode: { bg: C.ink, fg: C.white, blob: C.inkSoft },
    passFail: { bg: C.fogDeep, fg: C.text, blob: C.surface },
}));

export const ExamDetailScreen = ({ navigation, route }: ScreenProps<'ExamDetail'>) => {
    const { t, lang, state, rule, upsertExam, deleteExam } = useApp();
    const { width } = useWindowDimensions();
    const insets = useSafeAreaInsets();
    const exam = state.exams.find((e) => e.id === route.params.examId);
    const noteRef = useRef(exam?.note ?? '');
    const scroll = useRef<ScrollView>(null);
    const editingNote = useRef(false);
    // The notes field sits at the bottom: once the keyboard is up, scroll so the text being typed stays visible.
    useEffect(() => {
        const sub = Keyboard.addListener('keyboardDidShow', () => {
            if (editingNote.current) scroll.current?.scrollToEnd({ animated: true });
        });
        return () => sub.remove();
    }, []);

    const data = useMemo(() => {
        if (!exam) return null;
        const withIt = computeAverage(state.exams, rule);
        const without = computeAverage(state.exams.filter((e) => e.id !== exam.id), rule);
        const graded = state.exams.filter((e) => e.grade !== null);
        const value = (g: number | null, l: boolean) => (g === null ? 0 : l && g === 30 ? rule.average.lodeValue : g);
        const sorted = [...graded].sort((a, b) => value(b.grade, b.lode) - value(a.grade, a.lode));
        const rank = sorted.findIndex((e) => value(e.grade, e.lode) === value(exam.grade, exam.lode)) + 1;
        return { withIt, without, gradedCount: graded.length, rank };
    }, [exam, state.exams, rule]);

    if (!exam || !data) return null;
    const tier = tierOf(exam.grade, exam.lode);
    const head = HEAD[tier];
    // Long single words (German compounds) must fit on one line instead of breaking mid-word:
    // the title column is the screen minus paddings and the 96 pt badge.
    const longest = Math.max(...exam.name.split(/\s+/).map((w) => w.length));
    const titleSize = Math.min(32, Math.floor((width - 160) / (longest * 0.62)));
    const graded = exam.grade !== null;
    const label = !graded ? t('passFailShort') : exam.lode ? '30L' : String(exam.grade);
    const a1 = data.withIt.avg30;
    const a0 = data.without.avg30;
    const weight = data.withIt.gradedCfu ? exam.cfu / data.withIt.gradedCfu : 0;

    const confirmDelete = () =>
        Alert.alert(t('deleteConfirmTitle'), t('deleteConfirmBody'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('delete'),
                style: 'destructive',
                onPress: () => {
                    deleteExam(exam.id);
                    navigation.goBack();
                },
            },
        ]);

    const change = (title: string, from: number | null, to: number | null, d: number) => (
        <View style={styles.changeRow}>
            <Text style={styles.changeLbl}>{title}</Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8 }}>
                {from !== null && <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.text3 }}>{formatNumber(lang, from, d)}</Text>}
                {from !== null && <ArrowRight size={16} strokeWidth={2.4} color={C.text3} />}
                <Text style={{ fontFamily: F.display, fontSize: 20, color: C.text }}>{to === null ? '—' : formatNumber(lang, to, d)}</Text>
                {from !== null && to !== null && Math.abs(to - from) >= Math.pow(10, -d) / 2 && (
                    <View style={[styles.mini, { backgroundColor: to >= from ? C.mintSoft : C.coralSoft }]}>
                        <Text style={{ fontFamily: F.bold, fontSize: 13, color: to >= from ? C.greenText : C.redText }}>{formatSigned(lang, to - from, d)}</Text>
                    </View>
                )}
            </View>
        </View>
    );

    return (
        <ScrollView
            ref={scroll}
            style={{ backgroundColor: C.fog }}
            contentContainerStyle={{ paddingBottom: insets.bottom + 24 }}
            keyboardShouldPersistTaps="handled"
            keyboardDismissMode="interactive"
            automaticallyAdjustKeyboardInsets
        >
            <View style={[styles.head, { backgroundColor: head.bg, paddingTop: insets.top + 12 }]}>
                <View style={[styles.blob, { backgroundColor: head.blob }]} />
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                    <BackButton label={t('back')} tint="rgba(255,255,255,0.4)" />
                    <PressableScale onPress={() => navigation.navigate('AddExam', { examId: exam.id })} style={styles.editBtn}>
                        <Text style={{ fontFamily: F.bold, fontSize: 15, color: head.fg }}>{t('edit')}</Text>
                    </PressableScale>
                </View>
                <View style={{ flexDirection: 'row', alignItems: 'flex-end', justifyContent: 'space-between', gap: 12 }}>
                    <Animated.View entering={enter(0)} style={{ flex: 1, gap: 4 }}>
                        <Text style={{ fontFamily: F.bold, fontSize: 14, color: head.fg }}>
                            {t('yearN', { n: exam.year })} · {formatDate(lang, exam.date, 'long')}
                        </Text>
                        <Text style={[styles.h1, { color: head.fg, fontSize: titleSize, lineHeight: titleSize + 2 }]} numberOfLines={3}>
                            {exam.name}
                        </Text>
                        <Text style={{ fontFamily: F.semi, fontSize: 15, color: head.fg }}>
                            {t('cfuN', { n: exam.cfu })} · {t(`tier_${tier}` as const)}
                        </Text>
                    </Animated.View>
                    <Animated.View entering={pop(120)} style={styles.bigBadge}>
                        <Text style={{ fontFamily: F.display, fontSize: graded ? 48 : 26, color: TIER_COLORS[tier].fg === C.sun ? C.text : TIER_COLORS[tier].fg }}>{label}</Text>
                    </Animated.View>
                </View>
            </View>

            <View style={{ padding: 20, gap: 12 }}>
                <Animated.Text entering={enter(1)} style={styles.section}>
                    {t('whatChanged')}
                </Animated.Text>
                <Animated.View entering={enter(2)} style={styles.card}>
                    {graded ? (
                        <>
                            {change(t('weightedAverage'), a0, a1, 2)}
                            <View style={{ height: 1, backgroundColor: C.line }} />
                            {change(t('graduationBase'), a0 === null ? null : baseFor(a0, rule), a1 === null ? null : baseFor(a1, rule), 1)}
                        </>
                    ) : (
                        <Text style={{ fontFamily: F.body, fontSize: 15, color: C.text2 }}>{t('noImpact')}</Text>
                    )}
                </Animated.View>
                {graded && (
                    <Animated.View entering={enter(3)} style={{ flexDirection: 'row', gap: 12 }}>
                        <View style={[styles.card, { flex: 1, gap: 8 }]}>
                            <Text style={styles.lbl}>{t('weightOnAverage')}</Text>
                            <Text style={styles.big}>{formatNumber(lang, weight * 100, 1)}%</Text>
                            <Bar progress={weight} color={C.violet} />
                            <Text style={{ fontFamily: F.body, fontSize: 13, color: C.text3 }}>{t('ofGradedCfu', { a: exam.cfu, b: data.withIt.gradedCfu })}</Text>
                        </View>
                        <View style={[styles.card, { flex: 1, backgroundColor: C.sun, gap: 6 }]}>
                            <Text style={[styles.lbl, { color: C.ink, fontFamily: F.bold }]}>{t('ranking')}</Text>
                            <Text style={[styles.big, { color: C.ink }]}>{t('rankPlace', { n: data.rank })}</Text>
                            <Text style={{ fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.ink }}>{t('amongExams', { n: data.gradedCount })}</Text>
                        </View>
                    </Animated.View>
                )}
                <Animated.View entering={enter(4)} style={[styles.card, { gap: 6 }]}>
                    <Text style={styles.lbl}>{t('notes')}</Text>
                    <TextInput
                        defaultValue={noteRef.current}
                        onChangeText={(v) => (noteRef.current = v)}
                        onFocus={() => (editingNote.current = true)}
                        onEndEditing={() => {
                            editingNote.current = false;
                            upsertExam({ ...exam, note: noteRef.current.trim() || undefined });
                        }}
                        // A new line makes the field taller: keep its last line above the keyboard.
                        onContentSizeChange={() => editingNote.current && scroll.current?.scrollToEnd({ animated: false })}
                        placeholder={t('notesPlaceholder')}
                        placeholderTextColor={C.placeholder}
                        accessibilityLabel={t('notes')}
                        multiline
                        style={{ fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.text, minHeight: 44, padding: 0 }}
                    />
                </Animated.View>
                <Animated.View entering={enter(5)}>
                    <PressableScale onPress={confirmDelete} style={styles.delete}>
                        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.redText }}>{t('deleteExam')}</Text>
                    </PressableScale>
                </Animated.View>
            </View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    head: { paddingHorizontal: 20, paddingBottom: 26, borderBottomLeftRadius: 36, borderBottomRightRadius: 36, gap: 18, overflow: 'hidden' },
    blob: { position: 'absolute', right: -40, top: 60, width: 200, height: 200, borderRadius: 100 },
    editBtn: { height: 44, paddingHorizontal: 16, borderRadius: 14, backgroundColor: 'rgba(255,255,255,0.4)', justifyContent: 'center' },
    h1: { fontFamily: F.display, fontSize: 32, lineHeight: 34 },
    bigBadge: { width: 96, height: 96, borderRadius: 28, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    section: { fontFamily: F.display, fontSize: 20, color: C.text },
    card: { backgroundColor: C.surface, borderRadius: 22, padding: 16, gap: 14 },
    changeRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', gap: 8 },
    changeLbl: { fontFamily: F.body, fontSize: 15, color: C.text2, flexShrink: 1 },
    mini: { borderRadius: 999, paddingHorizontal: 8, paddingVertical: 3 },
    lbl: { fontFamily: F.semi, fontSize: 13, color: C.text3 },
    big: { fontFamily: F.display, fontSize: 28, color: C.text },
    delete: { height: 52, borderRadius: 18, backgroundColor: C.coralSoft, alignItems: 'center', justifyContent: 'center' },
}));
