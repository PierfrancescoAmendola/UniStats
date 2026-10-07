import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { Minus, Plus } from 'lucide-react-native';
import React, { useMemo, useRef, useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeOut, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { AnimatedNumber, PressableScale, Segmented } from '../components/motion';
import { PrimaryButton } from '../components/ui';
import { computeAverage } from '../engine/average';
import { Exam } from '../engine/types';
import { decimalSeparator, formatDate, formatSigned } from '../i18n';
import { ScreenProps } from '../navigation/types';
import { newId, useApp } from '../store/AppStore';
import { C, F, themed } from '../theme/tokens';
import { currentCourseYear, todayIso } from '../utils/career';

const GRADES: { v: number; lode: boolean; label: string }[] = [
    ...Array.from({ length: 13 }, (_, i) => ({ v: 18 + i, lode: false, label: String(18 + i) })),
    { v: 30, lode: true, label: '30L' },
];

export const AddExamScreen = ({ navigation, route }: ScreenProps<'AddExam'>) => {
    const { t, lang, state, rule, avg, upsertExam } = useApp();
    const insets = useSafeAreaInsets();
    const existing = state.exams.find((e) => e.id === route.params?.examId);
    const p = state.profile;

    // The name lives in a ref: re-rendering the whole sheet on every key made fast typing drop letters.
    const nameRef = useRef(existing?.name ?? '');
    const [hasName, setHasName] = useState(!!existing?.name.trim());
    const [kind, setKind] = useState<'graded' | 'passFail'>(existing && existing.grade === null ? 'passFail' : 'graded');
    const [grade, setGrade] = useState(existing?.grade ?? 27);
    const [lode, setLode] = useState(existing?.lode ?? false);
    const [cfu, setCfu] = useState(existing?.cfu ?? 6);
    const [date, setDate] = useState(existing?.date ?? todayIso());
    const [year, setYear] = useState(existing?.year ?? Math.min(p.years, currentCourseYear(p)));
    const [showPicker, setShowPicker] = useState(false);

    const draft: Exam = { id: existing?.id ?? '__draft', name: '', grade: kind === 'graded' ? grade : null, lode: kind === 'graded' && lode, cfu, date, year, note: existing?.note };
    const preview = useMemo(() => {
        const others = state.exams.filter((e) => e.id !== draft.id);
        const after = computeAverage([...others, draft], rule).avg30;
        const before = computeAverage(others, rule).avg30;
        return { after, before };
        // The draft is rebuilt every render: depend on its fields, not on the object.
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [state.exams, rule, draft.id, draft.grade, draft.lode, draft.cfu]);
    const delta = preview.after !== null && preview.before !== null ? preview.after - preview.before : null;

    const saved = useRef(false);
    const save = () => {
        // One save per screen, and never without a name (a fast double tap would add the exam twice).
        const name = nameRef.current.trim();
        if (!name || saved.current) return;
        saved.current = true;
        const exam: Exam = { ...draft, id: existing?.id ?? newId(), name };
        upsertExam(exam);
        if (existing) navigation.goBack();
        else navigation.replace('Milestone', { examId: exam.id, before: avg.avg30 });
    };

    const onDate = (e: DateTimePickerEvent, d?: Date) => {
        if (Platform.OS === 'android') setShowPicker(false);
        if (e.type === 'set' && d) setDate(todayIso(d));
    };

    return (
        <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.fog, paddingTop: insets.top }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <View style={styles.grabber} />
            <View style={styles.top}>
                <PressableScale onPress={() => navigation.goBack()} style={{ paddingVertical: 8, minWidth: 70 }}>
                    <Text style={styles.cancel}>{t('cancel')}</Text>
                </PressableScale>
                <Text style={styles.title}>{existing ? t('editExam') : t('newExam')}</Text>
                <View style={{ minWidth: 70 }} />
            </View>
            <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                <View style={styles.field}>
                    <Text style={styles.lbl}>{t('examName')}</Text>
                    <TextInput
                        defaultValue={nameRef.current}
                        onChangeText={(v) => {
                            nameRef.current = v;
                            if (!!v.trim() !== hasName) setHasName(!!v.trim());
                        }}
                        placeholder={t('examNamePlaceholder')}
                        placeholderTextColor="#9A9AAE"
                        accessibilityLabel={t('examName')}
                        style={styles.input}
                        autoFocus={!existing}
                        autoCorrect={false}
                        autoCapitalize="words"
                        returnKeyType="done"
                    />
                </View>

                <Segmented
                    value={kind}
                    onChange={setKind}
                    options={[
                        { value: 'graded', label: t('graded') },
                        { value: 'passFail', label: t('passFail') },
                    ]}
                />

                {kind === 'graded' ? (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} layout={LinearTransition} style={styles.card}>
                        <Text style={styles.lbl}>{t('grade')}</Text>
                        <View style={styles.grid}>
                            {GRADES.map((g) => {
                                const sel = grade === g.v && lode === g.lode;
                                return (
                                    <PressableScale
                                        key={g.label}
                                        scaleTo={0.9}
                                        accessibilityState={{ selected: sel }}
                                        onPress={() => {
                                            setGrade(g.v);
                                            setLode(g.lode);
                                        }}
                                        style={[styles.gradeBtn, sel && { backgroundColor: g.lode ? C.ink : C.violet }]}
                                    >
                                        <Text style={[styles.gradeTxt, sel && { color: g.lode ? C.sun : C.white }]}>{g.label}</Text>
                                    </PressableScale>
                                );
                            })}
                        </View>
                    </Animated.View>
                ) : (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} style={[styles.card, { backgroundColor: C.sunSoft }]}>
                        <Text style={{ fontFamily: F.medium, fontSize: 14, lineHeight: 20, color: C.amberDeep }}>{t('passFailNote')}</Text>
                    </Animated.View>
                )}

                <Animated.View layout={LinearTransition} style={styles.card}>
                    <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                        <Text style={styles.lbl}>{t('cfu')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10 }}>
                            <PressableScale accessibilityLabel={t('lessCfu')} onPress={() => setCfu(Math.max(1, cfu - 1))} style={styles.step}>
                                <Minus size={20} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                            <AnimatedNumber value={cfu} duration={200} style={styles.cfuNum} />
                            <PressableScale accessibilityLabel={t('moreCfu')} onPress={() => setCfu(Math.min(30, cfu + 1))} style={styles.step}>
                                <Plus size={20} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                        </View>
                    </View>
                    <View style={{ flexDirection: 'row', gap: 6 }}>
                        {[3, 6, 9, 12].map((c) => (
                            <PressableScale key={c} onPress={() => setCfu(c)} style={[styles.quick, cfu === c && { backgroundColor: C.sun }]}>
                                <Text style={[styles.quickTxt, cfu === c && { color: C.ink }]}>{t('cfuN', { n: c })}</Text>
                            </PressableScale>
                        ))}
                    </View>
                </Animated.View>

                <Animated.View layout={LinearTransition} style={{ flexDirection: 'row', gap: 10 }}>
                    <PressableScale onPress={() => setShowPicker((v) => !v)} style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.lbl}>{t('date')}</Text>
                        <Text style={styles.value}>{date === todayIso() ? t('dateToday') : formatDate(lang, date)}</Text>
                    </PressableScale>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.lbl}>{t('courseYear')}</Text>
                        <View style={{ flexDirection: 'row', gap: 4, flexWrap: 'wrap' }}>
                            {Array.from({ length: p.years + (p.years > 2 ? 1 : 0) }, (_, i) => i + 1).map((y) => (
                                <PressableScale key={y} onPress={() => setYear(y)} style={[styles.yearBtn, year === y && { backgroundColor: C.sel }]}>
                                    <Text style={[styles.yearTxt, year === y && { color: C.white }]}>{y}</Text>
                                </PressableScale>
                            ))}
                        </View>
                    </View>
                </Animated.View>
                {showPicker && (
                    <Animated.View entering={FadeIn} style={[styles.card, { alignItems: 'center' }]}>
                        <DateTimePicker
                            value={new Date(`${date}T12:00:00`)}
                            mode="date"
                            display={Platform.OS === 'ios' ? 'inline' : 'default'}
                            maximumDate={new Date()}
                            onChange={onDate}
                            locale={lang}
                            accentColor={C.violet}
                        />
                    </Animated.View>
                )}
            </ScrollView>

            <View style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 12, gap: 10 }}>
                <View style={styles.preview}>
                    <View>
                        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.text4 }}>{preview.before === null ? t('firstAverage') : t('averageBecomes')}</Text>
                        {preview.after !== null ? (
                            <AnimatedNumber value={preview.after} decimals={2} sep={decimalSeparator(lang)} duration={350} style={styles.previewNum} />
                        ) : (
                            <Text style={styles.previewNum}>—</Text>
                        )}
                    </View>
                    {delta !== null && kind === 'graded' && (
                        <View style={[styles.deltaPill, { backgroundColor: delta >= 0 ? C.mintPop : C.redPop }]}>
                            <Text style={{ fontFamily: F.display, fontSize: 14, color: delta >= 0 ? C.greenDeep : C.redDeep }}>
                                {delta >= 0 ? '▲ ' : '▼ '}
                                {formatSigned(lang, delta, 2)}
                            </Text>
                        </View>
                    )}
                </View>
                <PrimaryButton label={t('saveExam')} disabled={!hasName} onPress={save} />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = themed(() => StyleSheet.create({
    grabber: { width: 40, height: 5, borderRadius: 3, backgroundColor: C.text4, alignSelf: 'center', marginTop: 10 },
    top: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: 20, paddingVertical: 8 },
    cancel: { fontFamily: F.semi, fontSize: 16, color: C.violet },
    title: { fontFamily: F.display, fontSize: 20, color: C.text },
    field: { backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
    lbl: { fontFamily: F.semi, fontSize: 13, color: C.text3 },
    input: { fontFamily: F.semi, fontSize: 17, color: C.text, padding: 0 },
    value: { fontFamily: F.semi, fontSize: 16, color: C.text },
    card: { backgroundColor: C.surface, borderRadius: 22, padding: 14, gap: 10 },
    grid: { flexDirection: 'row', flexWrap: 'wrap', gap: 6 },
    gradeBtn: { width: '12.7%', flexGrow: 1, height: 44, borderRadius: 12, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    gradeTxt: { fontFamily: F.display, fontSize: 16, color: C.text },
    step: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    cfuNum: { fontSize: 26, minWidth: 36, textAlign: 'center' },
    quick: { flex: 1, height: 36, borderRadius: 12, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    quickTxt: { fontFamily: F.bold, fontSize: 13, color: C.text },
    yearBtn: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    yearTxt: { fontFamily: F.bold, fontSize: 14, color: C.text },
    preview: { backgroundColor: C.ink, borderRadius: 22, paddingHorizontal: 16, paddingVertical: 12, flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    previewNum: { fontFamily: F.display, fontSize: 28, color: C.white, minWidth: 100 },
    deltaPill: { borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
}));
