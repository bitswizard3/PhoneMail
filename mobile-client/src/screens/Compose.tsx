import React, { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert, ScrollView
} from 'react-native';
import { theme } from '../styles/theme';
import { emailAPI } from '../services/api';

interface Props {
  navigation: any;
  route?: any;
}

const Compose: React.FC<Props> = ({ navigation, route }) => {
  const { lockedTo, lockedCc, replyToId, defaultSubject, originalMessage, originalSender, originalDate, prefillBody } = route?.params || {};
  
  const [to, setTo] = useState(lockedTo || '');
  const [cc, setCc] = useState(lockedCc || '');
  const [subject, setSubject] = useState(defaultSubject || '');
  let initialBody = originalMessage 
    ? `\n\n--- Original Message ---\nFrom: ${originalSender}\nDate: ${originalDate}\n\n${originalMessage}`
    : '';
  if (prefillBody) {
    initialBody = prefillBody + initialBody;
  }

  const [body, setBody] = useState(initialBody);
  const [isSending, setIsSending] = useState(false);
  const [showCc, setShowCc] = useState(false);

  const handleSend = async () => {
    if (!to.trim()) {
      Alert.alert('Error', 'Please enter a recipient');
      return;
    }

    setIsSending(true);
    try {
      const toList = to.split(',').map((e) => e.trim()).filter(Boolean);
      const ccList = cc ? cc.split(',').map((e) => e.trim()).filter(Boolean) : [];

      await emailAPI.sendEmail({
        to: toList,
        cc: ccList,
        subject,
        body,
        replyToEmailId: replyToId,
      });

      navigation.goBack();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send email');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.headerBtn}>
          <Text style={styles.headerBtnText}>✕</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>New Email</Text>
        <TouchableOpacity
          style={[styles.sendBtn, isSending && styles.sendBtnDisabled]}
          onPress={handleSend}
          disabled={isSending}
        >
          <Text style={styles.sendBtnText}>{isSending ? '...' : 'Send ➤'}</Text>
        </TouchableOpacity>
      </View>

      {/* Form */}
      <ScrollView style={styles.form}>
        <View style={styles.field}>
          <Text style={styles.fieldLabel}>To</Text>
          <TextInput
            style={[styles.fieldInput, lockedTo && { color: theme.colors.textSecondary }]}
            placeholder="Phone number or email"
            placeholderTextColor={theme.colors.textTertiary}
            value={to}
            onChangeText={setTo}
            editable={!lockedTo}
            autoFocus={!lockedTo}
          />
          {!showCc && (
            <TouchableOpacity onPress={() => setShowCc(true)}>
              <Text style={styles.ccToggle}>Cc</Text>
            </TouchableOpacity>
          )}
        </View>

        {showCc && (
          <View style={styles.field}>
            <Text style={styles.fieldLabel}>Cc</Text>
            <TextInput
              style={styles.fieldInput}
              placeholder="Add CC recipients"
              placeholderTextColor={theme.colors.textTertiary}
              value={cc}
              onChangeText={setCc}
            />
          </View>
        )}

        <View style={styles.field}>
          <Text style={styles.fieldLabel}>Subject</Text>
          <TextInput
            style={styles.fieldInput}
            placeholder="Email subject"
            placeholderTextColor={theme.colors.textTertiary}
            value={subject}
            onChangeText={setSubject}
          />
        </View>

        <View style={styles.bodyContainer}>
          <TextInput
            style={styles.bodyInput}
            placeholder="Write your email..."
            placeholderTextColor={theme.colors.textTertiary}
            value={body}
            onChangeText={setBody}
            multiline
            textAlignVertical="top"
          />
        </View>
      </ScrollView>

      {/* Toolbar */}
      <View style={styles.toolbar}>
        <TouchableOpacity style={styles.toolbarBtn}>
          <Text style={styles.toolbarIcon}>📎</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.toolbarBtn}>
          <Text style={styles.toolbarIcon}>📷</Text>
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
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
  },
  headerBtn: {
    padding: 8,
  },
  headerBtnText: {
    fontSize: 22,
    color: theme.colors.white,
  },
  headerTitle: {
    flex: 1,
    textAlign: 'center',
    ...theme.typography.h3,
    color: theme.colors.white,
  },
  sendBtn: {
    backgroundColor: theme.colors.accent,
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: theme.borderRadius.full,
  },
  sendBtnDisabled: {
    opacity: 0.5,
  },
  sendBtnText: {
    color: theme.colors.textInverse,
    fontWeight: '700',
    fontSize: 14,
  },
  form: {
    flex: 1,
  },
  field: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 0.5,
    borderBottomColor: theme.colors.border,
    paddingHorizontal: 16,
  },
  fieldLabel: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    width: 55,
    fontWeight: '500',
  },
  fieldInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 14,
  },
  ccToggle: {
    color: theme.colors.accent,
    fontSize: 14,
    fontWeight: '600',
    paddingHorizontal: 8,
  },
  bodyContainer: {
    flex: 1,
    padding: 16,
    minHeight: 300,
  },
  bodyInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 22,
    minHeight: 280,
  },
  toolbar: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
    paddingVertical: 8,
    paddingHorizontal: 12,
    gap: 4,
  },
  toolbarBtn: {
    padding: 10,
    borderRadius: theme.borderRadius.full,
  },
  toolbarIcon: {
    fontSize: 20,
  },
});

export default Compose;
