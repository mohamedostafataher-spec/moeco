
import { LocalNotifications } from '@capacitor/local-notifications';
import { Haptics, ImpactStyle } from '@capacitor/haptics';
import { PushNotifications, Token, ActionPerformed, PushNotificationSchema } from '@capacitor/push-notifications';
import { Capacitor } from '@capacitor/core';

export enum AlertSeverity {
  Critical = 'critical',
  High = 'high',
  Medium = 'medium',
  Low = 'low'
}

export interface EmergencyAlert {
  id: string;
  title: { ar: string; en: string };
  message: { ar: string; en: string };
  severity: AlertSeverity;
  category: string;
  instructions?: { ar: string; en: string };
}

class NotificationService {
  private alertQueue: EmergencyAlert[] = [];
  private isShowingAlert = false;
  private onAlertTriggerCallback: ((alert: EmergencyAlert) => Promise<void>) | null = null;
  private currentSiren: HTMLAudioElement | null = null;
  private audioUnlocked: boolean = false;

  constructor() {
    console.log('[NotificationService] Core Initialized');
    this.init();
    this.setupAudioUnlocker();
  }

  private setupAudioUnlocker() {
    if (typeof window === 'undefined') return;
    const unlock = () => {
      if (this.audioUnlocked) return;
      try {
        const silentAudio = new Audio('data:audio/wav;base64,UklGRigAAABXQVZFZm10IBIAAAABAAEARKwAAIhYAQACABAAAABkYXRhAgAAAAEA');
        silentAudio.play().then(() => {
          this.audioUnlocked = true;
          console.log('[NotificationService] Audio unlocked via user gesture.');
          window.removeEventListener('click', unlock);
          window.removeEventListener('touchstart', unlock);
        }).catch(() => { /* ignore */ });
      } catch (e) { }
    };
    window.addEventListener('click', unlock, { once: true });
    window.addEventListener('touchstart', unlock, { once: true });
  }

  public async init() {
    try {
      if (!Capacitor.isNativePlatform()) return;
      const permission = await LocalNotifications.requestPermissions();
      if (permission.display === 'granted') {
        console.log('Local Notifications permission granted');
      }
      await this.initPushNotifications();
    } catch (e) {
      console.warn('Notifications init error', e);
    }
  }

  private async initPushNotifications() {
    let permStatus = await PushNotifications.checkPermissions();
    if (permStatus.receive === 'prompt') {
      permStatus = await PushNotifications.requestPermissions();
    }
    if (permStatus.receive === 'granted') {
      await PushNotifications.register();
      this.addPushListeners();
    }
  }

  private addPushListeners() {
    PushNotifications.addListener('registration', (token: Token) => {
      localStorage.setItem('push_token', token.value);
    });
    PushNotifications.addListener('pushNotificationReceived', (notification: PushNotificationSchema) => {
      this.sendLocalNotification(notification.title || 'Alert', notification.body || '');
    });
  }

  // --- FIFO QUEUE SYSTEM (MANDATORY) ---

  public async queueAlert(alert: EmergencyAlert) {
    console.log(`[ALERT QUEUE] Incoming: ${alert.title.en}`);
    this.alertQueue.push(alert);
    this.processQueue();
  }

  private async processQueue() {
    if (this.isShowingAlert || this.alertQueue.length === 0) return;

    this.isShowingAlert = true;
    const alert = this.alertQueue.shift();
    if (!alert) {
      this.isShowingAlert = false;
      return;
    }

    try {
      if (this.onAlertTriggerCallback) {
        await this.onAlertTriggerCallback(alert);
      }
    } catch (error) {
      console.error('Error processing alert:', error);
    } finally {
      this.isShowingAlert = false;
      this.processQueue(); // Automatically show next alert
    }
  }

  public setAlertHandler(handler: (alert: EmergencyAlert) => Promise<void>) {
    this.onAlertTriggerCallback = handler;
  }

