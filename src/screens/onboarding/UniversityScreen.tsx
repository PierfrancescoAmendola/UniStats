import { Check, Search } from 'lucide-react-native';
import React, { memo, useCallback, useDeferredValue, useMemo, useState } from 'react';
import { FlatList, StyleSheet, Text, TextInput, View } from 'react-native';
import Animated, { FadeIn } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { enter, PressableScale, pop } from '../../components/motion';
import { PrimaryButton, ProgressHeader } from '../../components/ui';
import { searchUniversities, UniKind, University, UNIVERSITIES } from '../../data/universities';
import { presetsFor } from '../../data/presets';
import { ScreenProps } from '../../navigation/types';
import { useApp } from '../../store/AppStore';
import { C, F, MONO_COLORS, themed } from '../../theme/tokens';

const KINDS: (UniKind | 'all')[] = ['all', 'state', 'private', 'online'];

const UniRow = memo(({ item, selected, onPick, kindLabel }: { item: University; selected: boolean; onPick: (id: string) => void; kindLabel: string }) => {
    const color = MONO_COLORS[UNIVERSITIES.indexOf(item) % MONO_COLORS.length];
    return (
        <PressableScale onPress={() => onPick(item.id)} accessibilityState={{ selected }} style={[styles.row, selected && { borderColor: C.violet }]}>
            <View style={[styles.mono, { backgroundColor: color }]}>
                <Text style={styles.monoTxt}>{item.short}</Text>
            </View>
            <View style={{ flex: 1 }}>
                <Text style={styles.uniName}>{item.name}</Text>
                <Text style={styles.uniCity}>
                    {item.city} · {kindLabel}
                </Text>
            </View>
            {selected && (
                <Animated.View entering={pop()} style={styles.check}>
                    <Check size={16} strokeWidth={3} color={C.white} />
                </Animated.View>
            )}
        </PressableScale>
    );
});
UniRow.displayName = 'UniRow';

export const UniversityScreen = ({ navigation, route }: ScreenProps<'University'>) => {
    const { t, state, setProfile } = useApp();
    const insets = useSafeAreaInsets();
    const edit = route.params?.edit;
    const [q, setQ] = useState('');
    const [kind, setKind] = useState<UniKind | 'all'>('all');
    const [picked, setPicked] = useState<string | null>(state.profile.universityId);
    // Filtering follows the typing at low priority, so the input never drops letters.
    const deferredQ = useDeferredValue(q);
    const list = useMemo(() => searchUniversities(deferredQ, kind), [deferredQ, kind]);

    const choose = (id: string | null) => {
        const level = state.profile.level;
        const changed = id !== state.profile.universityId;
        const first = presetsFor(id, level)[0];
        setProfile({
            universityId: id,
            ...(changed ? { ruleId: first?.id ?? `default-${level}`, customRule: null, bonusInput: {} } : {}),
        });
        navigation.navigate('Rules', edit ? { edit } : undefined);
    };

    const renderItem = useCallback(
        ({ item }: { item: University }) => <UniRow item={item} selected={picked === item.id} onPick={setPicked} kindLabel={t(`kindLower_${item.kind}` as const)} />,
        [picked, t],
    );

    return (
        <View style={[styles.root, { paddingTop: insets.top + 12 }]}>
            <View style={{ paddingHorizontal: 24, gap: 16 }}>
                <ProgressHeader step={2} total={3} label={t('stepOf', { n: 2, total: 3 })} backLabel={t('back')} />
                <Animated.Text entering={enter(0)} style={styles.h1}>
                    {t('uniTitle')}
                </Animated.Text>
                <Animated.View entering={enter(1)} style={styles.search}>
                    <Search size={20} strokeWidth={2.2} color={C.text3} />
                    <TextInput
                        defaultValue=""
                        onChangeText={setQ}
                        placeholder={t('uniSearch')}
                        placeholderTextColor="#76768A"
                        accessibilityLabel={t('uniSearch')}
                        style={styles.input}
                        autoCorrect={false}
                        returnKeyType="search"
                    />
                </Animated.View>
                <Animated.View entering={enter(2)} style={{ flexDirection: 'row', gap: 8, flexWrap: 'wrap' }}>
                    {KINDS.map((k) => (
                        <PressableScale key={k} onPress={() => setKind(k)} style={[styles.chip, kind === k && { backgroundColor: C.sel }]}>
                            <Text style={[styles.chipTxt, kind === k && { color: C.white }]}>{t(`kind_${k}` as const)}</Text>
                        </PressableScale>
                    ))}
                </Animated.View>
            </View>
            <FlatList
                data={list}
                keyExtractor={(u) => u.id}
                renderItem={renderItem}
                extraData={picked}
                initialNumToRender={12}
                windowSize={7}
                keyboardShouldPersistTaps="handled"
                keyboardDismissMode="on-drag"
                contentContainerStyle={{ paddingHorizontal: 24, paddingTop: 14, paddingBottom: 180, gap: 8 }}
                ListEmptyComponent={
                    <Animated.Text entering={FadeIn} style={styles.empty}>
                        {t('uniNoResults', { q })}
                    </Animated.Text>
                }
                ListFooterComponent={
                    <PressableScale onPress={() => choose(null)} style={{ padding: 14 }}>
                        <Text style={styles.link}>{t('uniNotFound')}</Text>
                    </PressableScale>
                }
            />
            <View style={[styles.footer, { paddingBottom: insets.bottom + 16 }]}>
                <PrimaryButton label={t('continue')} disabled={!picked} onPress={() => choose(picked)} />
            </View>
        </View>
    );
};

const styles = themed(() => StyleSheet.create({
    root: { flex: 1, backgroundColor: C.fog },
    h1: { fontFamily: F.display, fontSize: 34, lineHeight: 36, color: C.text },
    search: { flexDirection: 'row', alignItems: 'center', gap: 10, height: 54, borderRadius: 18, backgroundColor: C.surface, paddingHorizontal: 16, borderWidth: 2, borderColor: C.violet },
    input: { flex: 1, fontFamily: F.body, fontSize: 17, color: C.text, height: 50 },
    chip: { paddingHorizontal: 14, paddingVertical: 8, borderRadius: 999, backgroundColor: C.surface },
    chipTxt: { fontFamily: F.semi, fontSize: 14, color: C.text },
    row: { flexDirection: 'row', alignItems: 'center', gap: 12, padding: 12, borderRadius: 20, backgroundColor: C.surface, borderWidth: 2, borderColor: 'transparent' },
    mono: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    monoTxt: { fontFamily: F.display, fontSize: 15, color: C.ink },
    uniName: { fontFamily: F.bold, fontSize: 16, color: C.text },
    uniCity: { fontFamily: F.body, fontSize: 13, color: C.text3, marginTop: 1 },
    check: { width: 28, height: 28, borderRadius: 14, backgroundColor: C.violet, alignItems: 'center', justifyContent: 'center' },
    empty: { fontFamily: F.body, fontSize: 15, color: C.text2, textAlign: 'center', paddingVertical: 24 },
    link: { fontFamily: F.semi, fontSize: 15, color: C.violet, textAlign: 'center' },
    footer: { position: 'absolute', left: 0, right: 0, bottom: 0, paddingTop: 12, paddingHorizontal: 24, backgroundColor: C.fog },
}));
