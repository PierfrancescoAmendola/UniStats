import { useNavigation } from '@react-navigation/native';
import { ChevronRight, GraduationCap, Info, Target, TrendingUp } from 'lucide-react-native';
import React from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import Animated from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale } from '../components/motion';
import { TAB_SPACE } from '../navigation/TabBar';
import { useApp } from '../store/AppStore';
import { C, F, themed } from '../theme/tokens';

export const ToolsScreen = () => {
    const nav = useNavigation();
    const { t, grad, state } = useApp();
    const insets = useSafeAreaInsets();
    const hasExams = state.exams.some((e) => e.grade !== null);

    return (
        <ScrollView style={{ backgroundColor: C.fog }} contentContainerStyle={[styles.content, { paddingTop: insets.top + 14 }]} showsVerticalScrollIndicator={false}>
            <Animated.View entering={enter(0)} style={{ gap: 2 }}>
                <Text style={styles.h1}>{t('toolsTitle')}</Text>
                <Text style={styles.lead}>{t('toolsBody')}</Text>
            </Animated.View>

            <Animated.View entering={enter(1)}>
                <PressableScale onPress={() => nav.navigate('GradSim')} style={[styles.big, { backgroundColor: C.sun }]}>
                    <Text style={styles.ghost}>{hasExams ? grad.final : 110}</Text>
                    <View style={[styles.icon, { backgroundColor: C.ink }]}>
                        <GraduationCap size={22} strokeWidth={2} color={C.sun} />
                    </View>
                    <Text style={styles.bigTitle}>{t('qGrad')}</Text>
                    <Text style={styles.bigSub}>{t('qGradSub')}</Text>
                </PressableScale>
            </Animated.View>

            <View style={{ flexDirection: 'row', gap: 12 }}>
                <Animated.View entering={enter(2)} style={{ flex: 1 }}>
                    <PressableScale onPress={() => nav.navigate('Needed')} style={[styles.half, { backgroundColor: C.coral }]}>
                        <View style={[styles.icon, { backgroundColor: C.ink }]}>
                            <Target size={22} strokeWidth={2.2} color={C.coral} />
                        </View>
                        <View style={{ flex: 1 }} />
                        <Text style={styles.halfTitle}>{t('qNeed')}</Text>
                        <Text style={styles.halfSub}>{t('qNeedSub')}</Text>
                    </PressableScale>
                </Animated.View>
                <Animated.View entering={enter(3)} style={{ flex: 1 }}>
                    <PressableScale onPress={() => nav.navigate('WhatIf')} style={[styles.half, { backgroundColor: C.violet }]}>
                        <View style={[styles.icon, { backgroundColor: C.surface }]}>
                            <TrendingUp size={22} strokeWidth={2.2} color={C.violet} />
                        </View>
                        <View style={{ flex: 1 }} />
                        <Text style={[styles.halfTitle, { color: C.white }]}>{t('qWhatIf')}</Text>
                        <Text style={[styles.halfSub, { color: C.violetSoft }]}>{t('qWhatIfSub')}</Text>
                    </PressableScale>
                </Animated.View>
            </View>

            <Animated.View entering={enter(4)}>
                <PressableScale onPress={() => nav.navigate('HowCalc')} style={styles.row}>
                    <View style={[styles.icon, { backgroundColor: C.mintSoft }]}>
                        <Info size={22} strokeWidth={2.2} color={C.greenText} />
                    </View>
                    <View style={{ flex: 1 }}>
                        <Text style={{ fontFamily: F.bold, fontSize: 16, color: C.text }}>{t('qHow')}</Text>
                        <Text style={{ fontFamily: F.body, fontSize: 13, color: C.text3 }}>{t('qHowSub')}</Text>
                    </View>
                    <ChevronRight size={18} strokeWidth={2.4} color={C.text4} />
                </PressableScale>
            </Animated.View>
        </ScrollView>
    );
};

const styles = themed(() => StyleSheet.create({
    content: { paddingHorizontal: 20, paddingBottom: TAB_SPACE, gap: 12 },
    h1: { fontFamily: F.display, fontSize: 32, color: C.text },
    lead: { fontFamily: F.body, fontSize: 15, lineHeight: 21, color: C.text2 },
    big: { borderRadius: 28, padding: 18, gap: 10, minHeight: 170, overflow: 'hidden' },
    ghost: { position: 'absolute', right: -8, bottom: -48, fontFamily: F.display, fontSize: 120, color: C.sunDeep, opacity: 0.85 },
    icon: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    bigTitle: { fontFamily: F.display, fontSize: 26, lineHeight: 28, color: C.text },
    bigSub: { fontFamily: F.body, fontSize: 14, color: C.text },
    half: { borderRadius: 28, padding: 16, gap: 8, height: 200 },
    halfTitle: { fontFamily: F.display, fontSize: 22, lineHeight: 24, color: C.text },
    halfSub: { fontFamily: F.body, fontSize: 13, lineHeight: 18, color: C.text },
    row: { backgroundColor: C.surface, borderRadius: 24, padding: 16, flexDirection: 'row', alignItems: 'center', gap: 12 },
}));