  // --- SENSORY FEEDBACK SYSTEM ---

  public triggerSensoryFeedback(alert: EmergencyAlert, language: 'ar' | 'en') {
    const isCritical = alert.severity === AlertSeverity.Critical || alert.severity === AlertSeverity.High || alert.severity === 'Extreme Emergency' as any || alert.severity === 'Danger' as any;
    
    // 1. SOUND (MANDATORY LOOP)
    this.playSiren(isCritical);

    // 2. VIBRATION (PATTERN)
    if ('vibrate' in navigator) {
      navigator.vibrate([0, 500, 300, 500, 300, 500]);
    }

    // 3. TEXT TO SPEECH
    const ttsText = language === 'ar' 
      ? `تنبيه عاجل: ${alert.title.ar}. ${alert.message.ar}`
      : `Emergency Alert: ${alert.title.en}. ${alert.message.en}`;
    
    this.speak(ttsText, language);

    // 4. OVERRIDE REPEAT (handled by higher-level component)
  }

  private playSiren(isCritical: boolean) {
    try {
      if (this.currentSiren) this.currentSiren.pause();
      // Changed to a modest short notification alarm to avoid annoying the user
      this.currentSiren = new Audio('https://actions.google.com/sounds/v1/alarms/digital_watch_alarm_long.ogg');
      this.currentSiren.loop = false;
      this.currentSiren.volume = isCritical ? 0.8 : 0.5;
      this.currentSiren.play().catch(e => {
        console.warn('Audio blocked or failed', e);
        // Fallback or retry logic if needed
      });
    } catch (e) {
      console.warn('Audio subsystem error', e);
    }
  }

  public stopFeedback() {
    if (this.currentSiren) {
      this.currentSiren.pause();
      this.currentSiren = null;
    }
    window.speechSynthesis.cancel();
    if ('vibrate' in navigator) navigator.vibrate(0);
  }

  private speak(text: string, language: 'ar' | 'en') {
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US';
    utterance.rate = 1.0;
    window.speechSynthesis.speak(utterance);
  }

  public async sendLocalNotification(title: string, body: string, isCritical: boolean = false) {
    try {
      if (!Capacitor.isNativePlatform()) return;
      await LocalNotifications.schedule({
        notifications: [{ 
          title, 
          body, 
          id: Date.now() % 100000, 
          schedule: { at: new Date(Date.now() + 1000) },
          sound: isCritical ? 'emergency_siren.wav' : undefined,
          channelId: isCritical ? 'emergency-alerts' : 'default', // Emergency channel config expected in native project
          extra: { isCritical }
        }]
      });
    } catch (e) {
      console.log(`Local notification simulated: ${title} (Critical: ${isCritical})`);
    }
  }

  // --- UTILS ---
  // --- PUBLIC INTERFACE ---
  public sendMultiChannelAlert(payload: { title: string, message: string, severity: string }) {
    this.sendLocalNotification(payload.title, payload.message);
    // If it's critical, we could trigger sensory feedback here or through the queue
  }

  public sendBroadcast(title: string, message: string, type: string = 'info') {
    this.sendLocalNotification(title, message);
    console.log(`[BROADCAST] ${type}: ${title}`);
  }

  public vibrate(pattern: number | number[] = 10, _ignored?: any) {
    if ('vibrate' in navigator) navigator.vibrate(pattern);
  }

  public success(message: string, title?: string) { 
    console.log('✅', title ? `${title}: ${message}` : message); 
  }
  public error(message: string, title?: string) { 
    console.warn('❌', title ? `${title}: ${message}` : message); 
  }
  public info(message: string, title?: string) { 
    console.log('ℹ️', title ? `${title}: ${message}` : message); 
  }
  public warning(message: string, title?: string) { 
    console.warn('⚠️', title ? `${title}: ${message}` : message); 
  }
}

export const notificationService = new NotificationService();
