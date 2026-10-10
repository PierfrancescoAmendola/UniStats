import * as DocumentPicker from 'expo-document-picker';
import { File } from 'expo-file-system';
import * as Haptics from 'expo-haptics';
import { AlertCircle, Check, FileText, FileUp, Minus, Plus } from 'lucide-react-native';
import React, { useRef, useState } from 'react';
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn, FadeInDown, LinearTransition } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale, rise, pop } from '../components/motion';
import { BackButton, GradeBadge, PrimaryButton } from '../components/ui';
import { Exam } from '../engine/types';
import { formatDate } from '../i18n';
import { ScreenProps } from '../navigation/types';
import { extractPdfLines } from '../pdf/pdfText';
import { ParsedExam, parseTranscript, yearFromDate } from '../pdf/transcriptParser';
import { newId, useApp } from '../store/AppStore';
import { C, F, tierOf, themed } from '../theme/tokens';

type Phase = 'idle' | 'reading' | 'done' | 'failed';

export const ImportPdfScreen = ({ navigation }: ScreenProps<'ImportPdf'>) => {
    const { t, lang, state, addExams } = useApp();
    const insets = useSafeAreaInsets();
    const [phase, setPhase] = useState<Phase>('idle');
    const [fileName, setFileName] = useState('');
    const [found, setFound] = useState<ParsedExam[]>([]);
    const [selected, setSelected] = useState<Set<string>>(new Set());
    const pasteRef = useRef('');
    const [hasPaste, setHasPaste] = useState(false);

    // Exams already in the transcript (same name and date) are not offered again.
    const known = new Set(state.exams.map((e) => `${e.name.toLowerCase()}|${e.date}`));

    const accept = (list: ParsedExam[], name: string) => {
        const fresh = list.filter((e) => !known.has(`${e.name.toLowerCase()}|${e.date}`));
        setFileName(name);
        setFound(fresh);
        setSelected(new Set(fresh.map((e) => e.key)));
        setPhase(fresh.length ? 'done' : 'failed');
        Haptics.notificationAsync(fresh.length ? Haptics.NotificationFeedbackType.Success : Haptics.NotificationFeedbackType.Error).catch(() => undefined);
    };

    const pick = async () => {
        const res = await DocumentPicker.getDocumentAsync({ type: 'application/pdf', copyToCacheDirectory: true, multiple: false });
        if (res.canceled || !res.assets?.[0]) return;
        const asset = res.assets[0];
        setPhase('reading');
        try {
            const bytes = await new File(asset.uri).bytes();
            // Let the spinner paint before the synchronous parse.
            await new Promise((r) => setTimeout(r, 50));
            accept(parseTranscript(extractPdfLines(bytes)), asset.name);
        } catch {
            setFileName(asset.name);
            setPhase('failed');
        }
    };

    const fromText = () => accept(parseTranscript(pasteRef.current.split(/\r?\n/)), t('pasteInstead'));

    const toggle = (key: string) =>
        setSelected((s) => {
            const n = new Set(s);
            if (n.has(key)) n.delete(key);
            else n.add(key);
            return n;
        });
    const setCfu = (key: string, cfu: number) => setFound((list) => list.map((e) => (e.key === key ? { ...e, cfu, uncertain: false } : e)));

    const chosen = found.filter((e) => selected.has(e.key));
    const uncertain = found.filter((e) => e.uncertain).length;
    const p = state.profile;

    const save = () => {
        const maxYear = p.years + (p.years > 2 ? 1 : 0);
        const exams: Exam[] = chosen
            .filter((e) => e.cfu > 0)
            .map((e) => ({ id: newId(), name: e.name, grade: e.grade, lode: e.lode, cfu: e.cfu, date: e.date, year: yearFromDate(e.date, p.cohort, maxYear) }));
        addExams(exams);
        navigation.goBack();
    };

    return (
        // No KeyboardAvoidingView: the add button stays at the bottom while an exam is edited.
        <View style={{ flex: 1, backgroundColor: C.fog }}>
            <ScrollView keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive" automaticallyAdjustKeyboardInsets contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 20, paddingBottom: 20, gap: 12 }}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                    <BackButton label={t('back')} />
                    <Text style={styles.h1}>{t('importTitle')}</Text>
                </View>

                {(phase === 'idle' || phase === 'failed') && (
                    <Animated.View entering={enter(0)} style={{ gap: 12 }}>
                        <View style={styles.hero}>
                            <View style={styles.heroIcon}>
                                <FileUp size={30} strokeWidth={2} color={C.violet} />
                            </View>
                            <Text style={styles.heroTxt}>{t('importHelp')}</Text>
                            <PrimaryButton label={t('pickFile')} bg={C.sun} fg={C.ink} onPress={pick} style={{ alignSelf: 'stretch' }} />
                        </View>
                        {phase === 'failed' && (
                            <Animated.View entering={FadeIn} style={[styles.warn, { backgroundColor: C.coralSoft }]}>
                                <AlertCircle size={20} strokeWidth={2.2} color={C.redText} />
                                <Text style={[styles.warnTxt, { color: C.redText }]}>{t('importFailed')}</Text>
                            </Animated.View>
                        )}
                        <View style={styles.card}>
                            <Text style={styles.lbl}>{t('pasteInstead')}</Text>
                            <TextInput
                                onChangeText={(v) => {
                                    pasteRef.current = v;
                                    if (!!v.trim() !== hasPaste) setHasPaste(!!v.trim());
                                }}
                                placeholder={t('pastePlaceholder')}
                                placeholderTextColor={C.placeholder}
                                accessibilityLabel={t('pasteInstead')}
                                multiline
                                style={styles.paste}
                            />
                            {hasPaste && (
                                <PressableScale onPress={fromText} style={styles.readBtn}>
                                    <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.white }}>{t('readText')}</Text>
                                </PressableScale>
                            )}
                        </View>
                    </Animated.View>
                )}

                {phase === 'reading' && (
                    <Animated.View entering={FadeIn} style={[styles.fileCard, { justifyContent: 'center' }]}>
                        <ActivityIndicator color={C.white} />
                        <Text style={styles.fileName}>{t('readingFile')}</Text>
                    </Animated.View>
                )}

                {phase === 'done' && (
                    <>
                        <Animated.View entering={rise()} style={styles.fileCard}>
                            <View style={styles.fileIcon}>
                                <FileText size={24} strokeWidth={2} color={C.violet} />
                            </View>
                            <View style={{ flex: 1 }}>
                                <Text style={styles.fileName} numberOfLines={1}>
                                    {fileName}
                                </Text>
                                <Text style={{ fontFamily: F.body, fontSize: 13, color: C.white, opacity: 0.85 }}>{t('examsFound', { n: found.length })}</Text>
                            </View>
                            <Animated.View entering={pop(200)} style={styles.okDot}>
                                <Check size={16} strokeWidth={3} color={C.greenDeep} />
                            </Animated.View>
                        </Animated.View>
                        {uncertain > 0 && (
                            <Animated.View entering={enter(1)} style={[styles.warn, { backgroundColor: C.sunSoft }]}>
                                <AlertCircle size={20} strokeWidth={2.2} color={C.amberText} />
                                <Text style={[styles.warnTxt, { color: C.text }]}>{t('toCheck', { n: uncertain })}</Text>
                            </Animated.View>
                        )}
                        <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                            <Text style={styles.kicker}>{t('foundInPdf')}</Text>
                            <PressableScale onPress={() => setSelected(selected.size === found.length ? new Set() : new Set(found.map((e) => e.key)))} style={{ padding: 4 }}>
                                <Text style={{ fontFamily: F.bold, fontSize: 14, color: C.violet }}>{selected.size === found.length ? t('selectNone') : t('selectAll')}</Text>
                            </PressableScale>
                        </View>
                        {found.map((e, i) => {
                            const on = selected.has(e.key);
                            return (
                                <Animated.View key={e.key} entering={rise(Math.min(i, 8) * 35)} layout={LinearTransition}>
                                    <PressableScale
                                        scaleTo={0.98}
                                        onPress={() => toggle(e.key)}
                                        accessibilityRole="checkbox"
                                        accessibilityState={{ checked: on }}
                                        style={[styles.row, e.uncertain && { borderColor: C.sun }]}
                                    >
                                        <View style={[styles.box, on && { backgroundColor: C.violet, borderColor: C.violet }]}>{on && <Check size={14} strokeWidth={3.4} color={C.white} />}</View>
                                        <View style={{ flex: 1 }}>
                                            <Text style={styles.name} numberOfLines={2}>
                                                {e.name}
                                            </Text>
                                            {e.uncertain ? (
                                                <Text style={{ fontFamily: F.semi, fontSize: 13, color: C.amberText }}>{t('checkCfu')}</Text>
                                            ) : (
                                                <Text style={styles.meta}>
                                                    {t('cfuN', { n: e.cfu })} · {formatDate(lang, e.date)}
                                                </Text>
                                            )}
                                        </View>
                                        {e.uncertain ? (
                                            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
                                                <PressableScale accessibilityLabel={t('lessCfu')} onPress={() => setCfu(e.key, Math.max(1, (e.cfu || 6) - 1))} style={styles.step}>
                                                    <Minus size={14} strokeWidth={2.6} color={C.text} />
                                                </PressableScale>
                                                <Text style={{ fontFamily: F.display, fontSize: 16 }}>{e.cfu || '?'}</Text>
                                                <PressableScale accessibilityLabel={t('moreCfu')} onPress={() => setCfu(e.key, Math.min(30, (e.cfu || 5) + 1))} style={styles.step}>
                                                    <Plus size={14} strokeWidth={2.6} color={C.text} />
                                                </PressableScale>
                                            </View>
                                        ) : (
                                            <GradeBadge tier={tierOf(e.grade, e.lode)} label={e.grade === null ? t('passFailShort') : e.lode ? '30L' : String(e.grade)} size={40} fontSize={e.grade === null ? 12 : 16} />
                                        )}
                                    </PressableScale>
                                </Animated.View>
                            );
                        })}
                    </>
                )}
            </ScrollView>
            {phase === 'done' && (
                <Animated.View entering={FadeInDown} style={{ paddingHorizontal: 20, paddingBottom: insets.bottom + 12, paddingTop: 8 }}>
                    <PrimaryButton label={t('addN', { n: chosen.filter((e) => e.cfu > 0).length })} disabled={!chosen.some((e) => e.cfu > 0)} onPress={save} />
                </Animated.View>
            )}
        </View>
    );
};

