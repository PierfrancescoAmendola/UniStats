import * as Haptics from 'expo-haptics';
import React, { useEffect } from 'react';
import { AccessibilityInfo, StyleSheet, View } from 'react-native';
import Animated, {
    Easing,
    runOnJS,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
} from 'react-native-reanimated';
import Svg, { Circle, Path } from 'react-native-svg';
import { F, L } from '../theme/tokens';

// Geometry copied from assets/brand/icon.svg (1024 grid), framed to the mark's bounding box.
const BOX = { x: 170, y: 180, w: 720, h: 690 };
const SIZE = 196;
const k = SIZE / BOX.w;
const BARS = [
    { x: 190, y: 600, h: 250, color: L.coral },
    { x: 404, y: 482, h: 368, color: L.sun },
    { x: 618, y: 364, h: 486, color: L.mintBright },
];
const BAR_W = 164;
const CAP = { cx: 700, cy: 300, w: 420, h: 240 };
const WORD = 'UniStats'.split('');

const Bar = ({ i, x, y, h, color }: { i: number; x: number; y: number; h: number; color: string }) => {
    const s = useSharedValue(0);
    useEffect(() => {
        s.value = withDelay(120 + i * 110, withSpring(1, { damping: 11, stiffness: 140, mass: 0.8 }));
    }, [i, s]);
    const a = useAnimatedStyle(() => ({ transform: [{ scaleY: s.value }] }));
    return (
        <Animated.View
            style={[
                {
                    position: 'absolute',
                    left: (x - BOX.x) * k,
                    top: (y - BOX.y) * k,
                    width: BAR_W * k,
                    height: h * k,
                    borderRadius: 46 * k,
                    backgroundColor: color,
                    transformOrigin: 'bottom',
                },
                a,
            ]}
        />
    );
};

const Letter = ({ ch, i }: { ch: string; i: number }) => {
    const v = useSharedValue(0);
    useEffect(() => {
        v.value = withDelay(780 + i * 45, withSpring(1, { damping: 14, stiffness: 160 }));
    }, [i, v]);
    const a = useAnimatedStyle(() => ({ opacity: v.value, transform: [{ translateY: (1 - v.value) * 18 }] }));
    // "Uni" in white, "Stats" in sun: the two halves of the name.
    return <Animated.Text style={[styles.letter, { color: i < 3 ? L.white : L.sun }, a]}>{ch}</Animated.Text>;
};

/**
 * Plays once at launch over the app: the three bars rise, the cap drops onto the tallest one,
 * the name types in, then the whole layer zooms and fades to reveal the first screen.
 * The native splash is the same violet, so the hand-off is seamless.
 */
export const LaunchAnimation = ({ onDone }: { onDone: () => void }) => {
    const cap = useSharedValue(0);
    const out = useSharedValue(0);

    useEffect(() => {
        let cancelled = false;
        const land = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light).catch(() => undefined);
        const finish = () => {
            if (!cancelled) onDone();
        };
        AccessibilityInfo.isReduceMotionEnabled()
            .catch(() => false)
            .then((reduced) => {
                if (cancelled) return;
                if (reduced) {
                    cap.value = 1;
                    out.value = withDelay(500, withTiming(1, { duration: 250 }, (ok) => ok && runOnJS(finish)()));
                    return;
                }
                cap.value = withDelay(
                    480,
                    withSpring(1, { damping: 9, stiffness: 150, mass: 0.9 }, (ok) => {
                        if (ok) runOnJS(land)();
                    }),
                );
                out.value = withDelay(1500, withTiming(1, { duration: 420, easing: Easing.in(Easing.cubic) }, (ok) => ok && runOnJS(finish)()));
            });
        return () => {
            cancelled = true;
        };
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, []);

    const capStyle = useAnimatedStyle(() => ({
        opacity: Math.min(1, cap.value * 3),
        transform: [{ translateY: (1 - cap.value) * -140 }, { rotate: `${(1 - cap.value) * -28}deg` }],
    }));
    const layer = useAnimatedStyle(() => ({ opacity: 1 - out.value }));
    const content = useAnimatedStyle(() => ({ transform: [{ scale: 1 + out.value * 0.35 }] }));

    return (
        <Animated.View pointerEvents="none" style={[StyleSheet.absoluteFill, styles.root, layer]}>
            <View style={[styles.blob, { top: -120, right: -140 }]} />
            <View style={[styles.blob, { bottom: -150, left: -160, opacity: 0.05 }]} />
            <Animated.View style={[{ alignItems: 'center' }, content]}>
                <View style={{ width: SIZE, height: BOX.h * k }}>
                    {BARS.map((b, i) => (
                        <Bar key={i} i={i} {...b} />
                    ))}
                    <Animated.View
                        style={[
                            { position: 'absolute', left: (CAP.cx - CAP.w / 2 - BOX.x) * k, top: (CAP.cy - CAP.h / 2 - BOX.y) * k, width: CAP.w * k, height: CAP.h * k },
                            capStyle,
                        ]}
                    >
                        <Svg width="100%" height="100%" viewBox="-210 -120 420 240">
                            <Path d="M-96 -9 L-96 43 C-96 72 -48 91 0 91 C48 91 96 72 96 43 L96 -9 L0 28 Z" fill={L.ink} />
                            <Path d="M0 -96 L169 -34 L0 28 L-169 -34 Z" fill={L.ink} />
                            <Path d="M0 -34 L120 -10 L120 60" stroke={L.sun} strokeWidth={17} fill="none" strokeLinecap="round" strokeLinejoin="round" />
                            <Circle cx={120} cy={74} r={21} fill={L.sun} />
                        </Svg>
                    </Animated.View>
                </View>
                <View style={styles.word}>
                    {WORD.map((ch, i) => (
                        <Letter key={i} ch={ch} i={i} />
                    ))}
                </View>
            </Animated.View>
        </Animated.View>
    );
};

const styles = StyleSheet.create({
    root: { backgroundColor: L.violet, alignItems: 'center', justifyContent: 'center', zIndex: 100, overflow: 'hidden' },
    blob: { position: 'absolute', width: 380, height: 380, borderRadius: 190, backgroundColor: '#FFFFFF', opacity: 0.07 },
    word: { flexDirection: 'row', marginTop: 26 },
    letter: { fontFamily: F.display, fontSize: 46, letterSpacing: -0.5, includeFontPadding: false },
});
