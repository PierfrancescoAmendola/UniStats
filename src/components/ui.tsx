import { useNavigation } from '@react-navigation/native';
import { ChevronLeft } from 'lucide-react-native';
import React from 'react';
import { StyleProp, StyleSheet, Text, TextProps, TextStyle, View, ViewStyle } from 'react-native';
import { C, F, GradeTier, R, TIER_COLORS, themed } from '../theme/tokens';
import { PressableScale } from './motion';

type TProps = TextProps & { style?: StyleProp<TextStyle> };

export const Display = ({ style, ...p }: TProps) => <Text {...p} style={[s.display, style]} />;
export const Body = ({ style, ...p }: TProps) => <Text {...p} style={[s.body, style]} />;
export const Label = ({ style, ...p }: TProps) => <Text {...p} style={[s.label, style]} />;
export const Kicker = ({ style, ...p }: TProps) => <Text {...p} style={[s.kicker, style]} />;

export const Card = ({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) => <View style={[s.card, style]}>{children}</View>;

export const BackButton = ({ onDark = false, tint, label, onPress }: { onDark?: boolean; tint?: string; label: string; onPress?: () => void }) => {
    const nav = useNavigation();
    return (
        <PressableScale
            accessibilityLabel={label}
            onPress={onPress ?? (() => nav.goBack())}
            style={[s.back, { backgroundColor: tint ?? (onDark ? 'rgba(255,255,255,0.16)' : C.white) }]}
        >
            <ChevronLeft size={22} strokeWidth={2.4} color={onDark ? C.white : C.ink} />
        </PressableScale>
    );
};

export const PrimaryButton = ({
    label, onPress, bg = C.violet, fg = C.white, icon, disabled, style,
}: { label: string; onPress: () => void; bg?: string; fg?: string; icon?: React.ReactNode; disabled?: boolean; style?: StyleProp<ViewStyle> }) => (
    <PressableScale disabled={disabled} onPress={onPress} style={[s.primary, { backgroundColor: bg, opacity: disabled ? 0.45 : 1 }, style]}>
        <Text style={[s.primaryTxt, { color: fg }]}>{label}</Text>
        {icon}
    </PressableScale>
);

export const GradeBadge = ({ tier, label, size = 48, fontSize = 20 }: { tier: GradeTier; label: string; size?: number; fontSize?: number }) => {
    const c = TIER_COLORS[tier];
    return (
        <View style={[s.badge, { width: size, height: size, borderRadius: size * 0.31, backgroundColor: c.bg }]}>
            <Text style={{ fontFamily: F.display, fontSize, color: c.fg }}>{label}</Text>
        </View>
    );
};

export const Pill = ({ text, bg, fg, style }: { text: string; bg: string; fg: string; style?: StyleProp<ViewStyle> }) => (
    <View style={[s.pill, { backgroundColor: bg }, style]}>
        <Text style={{ fontFamily: F.bold, fontSize: 13, color: fg }}>{text}</Text>
    </View>
);

export const ProgressHeader = ({ step, total, label, backLabel }: { step: number; total: number; label: string; backLabel: string }) => (
    <View style={s.progRow}>
        <BackButton label={backLabel} />
        <View style={s.progTrack}>
            <View style={[s.progFill, { width: `${(step / total) * 100}%` }]} />
        </View>
        <Text style={s.progTxt}>{label}</Text>
    </View>
);

export const Row = ({ style, children }: { style?: StyleProp<ViewStyle>; children?: React.ReactNode }) => <View style={[{ flexDirection: 'row', alignItems: 'center' }, style]}>{children}</View>;

export const Divider = ({ color = C.line }: { color?: string }) => <View style={{ height: 1, backgroundColor: color }} />;

export const s = themed(() => StyleSheet.create({
    display: { fontFamily: F.display, color: C.text, includeFontPadding: false },
    body: { fontFamily: F.body, fontSize: 16, lineHeight: 23, color: C.text },
    label: { fontFamily: F.semi, fontSize: 13, color: C.text3 },
    kicker: { fontFamily: F.bold, fontSize: 13, letterSpacing: 1.2, textTransform: 'uppercase', color: C.text3 },
    card: { backgroundColor: C.surface, borderRadius: R.xl, padding: 16 },
    back: { width: 44, height: 44, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
    primary: { height: 58, borderRadius: R.lg, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 8 },
    primaryTxt: { fontFamily: F.bold, fontSize: 17 },
    badge: { alignItems: 'center', justifyContent: 'center' },
    pill: { paddingHorizontal: 10, paddingVertical: 5, borderRadius: 999, alignSelf: 'flex-start' },
    progRow: { flexDirection: 'row', alignItems: 'center', gap: 14 },
    progTrack: { flex: 1, height: 8, borderRadius: 4, backgroundColor: C.progTrack, overflow: 'hidden' },
    progFill: { height: 8, borderRadius: 4, backgroundColor: C.violet },
    progTxt: { fontFamily: F.semi, fontSize: 14, color: C.text3 },
}));
