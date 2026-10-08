import { NavigatorScreenParams } from '@react-navigation/native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';

export type TabParams = {
    Home: undefined;
    Transcript: undefined;
    Tools: undefined;
    Profile: undefined;
};

export type RootParams = {
    Intro: { replay?: boolean } | undefined;
    Level: { edit?: boolean } | undefined;
    University: { edit?: boolean } | undefined;
    Rules: { edit?: boolean } | undefined;
    Ready: undefined;
    Tabs: NavigatorScreenParams<TabParams> | undefined;
    AddExam: { examId?: string } | undefined;
    ExamDetail: { examId: string };
    ImportPdf: undefined;
    GradSim: undefined;
    Needed: undefined;
    WhatIf: undefined;
    HowCalc: undefined;
    RulesEdit: undefined;
    Legal: { doc: 'privacy' | 'terms' };
    Support: undefined;
    Milestone: { examId: string; before: number | null };
};

export type ScreenProps<K extends keyof RootParams> = NativeStackScreenProps<RootParams, K>;

declare global {
    namespace ReactNavigation {
        // eslint-disable-next-line @typescript-eslint/no-empty-object-type
        interface RootParamList extends RootParams {}
    }
}
