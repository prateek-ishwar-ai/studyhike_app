// Mobile app detection and utilities

// Check if Capacitor is available (native app)
export const isNativeApp = () => {
  try {
    // Try to import Capacitor dynamically
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return (window as any).Capacitor.isNativePlatform();
    }
    return false;
  } catch {
    return false;
  }
};

export const getPlatform = () => {
  try {
    if (typeof window !== 'undefined' && (window as any).Capacitor) {
      return (window as any).Capacitor.getPlatform();
    }
    return 'web';
  } catch {
    return 'web';
  }
};

// Check if we're running in the mobile app environment
export const isMobileApp = () => {
  return isNativeApp() || 
         (typeof window !== 'undefined' && 
          (window.navigator.userAgent.includes('StudyHike') ||
           window.navigator.userAgent.includes('capacitor')));
};

// Check if we should use password authentication (mobile app)
export const shouldUsePasswordAuth = () => {
  return isMobileApp() || 
         (typeof window !== 'undefined' && 
          (window.location.hostname === 'app.studyhike.in' || 
           window.location.pathname.includes('/app/') ||
           localStorage.getItem('app_mode') === 'true'));
};

// Check if this is the app-specific URL/domain
export const isAppDomain = () => {
  if (typeof window === 'undefined') return false;
  
  return window.location.hostname === 'app.studyhike.in' ||
         window.location.pathname.startsWith('/app/') ||
         window.location.search.includes('app=true');
};

// Set app mode for testing
export const setAppMode = (enabled: boolean) => {
  if (typeof window !== 'undefined') {
    if (enabled) {
      localStorage.setItem('app_mode', 'true');
    } else {
      localStorage.removeItem('app_mode');
    }
  }
};

// Enhanced biometric utilities using Web API and native fallbacks
export const BiometricAuth = {
  // Check if biometric authentication is available
  isAvailable: async () => {
    try {
      // Check for WebAuthn API support
      if (typeof window !== 'undefined' && 
          window.PublicKeyCredential && 
          window.navigator.credentials) {
        // Check if platform authenticator is available
        const available = await window.PublicKeyCredential.isUserVerifyingPlatformAuthenticatorAvailable();
        return available;
      }
      
      // Fallback for mobile devices (check for touch/mobile indicators)
      if (typeof window !== 'undefined') {
        const isMobile = /Android|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        const hasTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        return isMobile || hasTouch;
      }
      
      return false;
    } catch (error) {
      console.log('Biometric availability check failed:', error);
      return false;
    }
  },

  // Authenticate using biometric (WebAuthn or fallback)
  authenticate: async (reason = 'Please authenticate to continue') => {
    try {
      // Try WebAuthn first
      if (typeof window !== 'undefined' && 
          window.PublicKeyCredential && 
          window.navigator.credentials) {
        
        try {
          // Create a simple authentication challenge
          const publicKeyCredentialRequestOptions = {
            challenge: new Uint8Array(32),
            allowCredentials: [],
            userVerification: 'preferred' as const,
            timeout: 60000,
          };

          const credential = await navigator.credentials.get({
            publicKey: publicKeyCredentialRequestOptions
          });

          return { verified: !!credential };
        } catch (webAuthnError) {
          console.log('WebAuthn failed, falling back to simple auth:', webAuthnError);
        }
      }

      // Fallback for demonstration/testing
      return new Promise((resolve) => {
        // Simulate processing time
        setTimeout(() => {
          const success = window.confirm(`🔐 ${reason}\n\n👆 Touch the fingerprint sensor or confirm with biometric authentication\n\n(This is a demo - click OK to simulate successful authentication)`);
          resolve({ verified: success });
        }, 800);
      });

    } catch (error) {
      console.error('Biometric auth error:', error);
      return { verified: false, error: error.message };
    }
  },

  // Register biometric credential (for WebAuthn)
  register: async (email: string) => {
    try {
      if (typeof window !== 'undefined' && 
          window.PublicKeyCredential && 
          window.navigator.credentials) {
        
        const publicKeyCredentialCreationOptions = {
          challenge: new Uint8Array(32),
          rp: {
            name: "StudyHike",
            id: window.location.hostname,
          },
          user: {
            id: new TextEncoder().encode(email),
            name: email,
            displayName: email,
          },
          pubKeyCredParams: [{alg: -7, type: "public-key" as const}],
          authenticatorSelection: {
            authenticatorAttachment: "platform" as const,
            userVerification: "preferred" as const,
          },
          timeout: 60000,
          attestation: "direct" as const
        };

        const credential = await navigator.credentials.create({
          publicKey: publicKeyCredentialCreationOptions
        });

        if (credential) {
          // Store credential ID for future authentication
          localStorage.setItem('webauthn_credential_id', credential.id);
          return { success: true };
        }
      }
      
      return { success: false, error: 'WebAuthn not supported' };
    } catch (error) {
      console.error('Biometric registration error:', error);
      return { success: false, error: error.message };
    }
  },

  // Check if biometric is enabled for the current user
  isEnabled: () => {
    return localStorage.getItem('biometric_enabled') === 'true';
  },

  // Enable biometric authentication
  enable: () => {
    localStorage.setItem('biometric_enabled', 'true');
  },

  // Disable biometric authentication
  disable: () => {
    localStorage.removeItem('biometric_enabled');
    localStorage.removeItem('app_saved_email');
    localStorage.removeItem('app_saved_password');
    localStorage.removeItem('app_saved_role');
    localStorage.removeItem('webauthn_credential_id');
  }
};