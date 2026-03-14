const ONESIGNAL_APP_ID = import.meta.env.VITE_ONESIGNAL_APP_ID;

export const initOneSignal = async () => {
  if (!ONESIGNAL_APP_ID) {
    console.log("[OneSignal] No App ID configured — push notifications disabled");
    return;
  }

  try {
    // Dynamically load OneSignal SDK
    const OneSignalModule = await import("react-onesignal");
    const OneSignal = OneSignalModule.default;

    await OneSignal.init({
      appId: ONESIGNAL_APP_ID,
      allowLocalhostAsSecureOrigin: true,
    });

    console.log("[OneSignal] Initialized successfully");
  } catch (error) {
    console.warn("[OneSignal] Failed to initialize:", error);
  }
};

export const setOneSignalExternalUserId = async (userId: string) => {
  if (!ONESIGNAL_APP_ID) return;
  try {
    const OneSignalModule = await import("react-onesignal");
    const OneSignal = OneSignalModule.default;
    await OneSignal.login(userId);
  } catch (error) {
    console.warn("[OneSignal] Failed to set user:", error);
  }
};

export const promptForPushPermission = async () => {
  if (!ONESIGNAL_APP_ID) return false;
  try {
    const OneSignalModule = await import("react-onesignal");
    const OneSignal = OneSignalModule.default;
    const permission = await OneSignal.Notifications.requestPermission();
    return permission;
  } catch (error) {
    console.warn("[OneSignal] Permission request failed:", error);
    return false;
  }
};
