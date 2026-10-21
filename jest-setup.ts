
// react-hook form setup for testing
// @ts-ignore
global.window = {};
// @ts-ignore
global.window = global;

// Reanimated 4 runs its worklets through react-native-worklets, whose native
// module doesn't exist under Jest.
jest.mock('react-native-worklets', () => require('react-native-worklets/src/mock'));
