import {PermissionsAndroid, Platform} from 'react-native';

const PERMISSION = PermissionsAndroid.PERMISSIONS.READ_SMS;

export const hasSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    return await PermissionsAndroid.check(PERMISSION);
  } catch {
    return false;
  }
};

export const requestSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const result = await PermissionsAndroid.request(
      PERMISSION,
      {
        title: 'SMS Access Needed',
        message:
          'Axpense reads transaction SMS from your bank to automatically track your expenses.',
        buttonPositive: 'Allow',
        buttonNegative: 'Deny',
      },
    );

    return result === PermissionsAndroid.RESULTS.GRANTED;
  } catch {
    return false;
  }
};

export const ensureSmsPermission = async (): Promise<boolean> => {
  if (await hasSmsPermission()) {
    return true;
  }

  return requestSmsPermission();
};
