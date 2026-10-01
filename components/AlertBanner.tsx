import React, { useEffect } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Animated, {
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from 'react-native-reanimated';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';

export default function AlertBanner() {
  const { alerting, remainingLabel, destination, stopAlert, snoozeAlert, colors } =
    useApp();
  const flash = useSharedValue(0);

  useEffect(() => {
    if (!alerting) {
      flash.value = 0;
      return;
    }
    flash.value = withRepeat(
      withSequence(
        withTiming(1, { duration: 420, easing: Easing.inOut(Easing.quad) }),
        withTiming(0.25, { duration: 420, easing: Easing.inOut(Easing.quad) })
      ),
      -1,
      false
    );
  }, [alerting, flash]);

  const pulse = useAnimatedStyle(() => ({
    opacity: 0.55 + flash.value * 0.4,
  }));

  if (!alerting) return null;

  return (
    <View style={styles.overlay} pointerEvents="auto">
      <Animated.View style={[styles.flash, { backgroundColor: colors.pin }, pulse]} />
      <View style={styles.card}>
        <View style={styles.iconWrap}>
          <Ionicons name="notifications" size={42} color="#fff" />
        </View>
        <Text style={styles.kicker}>ALERTE ARRIVÉE</Text>
        <Text style={styles.title}>Vous arrivez à destination !</Text>
        <Text style={styles.sub}>
          {destination?.name ?? 'Destination'} · {remainingLabel}
        </Text>
        <Pressable style={styles.stop} onPress={stopAlert}>
          <Ionicons name="stop-circle" size={20} color="#fff" />
          <Text style={styles.stopTxt}>Arrêter l'alarme et le suivi</Text>
        </Pressable>
        <Pressable style={styles.snooze} onPress={snoozeAlert}>
          <Text style={styles.snoozeTxt}>Reporter 1 minute</Text>
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 80,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  flash: {
    ...StyleSheet.absoluteFillObject,
  },
  card: {
    width: '100%',
    maxWidth: 420,
    backgroundColor: '#0B1018',
    borderRadius: 28,
    padding: 28,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  iconWrap: {
    width: 84,
    height: 84,
    borderRadius: 42,
    backgroundColor: '#FF4D6A',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 18,
  },
  kicker: {
    color: '#FF4D6A',
    fontWeight: '800',
    letterSpacing: 2.4,
    fontSize: 12,
  },
  title: {
    color: '#F3F6FB',
    fontSize: 26,
    fontWeight: '800',
    textAlign: 'center',
    marginTop: 8,
    lineHeight: 32,
  },
  sub: {
    color: '#8B95A8',
    fontSize: 14,
    marginTop: 10,
    textAlign: 'center',
  },
  stop: {
    marginTop: 24,
    backgroundColor: '#FF4D6A',
    borderRadius: 16,
    height: 54,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  stopTxt: { color: '#fff', fontWeight: '700', fontSize: 16 },
  snooze: { marginTop: 12, padding: 8 },
  snoozeTxt: { color: '#C5CDD8', fontWeight: '600' },
});
