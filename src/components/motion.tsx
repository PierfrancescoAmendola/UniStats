import * as Haptics from 'expo-haptics';
import React, { useEffect, useState } from 'react';
import { Keyboard, LayoutChangeEvent, Pressable, PressableProps, StyleProp, StyleSheet, TextInput, TextStyle, View, ViewStyle } from 'react-native';
import Animated, {
    Easing,
    FadeInDown,
    interpolateColor,
    LinearTransition,
    useAnimatedProps,
    useAnimatedStyle,
    useSharedValue,
    withDelay,
    withSpring,
    withTiming,
    ZoomIn,
} from 'react-native-reanimated';
import { C, F, themed } from '../theme/tokens';

// Near-critically damped: settles fast with at most a hint of overshoot.
export const SPRING = { damping: 22, stiffness: 240, mass: 0.8 };

const EASE_OUT = Easing.out(Easing.cubic);

export const tap = () => {
    Haptics.selectionAsync().catch(() => undefined);
};

/** Staggered entrance used by every screen section. */
export const enter = (i: number) => rise(40 + Math.min(i, 8) * 45);

/** Single fade-and-rise, no bounce. */
export const rise = (delay = 0) => FadeInDown.duration(320).delay(delay).easing(EASE_OUT);

/** Small badges/checks popping in: one soft overshoot, then still. */
export const pop = (delay = 0) => ZoomIn.delay(delay).springify().damping(16).stiffness(260);

/** Reserved for a celebratory moment: a single visible bounce. */
export const celebrate = (delay = 0) => ZoomIn.delay(delay).springify().damping(12).stiffness(200);

/** Layout shifts (rows added/removed, sections resizing): quick and flat. */
export const LAYOUT = LinearTransition.duration(220).easing(EASE_OUT);

type ScaleProps = Omit<PressableProps, 'style'> & {
    style?: StyleProp<ViewStyle>;
    scaleTo?: number;
    haptic?: boolean;
    /** Leave the keyboard open (every other press closes it, like tapping anywhere else). */
    keepKeyboard?: boolean;
    children?: React.ReactNode;
};

/** Pressable that squishes on touch, with a light haptic tick. */
export const PressableScale = ({ style, scaleTo = 0.965, haptic = true, keepKeyboard = false, onPress, onPressIn, onPressOut, children, ...rest }: ScaleProps) => {
    const s = useSharedValue(1);
    const a = useAnimatedStyle(() => ({ transform: [{ scale: s.value }] }));
    // Layout props belong on the touchable itself, so `flex: 1` cards fill their row.
    const flat = StyleSheet.flatten(style) ?? {};
    const outer: ViewStyle = {};
    for (const k of ['flex', 'flexGrow', 'flexShrink', 'flexBasis', 'alignSelf', 'width', 'minWidth', 'maxWidth'] as const) {
        if (flat[k] !== undefined) (outer as any)[k] = flat[k];
    }
    // The animated child then fills the touchable instead of applying the same size twice.
    const inner: ViewStyle = {};
    if (outer.width !== undefined) Object.assign(inner, { width: '100%', minWidth: undefined, maxWidth: undefined });
    if (outer.flex !== undefined || outer.flexGrow !== undefined) inner.flexGrow = 1;
    return (
        <Pressable
            accessibilityRole="button"
            {...rest}
            style={outer}
            onPressIn={(e) => {
                s.value = withSpring(scaleTo, SPRING);
                onPressIn?.(e);
            }}
            onPressOut={(e) => {
                s.value = withSpring(1, SPRING);
                onPressOut?.(e);
            }}
            onPress={(e) => {
                if (!keepKeyboard) Keyboard.dismiss();
                if (haptic) tap();
                onPress?.(e);
            }}
        >
            <Animated.View style={[style, inner, a]}>{children}</Animated.View>
        </Pressable>
    );
};

const AnimatedTextInput = Animated.createAnimatedComponent(TextInput);

interface NumberProps {
    value: number;
    decimals?: number;
    sep?: string;
    style?: StyleProp<TextStyle>;
    prefix?: string;
    suffix?: string;
    duration?: number;
}

