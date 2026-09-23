import React, { useEffect } from 'react';
import { View, Text, StyleSheet, ScrollView, StatusBar, TouchableOpacity } from 'react-native';
import { theme } from '../styles/theme';
import { emailAPI } from '../services/api';

interface Props {
  navigation: any;
  route: any;
}

const TraditionalView: React.FC<Props> = ({ navigation, route }) => {
  const { email, senderName } = route.params;

  useEffect(() => {
    if (!email.is_read) {
      emailAPI.markAsRead(email.id).catch(console.error);
    }
  }, [email.id, email.is_read]);

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleString('en-US', {
      weekday: 'short',
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true
    });
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Email Details</Text>
      </View>

      <ScrollView style={styles.scroll}>
        <View style={styles.subjectContainer}>
          <Text style={styles.subject}>{email.subject || '(No Subject)'}</Text>
        </View>

        <View style={styles.metaContainer}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>{senderName.slice(0, 1).toUpperCase()}</Text>
          </View>
          <View style={styles.metaInfo}>
            <Text style={styles.senderName}>{senderName}</Text>
            <Text style={styles.senderEmail}>From: {email.sender_email}</Text>
            <Text style={styles.date}>{formatDate(email.created_at)}</Text>
          </View>
        </View>

        <View style={styles.bodyContainer}>
          <Text style={styles.body}>{email.body}</Text>
        </View>
        
        {/* Quick Replies */}
        <View style={styles.quickRepliesWrapper}>
          <Text style={styles.quickRepliesTitle}>Quick Reply</Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.quickRepliesContainer}>
            {['Thanks!', 'Sounds good.', "I'll check this.", "Got it."].map((reply, i) => (
              <TouchableOpacity 
                key={i} 
                style={styles.quickReplyBtn}
                onPress={() => {
                  navigation.navigate('Compose', {
                    lockedTo: email.sender_email,
                    replyToId: email.id,
                    defaultSubject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`,
                    originalMessage: email.body,
                    originalSender: senderName,
                    originalDate: formatDate(email.created_at),
                    prefillBody: reply + '\n'
                  });
                }}
              >
                <Text style={styles.quickReplyText}>{reply}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      {/* Action Footer */}
      <View style={styles.actionFooter}>
        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => {
            navigation.navigate('Compose', {
              lockedTo: email.sender_email,
              replyToId: email.id,
              defaultSubject: email.subject?.startsWith('Re:') ? email.subject : `Re: ${email.subject || ''}`,
              originalMessage: email.body,
              originalSender: senderName,
              originalDate: formatDate(email.created_at)
            });
          }}
        >
          <View style={styles.actionIconWrapper}>
            <Text style={styles.actionIcon}>↩️</Text>
          </View>
          <Text style={styles.actionText}>Reply</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={() => {
            navigation.navigate('Compose', {
              defaultSubject: email.subject?.startsWith('Fwd:') ? email.subject : `Fwd: ${email.subject || ''}`,
              originalMessage: email.body,
              originalSender: senderName,
              originalDate: formatDate(email.created_at)
            });
          }}
        >
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(255,255,255,0.05)' }]}>
            <Text style={styles.actionIcon}>↪️</Text>
          </View>
          <Text style={styles.actionText}>Forward</Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.actionBtn}
          onPress={async () => {
            try {
              await emailAPI.deleteEmail(email.id);
              navigation.goBack();
            } catch (err) {
              console.error('Delete failed:', err);
            }
          }}
        >
          <View style={[styles.actionIconWrapper, { backgroundColor: 'rgba(239,68,68,0.1)' }]}>
            <Text style={styles.actionIcon}>🗑️</Text>
          </View>
          <Text style={[styles.actionText, { color: '#ef4444' }]}>Delete</Text>
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
    paddingHorizontal: 8,
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
  subjectContainer: {
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  subject: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  metaContainer: {
    flexDirection: 'row',
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
    alignItems: 'center',
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 20,
    fontWeight: '700',
  },
  metaInfo: {
    flex: 1,
  },
  senderName: {
    ...theme.typography.body,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  senderEmail: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    marginBottom: 2,
  },
  date: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  bodyContainer: {
    padding: 16,
  },
  body: {
    ...theme.typography.body,
    color: theme.colors.textPrimary,
    lineHeight: 24,
  },
  actionFooter: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: theme.colors.surfaceElevated,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    paddingBottom: 24, // Safe area for bottom swipe
  },
  actionBtn: {
    alignItems: 'center',
    justifyContent: 'center',
    flex: 1,
  },
  actionIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(99, 102, 241, 0.1)', // Primary tint
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 6,
  },
  actionIcon: {
    fontSize: 20,
  },
  actionText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
  },
  quickRepliesWrapper: {
    marginTop: 20,
    marginBottom: 40,
  },
  quickRepliesTitle: {
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '600',
    textTransform: 'uppercase',
    marginLeft: 16,
    marginBottom: 8,
  },
  quickRepliesContainer: {
    paddingHorizontal: 16,
    gap: 8,
  },
  quickReplyBtn: {
    backgroundColor: theme.colors.surfaceElevated,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: theme.colors.border,
    marginRight: 8,
  },
  quickReplyText: {
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
});

export default TraditionalView;
