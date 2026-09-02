import { StyleSheet, Text, View } from 'react-native';

export default function App() {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>GradBook Mobile</Text>
      <Text style={styles.subtitle}>Future student and alumni features are coming soon.</Text>
      <Text style={styles.body}>
        The photo capture, editing queue, and admin workflows belong in the web admin app.
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 24,
    backgroundColor: '#f8fafc',
  },
  title: {
    fontSize: 30,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0369a1',
    textAlign: 'center',
    marginBottom: 8,
  },
  body: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    maxWidth: 320,
    lineHeight: 20,
  },
});