/** A number that counts toward its new value on the UI thread. */
export const AnimatedNumber = ({ value, decimals = 0, sep = ',', style, prefix = '', suffix = '', duration = 700 }: NumberProps) => {
    const v = useSharedValue(value);
    useEffect(() => {
        v.value = withTiming(value, { duration });
    }, [value, duration, v]);
    const fmt = (x: number) => {
        'worklet';
        const p = Math.pow(10, decimals);
        const r = Math.round(x * p) / p;
        const neg = r < 0;
        const s = Math.abs(r).toFixed(decimals).replace('.', sep);
        return `${prefix}${neg ? '−' : ''}${s}${suffix}`;
    };
    const props = useAnimatedProps(() => ({ text: fmt(v.value), defaultValue: fmt(v.value) }) as any);
    return (
        <AnimatedTextInput
            editable={false}
            pointerEvents="none"
            underlineColorAndroid="transparent"
            defaultValue={fmt(value)}
            animatedProps={props}
            style={[styles.number, style]}
        />
    );
};

/** Horizontal bar that grows to `progress` (0–1). */
export const Bar = ({ progress, color, track = C.track, height = 8, delay = 150 }: { progress: number; color: string; track?: string; height?: number; delay?: number }) => {
    const p = useSharedValue(0);
    useEffect(() => {
        p.value = withDelay(delay, withSpring(Math.max(0, Math.min(1, progress)), { damping: 20, stiffness: 90 }));
    }, [progress, delay, p]);
    const a = useAnimatedStyle(() => ({ width: `${p.value * 100}%` }));
    return (
        <View style={{ height, borderRadius: height / 2, backgroundColor: track, overflow: 'hidden' }}>
            <Animated.View style={[{ height, borderRadius: height / 2, backgroundColor: color }, a]} />
        </View>
    );
};

/** iOS-style switch drawn with the app colours. */
export const Toggle = ({ value, onChange, label }: { value: boolean; onChange: (v: boolean) => void; label: string }) => {
    const p = useSharedValue(value ? 1 : 0);
    useEffect(() => {
        p.value = withSpring(value ? 1 : 0, SPRING);
    }, [value, p]);
    const [off, on] = [C.progTrack, C.mint];
    const track = useAnimatedStyle(() => ({ backgroundColor: interpolateColor(p.value, [0, 1], [off, on]) }));
    const knob = useAnimatedStyle(() => ({ transform: [{ translateX: p.value * 20 }] }));
    return (
        <Pressable
            accessibilityRole="switch"
            accessibilityLabel={label}
            accessibilityState={{ checked: value }}
            hitSlop={8}
            onPress={() => {
                Keyboard.dismiss();
                tap();
                onChange(!value);
            }}
        >
            <Animated.View style={[styles.track, track]}>
                <Animated.View style={[styles.knob, knob]} />
            </Animated.View>
        </Pressable>
    );
};

interface SegOption<T extends string> {
    value: T;
    label: string;
}

/** Segmented control with a sliding white indicator. */
export function Segmented<T extends string>({ options, value, onChange }: { options: SegOption<T>[]; value: T; onChange: (v: T) => void }) {
    const [w, setW] = useState(0);
    const idx = Math.max(0, options.findIndex((o) => o.value === value));
    const x = useSharedValue(0);
    const seg = w / options.length;
    useEffect(() => {
        x.value = withSpring(idx * seg, SPRING);
    }, [idx, seg, x]);
    const ind = useAnimatedStyle(() => ({ transform: [{ translateX: x.value }] }));
    return (
        <View style={styles.seg} onLayout={(e: LayoutChangeEvent) => setW(e.nativeEvent.layout.width - 8)}>
            {w > 0 && <Animated.View style={[styles.segInd, { width: seg }, ind]} />}
            {options.map((o) => (
                <Pressable
                    key={o.value}
                    accessibilityRole="tab"
                    accessibilityState={{ selected: o.value === value }}
                    style={styles.segBtn}
                    onPress={() => {
                        Keyboard.dismiss();
                        tap();
                        onChange(o.value);
                    }}
                >
                    <Animated.Text style={styles.segTxt}>{o.label}</Animated.Text>
                </Pressable>
            ))}
        </View>
    );
}

const styles = themed(() => StyleSheet.create({
    number: { padding: 0, margin: 0, color: C.text, fontFamily: F.display, includeFontPadding: false },
    track: { width: 50, height: 30, borderRadius: 15, padding: 3, justifyContent: 'center' },
    knob: { width: 24, height: 24, borderRadius: 12, backgroundColor: C.white },
    seg: { flexDirection: 'row', backgroundColor: C.segTrack, borderRadius: 16, padding: 4 },
    segInd: { position: 'absolute', top: 4, left: 4, bottom: 4, borderRadius: 12, backgroundColor: C.segInd },
    segBtn: { flex: 1, height: 38, alignItems: 'center', justifyContent: 'center' },
    segTxt: { fontFamily: F.bold, fontSize: 14, color: C.text },
}));
