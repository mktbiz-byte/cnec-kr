/**
 * CNEC-KR Database Type Definitions (JSDoc)
 *
 * This file contains type definitions for all Supabase tables
 * used in the CNEC Korea creator site. This is synchronized with
 * the cnecbiz "Master" database schema.
 *
 * Synchronized: 2025-12-19
 *
 * Database Architecture:
 * - BIZ Database (supabaseBiz): Central admin operations
 * - Regional Databases (Korea, Japan, US, Taiwan): Creator-facing data
 */

// =============================================================================
// COMMON TYPES
// =============================================================================

/**
 * @typedef {string} UUID
 * @typedef {string} Timestamp - ISO 8601 format
 * @typedef {string|number|boolean|null|Array|Object} JSONValue
 */

/**
 * @typedef {'draft'|'pending_approval'|'approved'|'active'|'completed'|'cancelled'} CampaignStatus
 * @typedef {'pending'|'approved'|'rejected'|'selected'|'completed'} ApplicationStatus
 * @typedef {'pending'|'completed'|'failed'|'refunded'} PaymentStatus
 * @typedef {'pending'|'approved'|'rejected'|'completed'} WithdrawalStatus
 * @typedef {'pending'|'completed'|'cancelled'|'credit'} ChargeRequestStatus
 */

/**
 * @typedef {1|2|3|4|5} CNECGradeLevel
 * @typedef {'FRESH'|'GLOW'|'BLOOM'|'ICONIC'|'MUSE'} CNECGradeName
 */

/**
 * @typedef {'youtube'|'instagram'|'tiktok'|'blog'} Platform
 * @typedef {'korea'|'japan'|'us'|'taiwan'|'biz'} Region
 */

// =============================================================================
// REGIONAL DATABASE TABLES (Korea)
// =============================================================================

/**
 * user_profiles - Creator user profiles (REGIONAL)
 * Used for: Creator registration and profile management
 *
 * @typedef {Object} UserProfile
 * @property {UUID} id - References auth.users.id
 * @property {string} name
 * @property {string} email
 * @property {string} [phone]
 * @property {string} [profile_image]
 * @property {string} [instagram_url]
 * @property {string} [youtube_url]
 * @property {string} [tiktok_url]
 * @property {string} [blog_url] - Other SNS URL (standardized as blog_url in Master DB)
 * @property {string} [channel_name] - YouTube channel name (cached)
 * @property {number} [subscriber_count] - YouTube subscribers (cached)
 * @property {number} [avg_views] - Average video views (cached)
 * @property {boolean} [is_verified]
 * @property {boolean} [is_active]
 * @property {boolean} [profile_completed]
 * @property {Region} [region]
 * @property {string} [country]
 * @property {string} [city]
 * @property {string} [bank_name] - Bank name for withdrawals
 * @property {string} [account_number] - Bank account number (Master DB standard)
 * @property {string} [account_holder] - Bank account holder name (Master DB standard)
 * @property {Timestamp} created_at
 * @property {Timestamp} [updated_at]
 */

/**
 * applications - Campaign applications (REGIONAL)
 * Used for: Tracking creator applications to campaigns
 *
 * @typedef {Object} Application
 * @property {UUID} id
 * @property {UUID} campaign_id
 * @property {UUID} user_id
 * @property {ApplicationStatus} status
 * @property {boolean} [virtual_selected] - 가상 선정 (brand review)
 * @property {boolean} [final_selected] - 최종 선정
 * @property {string} [application_message]
 * @property {string} [portfolio_url]
 * @property {boolean} [guide_delivered]
 * @property {Timestamp} [guide_delivered_at]
 * @property {JSONValue} [personalized_guide]
 * @property {boolean} [video_submitted]
 * @property {UUID} [video_submission_id]
 * @property {Timestamp} [completed_at]
 * @property {boolean} [reward_paid]
 * @property {Timestamp} created_at
 * @property {Timestamp} [updated_at]
 * @property {Partial<Campaign>} [campaigns] - Joined data
 * @property {Partial<UserProfile>} [user_profiles] - Joined data
 */

