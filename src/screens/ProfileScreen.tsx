import { CommonActions, useNavigation } from '@react-navigation/native';
import Constants from 'expo-constants';
import { Check, ChevronRight, FileText, GraduationCap, Languages, Heart, ListChecks, Mail, PlayCircle, ShieldCheck, Star } from 'lucide-react-native';
import React, { useState } from 'react';
import { Alert, Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale, pop, LAYOUT } from '../components/motion';
import { findUniversity } from '../data/universities';
import { Language, LANGUAGES } from '../i18n';
import { SUPPORT_EMAIL } from '../i18n/legal';
import { REVIEW_URL } from '../config/store';
import { TAB_SPACE } from '../navigation/TabBar';
import { ThemePref, useApp } from '../store/AppStore';
import { C, F, PALETTES, themed } from '../theme/tokens';
import { currentCourseYear } from '../utils/career';
import { ruleName } from '../utils/ruleText';

/** Miniature of a screen in the given palette, used as the theme swatch. */
const Swatch = ({ pref }: { pref: ThemePref }) => {
    const mini = (scheme: 'light' | 'dark') => {
        const p = PALETTES[scheme];
        return (
            <View style={[styles.mini, { backgroundColor: p.fog }]}>
                <View style={[styles.miniHero, { backgroundColor: p.violet }]} />
                <View style={{ flexDirection: 'row', gap: 4 }}>
                    <View style={[styles.miniTile, { backgroundColor: p.sun }]} />
                    <View style={[styles.miniTile, { backgroundColor: p.surface }]} />
                </View>
                <View style={[styles.miniRow, { backgroundColor: p.surface }]} />
            </View>
        );
    };
    if (pref !== 'system') return mini(pref);
    // System: left half light, right half dark, clipped to one rounded frame.
    return (
        <View style={{ borderRadius: 14, overflow: 'hidden' }}>
            {mini('light')}
            <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '50%', overflow: 'hidden' }}>
                <View style={{ position: 'absolute', top: 0, bottom: 0, right: 0, width: '200%' }}>{mini('dark')}</View>
            </View>
        </View>
    );
};

