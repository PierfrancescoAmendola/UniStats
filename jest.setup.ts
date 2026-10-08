// Native modules replaced with in-memory fakes so app logic can run under Jest.
jest.mock('@react-native-async-storage/async-storage', () =>
    require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);

jest.mock('expo-localization', () => ({
    getLocales: () => [{ languageCode: 'it', languageTag: 'it-IT', regionCode: 'IT' }],
}));

// lucide ships ES modules (.mjs) that Jest does not transform: every icon becomes an empty view.
jest.mock('lucide-react-native', () => {
    const { View } = require('react-native');
    const React = require('react');
    const Icon = (props: object) => React.createElement(View, props);
    return new Proxy({}, { get: (_t, name) => (name === '__esModule' ? true : Icon) });
});

jest.mock('expo-store-review', () => ({
    hasAction: jest.fn(async () => true),
    requestReview: jest.fn(async () => undefined),
}));
