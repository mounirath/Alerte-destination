import React from 'react';
import {
  Pressable,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Ionicons from '@expo/vector-icons/Ionicons';
import { useApp } from '../context/AppContext';
import type { ThemePreference } from '../lib/theme';

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const {
    colors,
    isDark,
    themePref,
    setThemePref,
    soundEnabled,
    setSoundEnabled,
    vibrateEnabled,
    setVibrateEnabled,
    demoMode,
    setDemoMode,
    followUser,
    setFollowUser,
    previewAlert,
    refreshLocation,
    geoError,
    accuracy,
  } = useApp();

  const themes: { id: ThemePreference; label: string; icon: keyof typeof Ionicons.glyphMap }[] = [
    { id: 'auto', label: 'Auto', icon: 'phone-portrait-outline' },
    { id: 'dark', label: 'Sombre', icon: 'moon' },
    { id: 'light', label: 'Clair', icon: 'sunny' },
  ];

  return (
    <View style={[styles.root, { backgroundColor: colors.bg, paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Text style={[styles.title, { color: colors.text }]}>Réglages</Text>
        <Text style={[styles.sub, { color: colors.textMuted }]}>
          ArrivAlert · 100 % local, sans compte
        </Text>
      </View>

      <ScrollView contentContainerStyle={styles.scroll} showsVerticalScrollIndicator={false}>
        <Text style={[styles.section, { color: colors.textMuted }]}>Apparence</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <View style={styles.themeRow}>
            {themes.map((t) => {
              const active = themePref === t.id;
              return (
                <Pressable
                  key={t.id}
                  onPress={() => setThemePref(t.id)}
                  style={[
                    styles.themeChip,
                    {
                      backgroundColor: active ? colors.accent : colors.surface2,
                    },
                  ]}
                >
                  <Ionicons
                    name={t.icon}
                    size={16}
                    color={active ? '#062016' : colors.textSoft}
                  />
                  <Text style={{ color: active ? '#062016' : colors.textSoft, fontWeight: '700' }}>
                    {t.label}
                  </Text>
                </Pressable>
              );
            })}
          </View>
          <Text style={[styles.hint, { color: colors.textMuted }]}>
            Thème actuel : {isDark ? 'sombre' : 'clair'}
          </Text>
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>Alertes</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon="volume-high"
            title="Alarme sonore"
            subtitle="Oscillateur Web Audio (bip gare)"
            colors={colors}
            right={
              <Switch
                value={soundEnabled}
                onValueChange={setSoundEnabled}
                trackColor={{ false: colors.surface2, true: colors.accent }}
                thumbColor="#fff"
              />
            }
          />
          <Divider color={colors.border} />
          <Row
            icon="phone-portrait"
            title="Vibration"
            subtitle="navigator.vibrate — 500 / 200 / 500"
            colors={colors}
            right={
              <Switch
                value={vibrateEnabled}
                onValueChange={setVibrateEnabled}
                trackColor={{ false: colors.surface2, true: colors.accent }}
                thumbColor="#fff"
              />
            }
          />
          <Divider color={colors.border} />
          <Pressable onPress={previewAlert} style={styles.preview}>
            <Ionicons name="play-circle" size={18} color={colors.accent} />
            <Text style={[styles.previewTxt, { color: colors.accent }]}>
              Tester l'alarme maintenant
            </Text>
          </Pressable>
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>Géolocalisation</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Row
            icon="navigate"
            title="Recentrer automatiquement"
            subtitle="La carte suit votre position"
            colors={colors}
            right={
              <Switch
                value={followUser}
                onValueChange={setFollowUser}
                trackColor={{ false: colors.surface2, true: colors.accent }}
                thumbColor="#fff"
              />
            }
          />
          <Divider color={colors.border} />
          <Row
            icon="flask"
            title="Mode démo"
            subtitle="Simule un déplacement vers la destination"
            colors={colors}
            right={
              <Switch
                value={demoMode}
                onValueChange={setDemoMode}
                trackColor={{ false: colors.surface2, true: colors.accent }}
                thumbColor="#fff"
              />
            }
          />
          <Divider color={colors.border} />
          <Pressable onPress={refreshLocation} style={styles.preview}>
            <Ionicons name="locate" size={18} color={colors.accent} />
            <Text style={[styles.previewTxt, { color: colors.accent }]}>
              Relancer le GPS
              {accuracy != null ? `  ·  ±${Math.round(accuracy)} m` : ''}
            </Text>
          </Pressable>
          {geoError ? (
            <Text style={[styles.err, { color: colors.warning }]}>{geoError}</Text>
          ) : null}
        </View>

        <Text style={[styles.section, { color: colors.textMuted }]}>À propos</Text>
        <View style={[styles.card, { backgroundColor: colors.surface, borderColor: colors.border }]}>
          <Text style={[styles.about, { color: colors.textSoft }]}>
            ArrivAlert calcule la distance à vol d'oiseau (formule de Haversine) entre votre
            position GPS et l'épingle. Dès que vous entrez dans le rayon choisi, une alarme
            sonore, une vibration et un flash plein écran se déclenchent — idéal dans le train,
            le bus ou le métro.
          </Text>
          <Text style={[styles.meta, { color: colors.textMuted }]}>
            Carte OpenStreetMap · Carto · Nominatim{`\n`}Aucune donnée n'est stockée sur un serveur.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

function Divider({ color }: { color: string }) {
  return <View style={{ height: StyleSheet.hairlineWidth, backgroundColor: color, marginLeft: 52 }} />;
}

function Row({
  icon,
  title,
  subtitle,
  colors,
  right,
}: {
  icon: keyof typeof Ionicons.glyphMap;
  title: string;
  subtitle: string;
  colors: { text: string; textMuted: string; surface2: string };
  right: React.ReactNode;
}) {
  return (
    <View style={styles.row}>
      <View style={[styles.rowIcon, { backgroundColor: colors.surface2 }]}>
        <Ionicons name={icon} size={16} color={colors.text} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.rowTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.rowSub, { color: colors.textMuted }]}>{subtitle}</Text>
      </View>
      {right}
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  title: { fontSize: 32, fontWeight: '800' },
  sub: { fontSize: 14, marginTop: 4 },
  scroll: { padding: 20, paddingBottom: 48 },
  section: {
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 1.2,
    textTransform: 'uppercase',
    marginBottom: 8,
    marginTop: 8,
  },
  card: {
    borderRadius: 18,
    borderWidth: 1,
    marginBottom: 18,
    overflow: 'hidden',
  },
  themeRow: { flexDirection: 'row', gap: 8, padding: 12 },
  themeChip: {
    flex: 1,
    height: 42,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  hint: { paddingHorizontal: 14, paddingBottom: 12, fontSize: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  rowIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  rowTitle: { fontSize: 15, fontWeight: '700' },
  rowSub: { fontSize: 12, marginTop: 2 },
  preview: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingHorizontal: 14,
    paddingVertical: 14,
  },
  previewTxt: { fontWeight: '700', fontSize: 14 },
  err: { paddingHorizontal: 14, paddingBottom: 12, fontSize: 12 },
  about: { padding: 16, fontSize: 14, lineHeight: 21 },
  meta: { paddingHorizontal: 16, paddingBottom: 16, fontSize: 12, lineHeight: 18 },
});
