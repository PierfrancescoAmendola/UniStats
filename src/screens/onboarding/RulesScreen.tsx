import { CommonActions } from '@react-navigation/native';
import { Minus, Pencil, Plus } from 'lucide-react-native';
import React, { useRef } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale, LAYOUT } from '../../components/motion';
import { dismissKeyboardOnTap, PrimaryButton, ProgressHeader } from '../../components/ui';
import { findUniversity, UNIVERSITIES } from '../../data/universities';
import { NATIONAL_DEFAULTS, presetsFor } from '../../data/presets';
import { ScreenProps } from '../../navigation/types';
import { resolveRule, useApp } from '../../store/AppStore';
import { C, F, MONO_COLORS, themed } from '../../theme/tokens';
import { ruleName } from '../../utils/ruleText';

export const RulesScreen = ({ navigation, route }: ScreenProps<'Rules'>) => {
    const { t, state, setProfile } = useApp();
    const insets = useSafeAreaInsets();
    const p = state.profile;
    const edit = route.params?.edit;
    const uni = findUniversity(p.universityId);
    const presets = presetsFor(p.universityId, p.level);
    const options = [...presets, NATIONAL_DEFAULTS[p.level]];
    const rule = resolveRule(p);
    const activeId = p.customRule ? null : rule.id;
    const color = uni ? MONO_COLORS[UNIVERSITIES.indexOf(uni) % MONO_COLORS.length] : C.sun;
    const thisYear = new Date().getFullYear();
    // Typed text stays local and reaches the store when editing ends, so typing stays fluid.
    const name = useRef(p.name);
    const course = useRef(p.course);
    const commitText = () => setProfile({ name: name.current.trim(), course: course.current.trim() });

    const pick = (id: string) => setProfile({ ruleId: id, customRule: null, bonusInput: {}, thesisPoints: Math.min(p.thesisPoints, options.find((o) => o.id === id)!.finalExam.max) });

    const confirm = () => {
        commitText();
        if (edit) {
            navigation.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Tabs', params: { screen: 'Profile' } }] }));
        } else {
            navigation.navigate('Ready');
        }
    };

    const line = (label: string, value: string, accent = false) => (
        <View style={styles.line}>
            <Text style={styles.lineLbl}>{label}</Text>
            <Text style={[styles.lineVal, accent && { color: C.sun }]}>{value}</Text>
        </View>
    );

    return (
        <KeyboardAvoidingView {...dismissKeyboardOnTap} style={{ flex: 1, backgroundColor: C.fog }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
            <ScrollView
                keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive"
                contentContainerStyle={{ paddingTop: insets.top + 12, paddingHorizontal: 24, paddingBottom: 24, gap: 14 }}
            >
                <ProgressHeader step={3} total={3} label={t('stepOf', { n: 3, total: 3 })} backLabel={t('back')} />
                <Animated.Text entering={enter(0)} style={styles.h1}>
                    {t('rulesTitle')}
                </Animated.Text>

                <Animated.View entering={enter(1)} style={{ flexDirection: 'row', gap: 10 }}>
                    <View style={[styles.field, { flex: 1 }]}>
                        <Text style={styles.fieldLbl}>{t('yourName')}</Text>
                        <TextInput
                            defaultValue={p.name}
                            onChangeText={(v) => (name.current = v)}
                            onEndEditing={commitText}
                            placeholder={t('namePlaceholder')}
                            placeholderTextColor="#9A9AAE"
                            accessibilityLabel={t('yourName')}
                            style={styles.fieldInput}
                            autoCapitalize="words"
                        />
                    </View>
                    <View style={[styles.field, { width: 150 }]}>
                        <Text style={styles.fieldLbl}>{t('enrolledSince')}</Text>
                        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                            <PressableScale accessibilityLabel="−" hitSlop={8} onPress={() => setProfile({ cohort: Math.max(2000, p.cohort - 1) })} style={styles.mini}>
                                <Minus size={16} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                            <Text style={styles.fieldNum}>{p.cohort}</Text>
                            <PressableScale accessibilityLabel="+" hitSlop={8} onPress={() => setProfile({ cohort: Math.min(thisYear, p.cohort + 1) })} style={styles.mini}>
                                <Plus size={16} strokeWidth={2.6} color={C.text} />
                            </PressableScale>
                        </View>
                    </View>
                </Animated.View>

                <Animated.View entering={enter(2)} style={styles.field}>
                    <Text style={styles.fieldLbl}>{t('courseName')}</Text>
                    <TextInput
                        defaultValue={p.course}
                        onChangeText={(v) => (course.current = v)}
                        onEndEditing={commitText}
                        placeholder={t('coursePlaceholder')}
                        placeholderTextColor="#9A9AAE"
                        accessibilityLabel={t('courseName')}
                        style={styles.fieldInput}
                    />
                </Animated.View>

                <Animated.View entering={enter(3)} style={{ gap: 8 }}>
                    <Text style={styles.kicker}>{t('rulesAvailable')}</Text>
                    <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                        {options.map((o) => {
                            const sel = o.id === activeId;
                            const label = o.provenance.confidence === 'default' ? t('ruleNational') : o.scopeLabel === 'Ateneo' ? uni?.name ?? o.scopeLabel : o.scopeLabel;
                            return (
                                <PressableScale key={o.id} onPress={() => pick(o.id)} style={[styles.ruleChip, sel && { backgroundColor: C.violet }]}>
                                    <Text style={[styles.ruleChipTxt, sel && { color: C.white }]}>{label}</Text>
                                </PressableScale>
                            );
                        })}
                    </View>
                </Animated.View>

                <Animated.View entering={enter(4)} layout={LAYOUT} style={styles.dark}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, marginBottom: 8 }}>
                        <View style={[styles.mono, { backgroundColor: color }]}>
                            <Text style={styles.monoTxt}>{uni?.short ?? 'IT'}</Text>
                        </View>
                        <View style={{ flex: 1 }}>
                            <Text style={styles.darkTitle} numberOfLines={2}>
                                {p.course ? `${p.course} · ${p.cohort}` : ruleName(rule, t)}
                            </Text>
                            <Text style={styles.darkSub}>{rule.provenance.confidence === 'default' ? t('ruleNationalSub') : t('rulesCheck')}</Text>
                        </View>
                    </View>
                    <Animated.View key={rule.id + (p.customRule ? 'c' : '')} entering={FadeIn.duration(250)}>
                        {line(t('creditsToGraduate'), String(p.totalCfu))}
                        {line(t('lodeCountsAs'), String(rule.average.lodeValue), rule.average.lodeValue !== 30)}
                        {line(t('thesisMaxPoints'), `${rule.finalExam.max}`)}
                        {line(t('bonusSection'), rule.bonuses.length ? String(rule.bonuses.length) : t('noneLabel'))}
                        {line(t('roundingLabel'), t(`rounding_${rule.finalRounding}` as const))}
                    </Animated.View>
                </Animated.View>

                <PressableScale onPress={() => navigation.navigate('RulesEdit')} style={styles.customize}>
                    <Pencil size={18} strokeWidth={2.2} color={C.violet} />
                    <Text style={styles.customizeTxt}>{t('customizeRules')}</Text>
                </PressableScale>
            </ScrollView>
            <View style={{ paddingHorizontal: 24, paddingBottom: insets.bottom + 16, paddingTop: 8 }}>
                <PrimaryButton label={t('looksRight')} onPress={confirm} />
            </View>
        </KeyboardAvoidingView>
    );
};

