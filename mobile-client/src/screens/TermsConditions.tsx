import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView, StatusBar } from 'react-native';
import { theme } from '../styles/theme';

interface Props {
  navigation: any;
}

const TermsConditions: React.FC<Props> = ({ navigation }) => {
  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Terms & Conditions</Text>
      </View>

      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.content}>
          <Text style={styles.welcomeText}>Welcome to PhoneMail</Text>
          <Text style={styles.paragraph}>
            Please read our Terms of Service and Privacy Policy before using PhoneMail. 
            By tapping "Agree & Continue", you accept our terms.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📧 About PhoneMail</Text>
            <Text style={styles.paragraph}>
              PhoneMail is an email service that uses your phone number as your email address. 
              Your email will be formatted as your-phone-number@phonemail.local.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>🔐 Privacy</Text>
            <Text style={styles.paragraph}>
              We respect your privacy. Your emails are stored securely and encrypted. 
              We do not sell your data to third parties.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📱 Permissions</Text>
            <Text style={styles.paragraph}>
              PhoneMail requires the following permissions:{'\n'}
              • Phone Number Detection - To auto-fill your number{'\n'}
              • SMS Access - For OTP auto-verification{'\n'}
              • Contacts - To find people you know on PhoneMail{'\n'}
              • Notifications - To alert you of new emails
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>📋 Terms of Service</Text>
            <Text style={styles.paragraph}>
              By using PhoneMail, you agree not to:{'\n'}
              • Send spam or unsolicited emails{'\n'}
              • Use the service for illegal purposes{'\n'}
              • Share your account credentials{'\n'}
              • Attempt to breach the system's security
            </Text>
          </View>
        </View>
      </ScrollView>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={styles.agreeButton}
          onPress={() => navigation.navigate('PhoneVerification')}
          activeOpacity={0.8}
        >
          <Text style={styles.agreeButtonText}>Agree & Continue</Text>
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
    paddingTop: 60,
    paddingBottom: 16,
    paddingHorizontal: 24,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: 24,
    paddingBottom: 20,
  },
  welcomeText: {
    ...theme.typography.h3,
    color: theme.colors.accent,
    textAlign: 'center',
    marginBottom: 16,
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    ...theme.typography.h3,
    color: theme.colors.textPrimary,
    marginBottom: 8,
  },
  paragraph: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    lineHeight: 22,
  },
  bottomContainer: {
    padding: 20,
    paddingBottom: 36,
  },
  agreeButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  agreeButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default TermsConditions;
