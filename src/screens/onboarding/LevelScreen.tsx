import { Check } from 'lucide-react-native';
import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, interpolateColor, useAnimatedStyle, useSharedValue, withSpring } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale, SPRING, tap, pop, LAYOUT } from '../../components/motion';
import { PrimaryButton, ProgressHeader } from '../../components/ui';
import { Level } from '../../engine/types';
import { ScreenProps } from '../../navigation/types';
import { LEVEL_DEFAULTS, useApp } from '../../store/AppStore';
import { C, F, themed } from '../../theme/tokens';

const LEVELS: { id: Level; badge: string; color: string }[] = [
    { id: 'L', badge: 'L', color: C.sun },
    { id: 'LM', badge: 'LM', color: C.coral },
    { id: 'LMCU', badge: 'CU', color: C.mint },
];

const LevelCard = ({ selected, badge, color, title, sub, onPress }: { selected: boolean; badge: string; color: string; title: string; sub: string; onPress: () => void }) => {
    const p = useSharedValue(selected ? 1 : 0);
    useEffect(() => {
        p.value = withSpring(selected ? 1 : 0, SPRING);
    }, [selected, p]);
    // Colours copied out of the live palette: worklets must not capture the mutable `C` object.
    const [cardBg, ttlFg, sbFg, radioBg, violet, white, violetSoft, sun] = [C.surface, C.text, C.text3, C.fog, C.violet, C.white, C.violetSoft, C.sun];
    const card = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [cardBg, violet]) }));
    const ttl = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [ttlFg, white]) }));
    const sb = useAnimatedStyle(() => ({ color: interpolateColor(p.value, [0, 1], [sbFg, violetSoft]) }));
    const radio = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [radioBg, sun]), transform: [{ scale: 0.9 + p.value * 0.1 }] }));
    return (
        <PressableScale onPress={onPress} accessibilityState={{ selected }}>
            <Animated.View style={[styles.card, card]}>
                <View style={[styles.badge, { backgroundColor: color }]}>
                    <Text style={styles.badgeTxt}>{badge}</Text>
                </View>
                <View style={{ flex: 1, gap: 2 }}>
                    <Animated.Text style={[styles.cardTitle, ttl]}>{title}</Animated.Text>
                    <Animated.Text style={[styles.cardSub, sb]}>{sub}</Animated.Text>
                </View>
                <Animated.View style={[styles.radio, radio]}>
                    {selected && (
                        <Animated.View entering={pop()}>
                            <Check size={16} strokeWidth={3} color={C.ink} />
                        </Animated.View>
                    )}
                </Animated.View>
            </Animated.View>
        </PressableScale>
    );
};

export const LevelScreen = ({ navigation, route }: ScreenProps<'Level'>) => {
    const { t, state, setProfile } = useApp();
    const insets = useSafeAreaInsets();
    const edit = route.params?.edit;
    const [level, setLevel] = useState<Level>(state.profile.level);
    const [years, setYears] = useState(state.profile.level === 'LMCU' ? state.profile.years : 5);

    const confirm = () => {
        const d = LEVEL_DEFAULTS[level];
        const y = level === 'LMCU' ? years : d.years;
        const changed = level !== state.profile.level;
        setProfile({
            level,
            years: y,
            totalCfu: level === 'LMCU' ? y * 60 : d.totalCfu,
            ...(changed ? { ruleId: `default-${level}`, customRule: null, bonusInput: {} } : {}),
        });
        navigation.navigate('University', edit ? { edit } : undefined);
    };

    return (
        <View style={[styles.root, { paddingTop: insets.top + 12, paddingBottom: insets.bottom + 16 }]}>
            <ProgressHeader step={1} total={3} label={t('stepOf', { n: 1, total: 3 })} backLabel={t('back')} />
            <Animated.View entering={enter(0)} style={{ gap: 8, marginTop: 20 }}>
                <Text style={styles.h1}>{t('levelTitle')}</Text>
                <Text style={styles.lead}>{t('levelBody')}</Text>
            </Animated.View>
            <Animated.View layout={LAYOUT} style={{ gap: 12, marginTop: 20 }}>
                {LEVELS.map((l, i) => (
                    <Animated.View key={l.id} entering={enter(i + 1)}>
                        <LevelCard
                            selected={level === l.id}
                            badge={l.badge}
                            color={l.color}
                            title={t(`level_${l.id}`)}
                            sub={t(`levelSub_${l.id}`)}
                            onPress={() => setLevel(l.id)}
                        />
                    </Animated.View>
                ))}
                {level === 'LMCU' && (
                    <Animated.View entering={FadeIn.duration(250)} exiting={FadeOut.duration(150)} style={styles.duration}>
                        <Text style={{ fontFamily: F.semi, fontSize: 14, color: C.text2 }}>{t('courseLength')}</Text>
                        <View style={{ flexDirection: 'row', gap: 8 }}>
                            {[5, 6].map((y) => (
                                <PressableScale
                                    key={y}
                                    style={[styles.yearChip, { backgroundColor: years === y ? C.sel : C.fog }]}
                                    onPress={() => setYears(y)}
                                >
                                    <Text style={{ fontFamily: F.semi, fontSize: 15, color: years === y ? C.white : C.text }}>{t('yearsCfu', { y, c: y * 60 })}</Text>
                                </PressableScale>
                            ))}
                        </View>
                    </Animated.View>
                )}
            </Animated.View>
            <View style={{ flex: 1 }} />
            <PrimaryButton
                label={t('continue')}
                onPress={() => {
                    tap();
                    confirm();
                }}
            />
        </View>
    );
};

const styles = themed(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.fog, paddingHorizontal: 24 },
    h1: { fontFamily: F.display, fontSize: 34, lineHeight: 36, color: C.text },
    lead: { fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.text2 },
    card: { flexDirection: 'row', alignItems: 'center', gap: 14, padding: 18, borderRadius: 24 },
    badge: { width: 52, height: 52, borderRadius: 16, alignItems: 'center', justifyContent: 'center' },
    badgeTxt: { fontFamily: F.display, fontSize: 18, color: C.ink },
    cardTitle: { fontFamily: F.bold, fontSize: 19 },
    cardSub: { fontFamily: F.body, fontSize: 14, lineHeight: 19 },
    radio: { width: 28, height: 28, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    duration: { backgroundColor: C.surface, borderRadius: 20, padding: 16, gap: 10 },
    yearChip: { flex: 1, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
}));
