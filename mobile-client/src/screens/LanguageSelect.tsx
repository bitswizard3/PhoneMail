import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, FlatList, StatusBar } from 'react-native';
import { theme } from '../styles/theme';

const languages = [
  { code: 'en', name: 'English', native: 'English' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी' },
  { code: 'es', name: 'Spanish', native: 'Español' },
  { code: 'fr', name: 'French', native: 'Français' },
  { code: 'de', name: 'German', native: 'Deutsch' },
  { code: 'ja', name: 'Japanese', native: '日本語' },
  { code: 'zh', name: 'Chinese', native: '中文' },
  { code: 'ar', name: 'Arabic', native: 'العربية' },
  { code: 'pt', name: 'Portuguese', native: 'Português' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
];

interface Props {
  navigation: any;
}

const LanguageSelect: React.FC<Props> = ({ navigation }) => {
  const [selected, setSelected] = useState('en');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />
      
      {/* Logo */}
      <View style={styles.logoContainer}>
        <View style={styles.logoIcon}>
          <Text style={styles.logoEmoji}>📧</Text>
        </View>
        <Text style={styles.title}>Welcome to PhoneMail</Text>
        <Text style={styles.subtitle}>Choose your language</Text>
      </View>

      {/* Language List */}
      <FlatList
        data={languages}
        keyExtractor={(item) => item.code}
        style={styles.list}
        showsVerticalScrollIndicator={false}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={[styles.languageItem, selected === item.code && styles.languageItemSelected]}
            onPress={() => setSelected(item.code)}
            activeOpacity={0.7}
          >
            <View style={styles.radioOuter}>
              {selected === item.code && <View style={styles.radioInner} />}
            </View>
            <View style={styles.languageText}>
              <Text style={[styles.languageName, selected === item.code && styles.languageNameSelected]}>
                {item.native}
              </Text>
              <Text style={styles.languageNative}>{item.name}</Text>
            </View>
          </TouchableOpacity>
        )}
      />

      {/* Next Button */}
      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.nextButton}
          onPress={() => navigation.navigate('TermsConditions')}
          activeOpacity={0.8}
        >
          <Text style={styles.nextButtonText}>Next</Text>
          <Text style={styles.nextArrow}>→</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  logoContainer: {
    alignItems: 'center',
    paddingTop: 60,
    paddingBottom: 24,
  },
  logoIcon: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
  },
  logoEmoji: {
    fontSize: 36,
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    marginBottom: 6,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  list: {
    flex: 1,
    paddingHorizontal: 16,
  },
  languageItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.md,
    marginBottom: 4,
  },
  languageItemSelected: {
    backgroundColor: theme.colors.accentLight,
  },
  radioOuter: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    borderColor: theme.colors.textSecondary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: theme.colors.accent,
  },
  languageText: {
    flex: 1,
  },
  languageName: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  languageNameSelected: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  languageNative: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
  },
  nextButton: {
    flexDirection: 'row',
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  nextButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
  nextArrow: {
    color: theme.colors.textInverse,
    fontSize: 18,
    fontWeight: '700',
    marginLeft: 8,
  },
});

export default LanguageSelect;
