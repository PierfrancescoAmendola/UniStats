import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import React from 'react';
import { useApp } from '../store/AppStore';
import { C } from '../theme/tokens';
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
import { TabBar } from './TabBar';
import { RootParams, TabParams } from './types';

const Stack = createNativeStackNavigator<RootParams>();
const Tab = createBottomTabNavigator<TabParams>();

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
            <Stack.Screen name="Intro" component={IntroScreen} options={{ animation: 'fade' }} />
            <Stack.Screen name="Level" component={LevelScreen} />
            <Stack.Screen name="University" component={UniversityScreen} />
            <Stack.Screen name="Rules" component={RulesScreen} />
            <Stack.Screen name="Ready" component={ReadyScreen} options={{ animation: 'fade_from_bottom', gestureEnabled: false }} />
            <Stack.Screen name="Tabs" component={Tabs} options={{ animation: 'fade' }} />
            {/* Slide-up cards instead of native modals: on iOS 27 native sheets stopped receiving touches with the scene lifecycle. */}
            <Stack.Screen
                name="AddExam"
                component={AddExamScreen}
                options={{ animation: 'slide_from_bottom', gestureDirection: 'vertical', fullScreenGestureEnabled: true, contentStyle: { backgroundColor: C.fog } }}
            />
            <Stack.Screen name="ExamDetail" component={ExamDetailScreen} />
            <Stack.Screen name="ImportPdf" component={ImportPdfScreen} />
            <Stack.Screen name="GradSim" component={GradSimScreen} options={{ contentStyle: { backgroundColor: C.sun } }} />
            <Stack.Screen name="Needed" component={NeededScreen} options={{ contentStyle: { backgroundColor: C.coral } }} />
            <Stack.Screen name="WhatIf" component={WhatIfScreen} options={{ contentStyle: { backgroundColor: C.violet } }} />
            <Stack.Screen name="HowCalc" component={HowCalcScreen} />
            <Stack.Screen name="RulesEdit" component={RulesEditScreen} />
            <Stack.Screen
                name="Milestone"
                component={MilestoneScreen}
                options={{ animation: 'fade', contentStyle: { backgroundColor: C.ink }, gestureEnabled: false }}
            />
        </Stack.Navigator>
    );
};
