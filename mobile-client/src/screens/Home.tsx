import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, StyleSheet, FlatList,
  StatusBar, RefreshControl, Animated, TouchableWithoutFeedback
} from 'react-native';
import { Swipeable } from 'react-native-gesture-handler';
import AsyncStorage from '@react-native-async-storage/async-storage';
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
  has_attachments: boolean;
  created_at: string;
  conversation_id: string;
  recipients?: { recipient_email: string; recipient_type: string; is_read?: boolean }[];
}

interface Props {
  navigation: any;
  route: any;
}

const Home: React.FC<Props> = ({ navigation, route }) => {
  const folder = route.params?.folder || 'inbox';
  const [emails, setEmails] = useState<Email[]>([]);
  const [filter, setFilter] = useState('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [user, setUser] = useState<any>(null);
  const swipeableRefs = React.useRef<{[key: string]: Swipeable | null}>({});
  const scaleValue = React.useRef(new Animated.Value(1)).current;

  const animateFab = (pressed: boolean) => {
    Animated.spring(scaleValue, {
      toValue: pressed ? 0.8 : 1,
      useNativeDriver: true,
      friction: 5,
      tension: 100,
    }).start();
  };

  useEffect(() => {
    loadUser();
    fetchEmails();
    
    // Auto-refresh every 3 seconds
    const intervalId = setInterval(() => {
      fetchEmails();
    }, 3000);
    
    return () => clearInterval(intervalId);
  }, [filter, folder]);

  const loadUser = async () => {
    const userData = await AsyncStorage.getItem('phonemail_user');
    if (userData) setUser(JSON.parse(userData));
  };

  const fetchEmails = async () => {
    try {
      const response = await emailAPI.getEmails(folder, filter);
      setEmails(response.data.emails || []);
    } catch (error) {
      console.error('Failed to fetch emails:', error);
    }
  };

  const onRefresh = useCallback(async () => {
    setIsRefreshing(true);
    await fetchEmails();
    setIsRefreshing(false);
  }, [filter, folder]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHrs = diffMs / (1000 * 60 * 60);

    if (diffHrs < 24) {
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (diffHrs < 168) {
      return date.toLocaleDateString('en-US', { weekday: 'short' });
    }
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  };

  const getInitials = (name: string, email: string) => {
    if (name && name !== 'null') return name.slice(0, 1).toUpperCase();
    return email?.slice(0, 1).toUpperCase() || '?';
  };

  const filteredEmails = emails.filter((email) => {
    if (!searchQuery) return true;
    const q = searchQuery.toLowerCase();
    return (
      email.subject?.toLowerCase().includes(q) ||
      email.sender_name?.toLowerCase().includes(q) ||
      email.sender_email?.toLowerCase().includes(q)
    );
  });

  const filters = [
    { id: 'all', label: 'All' },
    { id: 'unread', label: 'Unread' },
    { id: 'attachments', label: '📎 Attachments' },
    { id: 'favorites', label: '⭐ Favorites' },
  ];

  const handleDelete = async (item: Email) => {
    swipeableRefs.current[item.id]?.close();
    setEmails(prev => prev.filter(e => e.id !== item.id));
    try {
      await emailAPI.deleteEmail(item.id);
    } catch (err) {
      console.error(err);
      fetchEmails(); // revert if fail
    }
  };

  const handleToggleRead = async (item: Email) => {
    swipeableRefs.current[item.id]?.close();
    const newStatus = !item.is_read;
    setEmails(prev => prev.map(e => e.id === item.id ? { ...e, is_read: newStatus } : e));
    try {
      if (newStatus) {
        await emailAPI.markAsRead(item.id);
      } else {
        await emailAPI.updateEmail(item.id, { isRead: false });
      }
    } catch (err) {
      console.error(err);
      fetchEmails();
    }
  };

  const renderRightActions = (item: Email) => (
    <TouchableOpacity style={styles.rightAction} onPress={() => handleDelete(item)}>
      <Text style={styles.actionIconText}>🗑️</Text>
    </TouchableOpacity>
  );

  const renderLeftActions = (item: Email) => (
    <TouchableOpacity style={styles.leftAction} onPress={() => handleToggleRead(item)}>
      <Text style={styles.actionIconText}>{item.is_read ? '✉️' : '📖'}</Text>
    </TouchableOpacity>
  );

  const renderEmailItem = ({ item }: { item: Email }) => (
    <Swipeable
      ref={(ref) => { swipeableRefs.current[item.id] = ref; }}
      renderRightActions={() => renderRightActions(item)}
      renderLeftActions={() => renderLeftActions(item)}
    >
      <TouchableOpacity
        style={styles.chatItem}
        onPress={() => {
        if (!item.is_read) {
          // Optimistic update for instant read mark
          setEmails(prev => prev.map(e => e.id === item.id ? { ...e, is_read: true } : e));
          
          navigation.navigate('TraditionalView', { 
            email: { ...item, is_read: true },
            senderName: item.sender_name || item.sender_email 
          });
        } else {
          navigation.navigate('TraditionalView', { 
            email: item,
            senderName: item.sender_name || item.sender_email 
          });
        }
      }}
      activeOpacity={0.7}
    >
      <View style={[styles.avatar, { backgroundColor: getAvatarColor(item.sender_email) }]}>
        <Text style={styles.avatarText}>{getInitials(item.sender_name, item.sender_email)}</Text>
      </View>

      <View style={styles.chatContent}>
        <View style={styles.chatTopRow}>
          <Text style={[styles.chatName, !item.is_read && styles.chatNameUnread]} numberOfLines={1}>
            {item.sender_name || item.sender_email}
          </Text>
          <Text style={[styles.chatTime, !item.is_read && styles.chatTimeUnread]}>
            {formatTime(item.created_at)}
          </Text>
        </View>

        <View style={styles.chatBottomRow}>
          <View style={styles.chatPreviewContainer}>
            {item.subject && (
              <Text style={styles.chatSubject} numberOfLines={1}>
                {item.subject}
              </Text>
            )}
            <Text style={styles.chatPreview} numberOfLines={1}>
              {item.body?.substring(0, 60) || ''}
            </Text>
          </View>
          <View style={styles.chatIndicators}>
            {folder === 'inbox' && !item.is_read && <View style={styles.unreadDot} />}
            {folder === 'sent' && (
              <Text style={{ fontSize: 12, color: item.recipients?.some(r => r.is_read) ? '#3b82f6' : theme.colors.textTertiary, marginRight: 4, fontWeight: 'bold' }}>
                {item.recipients?.some(r => r.is_read) ? '✓✓' : '✓'}
              </Text>
            )}
            {item.has_attachments && <Text style={styles.attachmentIcon}>📎</Text>}
          </View>
        </View>
      </View>
    </TouchableOpacity>
    </Swipeable>
  );

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.openDrawer()} style={styles.menuBtn}>
          <Text style={styles.menuIcon}>☰</Text>
        </TouchableOpacity>

        {/* Search Bar */}
        <View style={styles.searchContainer}>
          <Text style={styles.searchIcon}>🔍</Text>
          <TextInput
            style={styles.searchInput}
            placeholder="Search emails..."
            placeholderTextColor={theme.colors.textSecondary}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
        </View>

        <TouchableOpacity 
          onPress={() => navigation.navigate('Settings')}
          style={styles.profileBtn}
        >
          <View style={styles.profileAvatar}>
            <Text style={styles.profileAvatarText}>
              {user?.displayName?.slice(0, 1) || user?.phone?.slice(-1) || 'U'}
            </Text>
          </View>
        </TouchableOpacity>
      </View>

      {/* Filter Chips */}
      <View style={styles.filterBar}>
        <FlatList
          data={filters}
          horizontal
          showsHorizontalScrollIndicator={false}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.filterList}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.filterChip, filter === item.id && styles.filterChipActive]}
              onPress={() => setFilter(item.id)}
              activeOpacity={0.7}
            >
              <Text style={[styles.filterChipText, filter === item.id && styles.filterChipTextActive]}>
                {item.label}
              </Text>
            </TouchableOpacity>
          )}
        />
      </View>

      {/* Chat List */}
      <FlatList
        data={filteredEmails}
        keyExtractor={(item) => item.id}
        renderItem={renderEmailItem}
        contentContainerStyle={emails.length === 0 ? styles.emptyContainer : styles.listContainer}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={onRefresh}
            colors={[theme.colors.primary]}
            tintColor={theme.colors.primary}
            progressBackgroundColor={theme.colors.surfaceElevated}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>{folder === 'inbox' ? '📭' : folder === 'trash' ? '🗑️' : folder === 'spam' ? '⚠️' : '📂'}</Text>
            <Text style={styles.emptyTitle}>
              {folder === 'inbox' ? 'No emails yet' : `No emails in ${folder}`}
            </Text>
            <Text style={styles.emptySubtitle}>
              {folder === 'inbox' 
                ? 'Your inbox is empty. Tap the compose button to send your first email!' 
                : `There are no emails to display in your ${folder} folder.`}
            </Text>
          </View>
        }
      />

      {/* Compose FAB */}
      <TouchableWithoutFeedback
        onPressIn={() => animateFab(true)}
        onPressOut={() => animateFab(false)}
        onPress={() => navigation.navigate('Compose')}
      >
        <Animated.View style={[styles.fab, { transform: [{ scale: scaleValue }] }]}>
          <Text style={styles.fabIcon}>✏️</Text>
        </Animated.View>
      </TouchableWithoutFeedback>
    </View>
  );
};

