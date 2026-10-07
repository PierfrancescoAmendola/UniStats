import { useNavigation } from '@react-navigation/native';
import { ChevronRight, FileUp } from 'lucide-react-native';
import React, { useMemo, useState } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale, Segmented, LAYOUT } from '../components/motion';
import { GradeBadge } from '../components/ui';
import { formatDate } from '../i18n';
import { TAB_SPACE } from '../navigation/TabBar';
import { sortByDateDesc, useApp } from '../store/AppStore';
import { C, F, tierOf, themed } from '../theme/tokens';

type Filter = 'all' | 'graded' | 'passFail';

export const TranscriptScreen = () => {
    const nav = useNavigation();
    const { t, lang, state, avg } = useApp();
    const insets = useSafeAreaInsets();
    const [filter, setFilter] = useState<Filter>('all');

    const groups = useMemo(() => {
        const shown = sortByDateDesc(state.exams).filter((e) => filter === 'all' || (filter === 'graded' ? e.grade !== null : e.grade === null));
        const years = [...new Set(shown.map((e) => e.year))].sort((a, b) => b - a);
        return years.map((y) => ({ year: y, exams: shown.filter((e) => e.year === y) }));
    }, [state.exams, filter]);

    const stat = (label: string, value: number | string) => (
        <View style={styles.stat}>
            <Text style={styles.statLbl}>{label}</Text>
            <Text style={styles.statNum}>{value}</Text>
        </View>
    );

    return (
        <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={enter(0)} style={styles.header}>
                <Text style={styles.h1}>{t('tabTranscript')}</Text>
                <PressableScale accessibilityLabel={t('importTranscript')} onPress={() => nav.navigate('ImportPdf')} style={styles.iconBtn}>
                    <FileUp size={22} strokeWidth={2} color={C.text} />
                </PressableScale>
            </Animated.View>
            <Animated.View entering={enter(1)} style={{ flexDirection: 'row', gap: 8 }}>
                {stat(t('exams'), state.exams.length)}
                {stat(t('cfu'), avg.totalCfu)}
                {stat(t('honours'), avg.lodeCount)}
            </Animated.View>
            <Animated.View entering={enter(2)}>
                <Segmented<Filter>
                    value={filter}
                    onChange={setFilter}
                    options={[
                        { value: 'all', label: t('filter_all') },
                        { value: 'graded', label: t('filter_graded') },
                        { value: 'passFail', label: t('filter_passFail') },
                    ]}
                />
            </Animated.View>
            {groups.length === 0 && (
                <Animated.Text entering={FadeIn} style={styles.empty}>
                    {t('noExamsFilter')}
                </Animated.Text>
            )}
            {groups.map((g, gi) => (
                <Animated.View key={g.year} layout={LAYOUT} entering={enter(3 + gi)} style={{ gap: 8 }}>
                    <Text style={styles.year}>{t('yearN', { n: g.year })}</Text>
                    {g.exams.map((e) => (
                        <Animated.View key={e.id} layout={LAYOUT} entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)}>
                            <PressableScale onPress={() => nav.navigate('ExamDetail', { examId: e.id })} style={styles.row}>
                                <GradeBadge tier={tierOf(e.grade, e.lode)} label={e.grade === null ? t('passFailShort') : e.lode ? '30L' : String(e.grade)} size={44} fontSize={e.grade === null ? 13 : 17} />
                                <View style={{ flex: 1 }}>
                                    <Text style={styles.name} numberOfLines={1}>
                                        {e.name}
                                    </Text>
                                    <Text style={styles.meta}>
                                        {t('cfuN', { n: e.cfu })} · {formatDate(lang, e.date)}
                                        {e.grade === null ? ` · ${t('notInAverage')}` : ''}
                                    </Text>
                                </View>
                                <ChevronRight size={18} strokeWidth={2.4} color={C.text4} />
                            </PressableScale>
                        </Animated.View>
                    ))}
                </Animated.View>
            ))}
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: TAB_SPACE, gap: 12 },
    header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    h1: { fontFamily: F.display, fontSize: 32, color: C.text },
    iconBtn: { width: 44, height: 44, borderRadius: 14, backgroundColor: C.surface, alignItems: 'center', justifyContent: 'center' },
    stat: { flex: 1, backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10 },
    statLbl: { fontFamily: F.semi, fontSize: 12, color: C.text3 },
    statNum: { fontFamily: F.display, fontSize: 22, color: C.text },
    year: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginTop: 4 },
    row: { backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 10, flexDirection: 'row', alignItems: 'center', gap: 12 },
    name: { fontFamily: F.bold, fontSize: 15, color: C.text },
    meta: { fontFamily: F.body, fontSize: 13, color: C.text3 },
    empty: { fontFamily: F.body, fontSize: 15, color: C.text2, textAlign: 'center', paddingVertical: 30 },
}));
