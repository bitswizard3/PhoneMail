import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Image } from 'react-native';
import { createDrawerNavigator, DrawerContentScrollView } from '@react-navigation/drawer';
import { theme } from '../styles/theme';
import Home from '../screens/Home';

const Drawer = createDrawerNavigator();

const CustomDrawerContent = (props: any) => {
  const { navigation, state } = props;

  const currentRoute = state?.routes[state.index];
  const activeFolder = currentRoute?.params?.folder || 'inbox';

  const menuItems = [
    { id: 'inbox', label: 'Inbox', icon: '📥', screen: 'HomeScreen' },
    { id: 'sent', label: 'Sent', icon: '📤', screen: 'HomeScreen' },
    { id: 'drafts', label: 'Drafts', icon: '📝', screen: 'HomeScreen' },
    { id: 'spam', label: 'Spam', icon: '⚠️', screen: 'HomeScreen' },
    { id: 'trash', label: 'Trash', icon: '🗑️', screen: 'HomeScreen' },
  ];

  return (
    <View style={styles.drawerContainer}>
      <DrawerContentScrollView {...props} style={styles.drawer} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.drawerHeader}>
          <View style={styles.drawerLogo}>
            <Text style={styles.drawerLogoText}>📧</Text>
          </View>
          <Text style={styles.drawerTitle}>PhoneMail</Text>
        </View>

        {/* Compose Button */}
        <View style={styles.composeContainer}>
          <TouchableOpacity 
            style={styles.composeBtn}
            onPress={() => navigation.navigate('Compose')}
            activeOpacity={0.8}
          >
            <Text style={styles.composeIcon}>✏️</Text>
            <Text style={styles.composeText}>Compose</Text>
          </TouchableOpacity>
        </View>

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item) => {
            const isActive = activeFolder === item.id;
            return (
              <TouchableOpacity
                key={item.id}
                style={[styles.menuItem, isActive && styles.menuItemActive]}
                onPress={() => {
                  if (item.screen) {
                    navigation.navigate(item.screen, { folder: item.id });
                  }
                  navigation.closeDrawer();
                }}
                activeOpacity={0.7}
              >
                <Text style={styles.menuIcon}>{item.icon}</Text>
                <Text style={[styles.menuLabel, isActive && styles.menuLabelActive]}>
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </DrawerContentScrollView>

      {/* Footer Profile */}
      <View style={styles.drawerFooter}>
        <TouchableOpacity
          style={styles.footerItem}
          onPress={() => {
            navigation.navigate('Settings');
            navigation.closeDrawer();
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.footerIcon}>⚙️</Text>
          <Text style={styles.footerLabel}>Settings</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

const DrawerNavigator: React.FC = () => {
  return (
    <Drawer.Navigator
      drawerContent={(props) => <CustomDrawerContent {...props} />}
      screenOptions={{
        headerShown: false,
        drawerStyle: {
          backgroundColor: theme.colors.surface,
          width: 280,
          borderRightWidth: 1,
          borderRightColor: theme.colors.border,
        },
        drawerType: 'slide',
        overlayColor: theme.colors.overlay,
      }}
    >
      <Drawer.Screen 
        name="HomeScreen" 
        component={Home} 
        initialParams={{ folder: 'inbox' }}
      />
    </Drawer.Navigator>
  );
};

const styles = StyleSheet.create({
  drawerContainer: {
    flex: 1,
    backgroundColor: theme.colors.surface,
  },
  drawer: {
    backgroundColor: theme.colors.surface,
  },
  drawerHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 24,
    paddingTop: 32,
    marginBottom: 8,
  },
  drawerLogo: {
    width: 36,
    height: 36,
    borderRadius: 8,
    backgroundColor: theme.colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  drawerLogoText: {
    fontSize: 18,
  },
  drawerTitle: {
    ...theme.typography.h2,
    color: theme.colors.white,
    letterSpacing: 0,
  },
  composeContainer: {
    paddingHorizontal: 16,
    marginBottom: 24,
  },
  composeBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.primary,
    paddingVertical: 14,
    paddingHorizontal: 20,
    borderRadius: theme.borderRadius.full,
    gap: 10,
  },
  composeIcon: {
    fontSize: 18,
  },
  composeText: {
    ...theme.typography.body,
    color: theme.colors.white,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: 12,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: theme.borderRadius.lg,
  },
  menuItemActive: {
    backgroundColor: theme.colors.primaryLight,
  },
  menuIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  menuLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
  menuLabelActive: {
    color: theme.colors.primary,
    fontWeight: '600',
  },
  drawerFooter: {
    padding: 16,
    borderTopWidth: 1,
    borderTopColor: theme.colors.border,
    backgroundColor: theme.colors.surface,
  },
  footerItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: theme.borderRadius.md,
  },
  footerIcon: {
    fontSize: 20,
    marginRight: 14,
  },
  footerLabel: {
    ...theme.typography.body,
    color: theme.colors.textSecondary,
    fontWeight: '500',
  },
});

export default DrawerNavigator;