const getAvatarColor = (email: string): string => {
  const colors = ['#6366f1', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#14b8a6'];
  const index = email.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0) % colors.length;
  return colors[index];
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.background,
    paddingTop: 48,
    paddingBottom: 12,
    paddingHorizontal: 16,
    gap: 12,
  },
  menuBtn: {
    padding: 4,
  },
  menuIcon: {
    fontSize: 24,
    color: theme.colors.textPrimary,
  },
  profileBtn: {
    padding: 2,
  },
  profileAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  profileAvatarText: {
    color: theme.colors.white,
    fontWeight: '600',
    fontSize: 14,
  },
  searchContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.borderRadius.full,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  searchIcon: {
    fontSize: 16,
    marginRight: 8,
  },
  searchInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 14,
    paddingVertical: 10,
  },
  filterBar: {
    backgroundColor: theme.colors.background,
    paddingBottom: 12,
  },
  filterList: {
    paddingHorizontal: 16,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 16,
    paddingVertical: 6,
    borderRadius: theme.borderRadius.full,
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: theme.colors.borderLight,
  },
  filterChipActive: {
    backgroundColor: theme.colors.surfaceElevated,
    borderColor: theme.colors.border,
  },
  filterChipText: {
    ...theme.typography.caption,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  filterChipTextActive: {
    color: theme.colors.textPrimary,
    fontWeight: '600',
  },
  listContainer: {
    paddingBottom: 80,
  },
  chatItem: {
    flexDirection: 'row',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderBottomWidth: 1,
    borderBottomColor: theme.colors.border,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  avatarText: {
    color: theme.colors.white,
    fontSize: 16,
    fontWeight: '600',
  },
  chatContent: {
    flex: 1,
  },
  chatTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  chatName: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    flex: 1,
    marginRight: 8,
    fontWeight: '500',
  },
  chatNameUnread: {
    fontWeight: '700',
    color: theme.colors.white,
  },
  chatTime: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
    fontSize: 11,
  },
  chatTimeUnread: {
    color: theme.colors.textSecondary,
    fontWeight: '600',
  },
  chatBottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  chatPreviewContainer: {
    flex: 1,
  },
  chatSubject: {
    ...theme.typography.bodySmall,
    color: theme.colors.textPrimary,
    fontWeight: '600',
    marginBottom: 2,
    fontSize: 13,
  },
  chatPreview: {
    ...theme.typography.caption,
    color: theme.colors.textTertiary,
  },
  chatIndicators: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginLeft: 8,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: theme.colors.primary,
  },
  attachmentIcon: {
    fontSize: 12,
  },
  emptyContainer: {
    flex: 1,
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    paddingHorizontal: 40,
  },
  emptyEmoji: {
    fontSize: 64,
    marginBottom: 16,
    opacity: 0.8,
  },
  emptyTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  emptySubtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.lg,
  },
  fabIcon: {
    fontSize: 24,
  },
  rightAction: {
    backgroundColor: '#ef4444',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderTopRightRadius: 16,
    borderBottomRightRadius: 16,
  },
  leftAction: {
    backgroundColor: '#10b981',
    justifyContent: 'center',
    alignItems: 'center',
    width: 80,
    marginVertical: 4,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
  },
  actionIconText: {
    fontSize: 24,
  },
});

export default Home;
