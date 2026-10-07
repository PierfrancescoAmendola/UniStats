import { FileText, Mail, ShieldCheck } from 'lucide-react-native';
import React from 'react';
import { Linking, ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale } from '../components/motion';
import { BackButton } from '../components/ui';
import { formatDate } from '../i18n';
import { LEGAL_UPDATED, legalText, SUPPORT_EMAIL } from '../i18n/legal';
import { ScreenProps } from '../navigation/types';
import { useApp } from '../store/AppStore';
import { C, F, themed } from '../theme/tokens';

export const LegalScreen = ({ route }: ScreenProps<'Legal'>) => {
    const { t, lang } = useApp();
    const insets = useSafeAreaInsets();
    const doc = route.params.doc;
    const text = legalText(lang, doc);
    const privacy = doc === 'privacy';
    const Icon = privacy ? ShieldCheck : FileText;

    return (
        <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 32 }]}>
            <BackButton label={t('back')} />
            <Animated.View entering={enter(0)} style={[styles.hero, { backgroundColor: privacy ? C.mint : C.violet }]}>
                <View style={styles.heroIcon}>
                    <Icon size={26} strokeWidth={2.2} color={privacy ? C.greenDeep : C.violet} />
                </View>
                <Text style={styles.h1}>{text.title}</Text>
                <Text style={styles.updated}>{t('lastUpdated', { d: formatDate(lang, LEGAL_UPDATED, 'long') })}</Text>
            </Animated.View>
            <Animated.Text entering={enter(1)} style={styles.intro}>
                {text.intro}
            </Animated.Text>
            {text.sections.map((s, i) => (
                <Animated.View key={s.title} entering={enter(2 + i)} style={styles.card}>
                    <View style={styles.num}>
                        <Text style={styles.numTxt}>{i + 1}</Text>
                    </View>
                    <View style={{ flex: 1, gap: 4 }}>
                        <Text style={styles.title}>{s.title}</Text>
                        <Text style={styles.body}>{s.body}</Text>
                    </View>
                </Animated.View>
            ))}
            <Animated.View entering={enter(2 + text.sections.length)}>
                <PressableScale onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}?subject=UniStats`).catch(() => undefined)} style={styles.contact}>
                    <Mail size={20} strokeWidth={2.2} color={C.white} />
                    <View style={{ flex: 1 }}>
                        <Text style={styles.contactTitle}>{t('contactUs')}</Text>
                        <Text style={styles.contactMail}>{SUPPORT_EMAIL}</Text>
                    </View>
                </PressableScale>
            </Animated.View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    content: { paddingHorizontal: 20, gap: 12 },
    hero: { borderRadius: 28, padding: 20, gap: 6, marginTop: 4 },
    heroIcon: { width: 52, height: 52, borderRadius: 16, backgroundColor: C.white, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
    h1: { fontFamily: F.display, fontSize: 30, lineHeight: 33, color: C.white },
    updated: { fontFamily: F.semi, fontSize: 13, color: C.white, opacity: 0.85 },
    intro: { fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.text2, paddingHorizontal: 2 },
    card: { backgroundColor: C.surface, borderRadius: 22, padding: 16, flexDirection: 'row', gap: 12 },
    num: { width: 30, height: 30, borderRadius: 10, backgroundColor: C.violetSoft, alignItems: 'center', justifyContent: 'center' },
    numTxt: { fontFamily: F.display, fontSize: 14, color: C.violetDeep },
    title: { fontFamily: F.bold, fontSize: 16, color: C.text },
    body: { fontFamily: F.body, fontSize: 14, lineHeight: 21, color: C.text2 },
    contact: { backgroundColor: C.violet, borderRadius: 22, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12, marginTop: 4 },
    contactTitle: { fontFamily: F.bold, fontSize: 16, color: C.white },
    contactMail: { fontFamily: F.body, fontSize: 14, color: C.white, opacity: 0.85 },
}));
