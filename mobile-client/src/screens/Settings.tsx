import React, { useState, useEffect } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, StatusBar, Alert
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';
import { settingsAPI } from '../services/api';

interface Props {
  navigation: any;
}

const Settings: React.FC<Props> = ({ navigation }) => {
  const [user, setUser] = useState<any>(null);
  const [displayName, setDisplayName] = useState('');
  const [aliases, setAliases] = useState<any[]>([]);
  const [newAlias, setNewAlias] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    const userData = await AsyncStorage.getItem('phonemail_user');
    if (userData) {
      const parsed = JSON.parse(userData);
      setUser(parsed);
      setDisplayName(parsed.displayName || '');
    }

    try {
      const response = await settingsAPI.getSettings();
      const settings = response.data.settings;
      setAliases(settings.aliases || []);
      if (settings.display_name) setDisplayName(settings.display_name);
    } catch (error) {
      console.error('Failed to load settings:', error);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      await settingsAPI.updateSettings({ displayName });
      const updatedUser = { ...user, displayName };
      await AsyncStorage.setItem('phonemail_user', JSON.stringify(updatedUser));
      setUser(updatedUser);
      Alert.alert('Success', 'Profile updated!');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsLoading(false);
    }
  };

  const handleAddAlias = async () => {
    if (!newAlias.trim()) return;
    try {
      const response = await settingsAPI.createAlias(newAlias);
      setAliases([...aliases, response.data.alias]);
      setNewAlias('');
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to create alias');
    }
  };

  const handleDeleteAlias = async (id: string) => {
    try {
      await settingsAPI.deleteAlias(id);
      setAliases(aliases.filter((a) => a.id !== id));
    } catch (error) {
      Alert.alert('Error', 'Failed to delete alias');
    }
  };

  const handleLogout = async () => {
    await AsyncStorage.removeItem('phonemail_token');
    await AsyncStorage.removeItem('phonemail_user');
    navigation.reset({ index: 0, routes: [{ name: 'LanguageSelect' }] });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Settings</Text>
      </View>

      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Profile Section */}
        <View style={styles.section}>
          <View style={styles.profileCard}>
            <View style={styles.profileAvatar}>
              <Text style={styles.profileAvatarText}>
                {user?.displayName?.slice(0, 2).toUpperCase() || user?.phone?.slice(-2) || 'U'}
              </Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{user?.displayName || user?.phone}</Text>
              <Text style={styles.profileEmail}>{user?.email}</Text>
              <Text style={styles.profilePhone}>{user?.phone}</Text>
            </View>
          </View>
        </View>

        {/* Display Name */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Profile</Text>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Display Name</Text>
            <TextInput
              style={styles.input}
              value={displayName}
              onChangeText={setDisplayName}
              placeholder="Your display name"
              placeholderTextColor={theme.colors.textTertiary}
            />
          </View>
          <TouchableOpacity
            style={styles.saveBtn}
            onPress={handleSave}
            disabled={isLoading}
          >
            <Text style={styles.saveBtnText}>{isLoading ? 'Saving...' : 'Save Changes'}</Text>
          </TouchableOpacity>
        </View>

        {/* Alias IDs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alias IDs</Text>
          <Text style={styles.sectionDescription}>
            Create additional email addresses for your account.
          </Text>

          {/* Primary email */}
          <View style={styles.aliasItem}>
            <Text style={styles.aliasEmail}>{user?.email}</Text>
            <View style={styles.primaryBadge}>
              <Text style={styles.primaryBadgeText}>Primary</Text>
            </View>
          </View>

          {aliases.map((alias) => (
            <View key={alias.id} style={styles.aliasItem}>
              <Text style={styles.aliasEmail}>{alias.alias_email}</Text>
              <TouchableOpacity onPress={() => handleDeleteAlias(alias.id)}>
                <Text style={styles.deleteText}>🗑️</Text>
              </TouchableOpacity>
            </View>
          ))}

          <View style={styles.aliasAddRow}>
            <TextInput
              style={[styles.input, { flex: 1 }]}
              value={newAlias}
              onChangeText={setNewAlias}
              placeholder="New alias name"
              placeholderTextColor={theme.colors.textTertiary}
            />
            <TouchableOpacity style={styles.addBtn} onPress={handleAddAlias}>
              <Text style={styles.addBtnText}>Add</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Language */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Language</Text>
          <View style={styles.menuItem}>
            <Text style={styles.menuItemText}>App Language</Text>
            <Text style={styles.menuItemValue}>English</Text>
          </View>
        </View>

        {/* Logout */}
        <View style={styles.section}>
          <TouchableOpacity style={styles.logoutBtn} onPress={handleLogout}>
            <Text style={styles.logoutText}>Sign Out</Text>
          </TouchableOpacity>
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  backBtn: {
    padding: 8,
  },
  backIcon: {
    fontSize: 24,
    color: theme.colors.white,
  },
  headerTitle: {
    ...theme.typography.h3,
    color: theme.colors.white,
    marginLeft: 8,
  },
  scroll: {
    flex: 1,
  },
  section: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderBottomWidth: 8,
    borderBottomColor: theme.colors.surface,
  },
  sectionTitle: {
    ...theme.typography.body,
    color: theme.colors.accent,
    fontWeight: '600',
    marginBottom: 12,
  },
  sectionDescription: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    marginBottom: 12,
  },
  profileCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  profileAvatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: theme.colors.white,
    fontSize: 24,
    fontWeight: '700',
  },
  profileInfo: {
    flex: 1,
  },
  profileName: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 2,
  },
  profileEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  profilePhone: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  inputGroup: {
    marginBottom: 12,
  },
  inputLabel: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
    marginBottom: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  input: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: theme.colors.textPrimary,
    fontSize: 15,
  },
  saveBtn: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 12,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  saveBtnText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  aliasItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    padding: 14,
    marginBottom: 8,
  },
  aliasEmail: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '500',
  },
  primaryBadge: {
    backgroundColor: theme.colors.accentLight,
    paddingHorizontal: 10,
    paddingVertical: 3,
    borderRadius: theme.borderRadius.full,
  },
  primaryBadgeText: {
    color: theme.colors.accent,
    fontSize: 11,
    fontWeight: '600',
  },
  deleteText: {
    fontSize: 18,
  },
  aliasAddRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addBtnText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  menuItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 14,
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
  },
  menuItemText: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
  },
  menuItemValue: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  logoutBtn: {
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.2)',
    paddingVertical: 14,
    borderRadius: theme.borderRadius.md,
    alignItems: 'center',
  },
  logoutText: {
    color: '#EF4444',
    fontWeight: '700',
    fontSize: 15,
  },
});

export default Settings;
