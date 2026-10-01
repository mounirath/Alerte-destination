import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import { RADIUS_PRESETS } from '../lib/theme';
import { formatEta } from '../lib/geo';

export default function ControlSheet() {
  const {
    colors,
    destination,
    radius,
    setRadius,
    tracking,
    startTracking,
    stopTracking,
    remainingLabel,
    distance,
    speed,
    saveCurrentDestination,
    demoMode,
  } = useApp();

  return (
    <View
      style={[
        styles.sheet,
        {
          backgroundColor: colors.surface,
          borderColor: colors.border,
          shadowColor: '#000',
        },
      ]}
      pointerEvents="box-none"
    >
      <View style={[styles.handle, { backgroundColor: colors.border }]} />

      <View style={styles.destRow}>
        <View style={[styles.pinDot, { backgroundColor: destination ? colors.pin : colors.surface2 }]}>
          <Ionicons
            name={destination ? 'flag' : 'navigate-outline'}
            size={16}
            color={destination ? '#fff' : colors.textMuted}
          />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={[styles.kicker, { color: colors.textMuted }]}>
            {destination ? 'DESTINATION' : 'EN ATTENTE'}
          </Text>
          <Text style={[styles.destName, { color: colors.text }]} numberOfLines={1}>
            {destination?.name ?? 'Touchez la carte ou recherchez'}
          </Text>
          {destination?.address ? (
            <Text style={[styles.addr, { color: colors.textMuted }]} numberOfLines={1}>
              {destination.address}
            </Text>
          ) : null}
        </View>
        {destination ? (
          <Pressable onPress={saveCurrentDestination} hitSlop={8} style={styles.star}>
            <Ionicons name="star-outline" size={20} color={colors.warning} />
          </Pressable>
        ) : null}
      </View>

      {destination ? (
        <View style={styles.stats}>
          <Stat label="Restant" value={remainingLabel} colors={colors} />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <Stat label="ETA" value={formatEta(distance ?? 0, speed)} colors={colors} />
          <View style={[styles.sep, { backgroundColor: colors.border }]} />
          <Stat
            label="Alerte"
            value={radius >= 1000 ? `${radius / 1000} km` : `${radius} m`}
            colors={colors}
          />
        </View>
      ) : null}

      <Text style={[styles.radiusLabel, { color: colors.textMuted }]}>Rayon d'alerte</Text>
      <View style={styles.chips}>
        {RADIUS_PRESETS.map((p) => {
          const active = radius === p.value;
          return (
            <Pressable
              key={p.value}
              onPress={() => setRadius(p.value)}
              style={[
                styles.chip,
                {
                  backgroundColor: active ? colors.accent : colors.surface2,
                  borderColor: active ? colors.accent : colors.border,
                },
              ]}
            >
              <Text style={[styles.chipTxt, { color: active ? '#062016' : colors.textSoft }]}>
                {p.label}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Pressable
        disabled={!destination && !tracking}
        onPress={tracking ? stopTracking : startTracking}
        style={[
          styles.cta,
          {
            backgroundColor: tracking ? colors.pin : colors.accent,
            opacity: !destination && !tracking ? 0.45 : 1,
          },
        ]}
      >
        <Ionicons
          name={tracking ? 'stop' : 'navigate'}
          size={20}
          color={tracking ? '#fff' : '#062016'}
        />
        <Text style={[styles.ctaTxt, { color: tracking ? '#fff' : '#062016' }]}>
          {tracking ? "Arrêter l'alarme et le suivi" : 'Démarrer le suivi du trajet'}
        </Text>
      </Pressable>

      {demoMode && tracking ? (
        <Text style={[styles.hint, { color: colors.warning }]}>
          Mode démo : le curseur se rapproche de la destination.
        </Text>
      ) : (
        <Text style={[styles.hint, { color: colors.textMuted }]}>
          Alarme sonore + vibration dès l'entrée dans le rayon.
        </Text>
      )}
    </View>
  );
}

function Stat({
  label,
  value,
  colors,
}: {
  label: string;
  value: string;
  colors: { textMuted: string; text: string };
}) {
  return (
    <View style={styles.stat}>
      <Text style={[styles.statLabel, { color: colors.textMuted }]}>{label}</Text>
      <Text style={[styles.statValue, { color: colors.text }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  sheet: {
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
    borderWidth: 1,
    paddingHorizontal: 18,
    paddingTop: 10,
    paddingBottom: 10,
    shadowOpacity: 0.28,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: -8 },
    elevation: 16,
  },
  handle: {
    alignSelf: 'center',
    width: 42,
    height: 4,
    borderRadius: 2,
    marginBottom: 12,
  },
  destRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  pinDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: 'center',
    justifyContent: 'center',
  },
  kicker: { fontSize: 10, fontWeight: '800', letterSpacing: 1.4 },
  destName: { fontSize: 16, fontWeight: '700', marginTop: 2 },
  addr: { fontSize: 12, marginTop: 1 },
  star: { padding: 6 },
  stats: {
    flexDirection: 'row',
    marginTop: 14,
    borderRadius: 16,
    overflow: 'hidden',
  },
  stat: { flex: 1, alignItems: 'center', paddingVertical: 8 },
  statLabel: { fontSize: 11, fontWeight: '600' },
  statValue: { fontSize: 16, fontWeight: '800', marginTop: 2 },
  sep: { width: 1, marginVertical: 8 },
  radiusLabel: {
    marginTop: 12,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 0.6,
    textTransform: 'uppercase',
  },
  chips: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 8 },
  chip: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 999,
    borderWidth: 1,
  },
  chipTxt: { fontSize: 13, fontWeight: '700' },
  cta: {
    marginTop: 14,
    height: 54,
    borderRadius: 16,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  ctaTxt: { fontSize: 16, fontWeight: '800' },
  hint: { textAlign: 'center', fontSize: 12, marginTop: 8 },
});
