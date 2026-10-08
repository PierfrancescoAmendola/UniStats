import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { View } from 'react-native';
import { useApp } from '../store/AppStore';
import { C, L } from '../theme/tokens';
import { IntroScreen } from '../screens/onboarding/IntroScreen';
import { LevelScreen } from '../screens/onboarding/LevelScreen';
import { UniversityScreen } from '../screens/onboarding/UniversityScreen';
import { RulesScreen } from '../screens/onboarding/RulesScreen';
import { ReadyScreen } from '../screens/onboarding/ReadyScreen';
import { HomeScreen } from '../screens/HomeScreen';
import { TranscriptScreen } from '../screens/TranscriptScreen';
import { ToolsScreen } from '../screens/ToolsScreen';
import { ProfileScreen } from '../screens/ProfileScreen';
import { AddExamScreen } from '../screens/AddExamScreen';
import { ExamDetailScreen } from '../screens/ExamDetailScreen';
import { ImportPdfScreen } from '../screens/ImportPdfScreen';
import { GradSimScreen } from '../screens/tools/GradSimScreen';
import { NeededScreen } from '../screens/tools/NeededScreen';
import { WhatIfScreen } from '../screens/tools/WhatIfScreen';
import { HowCalcScreen } from '../screens/tools/HowCalcScreen';
import { RulesEditScreen } from '../screens/RulesEditScreen';
import { MilestoneScreen } from '../screens/MilestoneScreen';
import { LegalScreen } from '../screens/LegalScreen';
import { SupportScreen } from '../screens/SupportScreen';
import { TabBar } from './TabBar';
import { RootParams, TabParams } from './types';

const Stack = createNativeStackNavigator<RootParams>();
const Tab = createBottomTabNavigator<TabParams>();

/** On iPad the phone layout sits in a centred column instead of stretching edge to edge. */
const MAX_WIDTH = 700;
const columns = new Map<React.ComponentType<any>, React.ComponentType<any>>();
const column = <P extends object>(Screen: React.ComponentType<P>): React.ComponentType<P> => {
    let Wrapped = columns.get(Screen);
    if (!Wrapped) {
        Wrapped = function Column(props: P) {
            return (
                <View style={{ flex: 1, alignItems: 'center' }}>
                    <View style={{ flex: 1, width: '100%', maxWidth: MAX_WIDTH }}>
                        <Screen {...props} />
                    </View>
                </View>
            );
        };
        Wrapped.displayName = `Column(${Screen.displayName ?? Screen.name})`;
        columns.set(Screen, Wrapped);
    }
    return Wrapped as React.ComponentType<P>;
};

const Tabs = () => (
    <Tab.Navigator tabBar={(p) => <TabBar {...p} />} screenOptions={{ headerShown: false, animation: 'shift', sceneStyle: { backgroundColor: C.fog } }}>
        <Tab.Screen name="Home" component={HomeScreen} />
        <Tab.Screen name="Transcript" component={TranscriptScreen} />
        <Tab.Screen name="Tools" component={ToolsScreen} />
        <Tab.Screen name="Profile" component={ProfileScreen} />
    </Tab.Navigator>
);

export const RootNavigator = () => {
    const { state } = useApp();
    return (
        <Stack.Navigator
            initialRouteName={state.onboarded ? 'Tabs' : 'Intro'}
            screenOptions={{ headerShown: false, contentStyle: { backgroundColor: C.fog }, animation: 'slide_from_right' }}
        >
            <Stack.Screen name="Intro" component={IntroScreen} options={({ route }) => ({ animation: route.params?.replay ? 'slide_from_bottom' : 'fade' })} />
            <Stack.Screen name="Level" component={column(LevelScreen)} />
            <Stack.Screen name="University" component={column(UniversityScreen)} />
            <Stack.Screen name="Rules" component={column(RulesScreen)} />
            <Stack.Screen name="Ready" component={ReadyScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="Tabs" component={column(Tabs)} options={{ animation: 'fade' }} />
            {/* Slide-up cards instead of native modals: on iOS 27 native sheets stopped receiving touches with the scene lifecycle. */}
            <Stack.Screen
                name="AddExam"
                component={column(AddExamScreen)}
                options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical', fullScreenGestureEnabled: true, contentStyle: { backgroundColor: C.fog } }}
            />
            <Stack.Screen name="ExamDetail" component={column(ExamDetailScreen)} />
            <Stack.Screen name="ImportPdf" component={column(ImportPdfScreen)} />
            <Stack.Screen name="GradSim" component={column(GradSimScreen)} options={{ contentStyle: { backgroundColor: C.sun } }} />
            <Stack.Screen name="Needed" component={column(NeededScreen)} options={{ contentStyle: { backgroundColor: C.coral } }} />
            <Stack.Screen name="WhatIf" component={column(WhatIfScreen)} options={{ contentStyle: { backgroundColor: C.violet } }} />
            <Stack.Screen name="HowCalc" component={column(HowCalcScreen)} />
            <Stack.Screen name="RulesEdit" component={column(RulesEditScreen)} />
            <Stack.Screen name="Legal" component={column(LegalScreen)} />
            <Stack.Screen name="Support" component={column(SupportScreen)} />
            <Stack.Screen
                name="Milestone"
                component={MilestoneScreen}
                options={{ animation: 'fade', contentStyle: { backgroundColor: L.ink }, gestureEnabled: false }}
            />
        </Stack.Navigator>
    );
};