const styles = themed(() => StyleSheet.create({
    h1: { fontFamily: F.display, fontSize: 24, color: C.text, flex: 1 },
    hero: { backgroundColor: C.violet, borderRadius: 28, padding: 20, gap: 14, alignItems: 'flex-start' },
    heroIcon: { width: 60, height: 60, borderRadius: 20, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
    heroTxt: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.white },
    card: { backgroundColor: C.surface, borderRadius: 22, padding: 16, gap: 10 },
    lbl: { fontFamily: F.bold, fontSize: 15, color: C.text },
    paste: { minHeight: 90, borderRadius: 14, backgroundColor: C.fog, padding: 12, fontFamily: F.body, fontSize: 14, color: C.text, textAlignVertical: 'top' },
    readBtn: { height: 46, borderRadius: 14, backgroundColor: C.ink, alignItems: 'center', justifyContent: 'center' },
    warn: { borderRadius: 18, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'center' },
    warnTxt: { flex: 1, fontFamily: F.medium, fontSize: 14, lineHeight: 20 },
    fileCard: { backgroundColor: C.violet, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 80 },
    fileIcon: { width: 48, height: 48, borderRadius: 14, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center' },
    fileName: { fontFamily: F.bold, fontSize: 16, color: C.white },
    okDot: { width: 30, height: 30, borderRadius: 15, backgroundColor: C.mintPop, alignItems: 'center', justifyContent: 'center' },
    kicker: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.text3 },
    row: { backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12, borderWidth: 2, borderColor: 'transparent' },
    box: { width: 24, height: 24, borderRadius: 8, borderWidth: 2, borderColor: C.text4, alignItems: 'center', justifyContent: 'center' },
    name: { fontFamily: F.bold, fontSize: 15, color: C.text },
    meta: { fontFamily: F.body, fontSize: 13, color: C.text3 },
    step: { width: 28, height: 28, borderRadius: 9, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
}));