/**
 * campaigns - Campaign data (REGIONAL)
 * Used for: Campaign creation and management
 *
 * @typedef {Object} Campaign
 * @property {UUID} id
 * @property {string} title
 * @property {string} [description]
 * @property {string} [brand]
 * @property {string} [company_email]
 * @property {UUID} [company_id]
 * @property {number} [budget]
 * @property {number} [total_amount]
 * @property {number} [reward_amount]
 * @property {number} [max_participants]
 * @property {CampaignStatus} status
 * @property {Timestamp} [start_date]
 * @property {Timestamp} [end_date]
 * @property {Timestamp} [application_deadline]
 * @property {string} [requirements]
 * @property {string} [guidelines]
 * @property {string[]} [selected_regions]
 * @property {'regular'|'four_week'|'olive_young'|'cnec_plus'} [campaign_type]
 * @property {string} [product_name]
 * @property {string} [product_info]
 * @property {string} [thumbnail_url]
 * @property {string} [reference_video_url]
 * @property {PaymentStatus} [payment_status]
 * @property {Region} [region]
 * @property {Timestamp} created_at
 * @property {Timestamp} [updated_at]
 */

/**
 * withdrawal_requests - Creator withdrawal requests (REGIONAL)
 * Used for: Regional withdrawal processing
 *
 * @typedef {Object} WithdrawalRequest
 * @property {UUID} id
 * @property {UUID} user_id
 * @property {number} amount
 * @property {WithdrawalStatus} status
 * @property {string} [bank_name]
 * @property {string} [account_number] - Master DB standard
 * @property {string} [account_holder] - Master DB standard
 * @property {Timestamp} [processed_at]
 * @property {Timestamp} created_at
 */

/**
 * point_transactions - Point transactions (REGIONAL)
 * Used for: Creator point history
 *
 * @typedef {Object} PointTransaction
 * @property {UUID} id
 * @property {UUID} user_id
 * @property {number} amount
 * @property {'earn'|'withdraw'|'bonus'|'adjustment'} type
 * @property {string} [description]
 * @property {UUID} [reference_id]
 * @property {Timestamp} created_at
 */

/**
 * faqs - FAQ content (REGIONAL)
 * Used for: FAQ management
 *
 * @typedef {Object} FAQ
 * @property {UUID} id
 * @property {string} question
 * @property {string} answer
 * @property {string} [category]
 * @property {number} display_order
 * @property {boolean} is_active
 * @property {Timestamp} created_at
 * @property {Timestamp} [updated_at]
 */

/**
 * reference_videos - Reference video library (REGIONAL)
 * Used for: Site-wide reference videos
 *
 * @typedef {Object} ReferenceVideo
 * @property {UUID} id
 * @property {string} title
 * @property {string} video_url
 * @property {string} [thumbnail_url]
 * @property {string} [description]
 * @property {string} [category]
 * @property {number} display_order
 * @property {boolean} is_active
 * @property {Timestamp} created_at
 */

/**
 * email_templates - Email templates (REGIONAL)
 * Used for: Email notification templates
 *
 * @typedef {Object} EmailTemplate
 * @property {UUID} id
 * @property {string} name
 * @property {string} subject
 * @property {string} content - HTML content
 * @property {string[]} [variables] - Template variables like {{name}}
 * @property {boolean} is_active
 * @property {Timestamp} created_at
 * @property {Timestamp} [updated_at]
 */

// =============================================================================
// GRADE SYSTEM CONSTANTS
// =============================================================================

/**
 * Grade level definitions
 * @type {Record<CNECGradeLevel, {name: CNECGradeName, color: string}>}
 */
export const GRADE_LEVELS = {
  1: { name: 'FRESH', color: '#94A3B8' },
  2: { name: 'GLOW', color: '#22C55E' },
  3: { name: 'BLOOM', color: '#3B82F6' },
  4: { name: 'ICONIC', color: '#8B5CF6' },
  5: { name: 'MUSE', color: '#F59E0B' }
}

// =============================================================================
// FIELD MAPPING CONSTANTS
// =============================================================================

/**
 * Field name mappings between legacy and Master DB standard
 * Use these to ensure consistent field naming across the application
 */
export const FIELD_MAPPINGS = {
  userProfiles: {
    // Legacy -> Master DB standard
    bank_account: 'account_number',
    bank_holder: 'account_holder',
    bank_account_number: 'account_number',
    bank_account_holder: 'account_holder',
    other_sns_url: 'blog_url'
  }
}

// Export types for use in components (JSDoc reference)
export const Types = {
  /** @type {UserProfile} */
  UserProfile: null,
  /** @type {Application} */
  Application: null,
  /** @type {Campaign} */
  Campaign: null,
  /** @type {WithdrawalRequest} */
  WithdrawalRequest: null,
  /** @type {PointTransaction} */
  PointTransaction: null,
  /** @type {FAQ} */
  FAQ: null,
  /** @type {ReferenceVideo} */
  ReferenceVideo: null,
  /** @type {EmailTemplate} */
  EmailTemplate: null
}
