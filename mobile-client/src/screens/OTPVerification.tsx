import React, { useState, useRef } from 'react';
import { View, Text, TextInput, TouchableOpacity, StyleSheet, StatusBar, Alert } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { theme } from '../styles/theme';
import { authAPI } from '../services/api';

interface Props {
  navigation: any;
  route: any;
}

const OTPVerification: React.FC<Props> = ({ navigation, route }) => {
  const { phone, isLogin } = route.params;
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [isLoading, setIsLoading] = useState(false);
  const inputs = useRef<TextInput[]>([]);

  const handleOtpChange = (value: string, index: number) => {
    const newOtp = [...otp];
    newOtp[index] = value;
    setOtp(newOtp);

    if (value && index < 5) {
      inputs.current[index + 1]?.focus();
    }

    // Auto-submit when all digits entered
    if (index === 5 && value) {
      const code = [...newOtp.slice(0, 5), value].join('');
      if (code.length === 6) {
        handleVerify(code);
      }
    }
  };

  const handleKeyPress = (e: any, index: number) => {
    if (e.nativeEvent.key === 'Backspace' && !otp[index] && index > 0) {
      inputs.current[index - 1]?.focus();
    }
  };

  const handleVerify = async (code?: string) => {
    const otpCode = code || otp.join('');
    if (otpCode.length !== 6) {
      Alert.alert('Error', 'Please enter the complete 6-digit OTP');
      return;
    }

    setIsLoading(true);
    try {
      const response = await authAPI.verifyOTP(phone, otpCode);
      const { token, user } = response.data;
      
      if (token) {
        await AsyncStorage.setItem('phonemail_token', token);
        await AsyncStorage.setItem('phonemail_user', JSON.stringify(user));
        navigation.reset({ index: 0, routes: [{ name: 'MainApp' }] });
      }
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.error || 'Invalid OTP');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={theme.colors.background} />

      <View style={styles.header}>
        <Text style={styles.title}>Verify your number</Text>
        <Text style={styles.subtitle}>
          Enter the 6-digit code sent to{'\n'}
          <Text style={styles.phoneText}>{phone}</Text>
        </Text>
      </View>

      <View style={styles.otpContainer}>
        {otp.map((digit, index) => (
          <TextInput
            key={index}
            ref={(ref) => { if (ref) inputs.current[index] = ref; }}
            style={[styles.otpInput, digit ? styles.otpInputFilled : {}]}
            value={digit}
            onChangeText={(value) => handleOtpChange(value, index)}
            onKeyPress={(e) => handleKeyPress(e, index)}
            keyboardType="number-pad"
            maxLength={1}
            selectTextOnFocus
          />
        ))}
      </View>

      <TouchableOpacity style={styles.resendButton} activeOpacity={0.7}>
        <Text style={styles.resendText}>
          Didn't receive the code? <Text style={styles.resendLink}>Resend</Text>
        </Text>
      </TouchableOpacity>

      <TouchableOpacity style={{ marginTop: 16, paddingHorizontal: 24 }} onPress={() => Alert.alert('Help', 'Fallback Demo OTP: 123456')} activeOpacity={0.7}>
        <Text style={{ textAlign: 'center', color: theme.colors.textTertiary, fontSize: 12, textDecorationLine: 'underline' }}>
          Need Help?
        </Text>
      </TouchableOpacity>

      <View style={styles.bottomContainer}>
        <TouchableOpacity
          style={[styles.verifyButton, isLoading && styles.verifyButtonDisabled]}
          onPress={() => handleVerify()}
          activeOpacity={0.8}
          disabled={isLoading}
        >
          <Text style={styles.verifyButtonText}>
            {isLoading ? 'Verifying...' : 'Verify'}
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
    marginBottom: 12,
  },
  subtitle: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  phoneText: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  otpContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  otpInput: {
    width: 48,
    height: 56,
    backgroundColor: theme.colors.surfaceElevated,
    borderRadius: theme.borderRadius.md,
    borderWidth: 1,
    borderColor: theme.colors.border,
    textAlign: 'center',
    fontSize: 22,
    fontWeight: '700',
    color: theme.colors.textPrimary,
  },
  otpInputFilled: {
    borderColor: theme.colors.accent,
    backgroundColor: 'rgba(37, 211, 102, 0.08)',
  },
  resendButton: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  resendText: {
    ...theme.typography.bodySmall,
    color: theme.colors.textSecondary,
  },
  resendLink: {
    color: theme.colors.accent,
    fontWeight: '600',
  },
  mockHint: {
    textAlign: 'center',
    color: theme.colors.textTertiary,
    fontSize: 12,
    marginTop: 16,
    paddingHorizontal: 24,
  },
  mockCode: {
    color: theme.colors.accent,
    fontWeight: '700',
    fontSize: 14,
  },
  bottomContainer: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 20,
    paddingBottom: 36,
  },
  verifyButton: {
    backgroundColor: theme.colors.accent,
    paddingVertical: 16,
    borderRadius: theme.borderRadius.full,
    alignItems: 'center',
    ...theme.shadows.md,
  },
  verifyButtonDisabled: {
    opacity: 0.6,
  },
  verifyButtonText: {
    color: theme.colors.textInverse,
    fontSize: 16,
    fontWeight: '700',
  },
});

export default OTPVerification;
