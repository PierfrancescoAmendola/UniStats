import { Heart, Star, X } from 'lucide-react-native';
import React, { useEffect, useRef, useState } from 'react';
import { Linking, Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, { FadeIn, FadeOut, SlideInDown, SlideOutDown } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { REVIEW_URL } from '../config/store';
import { useApp } from '../store/AppStore';
import { NudgeKind, pickNudge } from '../store/nudges';
import { C, F, L, themed } from '../theme/tokens';
import { PressableScale } from './motion';

/** Seconds on Home before a pop-up may appear, so it never covers the first glance. */
const DELAY_MS = 1600;
// One pop-up per app session at most.
let shownThisSession = false;

/** Test hook: lets tests start from a fresh session. */
export const resetNudgeSession = () => {
    shownThisSession = false;
};

/**
 * Shows, by chance and only to regular users, a card asking for an App Store review or a
 * donation (rules in store/nudges.ts). Mounted above the navigator; `active` is true while
 * the Home tab is on screen and nothing else (launch animation) covers it.
 */
export const NudgeHost = ({ active, onSupport }: { active: boolean; onSupport: () => void }) => {
    const { t, state, answerNudge } = useApp();
    const insets = useSafeAreaInsets();
    const [kind, setKind] = useState<NudgeKind | null>(null);
    const latest = useRef(state);
    latest.current = state;

    useEffect(() => {
        if (!active || shownThisSession || !state.onboarded) return;
        const id = setTimeout(() => {
            const s = latest.current;
            const pick = pickNudge(s.nudges, { now: Date.now(), exams: s.exams.length, shownThisSession });
            // Decided once per session: a "no" from the coin flip also waits for the next launch.
            shownThisSession = true;
            if (pick) setKind(pick);
        }, DELAY_MS);
        return () => clearTimeout(id);
    }, [active, state.onboarded]);

    if (!kind) return null;
    const review = kind === 'review';

    const close = (outcome: 'done' | 'later') => {
        answerNudge(kind, outcome);
        setKind(null);
    };
    const primary = () => {
        if (review) {
            Linking.openURL(REVIEW_URL).catch(() => undefined);
            close('done');
        } else {
            // A donation counts as done only when the purchase succeeds (Support screen).
            close('later');
            onSupport();
        }
    };

    return (
        <View style={StyleSheet.absoluteFill} pointerEvents="box-none" testID="nudge">
            <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(180)} style={[StyleSheet.absoluteFill, styles.backdrop]}>
                <Pressable accessibilityLabel={t('notNow')} style={StyleSheet.absoluteFill} onPress={() => close('later')} />
            </Animated.View>
            <View style={styles.dock} pointerEvents="box-none">
            <Animated.View
                entering={SlideInDown.springify().damping(20).stiffness(220)}
                exiting={SlideOutDown.duration(200)}
                style={[styles.card, { marginBottom: Math.max(insets.bottom, 16) }]}
                accessibilityViewIsModal
            >
                <View style={styles.xWrap}>
                    <PressableScale accessibilityLabel={t('close')} onPress={() => close('later')} style={styles.x} scaleTo={0.9} hitSlop={8}>
                        <X size={18} strokeWidth={2.6} color={C.text3} />
                    </PressableScale>
                </View>
                <View style={[styles.icon, { backgroundColor: review ? L.sun : L.coral }]}>
                    {review ? <Star size={30} strokeWidth={2.2} color={L.ink} fill={L.ink} /> : <Heart size={30} strokeWidth={2.2} color={L.white} fill={L.white} />}
                </View>
                {review && (
                    <View style={styles.stars}>
                        {[0, 1, 2, 3, 4].map((i) => (
                            <Star key={i} size={22} strokeWidth={2} color={L.sunDeep} fill={L.sun} />
                        ))}
                    </View>
                )}
                <Text style={styles.title}>{review ? t('nudgeReviewTitle') : t('nudgeTipTitle')}</Text>
                <Text style={styles.body}>{review ? t('nudgeReviewBody') : t('nudgeTipBody')}</Text>
                <PressableScale onPress={primary} style={[styles.cta, { backgroundColor: review ? C.violet : L.coral }]}>
                    <Text style={styles.ctaTxt}>{review ? t('nudgeReviewCta') : t('nudgeTipCta')}</Text>
                </PressableScale>
                <PressableScale onPress={() => close('later')} style={styles.later}>
                    <Text style={styles.laterTxt}>{t('notNow')}</Text>
                </PressableScale>
            </Animated.View>
            </View>
        </View>
    );
};

const styles = themed(() => StyleSheet.create({
    backdrop: { backgroundColor: 'rgba(10, 8, 30, 0.55)' },
    // Docked at the bottom, centred, never wider than 520 (iPad).
    dock: { position: 'absolute', left: 16, right: 16, bottom: 0, alignItems: 'center' },
    card: {
        width: '100%', maxWidth: 520,
        backgroundColor: C.surface, borderRadius: 30, paddingHorizontal: 22, paddingTop: 26, paddingBottom: 12, alignItems: 'center', gap: 10,
    },
    // Positioned by a plain View: PressableScale keeps only flex/size props on its touchable.
    xWrap: { position: 'absolute', top: 14, right: 14, zIndex: 1 },
    x: { width: 34, height: 34, borderRadius: 17, backgroundColor: C.fog, alignItems: 'center', justifyContent: 'center' },
    icon: { width: 64, height: 64, borderRadius: 20, alignItems: 'center', justifyContent: 'center' },
    stars: { flexDirection: 'row', gap: 4 },
    title: { fontFamily: F.display, fontSize: 24, lineHeight: 28, color: C.text, textAlign: 'center' },
    body: { fontFamily: F.body, fontSize: 15, lineHeight: 22, color: C.text2, textAlign: 'center', paddingHorizontal: 6 },
    cta: { alignSelf: 'stretch', height: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', marginTop: 6 },
    ctaTxt: { fontFamily: F.bold, fontSize: 17, color: C.white },
    later: { padding: 12 },
    laterTxt: { fontFamily: F.bold, fontSize: 15, color: C.text3 },
}));
