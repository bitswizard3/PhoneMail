import React, { useState, useEffect } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import { theme } from '../styles/theme';
import { authAPI } from '../services/api';
import * as Contacts from 'expo-contacts';
import * as SMS from 'expo-sms';

interface Props {
  navigation: any;
}

const PhoneVerification: React.FC<Props> = ({ navigation }) => {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    requestPermissions();
  }, []);

  const requestPermissions = async () => {
    try {
      await Contacts.requestPermissionsAsync();
      const isAvailable = await SMS.isAvailableAsync();
      if (!isAvailable) {
        console.log('SMS not available on this device');
      }
    } catch (e) {
      console.log('Permission error', e);
    }
  };

  const handleNext = async () => {
    if (!phoneNumber.trim()) {
      Alert.alert('Error', 'Please enter your phone number');
      return;
    }

    setIsLoading(true);
    try {
      const fullPhone = `${countryCode}${phoneNumber.replace(/\s/g, '')}`;
      
      // Send OTP
      const response = await authAPI.sendOTP(fullPhone, 'mobile');
      
      // Navigate to OTP screen
      navigation.navigate('OTPVerification', { 
        phone: fullPhone, 
        isNewUser: response.data.isNewUser,
        devHint: response.data.devHint 
      });
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Failed to send OTP');
    } finally {
      setIsLoading(false);
    }
  };

  const cleanPhone = phoneNumber.replace(/[^0-9]/g, '');

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Enter your phone number</Text>
        <Text style={styles.subtitle}>
          PhoneMail will create your email as{'\n'}
          <Text style={styles.emailPreview}>
            {cleanPhone ? `${cleanPhone}@phonemail.local` : 'your-number@phonemail.local'}
          </Text>
        </Text>
      </View>

      <View style={styles.form}>
        <View style={styles.phoneRow}>
          <View style={styles.countryCodeContainer}>
            <Text style={styles.flag}>🇮🇳</Text>
            <TextInput
              style={styles.countryCodeInput}
              value={countryCode}
              onChangeText={setCountryCode}
              keyboardType="phone-pad"
            />
          </View>
          <View style={styles.phoneInputContainer}>
            <TextInput
              style={styles.phoneInput}
              placeholder="Phone number"
              placeholderTextColor={theme.colors.textTertiary}
              value={phoneNumber}
              onChangeText={setPhoneNumber}
              keyboardType="phone-pad"
              autoFocus
            />
          </View>
        </View>

        <Text style={styles.infoText}>
          We will send you a 6-digit verification code via SMS
        </Text>
      </View>

      <View style={styles.bottomContainer}>
        <Text style={styles.tosText}>
          By tapping Next, you agree to the{' '}
          <Text style={styles.tosLink}>Terms of Service</Text>
        </Text>
        <TouchableOpacity
          style={[styles.nextButton, isLoading && styles.nextButtonDisabled]}
          onPress={handleNext}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.nextButtonText}>
            {isLoading ? 'Sending OTP...' : 'Next'}
          </Text>
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
    paddingHorizontal: 24,
    paddingBottom: 32,
    alignItems: 'center',
  },
  title: {
    ...theme.typography.h2,
    color: theme.colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  emailPreview: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  form: {
    paddingHorizontal: 24,
  },
  phoneRow: {
    flexDirection: 'row',
    gap: 10,
    marginBottom: 16,
  },
  countryCodeContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    paddingHorizontal: 12,
    width: 100,
  },
  flag: {
    fontSize: 20,
    marginRight: 6,
  },
  countryCodeInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingVertical: 14,
  },
  phoneInputContainer: {
    flex: 1,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  phoneInput: {
    flex: 1,
    color: theme.colors.textPrimary,
    fontSize: 16,
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  infoText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginTop: 8,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 36,
  },
  tosText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textTertiary,
    textAlign: 'center',
    marginBottom: 16,
    fontSize: 12,
  },
  tosLink: {
    color: theme.colors.accent,
  },
  nextButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    justifyContent: 'center',
    ...theme.shadows.md,
  },
  nextButtonDisabled: {
    opacity: 0.6,
  },
  nextButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default PhoneVerification;