export const ProfileScreen = () => {
    const nav = useNavigation();
    const { t, state, rule, setLanguage, setTheme, reset, markNudgeDone } = useApp();
    const insets = useSafeAreaInsets();
    const p = state.profile;
    const uni = findUniversity(p.universityId);
    const [langOpen, setLangOpen] = useState(false);
    const current = state.language ? LANGUAGES.find((l) => l.code === state.language)?.name : t('languageAuto');

    const confirmReset = () =>
        Alert.alert(t('resetConfirmTitle'), t('resetConfirmBody'), [
            { text: t('cancel'), style: 'cancel' },
            {
                text: t('resetAll'),
                style: 'destructive',
                onPress: () => {
                    reset();
                    nav.dispatch(CommonActions.reset({ index: 0, routes: [{ name: 'Intro' }] }));
                },
            },
        ]);

    const row = (icon: React.ReactNode, tint: string, label: string, onPress: () => void, right?: string, last = false) => (
        <PressableScale scaleTo={0.98} onPress={onPress} style={[styles.row, !last && styles.rowLine]}>
            <View style={[styles.rowIcon, { backgroundColor: tint }]}>{icon}</View>
            <Text style={styles.rowTxt}>{label}</Text>
            {right ? (
                <Text style={styles.rowRight} numberOfLines={1}>
                    {right}
                </Text>
            ) : (
                <View style={{ flex: 1 }} />
            )}
            <View style={{ flexShrink: 0 }}>
                <ChevronRight size={18} strokeWidth={2.4} color={C.text4} />
            </View>
        </PressableScale>
    );

    const themes: { pref: ThemePref; label: string }[] = [
        { pref: 'system', label: t('themeSystem') },
        { pref: 'light', label: t('themeLight') },
        { pref: 'dark', label: t('themeDark') },
    ];

    return (
        <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]} showsVerticalScrollIndicator={false}>
            <Animated.Text entering={enter(0)} style={styles.h1}>
                {t('profile')}
            </Animated.Text>
            <Animated.View entering={enter(1)} style={styles.card}>
                <View style={{ flexDirection: 'row', alignItems: 'center', gap: 14 }}>
                    <View style={styles.avatar}>
                        <Text style={{ fontFamily: F.display, fontSize: 26, color: C.ink }}>{(p.name || 'U').slice(0, 1).toUpperCase()}</Text>
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: F.bold, fontSize: 19, color: C.white }}>{p.name || t('appName')}</Text>
                        <Text style={{ fontFamily: F.body, fontSize: 14, color: C.text4 }}>{t('enrolledLine', { y: p.cohort, n: currentCourseYear(p) })}</Text>
                    </View>
                </View>
                <View style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    <View style={[styles.tag, { backgroundColor: C.violet }]}>
                        <Text style={styles.tagTxt}>{t(`level_${p.level}` as const)}</Text>
                    </View>
                    {uni && (
                        <View style={styles.tag}>
                            <Text style={styles.tagTxt}>{uni.name}</Text>
                        </View>
                    )}
                    {!!p.course && (
                        <View style={styles.tag}>
                            <Text style={styles.tagTxt}>{p.course}</Text>
                        </View>
                    )}
                </View>
            </Animated.View>

            <Animated.Text entering={enter(2)} style={styles.kicker}>
                {t('pathSection')}
            </Animated.Text>
            <Animated.View entering={enter(3)} style={styles.group}>
                {row(<GraduationCap size={18} strokeWidth={2.2} color={C.violetDeep} />, C.violetSoft, t('changePath'), () => nav.navigate('Level', { edit: true }))}
                {row(<ListChecks size={18} strokeWidth={2.2} color={C.amberText} />, C.sunSoft, t('calcRules'), () => nav.navigate('RulesEdit'), ruleName(rule, t))}
                {row(<FileText size={18} strokeWidth={2.2} color={C.greenText} />, C.mintSoft, t('importTranscript'), () => nav.navigate('ImportPdf'), undefined, true)}
            </Animated.View>

            <Animated.Text entering={enter(4)} style={styles.kicker}>
                {t('appearance')}
            </Animated.Text>
            <Animated.View entering={enter(5)} style={[styles.group, styles.themes]}>
                {themes.map(({ pref, label }) => {
                    const sel = state.theme === pref;
                    return (
                        <PressableScale
                            key={pref}
                            accessibilityRole="radio"
                            accessibilityState={{ selected: sel }}
                            accessibilityLabel={label}
                            scaleTo={0.94}
                            onPress={() => setTheme(pref)}
                            style={{ flex: 1 }}
                        >
                            <View style={[styles.themeFrame, sel && { borderColor: C.violet }]}>
                                <Swatch pref={pref} />
                                {sel && (
                                    <Animated.View entering={pop()} style={styles.themeCheck}>
                                        <Check size={12} strokeWidth={3.4} color={C.white} />
                                    </Animated.View>
                                )}
                            </View>
                            <Text style={[styles.themeLbl, sel && { color: C.violet }]}>{label}</Text>
                        </PressableScale>
                    );
                })}
            </Animated.View>

            <Animated.Text entering={enter(6)} style={styles.kicker}>
                {t('appSection')}
            </Animated.Text>
            <Animated.View entering={enter(7)} layout={LAYOUT} style={styles.group}>
                {row(<Languages size={18} strokeWidth={2.2} color={C.text} />, C.fogDeep, t('language'), () => setLangOpen((v) => !v), current, langOpen)}
                {langOpen && (
                    <Animated.View entering={FadeIn.duration(200)} exiting={FadeOut.duration(120)} style={[styles.langs, styles.rowLine]}>
                        {[{ code: null as Language | null, name: t('languageAuto') }, ...LANGUAGES].map((l) => {
                            const sel = state.language === l.code;
                            return (
                                <PressableScale key={l.code ?? 'auto'} onPress={() => setLanguage(l.code)} style={[styles.langChip, sel && { backgroundColor: C.sel }]}>
                                    <Text style={[styles.langTxt, sel && { color: C.white }]}>{l.name}</Text>
                                </PressableScale>
                            );
                        })}
                    </Animated.View>
                )}
                {row(<PlayCircle size={18} strokeWidth={2.2} color={C.ink} />, C.sun, t('replayIntro'), () => nav.navigate('Intro', { replay: true }), undefined, true)}
            </Animated.View>

            <Animated.Text entering={enter(8)} style={styles.kicker}>
                {t('appName')}
            </Animated.Text>
            <Animated.View entering={enter(8)} style={styles.group}>
                {row(<Heart size={18} strokeWidth={2.2} color={C.white} fill={C.white} />, C.coral, t('supportRow'), () => nav.navigate('Support'))}
                {row(
                    <Star size={18} strokeWidth={2.2} color={C.ink} fill={C.ink} />,
                    C.sun,
                    t('rateRow'),
                    () => {
                        markNudgeDone('review');
                        Linking.openURL(REVIEW_URL).catch(() => undefined);
                    },
                    undefined,
                    true,
                )}
            </Animated.View>

            <Animated.Text entering={enter(9)} style={styles.kicker}>
                {t('infoSection')}
            </Animated.Text>
            <Animated.View entering={enter(9)} style={styles.group}>
                {row(<ShieldCheck size={18} strokeWidth={2.2} color={C.greenText} />, C.mintSoft, t('privacyPolicy'), () => nav.navigate('Legal', { doc: 'privacy' }))}
                {row(<FileText size={18} strokeWidth={2.2} color={C.violetDeep} />, C.violetSoft, t('termsOfUse'), () => nav.navigate('Legal', { doc: 'terms' }))}
                {row(<Mail size={18} strokeWidth={2.2} color={C.amberText} />, C.sunSoft, t('contactUs'), () => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=UniStats`).catch(() => undefined), undefined, true)}
            </Animated.View>

            <Animated.View entering={enter(10)} style={styles.privacy}>
                <ShieldCheck size={20} strokeWidth={2.2} color={C.greenText} />
                <Text style={{ flex: 1, fontFamily: F.body, fontSize: 14, lineHeight: 20, color: C.greenText }}>{t('privacyLine')}</Text>
            </Animated.View>

            <Animated.View entering={enter(11)} style={{ alignItems: 'center', gap: 6 }}>
                <PressableScale onPress={confirmReset} style={{ padding: 10 }}>
                    <Text style={{ fontFamily: F.bold, fontSize: 15, color: C.redText }}>{t('resetAll')}</Text>
                </PressableScale>
                <Text style={{ fontFamily: F.body, fontSize: 12, color: C.text3 }}>{t('version', { v: Constants.expoConfig?.version ?? '1.0.0' })}</Text>
            </Animated.View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: TAB_SPACE, gap: 12 },
    h1: { fontFamily: F.display, fontSize: 32, color: C.text },
    card: { backgroundColor: C.ink, borderRadius: 28, padding: 18, gap: 14 },
    avatar: { width: 60, height: 60, borderRadius: 20, backgroundColor: C.sun, alignItems: 'center', justifyContent: 'center' },
    tag: { paddingHorizontal: 12, paddingVertical: 7, borderRadius: 999, backgroundColor: C.inkSoft },
    tagTxt: { fontFamily: F.semi, fontSize: 13, color: C.white },
    kicker: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1, textTransform: 'uppercase', color: C.text3, marginTop: 4 },
    group: { backgroundColor: C.surface, borderRadius: 22, overflow: 'hidden' },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
    rowLine: { borderBottomWidth: 1, borderBottomColor: C.line },
    rowIcon: { width: 36, height: 36, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
    rowTxt: { flexShrink: 0, maxWidth: '72%', fontFamily: F.semi, fontSize: 16, color: C.text },
    // The label keeps its width (long German words never break); the value takes what is left.
    rowRight: { flex: 1, minWidth: 0, textAlign: 'right', fontFamily: F.body, fontSize: 13, color: C.text3 },
    langs: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingHorizontal: 16, paddingTop: 2, paddingBottom: 18 },
    langChip: { paddingHorizontal: 14, paddingVertical: 9, borderRadius: 999, backgroundColor: C.fog },
    langTxt: { fontFamily: F.semi, fontSize: 14, color: C.text },
    themes: { flexDirection: 'row', gap: 10, padding: 14 },
    themeFrame: { borderRadius: 18, borderWidth: 2.5, borderColor: 'transparent', padding: 3 },
    themeCheck: { position: 'absolute', top: -2, right: -2, width: 22, height: 22, borderRadius: 11, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center', borderWidth: 2, borderColor: C.surface },
    themeLbl: { fontFamily: F.bold, fontSize: 14, color: C.text, textAlign: 'center', marginTop: 8 },
    mini: { height: 96, borderRadius: 14, padding: 7, gap: 4, borderWidth: 1, borderColor: C.line },
    miniHero: { height: 30, borderRadius: 7 },
    miniTile: { flex: 1, height: 22, borderRadius: 6 },
    miniRow: { height: 14, borderRadius: 5 },
    privacy: { backgroundColor: C.mintSoft, borderRadius: 20, padding: 14, flexDirection: 'row', alignItems: 'center', gap: 10 },
}));
