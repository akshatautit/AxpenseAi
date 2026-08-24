import {PermissionsAndroid, Platform} from 'react-native';

// READ_SMS → inbox padhne ke liye (dashboard/backfill).
// RECEIVE_SMS → live transaction events ke liye (SMS_RECEIVED broadcast).
// Dono zaroori hain — ek ke bina pipeline adhoori reh jaati hai.
const SMS_PERMISSIONS = [
  PermissionsAndroid.PERMISSIONS.READ_SMS,
  PermissionsAndroid.PERMISSIONS.RECEIVE_SMS,
];

export const hasSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    for (const permission of SMS_PERMISSIONS) {
      if (!(await PermissionsAndroid.check(permission))) {
        return false;
      }
    }
    return true;
  } catch {
    return false;
  }
};

export const requestSmsPermission = async (): Promise<boolean> => {
  if (Platform.OS !== 'android') {
    return false;
  }

  try {
    const results = await PermissionsAndroid.requestMultiple(SMS_PERMISSIONS);

    return SMS_PERMISSIONS.every(
      permission => results[permission] === PermissionsAndroid.RESULTS.GRANTED,
    );
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
