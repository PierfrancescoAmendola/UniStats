import { CommonActions } from '@react-navigation/native';
import * as Haptics from 'expo-haptics';
import { Check, FileUp, Plus } from 'lucide-react-native';
import React, { useEffect } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeInDown, ZoomIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale } from '../../components/motion';
import { findUniversity } from '../../data/universities';
import { RootParams, ScreenProps } from '../../navigation/types';
import { useApp } from '../../store/AppStore';
import { L, F } from '../../theme/tokens';

export const ReadyScreen = ({ navigation }: ScreenProps<'Ready'>) => {
    const { t, state, setOnboarded } = useApp();
    const insets = useSafeAreaInsets();
    const p = state.profile;
    const uni = findUniversity(p.universityId);

    useEffect(() => {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success).catch(() => undefined);
    }, []);

    const finish = (next?: keyof RootParams) => {
        setOnboarded(true);
        const routes: { name: keyof RootParams }[] = [{ name: 'Tabs' }];
        if (next) routes.push({ name: next });
        navigation.dispatch(CommonActions.reset({ index: routes.length - 1, routes }));
    };

    const parts = [p.course, uni?.short ? uni.name : null, t(`level_${p.level}` as const)].filter(Boolean);

    return (
        <View style={[styles.root, { paddingTop: insets.top + 50, paddingBottom: insets.bottom + 16 }]}>
            <Animated.View entering={ZoomIn.duration(700).springify().damping(12)} style={styles.sunBlob} />
            <Animated.View entering={ZoomIn.delay(150).springify().damping(10)} style={styles.checkTile}>
                <Check size={36} strokeWidth={2.8} color={L.greenText} />
            </Animated.View>
            <Animated.View entering={enter(2)} style={{ gap: 10, marginTop: 18 }}>
                <Text style={styles.h1}>{p.name ? t('readyTitle', { name: p.name }) : t('readyTitleNoName')}</Text>
                <Text style={styles.body}>{parts.join(' · ')}</Text>
            </Animated.View>
            <View style={{ flex: 1 }} />
            <View style={{ gap: 12 }}>
                <Animated.View entering={FadeInDown.delay(350).springify()}>
                    <PressableScale onPress={() => finish('ImportPdf')} style={[styles.option, { backgroundColor: L.white }]}>
                        <View style={[styles.icon, { backgroundColor: L.violet }]}>
                            <FileUp size={26} strokeWidth={2} color={L.white} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.optTitle}>{t('importPdf')}</Text>
                            <Text style={[styles.optSub, { color: L.text3 }]}>{t('importPdfSub')}</Text>
                        </View>
                        <View style={styles.fast}>
                            <Text style={styles.fastTxt}>{t('fast')}</Text>
                        </View>
                    </PressableScale>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(430).springify()}>
                    <PressableScale onPress={() => finish('AddExam')} style={[styles.option, { backgroundColor: 'rgba(255,255,255,0.55)' }]}>
                        <View style={[styles.icon, { backgroundColor: L.ink }]}>
                            <Plus size={26} strokeWidth={2.4} color={L.white} />
                        </View>
                        <View style={{ flex: 1, gap: 2 }}>
                            <Text style={styles.optTitle}>{t('addManually')}</Text>
                            <Text style={[styles.optSub, { color: '#1F3D30' }]}>{t('addManuallySub')}</Text>
                        </View>
                    </PressableScale>
                </Animated.View>
                <Animated.View entering={FadeInDown.delay(510).springify()}>
                    <PressableScale onPress={() => finish()} style={{ padding: 12 }}>
                        <Text style={styles.later}>{t('later')}</Text>
                    </PressableScale>
                </Animated.View>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    root: { flex: 1, backgroundColor: L.mint, paddingHorizontal: 24, overflow: 'hidden' },
    sunBlob: { position: 'absolute', right: -80, top: -40, width: 260, height: 260, borderRadius: 130, backgroundColor: L.sun },
    checkTile: { width: 72, height: 72, borderRadius: 24, backgroundColor: L.white, alignItems: 'center', justifyContent: 'center' },
    h1: { fontFamily: F.display, fontSize: 40, lineHeight: 42, color: L.greenDeep },
    body: { fontFamily: F.body, fontSize: 17, lineHeight: 25, color: L.greenDeep },
    option: { borderRadius: 24, padding: 18, flexDirection: 'row', alignItems: 'center', gap: 14 },
    icon: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    optTitle: { fontFamily: F.bold, fontSize: 17, color: L.ink },
    optSub: { fontFamily: F.body, fontSize: 14 },
    fast: { backgroundColor: L.sun, borderRadius: 8, paddingHorizontal: 8, paddingVertical: 4 },
    fastTxt: { fontFamily: F.bold, fontSize: 12, color: L.ink },
    later: { fontFamily: F.bold, fontSize: 16, color: L.greenDeep, textAlign: 'center' },
});
