import { Stack } from 'expo-router';
import { QueryProvider } from '../src/presentation/providers/QueryProvider';

export default function RootLayout() {
  return (
    <QueryProvider>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="index" />
      </Stack>
    </QueryProvider>
  );
}
