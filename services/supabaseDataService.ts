import {
  supabase,
  isSupabaseConfigured,
  formatSupabaseErrorAr,
} from './supabaseClient';
import type {
  HomeUtilityRecord,
  PersonalComplaint,
  SavedPublicProjectNote,
  UtilityServiceType,
  UtilityEntryKind,
  UtilityDateMode,
  ComplaintCategoryId,
  ComplaintLocalStatus,
} from './personalCivicService';

export const CURRENT_CONSENT_VERSION = '1.0';

export const ALLOWED_USAGE_EVENTS = [
  'feature_opened',
  'reading_saved',
  'reading_deleted',
  'complaint_draft_created',
  'complaint_external_opened',
  'account_linked',
  'data_exported',
  'data_deleted',
] as const;

export type UsageEventName = (typeof ALLOWED_USAGE_EVENTS)[number];

export interface UserPrivacyProfile {
  userId: string;
  consentVersion: string;
  coreConsentAcceptedAt: string | null;
  analyticsEnabled: boolean;
  privacyPreferences: Record<string, unknown>;
  accountKind: 'anonymous' | 'linked';
  createdAt: string;
  updatedAt: string;
}

export interface ConsentRecord {
  id: string;
  userId: string;
  consentType: 'core_storage' | 'usage_analytics';
  consentVersion: string;
  granted: boolean;
  acceptedAt: string;
  revokedAt: string | null;
}

export interface OfficialSourceRecord {
  id: string;
  title: string;
  governorate: string | null;
  sector: string | null;
  statusText: string | null;
  sourceUrl: string;
  sourceOwner: string;
  recordData: Record<string, unknown>;
  sourcePublishedAt: string | null;
  importedAt: string;
  verifiedAt: string | null;
  dataStatus: 'verified' | 'archived' | 'needs_review';
  isPublished: boolean;
}

export interface OwnerUsageSummary {
  window_days: number;
  generated_at: string;
  total_profiles: number;
  anonymous_profiles: number;
  linked_profiles: number;
  analytics_opted_in_profiles: number;
  active_users_in_window: number;
  returning_users_in_window: number;
  total_readings_count: number;
  total_complaint_drafts_count: number;
  published_official_sources_count: number;
  feature_opens_by_day: { day: string; feature: string; count: number }[];
  events_by_type: { event_name: string; count: number }[];
}

function ensureConfigured(): void {
  if (!isSupabaseConfigured) {
    throw new Error(formatSupabaseErrorAr({ code: 'SUPABASE_NOT_CONFIGURED' }));
  }
}

const DB_STATUS_TO_UI: Record<string, ComplaintLocalStatus> = {
  draft: 'draft_moeco',
  external_site_opened: 'opened_official_channel',
  user_added_reference: 'tracking_entered',
  closed_by_user: 'closed_by_user',
};

const UI_STATUS_TO_DB: Record<ComplaintLocalStatus, string> = {
  draft_moeco: 'draft',
  opened_official_channel: 'external_site_opened',
  tracking_entered: 'user_added_reference',
  closed_by_user: 'closed_by_user',
};

