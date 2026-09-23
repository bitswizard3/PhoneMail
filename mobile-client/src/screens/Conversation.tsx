import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList, StatusBar, KeyboardAvoidingView, Platform
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { Swipeable } from 'react-native-gesture-handler';
import { theme } from '../styles/theme';
import { emailAPI } from '../services/api';

interface Email {
  id: string;
  sender_email: string;
  sender_name: string;
  subject: string;
  body: string;
  is_read: boolean;
  is_favorite: boolean;
  reply_to_email_id?: string;
  created_at: string;
  has_been_replied?: boolean;
}

interface Props {
  navigation: any;
  route: any;
}

const Conversation: React.FC<Props> = ({ navigation, route }) => {
  const { conversationId, senderName } = route.params;
  const [emails, setEmails] = useState<Email[]>([]);
  const [message, setMessage] = useState('');
  const [subject, setSubject] = useState('');
  const [showSubject, setShowSubject] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [replyingTo, setReplyingTo] = useState<Email | null>(null);
  
  const flatListRef = useRef<FlatList>(null);
  const swipeableRefs = useRef<{[key: string]: Swipeable | null}>({});

  useEffect(() => {
    loadUser();
    fetchConversation();
  }, []);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('phonemail_user');
    if (userData) setCurrentUser(JSON.parse(userData));
  };

  const processEmails = (rawEmails: any[]) => {
    // Check which emails have been replied to
    const replyIds = new Set(rawEmails.map(e => e.reply_to_email_id).filter(Boolean));
    return rawEmails.map(e => ({
      ...e,
      has_been_replied: replyIds.has(e.id)
    }));
  };

  const fetchConversation = async () => {
    try {
      const response = await emailAPI.getConversation(conversationId);
      const processed = processEmails(response.data.emails || []);
      setEmails(processed);
      
      // If there are existing emails, hide subject (it's a reply)
      if (processed.length > 0) {
        setShowSubject(false);
      }
    } catch (error) {
      console.error('Failed to fetch conversation:', error);
    }
  };

  const handleSend = async () => {
    if (!message.trim()) return;

    setIsSending(true);
    try {
      const lastEmail = emails[emails.length - 1];
      const recipientEmail = lastEmail?.sender_email === currentUser?.email 
        ? lastEmail?.recipients?.[0]?.recipient_email || senderName
        : lastEmail?.sender_email || senderName;

      await emailAPI.sendEmail({
        to: [recipientEmail],
        subject: showSubject ? subject : (replyingTo ? `Re: ${replyingTo.subject}` : `Re: ${lastEmail?.subject || ''}`),
        body: message,
        replyToEmailId: replyingTo?.id || lastEmail?.id,
      });

      setMessage('');
      setSubject('');
      setReplyingTo(null);
      fetchConversation();
    } catch (error: any) {
      console.error('Failed to send:', error);
    } finally {
      setIsSending(false);
    }
  };

  const handleSwipeToReply = (email: Email) => {
    if (email.has_been_replied) return;
    setReplyingTo(email);
    // Close the swipeable
    if (swipeableRefs.current[email.id]) {
      swipeableRefs.current[email.id]?.close();
    }
  };

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
  };

  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    const today = new Date();
    if (date.toDateString() === today.toDateString()) return 'Today';
    const yesterday = new Date(today);
    yesterday.setDate(today.getDate() - 1);
    if (date.toDateString() === yesterday.toDateString()) return 'Yesterday';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const renderRightActions = () => (
    <View style={styles.replyActionContainer}>
      <Text style={styles.replyActionIcon}>↩️</Text>
    </View>
  );

  const renderMessage = ({ item, index }: { item: Email; index: number }) => {
    const isSent = item.sender_email === currentUser?.email;
    const showDate = index === 0 || formatDate(item.created_at) !== formatDate(emails[index - 1].created_at);

    const messageContent = (
      <View>
        {showDate && (
          <View style={styles.dateSeparator}>
            <Text style={styles.dateText}>{formatDate(item.created_at)}</Text>
          </View>
        )}

        {item.subject && (index === 0 || item.subject !== emails[index - 1]?.subject) && (
          <View style={styles.subjectBanner}>
            <Text style={styles.subjectText}>📌 {item.subject}</Text>
          </View>
        )}

        <View style={[styles.messageRow, isSent && styles.messageRowSent]}>
          <TouchableOpacity 
            activeOpacity={0.8}
            onPress={() => navigation.navigate('TraditionalView', { email: item, senderName: item.sender_name || item.sender_email })}
            style={[styles.messageBubble, isSent ? styles.bubbleSent : styles.bubbleReceived]}
          >
            {!isSent && (
              <Text style={styles.messageSender}>{item.sender_name || item.sender_email}</Text>
            )}
            
            {/* If it was a reply, show a small tag */}
            {item.reply_to_email_id && (
              <View style={styles.replyTag}>
                <Text style={styles.replyTagText} numberOfLines={1}>Replied to earlier message</Text>
              </View>
            )}

            <Text style={styles.messageText}>{item.body}</Text>
            <View style={styles.messageFooter}>
              <Text style={styles.messageTime}>{formatTime(item.created_at)}</Text>
              {item.is_favorite && <Text style={styles.favoriteIcon}>⭐</Text>}
            </View>
          </TouchableOpacity>
        </View>
      </View>
    );

    if (!item.has_been_replied && !isSent) {
      return (
        <Swipeable
          ref={(ref) => { swipeableRefs.current[item.id] = ref; }}
          renderRightActions={renderRightActions}
          onSwipeableRightOpen={() => handleSwipeToReply(item)}
        >
          {messageContent}
        </Swipeable>
      );
    }
    
    return messageContent;
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.primary} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>

        <View style={[styles.headerAvatar, { backgroundColor: '#4ECDC4' }]}>
          <Text style={styles.headerAvatarText}>
            {senderName?.slice(0, 1).toUpperCase() || '?'}
          </Text>
        </View>

        <View style={styles.headerInfo}>
          <Text style={styles.headerName} numberOfLines={1}>{senderName}</Text>
          <Text style={styles.headerStatus}>{emails.length} messages</Text>
        </View>

        <TouchableOpacity style={styles.headerAction}>
          <Text style={styles.headerActionIcon}>📧</Text>
        </TouchableOpacity>
      </View>

      {/* Messages */}
      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
        <FlatList
          ref={flatListRef}
          data={emails}
          keyExtractor={(item) => item.id}
          renderItem={renderMessage}
          contentContainerStyle={styles.messageList}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd()}
          ListEmptyComponent={
            <View style={styles.emptyChat}>
              <Text style={styles.emptyChatText}>No messages yet. Start the conversation!</Text>
            </View>
          }
        />

        {/* Input Area */}
        <View style={styles.inputArea}>
          
          {replyingTo && (
            <View style={styles.replyingToBanner}>
              <View style={styles.replyingToContent}>
                <Text style={styles.replyingToName}>{replyingTo.sender_name || replyingTo.sender_email}</Text>
                <Text style={styles.replyingToText} numberOfLines={1}>{replyingTo.body}</Text>
              </View>
              <TouchableOpacity onPress={() => setReplyingTo(null)} style={styles.replyingToClose}>
                <Text style={styles.replyingToCloseText}>✕</Text>
              </TouchableOpacity>
            </View>
          )}

          {showSubject && !replyingTo && (
            <View style={styles.subjectInput}>
              <TextInput
                style={styles.subjectField}
                placeholder="Subject"
                placeholderTextColor={theme.colors.textTertiary}
                value={subject}
                onChangeText={setSubject}
              />
            </View>
          )}

          <View style={styles.inputRow}>
            {/* Camera / Compose icon to open Traditional Compose */}
            <TouchableOpacity 
              style={styles.cameraBtn}
              onPress={() => {
                navigation.navigate('Compose', {
                  lockedTo: senderName,
                  replyToId: replyingTo?.id || emails[emails.length - 1]?.id,
                });
              }}
            >
              <Text style={styles.cameraIcon}>📷</Text>
            </TouchableOpacity>

            <View style={styles.textInputContainer}>
              <TextInput
                style={styles.textInput}
                placeholder="Type a message..."
                placeholderTextColor={theme.colors.textTertiary}
                value={message}
                onChangeText={setMessage}
                multiline
                maxLength={5000}
              />
            </View>
            <TouchableOpacity
              style={[styles.sendButton, !message.trim() && styles.sendButtonDisabled]}
              onPress={handleSend}
              disabled={!message.trim() || isSending}
              activeOpacity={0.7}
            >
              <Text style={styles.sendIcon}>{isSending ? '⏳' : '➤'}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </KeyboardAvoidingView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  flex: {
    flex: 1,
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
  headerAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 10,
  },
  headerAvatarText: {
    color: theme.colors.white,
    fontSize: 18,
    fontWeight: '700',
  },
  headerInfo: {
    flex: 1,
  },
  headerName: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
  },
  headerStatus: {
    ...theme.typography.caption,
    color: 'rgba(255,255,255,0.7)',
  },
  headerAction: {
    padding: 8,
  },
  headerActionIcon: {
    fontSize: 20,
  },
  messageList: {
    padding: 12,
    paddingBottom: 8,
  },
  dateSeparator: {
    alignItems: 'center',
    marginVertical: 12,
  },
  dateText: {
    backgroundColor: theme.colors.surfaceElevated,
    color: theme.colors.textSecondary,
    fontSize: 12,
    fontWeight: '500',
    paddingHorizontal: 14,
    paddingVertical: 5,
    borderRadius: theme.borderRadius.full,
    overflow: 'hidden',
  },
  subjectBanner: {
    alignItems: 'center',
    marginVertical: 8,
  },
  subjectText: {
    color: theme.colors.info,
    fontSize: 13,
    fontWeight: '600',
  },
  messageRow: {
    marginBottom: 4,
    flexDirection: 'row',
  },
  messageRowSent: {
    justifyContent: 'flex-end',
  },
  messageBubble: {
    maxWidth: '78%',
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 12,
    marginBottom: 2,
  },
  bubbleSent: {
    backgroundColor: theme.colors.chatBubbleSent,
    borderBottomRightRadius: 4,
  },
  bubbleReceived: {
    backgroundColor: theme.colors.chatBubbleReceived,
    borderBottomLeftRadius: 4,
  },
  messageSender: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
    marginBottom: 2,
  },
  replyTag: {
    backgroundColor: 'rgba(0,0,0,0.1)',
    borderLeftWidth: 3,
    borderLeftColor: theme.colors.accent,
    padding: 6,
    borderRadius: 4,
    marginBottom: 6,
  },
  replyTagText: {
    fontSize: 12,
    color: theme.colors.textSecondary,
  },
  messageText: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    lineHeight: 20,
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4,
    gap: 4,
  },
  messageTime: {
    color: 'rgba(255,255,255,0.5)',
    fontSize: 11,
  },
  favoriteIcon: {
    fontSize: 11,
  },
  replyActionContainer: {
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  replyActionIcon: {
    fontSize: 24,
  },
  emptyChat: {
    alignItems: 'center',
    paddingTop: 80,
  },
  emptyChatText: {
    color: theme.colors.textTertiary,
    fontSize: 14,
  },
  inputArea: {
    backgroundColor: theme.colors.surface,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    padding: 8,
  },
  replyingToBanner: {
    flexDirection: 'row',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
    marginHorizontal: 4,
    borderLeftWidth: 4,
    borderLeftColor: theme.colors.accent,
  },
  replyingToContent: {
    flex: 1,
  },
  replyingToName: {
    color: theme.colors.accent,
    fontSize: 13,
    fontWeight: '600',
  },
  replyingToText: {
    color: theme.colors.textSecondary,
    fontSize: 13,
  },
  replyingToClose: {
    padding: 4,
  },
  replyingToCloseText: {
    color: theme.colors.textTertiary,
    fontSize: 16,
  },
  subjectInput: {
    marginBottom: 6,
    marginHorizontal: 4,
  },
  subjectField: {
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    paddingHorizontal: 14,
    paddingVertical: 8,
    color: theme.colors.textPrimary,
    fontSize: 14,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },
  cameraBtn: {
    padding: 10,
    marginBottom: 2,
  },
  cameraIcon: {
    fontSize: 22,
    color: theme.colors.textSecondary,
  },
  textInputContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 4,
    maxHeight: 120,
  },
  textInput: {
    color: theme.colors.textPrimary,
    fontSize: 15,
    paddingVertical: 8,
    maxHeight: 100,
  },
  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor: theme.colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    opacity: 0.4,
  },
  sendIcon: {
    fontSize: 20,
    color: theme.colors.white,
  },
});

export default Conversation;