const styles = themed(() => StyleSheet.create({
    h1: { fontFamily: F.display, fontSize: 34, lineHeight: 36, color: C.text },
    field: { backgroundColor: C.surface, borderRadius: 18, paddingHorizontal: 14, paddingVertical: 12, gap: 6 },
    fieldLbl: { fontFamily: F.semi, fontSize: 13, color: C.text3 },
    fieldInput: { fontFamily: F.semi, fontSize: 16, color: C.text, padding: 0 },
    fieldNum: { fontFamily: F.display, fontSize: 18, color: C.text },
    mini: { width: 28, height: 28, borderRadius: 9, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    kicker: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.text3 },
    ruleChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: C.surface },
    ruleChipTxt: { fontFamily: F.semi, fontSize: 14, color: C.text },
    dark: { backgroundColor: C.ink, borderRadius: 26, padding: 18 },
    mono: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    monoTxt: { fontFamily: F.display, fontSize: 13, color: C.ink },
    darkTitle: { fontFamily: F.bold, fontSize: 15, color: C.white },
    darkSub: { fontFamily: F.body, fontSize: 13, color: C.text4 },
    line: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 11, borderTopWidth: 1, borderTopColor: C.inkLine, gap: 12 },
    lineLbl: { fontFamily: F.body, fontSize: 15, color: C.onDark2, flex: 1 },
    lineVal: { fontFamily: F.bold, fontSize: 15, color: C.white },
    customize: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingVertical: 4 },
    customizeTxt: { fontFamily: F.semi, fontSize: 15, color: C.violet },
}));