function mapReadingRow(row: any): HomeUtilityRecord {
  return {
    id: row.id,
    userId: row.user_id,
    serviceType: row.utility_type as UtilityServiceType,
    entryKind: row.entry_kind as UtilityEntryKind,
    value: Number(row.value),
    unit: row.unit,
    dateMode: row.date_mode as UtilityDateMode,
    readingDate: row.reading_date || row.period_end || row.period_start || '',
    periodStart: row.period_start || undefined,
    periodEnd: row.period_end || undefined,
    amountPaid: row.amount_paid !== null && row.amount_paid !== undefined ? Number(row.amount_paid) : undefined,
    currency: row.currency || undefined,
    personalNote: row.note || undefined,
    attachment: row.attachment_meta || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapComplaintRow(row: any): PersonalComplaint {
  return {
    id: row.id,
    userId: row.user_id,
    category: row.category as ComplaintCategoryId,
    title: row.title,
    description: row.description,
    areaOrAddress: row.approximate_location,
    incidentDateTime: row.occurred_at || '',
    privateNotes: row.private_notes || undefined,
    locationConsentGiven: Boolean(row.location_consent_given),
    lat: row.lat !== null && row.lat !== undefined ? Number(row.lat) : undefined,
    lng: row.lng !== null && row.lng !== undefined ? Number(row.lng) : undefined,
    status: DB_STATUS_TO_UI[row.status] || 'draft_moeco',
    officialChannelOpenedAt: row.official_channel_opened_at || undefined,
    officialChannelUrlUsed: row.official_channel_url_used || undefined,
    trackingNumber: row.user_entered_reference || undefined,
    officialSubmittedDate: row.official_submitted_date || undefined,
    officialEntityName: row.official_entity_name || undefined,
    followUpNotes: row.follow_up_notes || undefined,
    reminderDateTime: row.reminder_at ? String(row.reminder_at).slice(0, 16) : undefined,
    attachment: row.attachment_meta || undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function mapProfileRow(row: any): UserPrivacyProfile {
  return {
    userId: row.user_id,
    consentVersion: row.consent_version || CURRENT_CONSENT_VERSION,
    coreConsentAcceptedAt: row.core_consent_accepted_at || null,
    analyticsEnabled: Boolean(row.analytics_enabled),
    privacyPreferences: row.privacy_preferences || {},
    accountKind: row.account_kind === 'linked' ? 'linked' : 'anonymous',
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

export const supabaseDataService = {
  // --- Profiles & Consents ---
  async getProfile(userId: string): Promise<UserPrivacyProfile | null> {
    if (!isSupabaseConfigured || !userId) return null;
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('user_id', userId)
      .maybeSingle();
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return data ? mapProfileRow(data) : null;
  },

  async upsertConsentProfile(params: {
    userId: string;
    analyticsEnabled: boolean;
    accountKind: 'anonymous' | 'linked';
    privacyPreferences?: Record<string, unknown>;
  }): Promise<UserPrivacyProfile> {
    ensureConfigured();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .upsert(
        {
          user_id: params.userId,
          consent_version: CURRENT_CONSENT_VERSION,
          core_consent_accepted_at: now,
          analytics_enabled: params.analyticsEnabled,
          account_kind: params.accountKind,
          privacy_preferences: params.privacyPreferences || {},
        },
        { onConflict: 'user_id' },
      )
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorAr(error));

    const { error: consentError } = await supabase.from('consents').insert([
      {
        user_id: params.userId,
        consent_type: 'core_storage',
        consent_version: CURRENT_CONSENT_VERSION,
        granted: true,
        accepted_at: now,
      },
      {
        user_id: params.userId,
        consent_type: 'usage_analytics',
        consent_version: CURRENT_CONSENT_VERSION,
        granted: params.analyticsEnabled,
        accepted_at: now,
        revoked_at: params.analyticsEnabled ? null : now,
      },
    ]);
    if (consentError) throw new Error(formatSupabaseErrorAr(consentError));

    return mapProfileRow(data);
  },

  async updateAnalyticsPreference(userId: string, enabled: boolean): Promise<UserPrivacyProfile> {
    ensureConfigured();
    const now = new Date().toISOString();
    const { data, error } = await supabase
      .from('profiles')
      .update({ analytics_enabled: enabled })
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorAr(error));

    await supabase.from('consents').insert([
      {
        user_id: userId,
        consent_type: 'usage_analytics',
        consent_version: CURRENT_CONSENT_VERSION,
        granted: enabled,
        accepted_at: now,
        revoked_at: enabled ? null : now,
      },
    ]);

    return mapProfileRow(data);
  },

  async updateAccountKind(userId: string, accountKind: 'anonymous' | 'linked'): Promise<void> {
    if (!isSupabaseConfigured || !userId) return;
    await supabase.from('profiles').update({ account_kind: accountKind }).eq('user_id', userId);
  },

  async listConsents(userId: string): Promise<ConsentRecord[]> {
    ensureConfigured();
    const { data, error } = await supabase
      .from('consents')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      consentType: r.consent_type,
      consentVersion: r.consent_version,
      granted: Boolean(r.granted),
      acceptedAt: r.accepted_at,
      revokedAt: r.revoked_at || null,
    }));
  },

  // --- Household Readings (ملف بيتي) ---
  async listHouseholdReadings(userId: string): Promise<HomeUtilityRecord[]> {
    if (!isSupabaseConfigured || !userId) return [];
    const { data, error } = await supabase
      .from('household_readings')
      .select('*')
      .eq('user_id', userId)
      .order('reading_date', { ascending: false })
      .order('created_at', { ascending: false });
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return (data || []).map(mapReadingRow);
  },

  async createHouseholdReading(
    userId: string,
    payload: Omit<HomeUtilityRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<HomeUtilityRecord> {
    ensureConfigured();
    const safeAttachmentMeta = payload.attachment
      ? {
          id: payload.attachment.id,
          name: payload.attachment.name,
          mimeType: payload.attachment.mimeType,
          sizeBytes: payload.attachment.sizeBytes,
          addedAt: payload.attachment.addedAt,
          dataUrl: '', // Never upload binary/base64 blobs automatically into database rows
        }
      : null;

    const { data, error } = await supabase
      .from('household_readings')
      .insert([
        {
          user_id: userId,
          utility_type: payload.serviceType,
          entry_kind: payload.entryKind,
          value: payload.value,
          unit: payload.unit,
          date_mode: payload.dateMode,
          reading_date: payload.readingDate || null,
          period_start: payload.periodStart || null,
          period_end: payload.periodEnd || null,
          amount_paid: payload.amountPaid ?? null,
          currency: payload.currency || null,
          note: payload.personalNote || null,
          attachment_meta: safeAttachmentMeta,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorAr(error));
    return mapReadingRow(data);
  },

  async updateHouseholdReading(
    userId: string,
    id: string,
    payload: Partial<Omit<HomeUtilityRecord, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<HomeUtilityRecord> {
    ensureConfigured();
    const updates: Record<string, unknown> = {};
    if (payload.serviceType !== undefined) updates.utility_type = payload.serviceType;
    if (payload.entryKind !== undefined) updates.entry_kind = payload.entryKind;
    if (payload.value !== undefined) updates.value = payload.value;
    if (payload.unit !== undefined) updates.unit = payload.unit;
    if (payload.dateMode !== undefined) updates.date_mode = payload.dateMode;
    if (payload.readingDate !== undefined) updates.reading_date = payload.readingDate || null;
    if (payload.periodStart !== undefined) updates.period_start = payload.periodStart || null;
    if (payload.periodEnd !== undefined) updates.period_end = payload.periodEnd || null;
    if ('amountPaid' in payload) updates.amount_paid = payload.amountPaid ?? null;
    if ('currency' in payload) updates.currency = payload.currency || null;
    if ('personalNote' in payload) updates.note = payload.personalNote || null;
    if ('attachment' in payload) {
      updates.attachment_meta = payload.attachment
        ? {
            id: payload.attachment.id,
            name: payload.attachment.name,
            mimeType: payload.attachment.mimeType,
            sizeBytes: payload.attachment.sizeBytes,
            addedAt: payload.attachment.addedAt,
            dataUrl: '',
          }
        : null;
    }

    const { data, error } = await supabase
      .from('household_readings')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorAr(error));
    return mapReadingRow(data);
  },

  async deleteHouseholdReading(userId: string, id: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
      .from('household_readings')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(formatSupabaseErrorAr(error));
  },

  async deleteAllHouseholdReadings(userId: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
      .from('household_readings')
      .delete()
      .eq('user_id', userId);
    if (error) throw new Error(formatSupabaseErrorAr(error));
  },

  // --- Complaint Drafts (شكواي ما تضيعش) ---
  async listComplaintDrafts(userId: string): Promise<PersonalComplaint[]> {
    if (!isSupabaseConfigured || !userId) return [];
    const { data, error } = await supabase
      .from('complaint_drafts')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return (data || []).map(mapComplaintRow);
  },

  async createComplaintDraft(
    userId: string,
    payload: Omit<PersonalComplaint, 'id' | 'userId' | 'createdAt' | 'updatedAt'>,
  ): Promise<PersonalComplaint> {
    ensureConfigured();
    const safeAttachmentMeta = payload.attachment
      ? {
          id: payload.attachment.id,
          name: payload.attachment.name,
          mimeType: payload.attachment.mimeType,
          sizeBytes: payload.attachment.sizeBytes,
          addedAt: payload.attachment.addedAt,
          dataUrl: '',
        }
      : null;

    const { data, error } = await supabase
      .from('complaint_drafts')
      .insert([
        {
          user_id: userId,
          category: payload.category,
          title: payload.title,
          description: payload.description,
          approximate_location: payload.areaOrAddress,
          occurred_at: payload.incidentDateTime || null,
          private_notes: payload.privateNotes || null,
          location_consent_given: Boolean(payload.locationConsentGiven),
          lat: payload.locationConsentGiven ? payload.lat ?? null : null,
          lng: payload.locationConsentGiven ? payload.lng ?? null : null,
          status: UI_STATUS_TO_DB[payload.status] || 'draft',
          attachment_meta: safeAttachmentMeta,
        },
      ])
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorAr(error));
    return mapComplaintRow(data);
  },

  async updateComplaintDraft(
    userId: string,
    id: string,
    payload: Partial<Omit<PersonalComplaint, 'id' | 'userId' | 'createdAt' | 'updatedAt'>>,
  ): Promise<PersonalComplaint> {
    ensureConfigured();
    const updates: Record<string, unknown> = {};
    if (payload.category !== undefined) updates.category = payload.category;
    if (payload.title !== undefined) updates.title = payload.title;
    if (payload.description !== undefined) updates.description = payload.description;
    if (payload.areaOrAddress !== undefined) updates.approximate_location = payload.areaOrAddress;
    if ('incidentDateTime' in payload) updates.occurred_at = payload.incidentDateTime || null;
    if ('privateNotes' in payload) updates.private_notes = payload.privateNotes || null;
    if (payload.locationConsentGiven !== undefined) {
      updates.location_consent_given = Boolean(payload.locationConsentGiven);
    }
    if ('lat' in payload) updates.lat = payload.lat ?? null;
    if ('lng' in payload) updates.lng = payload.lng ?? null;
    if (payload.status !== undefined) updates.status = UI_STATUS_TO_DB[payload.status] || 'draft';
    if ('officialChannelOpenedAt' in payload) {
      updates.official_channel_opened_at = payload.officialChannelOpenedAt || null;
    }
    if ('officialChannelUrlUsed' in payload) {
      updates.official_channel_url_used = payload.officialChannelUrlUsed || null;
    }
    if ('trackingNumber' in payload) updates.user_entered_reference = payload.trackingNumber || null;
    if ('officialSubmittedDate' in payload) {
      updates.official_submitted_date = payload.officialSubmittedDate || null;
    }
    if ('officialEntityName' in payload) {
      updates.official_entity_name = payload.officialEntityName || null;
    }
    if ('followUpNotes' in payload) updates.follow_up_notes = payload.followUpNotes || null;
    if ('reminderDateTime' in payload) {
      updates.reminder_at = payload.reminderDateTime ? new Date(payload.reminderDateTime).toISOString() : null;
    }
    if ('attachment' in payload) {
      updates.attachment_meta = payload.attachment
        ? {
            id: payload.attachment.id,
            name: payload.attachment.name,
            mimeType: payload.attachment.mimeType,
            sizeBytes: payload.attachment.sizeBytes,
            addedAt: payload.attachment.addedAt,
            dataUrl: '',
          }
        : null;
    }

    const { data, error } = await supabase
      .from('complaint_drafts')
      .update(updates)
      .eq('id', id)
      .eq('user_id', userId)
      .select()
      .single();

    if (error) throw new Error(formatSupabaseErrorAr(error));
    return mapComplaintRow(data);
  },

  async deleteComplaintDraft(userId: string, id: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
      .from('complaint_drafts')
      .delete()
      .eq('id', id)
      .eq('user_id', userId);
    if (error) throw new Error(formatSupabaseErrorAr(error));
  },

  async deleteAllComplaintDrafts(userId: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
      .from('complaint_drafts')
      .delete()
      .eq('user_id', userId);
    if (error) throw new Error(formatSupabaseErrorAr(error));
  },

  // --- Official Sources & Saved Project Notes ---
  async listPublishedOfficialSources(): Promise<OfficialSourceRecord[]> {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('official_sources')
      .select('*')
      .eq('is_published', true)
      .in('data_status', ['verified', 'archived'])
      .order('imported_at', { ascending: false });
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return (data || []).map((r: any) => ({
      id: r.id,
      title: r.title,
      governorate: r.governorate || null,
      sector: r.sector || null,
      statusText: r.status_text || null,
      sourceUrl: r.source_url,
      sourceOwner: r.source_owner,
      recordData: r.record_data || {},
      sourcePublishedAt: r.source_published_at || null,
      importedAt: r.imported_at,
      verifiedAt: r.verified_at || null,
      dataStatus: r.data_status,
      isPublished: Boolean(r.is_published),
    }));
  },

  async listSavedProjectNotes(userId: string): Promise<SavedPublicProjectNote[]> {
    if (!isSupabaseConfigured || !userId) return [];
    const { data, error } = await supabase
      .from('saved_project_notes')
      .select('*')
      .eq('user_id', userId)
      .order('updated_at', { ascending: false });
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return (data || []).map((r: any) => ({
      id: r.id,
      userId: r.user_id,
      projectId: r.source_id,
      projectTitle: r.project_title,
      sourceName: r.source_name,
      sourceUrl: r.source_url,
      personalNote: r.personal_note || '',
      reportedErrorNote: r.reported_error_note || undefined,
      reportedErrorTag: r.reported_error_note ? 'ملاحظة مستخدم غير متحققة' : undefined,
      updatedAt: r.updated_at,
    }));
  },

  async upsertSavedProjectNote(
    userId: string,
    payload: Omit<SavedPublicProjectNote, 'id' | 'userId' | 'updatedAt'>,
  ): Promise<SavedPublicProjectNote> {
    ensureConfigured();
    const { data, error } = await supabase
      .from('saved_project_notes')
      .upsert(
        {
          user_id: userId,
          source_id: payload.projectId,
          project_title: payload.projectTitle,
          source_name: payload.sourceName,
          source_url: payload.sourceUrl,
          personal_note: payload.personalNote || '',
          reported_error_note: payload.reportedErrorNote || null,
        },
        { onConflict: 'user_id,source_id' },
      )
      .select()
      .single();
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return {
      id: data.id,
      userId: data.user_id,
      projectId: data.source_id,
      projectTitle: data.project_title,
      sourceName: data.source_name,
      sourceUrl: data.source_url,
      personalNote: data.personal_note || '',
      reportedErrorNote: data.reported_error_note || undefined,
      reportedErrorTag: data.reported_error_note ? 'ملاحظة مستخدم غير متحققة' : undefined,
      updatedAt: data.updated_at,
    };
  },

  async deleteSavedProjectNote(userId: string, sourceId: string): Promise<void> {
    ensureConfigured();
    const { error } = await supabase
      .from('saved_project_notes')
      .delete()
      .eq('user_id', userId)
      .eq('source_id', sourceId);
    if (error) throw new Error(formatSupabaseErrorAr(error));
  },

  // --- Minimal Allowlisted Usage Events ---
  sanitizeUsageMetadata(meta?: { feature?: string; status?: string }): Record<string, string> {
    const clean: Record<string, string> = {};
    if (meta?.feature && typeof meta.feature === 'string') {
      clean.feature = meta.feature.slice(0, 64);
    }
    if (meta?.status && typeof meta.status === 'string') {
      clean.status = meta.status.slice(0, 32);
    }
    return clean;
  },

  async logUsageEvent(
    userId: string,
    analyticsEnabled: boolean,
    eventName: UsageEventName,
    meta?: { feature?: string; status?: string },
  ): Promise<boolean> {
    if (!isSupabaseConfigured || !userId || !analyticsEnabled) return false;
    if (!ALLOWED_USAGE_EVENTS.includes(eventName)) return false;

    try {
      const metadata = this.sanitizeUsageMetadata(meta);
      const { error } = await supabase.from('usage_events').insert([
        {
          user_id: userId,
          event_name: eventName,
          metadata,
        },
      ]);
      return !error;
    } catch {
      return false;
    }
  },

  // --- Export & Self-Deletion ---
  async fetchAllPersonalData(userId: string) {
    ensureConfigured();
    const [profile, consents, readings, complaints, projectNotes, events] = await Promise.all([
      this.getProfile(userId),
      this.listConsents(userId),
      this.listHouseholdReadings(userId),
      this.listComplaintDrafts(userId),
      this.listSavedProjectNotes(userId),
      supabase
        .from('usage_events')
        .select('id, event_name, occurred_at, metadata')
        .eq('user_id', userId)
        .order('occurred_at', { ascending: false })
        .then((res: any) => res.data || []),
    ]);

    return {
      exportedAt: new Date().toISOString(),
      userId,
      profile,
      consents,
      householdReadings: readings,
      complaintDrafts: complaints,
      savedProjectNotes: projectNotes,
      usageEvents: events,
    };
  },

  downloadPersonalExportJson(bundle: Awaited<ReturnType<typeof this.fetchAllPersonalData>>): void {
    const blob = new Blob([JSON.stringify(bundle, null, 2)], {
      type: 'application/json;charset=utf-8',
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `moeco-my-data-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  async deleteAllMyMoecoData(): Promise<void> {
    ensureConfigured();
    const { error } = await supabase.rpc('delete_my_moeco_data');
    if (error) throw new Error(formatSupabaseErrorAr(error));
  },

  // --- Server-Verified Owner Admin Stats ---
  async isCurrentUserAdmin(): Promise<boolean> {
    if (!isSupabaseConfigured) return false;
    try {
      const { data, error } = await supabase.rpc('is_current_user_admin');
      if (error) return false;
      return Boolean(data);
    } catch {
      return false;
    }
  },

  async getOwnerUsageSummary(days = 30): Promise<OwnerUsageSummary> {
    ensureConfigured();
    const { data, error } = await supabase.rpc('get_owner_usage_summary', { p_days: days });
    if (error) throw new Error(formatSupabaseErrorAr(error));
    return data as OwnerUsageSummary;
  },
};
