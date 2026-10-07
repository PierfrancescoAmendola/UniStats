// Native modules replaced with in-memory fakes so app logic can run under Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-localization', () => ({
    getLocales: () => [{ languageCode: 'it', languageTag: 'it-IT', regionCode: 'IT' }],
}));
