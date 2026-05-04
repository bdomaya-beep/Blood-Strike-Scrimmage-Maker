# Blood Strike Scrim Hub - Product and System Blueprint

Version: 1.0
Date: 2026-05-04
Scope: Full platform architecture, UX direction, backend design, API plan, realtime model, security, monetization, and delivery phases.

## 1. Product North Star

Blood Strike Scrim Hub is a premium competitive operations platform for local and regional communities.
It combines scrimmage operations, tournament orchestration, live standings, anti-cheat workflows, and spectator-first broadcasting.

Success metrics for first 6 months:
- 2,000 MAU
- 250 active clans
- 500 weekly matches
- Match result finalization under 8 minutes median
- Live dashboard update latency under 1.5 seconds p95
- Dispute resolution SLA under 24 hours

## 2. Experience Direction

Brand pillars:
- Tactical
- Cinematic
- Competitive
- Fast
- Trustworthy

Visual system:
- Dark surfaces with neon cyan, electric magenta, and danger red accents
- Glassmorphism cards with subtle blur and border glow
- Animated gradients for hero and tournament state transitions
- HUD-inspired status chips and telemetry rows
- Motion hierarchy: page entrance, list stagger, data-change highlights, score pulse events

Typography recommendation:
- Display: Rajdhani or Orbitron
- Body: Space Grotesk or Manrope
- Numeric/scoreboard: JetBrains Mono

Accessibility minimums:
- WCAG AA contrast for all critical data
- Reduced motion mode for all animations
- Keyboard navigation for admin and organizer interfaces

## 3. User Roles and Permissions

Roles:
- Super Admin
- Tournament Organizer
- Clan Leader
- Clan Moderator
- Player
- Spectator

Authorization model:
- RBAC with resource scopes
- Scope examples: clan:write, scrim:manage, match:verify, admin:moderate
- Organization and clan context in every privileged request

Permission highlights:
- Super Admin: global override, penalties, bans, audit access
- Organizer: create tournaments and scrims, configure rules, publish standings
- Clan Leader: manage roster, accept invites, register for events
- Clan Moderator: limited roster and scheduling operations
- Player: ready-check, result evidence upload, profile and stats
- Spectator: follow, watch, react, read-only analytics

## 4. Full Page Hierarchy

Public:
- Landing
- Explore Scrims
- Explore Tournaments
- Leaderboards
- Livestream Hub
- Clan Directory
- Player Profiles
- Match Center (read-only)
- Highlights

Auth:
- Sign in
- Sign up
- OTP verify
- Social login callback
- Password reset

Player app:
- Home command center
- Notifications inbox
- My schedule
- Match room and ready check
- Result submission panel
- Profile and performance
- Clan join and invitations

Clan app:
- Clan overview
- Roster management
- Recruitment board
- Transfer requests
- Match history
- Clan analytics
- Clan achievements and media

Organizer app:
- Event builder
- Rule engine editor
- Seeding and bracket manager
- Live operations dashboard
- Disputes queue
- Penalty and sanctions desk
- Stream control room

Admin app:
- User and clan moderation
- Fraud and suspicious activity center
- Ban management
- Audit logs
- Revenue and sponsor analytics
- Platform configuration

## 5. Core Domain Modules

- Identity and Access
- Clan Management
- Event and Tournament Engine
- Scrim Operations
- Match Integrity and Anti-Cheat
- Scoring and Standings Engine
- Realtime Broadcast Layer
- Notification Hub
- Media and Livestream
- Analytics and Reporting
- Billing and Monetization

## 6. Architecture (Production)

Primary stack:
- Frontend: Next.js App Router, React, Tailwind, Framer Motion, Zustand
- Backend API: NestJS (modular) or Express with domain modules
- Database: PostgreSQL
- ORM: Prisma
- Cache and queues: Redis + BullMQ
- Realtime: Socket.IO gateway + Redis adapter
- Blob storage: S3 compatible storage for screenshots and clips
- CDN and edge: Cloudflare
- Deployment: Vercel for web, Railway or Fly for API and workers

Logical services:
- web-app (SSR + client)
- api-service (REST + websocket auth)
- scoring-worker (calculations, standings updates)
- media-worker (image and clip processing)
- notification-worker (email, discord, push)
- anti-cheat-worker (heuristics and flag pipelines)

Data flow summary:
1. Match event arrives from organizer or verified upload.
2. Event stored in append-only match_events.
3. Scoring worker computes incremental standings.
4. Standings snapshots persisted.
5. Websocket broadcasts to subscribed channels.
6. Notifications issued to affected users.

## 7. Realtime Event Model

Socket channels:
- event:{eventId}:standings
- event:{eventId}:matches
- match:{matchId}:ops
- clan:{clanId}:feed
- user:{userId}:notifications

Core event types:
- standings.updated
- match.status.changed
- match.readycheck.started
- match.result.submitted
- match.dispute.opened
- penalty.applied
- stream.live.started
- bracket.updated

Delivery guarantees:
- At-least-once delivery with idempotent event consumers
- Client dedupe by event_id and version
- Snapshot + delta sync strategy

## 8. Database Schema (Production-Ready)

Recommended relational model with UUID primary keys and soft delete where needed.

### Core identity
- users
- user_identities (google, discord, facebook)
- user_otps
- sessions
- roles
- user_roles
- permissions
- role_permissions

### Clan domain
- clans
- clan_members
- clan_invites
- clan_recruitment_posts
- clan_transfer_requests
- clan_achievements
- clan_social_links

### Competition domain
- events
- event_rulesets
- scrims
- tournaments
- tournament_stages
- brackets
- bracket_matches
- rounds
- matches
- match_rooms
- match_participants
- match_ready_checks
- match_results
- match_evidence
- match_disputes
- match_replays

### Scoring and integrity
- scoring_profiles
- scoring_rules
- placement_points
- kill_logs
- player_match_stats
- team_match_stats
- standings_snapshots
- penalties
- violations
- bans
- suspicious_flags

### Media and engagement
- livestream_channels
- livestream_sessions
- highlights
- comments
- reactions
- follows

### Platform operations
- notifications
- notification_deliveries
- webhook_targets
- audit_logs
- reports
- feature_flags
- billing_accounts
- subscriptions
- invoices

### Detailed table blueprint

users:
- id UUID PK
- email VARCHAR UNIQUE NOT NULL
- username VARCHAR UNIQUE NOT NULL
- password_hash VARCHAR NULL
- display_name VARCHAR NOT NULL
- avatar_url TEXT NULL
- region VARCHAR NULL
- role_default VARCHAR NOT NULL
- is_verified BOOLEAN DEFAULT false
- status VARCHAR DEFAULT active
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ
- deleted_at TIMESTAMPTZ NULL

user_identities:
- id UUID PK
- user_id UUID FK users.id
- provider VARCHAR NOT NULL
- provider_user_id VARCHAR NOT NULL
- provider_email VARCHAR NULL
- access_token_encrypted TEXT NULL
- refresh_token_encrypted TEXT NULL
- created_at TIMESTAMPTZ
- UNIQUE(provider, provider_user_id)

sessions:
- id UUID PK
- user_id UUID FK users.id
- refresh_token_hash VARCHAR NOT NULL
- ip INET NULL
- user_agent TEXT NULL
- expires_at TIMESTAMPTZ
- revoked_at TIMESTAMPTZ NULL

user_otps:
- id UUID PK
- user_id UUID FK users.id
- channel VARCHAR NOT NULL
- otp_hash VARCHAR NOT NULL
- expires_at TIMESTAMPTZ
- consumed_at TIMESTAMPTZ NULL
- attempt_count INT DEFAULT 0

roles:
- id UUID PK
- code VARCHAR UNIQUE NOT NULL
- name VARCHAR NOT NULL

permissions:
- id UUID PK
- code VARCHAR UNIQUE NOT NULL
- description TEXT NULL

role_permissions:
- role_id UUID FK roles.id
- permission_id UUID FK permissions.id
- PRIMARY KEY(role_id, permission_id)

user_roles:
- id UUID PK
- user_id UUID FK users.id
- role_id UUID FK roles.id
- scope_type VARCHAR NOT NULL
- scope_id UUID NULL
- granted_by UUID FK users.id NULL
- created_at TIMESTAMPTZ

clans:
- id UUID PK
- name VARCHAR NOT NULL
- tag VARCHAR UNIQUE NOT NULL
- description TEXT NULL
- logo_url TEXT NULL
- banner_url TEXT NULL
- region VARCHAR NOT NULL
- captain_user_id UUID FK users.id
- ranking_tier VARCHAR NOT NULL
- total_points INT DEFAULT 0
- wins INT DEFAULT 0
- losses INT DEFAULT 0
- status VARCHAR DEFAULT active
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

clan_members:
- id UUID PK
- clan_id UUID FK clans.id
- user_id UUID FK users.id
- clan_role VARCHAR NOT NULL
- joined_at TIMESTAMPTZ
- left_at TIMESTAMPTZ NULL
- status VARCHAR DEFAULT active
- UNIQUE(clan_id, user_id)

clan_invites:
- id UUID PK
- clan_id UUID FK clans.id
- invited_user_id UUID FK users.id
- invited_by UUID FK users.id
- message TEXT NULL
- status VARCHAR DEFAULT pending
- expires_at TIMESTAMPTZ
- responded_at TIMESTAMPTZ NULL

clan_recruitment_posts:
- id UUID PK
- clan_id UUID FK clans.id
- title VARCHAR NOT NULL
- body TEXT NOT NULL
- required_rank VARCHAR NULL
- slots INT DEFAULT 1
- status VARCHAR DEFAULT open
- created_at TIMESTAMPTZ

clan_transfer_requests:
- id UUID PK
- from_clan_id UUID FK clans.id
- to_clan_id UUID FK clans.id
- user_id UUID FK users.id
- reason TEXT NULL
- status VARCHAR DEFAULT pending
- decided_by UUID FK users.id NULL
- decided_at TIMESTAMPTZ NULL

events:
- id UUID PK
- organizer_id UUID FK users.id
- type VARCHAR NOT NULL
- title VARCHAR NOT NULL
- description TEXT NULL
- region VARCHAR NOT NULL
- starts_at TIMESTAMPTZ
- ends_at TIMESTAMPTZ NULL
- max_teams INT NOT NULL
- visibility VARCHAR DEFAULT public
- status VARCHAR DEFAULT draft
- created_at TIMESTAMPTZ

event_rulesets:
- id UUID PK
- event_id UUID FK events.id
- version INT NOT NULL
- payload_json JSONB NOT NULL
- is_active BOOLEAN DEFAULT true
- published_by UUID FK users.id
- created_at TIMESTAMPTZ
- UNIQUE(event_id, version)

scrims:
- id UUID PK
- event_id UUID FK events.id
- scrim_type VARCHAR NOT NULL
- game_mode VARCHAR NOT NULL
- room_count INT DEFAULT 1
- allow_stream_mode BOOLEAN DEFAULT false
- status VARCHAR DEFAULT registration

tournaments:
- id UUID PK
- event_id UUID FK events.id
- format VARCHAR NOT NULL
- seeding_type VARCHAR NOT NULL
- status VARCHAR DEFAULT registration

tournament_stages:
- id UUID PK
- tournament_id UUID FK tournaments.id
- stage_type VARCHAR NOT NULL
- order_no INT NOT NULL
- title VARCHAR NOT NULL

brackets:
- id UUID PK
- stage_id UUID FK tournament_stages.id
- bracket_type VARCHAR NOT NULL
- generated_at TIMESTAMPTZ

bracket_matches:
- id UUID PK
- bracket_id UUID FK brackets.id
- round_no INT NOT NULL
- position_no INT NOT NULL
- match_id UUID FK matches.id
- next_match_id UUID FK matches.id NULL

rounds:
- id UUID PK
- event_id UUID FK events.id
- number INT NOT NULL
- starts_at TIMESTAMPTZ
- ends_at TIMESTAMPTZ NULL

matches:
- id UUID PK
- event_id UUID FK events.id
- round_id UUID FK rounds.id NULL
- stage_id UUID FK tournament_stages.id NULL
- ruleset_version INT NOT NULL
- room_code_encrypted TEXT NULL
- room_password_encrypted TEXT NULL
- status VARCHAR NOT NULL
- starts_at TIMESTAMPTZ
- ended_at TIMESTAMPTZ NULL
- locked_at TIMESTAMPTZ NULL
- created_at TIMESTAMPTZ
- updated_at TIMESTAMPTZ

match_rooms:
- id UUID PK
- match_id UUID FK matches.id
- room_label VARCHAR NOT NULL
- credentials_encrypted TEXT NOT NULL
- published_at TIMESTAMPTZ NULL

match_participants:
- id UUID PK
- match_id UUID FK matches.id
- clan_id UUID FK clans.id
- slot_no INT NOT NULL
- seed INT NULL
- ready_state VARCHAR DEFAULT pending
- checked_in_at TIMESTAMPTZ NULL
- UNIQUE(match_id, clan_id)

match_ready_checks:
- id UUID PK
- match_id UUID FK matches.id
- opened_at TIMESTAMPTZ
- closes_at TIMESTAMPTZ
- status VARCHAR DEFAULT open

match_results:
- id UUID PK
- match_id UUID FK matches.id UNIQUE
- submitted_by UUID FK users.id
- submitted_at TIMESTAMPTZ
- verification_state VARCHAR DEFAULT pending
- verified_by UUID FK users.id NULL
- verified_at TIMESTAMPTZ NULL
- summary_json JSONB NOT NULL

match_evidence:
- id UUID PK
- match_id UUID FK matches.id
- uploaded_by UUID FK users.id
- type VARCHAR NOT NULL
- file_url TEXT NOT NULL
- file_hash VARCHAR NOT NULL
- metadata_json JSONB NULL
- created_at TIMESTAMPTZ

match_disputes:
- id UUID PK
- match_id UUID FK matches.id
- opened_by UUID FK users.id
- reason TEXT NOT NULL
- status VARCHAR DEFAULT open
- resolved_by UUID FK users.id NULL
- resolved_at TIMESTAMPTZ NULL
- resolution_notes TEXT NULL

match_replays:
- id UUID PK
- match_id UUID FK matches.id
- replay_url TEXT NOT NULL
- source VARCHAR NOT NULL
- duration_seconds INT NULL
- created_at TIMESTAMPTZ

scoring_profiles:
- id UUID PK
- event_id UUID FK events.id
- name VARCHAR NOT NULL
- kill_point_base INT NOT NULL
- headshot_bonus INT DEFAULT 0
- team_wipe_bonus INT DEFAULT 0
- mvp_bonus INT DEFAULT 0
- created_at TIMESTAMPTZ

placement_points:
- id UUID PK
- scoring_profile_id UUID FK scoring_profiles.id
- placement INT NOT NULL
- points INT NOT NULL
- UNIQUE(scoring_profile_id, placement)

scoring_rules:
- id UUID PK
- scoring_profile_id UUID FK scoring_profiles.id
- rule_type VARCHAR NOT NULL
- value INT NOT NULL
- payload_json JSONB NULL

kill_logs:
- id UUID PK
- match_id UUID FK matches.id
- player_id UUID FK users.id
- clan_id UUID FK clans.id
- victim_player_id UUID FK users.id NULL
- kill_type VARCHAR NOT NULL
- weapon VARCHAR NULL
- is_headshot BOOLEAN DEFAULT false
- occurred_at TIMESTAMPTZ

player_match_stats:
- id UUID PK
- match_id UUID FK matches.id
- player_id UUID FK users.id
- clan_id UUID FK clans.id
- kills INT DEFAULT 0
- deaths INT DEFAULT 0
- assists INT DEFAULT 0
- damage INT DEFAULT 0
- accuracy NUMERIC(5,2) NULL
- mvp BOOLEAN DEFAULT false
- UNIQUE(match_id, player_id)

team_match_stats:
- id UUID PK
- match_id UUID FK matches.id
- clan_id UUID FK clans.id
- placement INT NOT NULL
- total_kills INT DEFAULT 0
- penalty_points INT DEFAULT 0
- total_points INT DEFAULT 0
- UNIQUE(match_id, clan_id)

standings_snapshots:
- id UUID PK
- event_id UUID FK events.id
- version INT NOT NULL
- snapshot_json JSONB NOT NULL
- created_at TIMESTAMPTZ
- UNIQUE(event_id, version)

penalties:
- id UUID PK
- event_id UUID FK events.id
- match_id UUID FK matches.id NULL
- clan_id UUID FK clans.id NULL
- player_id UUID FK users.id NULL
- type VARCHAR NOT NULL
- points_delta INT NOT NULL
- reason TEXT NOT NULL
- issued_by UUID FK users.id
- issued_at TIMESTAMPTZ

violations:
- id UUID PK
- event_id UUID FK events.id
- match_id UUID FK matches.id NULL
- target_type VARCHAR NOT NULL
- target_id UUID NOT NULL
- category VARCHAR NOT NULL
- severity VARCHAR NOT NULL
- status VARCHAR DEFAULT open
- evidence_json JSONB NULL
- created_at TIMESTAMPTZ

bans:
- id UUID PK
- target_type VARCHAR NOT NULL
- target_id UUID NOT NULL
- reason TEXT NOT NULL
- starts_at TIMESTAMPTZ
- ends_at TIMESTAMPTZ NULL
- issued_by UUID FK users.id
- status VARCHAR DEFAULT active

suspicious_flags:
- id UUID PK
- event_id UUID FK events.id NULL
- match_id UUID FK matches.id NULL
- target_type VARCHAR NOT NULL
- target_id UUID NOT NULL
- signal_type VARCHAR NOT NULL
- score NUMERIC(5,2) NOT NULL
- payload_json JSONB NULL
- status VARCHAR DEFAULT open
- created_at TIMESTAMPTZ

livestream_channels:
- id UUID PK
- owner_user_id UUID FK users.id
- provider VARCHAR NOT NULL
- channel_id VARCHAR NOT NULL
- title VARCHAR NOT NULL
- region VARCHAR NULL
- is_verified BOOLEAN DEFAULT false

livestream_sessions:
- id UUID PK
- event_id UUID FK events.id
- channel_id UUID FK livestream_channels.id
- embed_url TEXT NOT NULL
- starts_at TIMESTAMPTZ NULL
- ended_at TIMESTAMPTZ NULL
- status VARCHAR DEFAULT scheduled

highlights:
- id UUID PK
- event_id UUID FK events.id
- match_id UUID FK matches.id NULL
- title VARCHAR NOT NULL
- clip_url TEXT NOT NULL
- thumbnail_url TEXT NULL
- created_by UUID FK users.id
- created_at TIMESTAMPTZ

comments:
- id UUID PK
- target_type VARCHAR NOT NULL
- target_id UUID NOT NULL
- user_id UUID FK users.id
- body TEXT NOT NULL
- created_at TIMESTAMPTZ
- deleted_at TIMESTAMPTZ NULL

reactions:
- id UUID PK
- target_type VARCHAR NOT NULL
- target_id UUID NOT NULL
- user_id UUID FK users.id
- reaction VARCHAR NOT NULL
- created_at TIMESTAMPTZ
- UNIQUE(target_type, target_id, user_id, reaction)

follows:
- id UUID PK
- user_id UUID FK users.id
- target_type VARCHAR NOT NULL
- target_id UUID NOT NULL
- created_at TIMESTAMPTZ
- UNIQUE(user_id, target_type, target_id)

notifications:
- id UUID PK
- user_id UUID FK users.id
- type VARCHAR NOT NULL
- title VARCHAR NOT NULL
- body TEXT NOT NULL
- payload_json JSONB NULL
- is_read BOOLEAN DEFAULT false
- created_at TIMESTAMPTZ

notification_deliveries:
- id UUID PK
- notification_id UUID FK notifications.id
- channel VARCHAR NOT NULL
- status VARCHAR NOT NULL
- provider_message_id VARCHAR NULL
- attempts INT DEFAULT 0
- last_error TEXT NULL
- sent_at TIMESTAMPTZ NULL

webhook_targets:
- id UUID PK
- owner_scope_type VARCHAR NOT NULL
- owner_scope_id UUID NOT NULL
- provider VARCHAR NOT NULL
- endpoint_url TEXT NOT NULL
- secret_encrypted TEXT NOT NULL
- is_active BOOLEAN DEFAULT true

audit_logs:
- id UUID PK
- actor_user_id UUID FK users.id NULL
- action VARCHAR NOT NULL
- entity_type VARCHAR NOT NULL
- entity_id UUID NULL
- old_value_json JSONB NULL
- new_value_json JSONB NULL
- ip INET NULL
- user_agent TEXT NULL
- created_at TIMESTAMPTZ

reports:
- id UUID PK
- reporter_user_id UUID FK users.id
- target_type VARCHAR NOT NULL
- target_id UUID NOT NULL
- reason TEXT NOT NULL
- status VARCHAR DEFAULT open
- resolved_by UUID FK users.id NULL
- resolved_at TIMESTAMPTZ NULL

feature_flags:
- id UUID PK
- code VARCHAR UNIQUE NOT NULL
- description TEXT NULL
- is_enabled BOOLEAN DEFAULT false
- rollout_json JSONB NULL

billing_accounts:
- id UUID PK
- owner_type VARCHAR NOT NULL
- owner_id UUID NOT NULL
- provider_customer_id VARCHAR NOT NULL
- status VARCHAR NOT NULL
- created_at TIMESTAMPTZ

subscriptions:
- id UUID PK
- billing_account_id UUID FK billing_accounts.id
- plan_code VARCHAR NOT NULL
- status VARCHAR NOT NULL
- current_period_start TIMESTAMPTZ
- current_period_end TIMESTAMPTZ
- cancel_at_period_end BOOLEAN DEFAULT false

invoices:
- id UUID PK
- billing_account_id UUID FK billing_accounts.id
- provider_invoice_id VARCHAR NOT NULL
- amount_cents INT NOT NULL
- currency VARCHAR(3) NOT NULL
- status VARCHAR NOT NULL
- issued_at TIMESTAMPTZ
- paid_at TIMESTAMPTZ NULL

## 9. Example Prisma Schema Snippet

```prisma
model User {
  id              String      @id @default(uuid())
  email           String      @unique
  username        String      @unique
  passwordHash    String?
  displayName     String
  region          String?
  avatarUrl       String?
  isVerified      Boolean     @default(false)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  deletedAt       DateTime?
  roles           UserRole[]
  clanMemberships ClanMember[]
  playerStats     PlayerSeasonStat[]
}

model Clan {
  id              String      @id @default(uuid())
  name            String
  tag             String      @unique
  logoUrl         String?
  bannerUrl       String?
  description     String?
  region          String
  captainUserId   String
  rankingTier     String      @default("Bronze")
  totalPoints     Int         @default(0)
  wins            Int         @default(0)
  losses          Int         @default(0)
  createdAt       DateTime    @default(now())
  updatedAt       DateTime    @updatedAt
  members         ClanMember[]
}

model Match {
  id                 String      @id @default(uuid())
  eventId            String
  stageId            String?
  roomCode           String?
  status             MatchStatus @default(SCHEDULED)
  startsAt           DateTime
  endedAt            DateTime?
  rulesetVersion     Int
  streamSessionId    String?
  createdAt          DateTime    @default(now())
  updatedAt          DateTime    @updatedAt
  participants       MatchParticipant[]
  result             MatchResult?
}

enum MatchStatus {
  SCHEDULED
  READY_CHECK
  LIVE
  RESULT_PENDING
  VERIFIED
  DISPUTED
  LOCKED
  CANCELED
}
```

## 10. Scoring Engine Design

Scoring profile per event:
- kill_point_base
- headshot_bonus
- team_wipe_bonus
- mvp_bonus
- placement map (position -> points)
- penalty map (penalty_type -> negative points)

Formula:
- team_score = placement_points + sum(kill_points + bonuses) - sum(penalties)

Where:
- kill_points = kills * kill_point_base

Engine behavior:
- Supports per-event overrides
- Recomputes standings incrementally on each verified match result
- Produces snapshot version numbers for deterministic rollback
- Maintains audit trail for every score mutation

Dispute-safe flow:
- Submitted result -> provisional standings
- Approved result -> official standings
- Dispute reopen -> rollback to prior snapshot and replay events

## 11. API Plan (REST + Realtime)

Auth:
- POST /v1/auth/register
- POST /v1/auth/login
- POST /v1/auth/social/{provider}
- POST /v1/auth/otp/request
- POST /v1/auth/otp/verify
- POST /v1/auth/logout

Users and profiles:
- GET /v1/users/me
- PATCH /v1/users/me
- GET /v1/players/{playerId}/stats

Clans:
- POST /v1/clans
- GET /v1/clans/{clanId}
- PATCH /v1/clans/{clanId}
- POST /v1/clans/{clanId}/invites
- POST /v1/clans/invites/{inviteId}/accept
- POST /v1/clans/{clanId}/transfer-requests

Scrims and events:
- POST /v1/events
- POST /v1/events/{eventId}/rulesets
- POST /v1/events/{eventId}/register
- GET /v1/events/{eventId}/standings
- GET /v1/events/{eventId}/matches

Matches and integrity:
- POST /v1/matches/{matchId}/ready-check/start
- POST /v1/matches/{matchId}/results
- POST /v1/matches/{matchId}/evidence
- POST /v1/matches/{matchId}/disputes
- POST /v1/matches/{matchId}/verify
- POST /v1/matches/{matchId}/lock

Penalties and moderation:
- POST /v1/penalties
- POST /v1/violations
- POST /v1/bans
- GET /v1/admin/audit-logs

Livestream:
- POST /v1/streams/sessions
- PATCH /v1/streams/sessions/{sessionId}
- GET /v1/streams/live

Notifications:
- GET /v1/notifications
- POST /v1/notifications/read-all
- POST /v1/webhooks/discord/test

Realtime auth:
- JWT handshake with role and scope claims
- Channel-level authorization on join

## 12. Match Operations Workflow

1. Organizer schedules match and room assignment.
2. Captains receive notifications and countdown.
3. Ready-check opens 10 minutes before start.
4. Match goes LIVE when both teams confirm.
5. Captains upload screenshot evidence and kill logs.
6. Auto-score computes provisional result.
7. Opponent confirms or opens dispute.
8. Moderator verifies and locks result.
9. Standings and leaderboards update instantly.

## 13. Anti-Cheat and Verification

Controls:
- Mandatory result screenshot with metadata
- Timestamp consistency checks
- Duplicate screenshot hash detection
- Kill log anomaly detector (z-score and threshold rules)
- Suspicious match pattern flags
- Manual moderation queue with evidence bundle

Sanction ladder:
- Warning
- Point deduction
- Match forfeit
- Temporary suspension
- Permanent ban

All anti-cheat decisions write immutable audit entries.

## 14. Notification Matrix

Triggers:
- Match starts in 30 and 10 minutes
- Invite accepted or rejected
- Rule change published
- Dispute opened and resolved
- Penalty applied
- Stream goes live

Channels:
- In-app websocket feed
- Email transactional
- Discord webhook message
- Push notification (PWA)

Reliability:
- Retry policy with exponential backoff
- Dead-letter queue for failed deliveries

## 15. Spectator and Broadcast Experience

Spectator features:
- Live standings wall
- Embedded stream with match timeline and schedule rail
- Kill leaders and MVP panel
- Favorite clans and follow alerts
- Highlight clips and post-match recap

Broadcast widgets:
- OBS browser source overlays
- Lower-third team cards
- Dynamic scoreboard ticker
- Countdown and transition stingers

## 16. Mobile-First Performance Strategy

Performance targets:
- LCP under 2.5 seconds on 4G
- JS payload under 220 KB gz initial route
- API response p95 under 400 ms for core reads

Optimization tactics:
- Route-level code splitting
- Server components for read-heavy pages
- Image CDN transforms and modern formats
- Realtime payload compaction and throttling
- Cache-first leaderboard snapshots at edge

SEA optimization:
- Multi-region read replicas
- Cloudflare regional caching
- Timezone-aware schedules by locale

## 17. Security Baseline

- Rate limiting by IP, user, and route class
- WAF rules via Cloudflare
- Strict input validation with schema guards
- Signed upload URLs and MIME checks
- CSRF protection for cookie auth flows
- JWT rotation and refresh token revocation
- Secrets in managed vault, never in repo
- Full audit logs for admin and organizer actions

Admin security:
- Mandatory MFA for privileged roles
- IP allowlist option for super admin panel
- Just-in-time elevated permissions with expiry

## 18. Monetization System

Revenue lanes:
- Premium organizer subscription tiers
- Sponsored tournament slots
- Clan premium pages and cosmetics
- Verified organizer badge program
- Seasonal battle-pass leaderboard rewards
- Ad slots for public spectator pages

Billing model:
- Stripe subscription for premium tools
- Metered overage for high-volume events
- Sponsor campaign reporting dashboard

## 19. Frontend Component Breakdown

Design system primitives:
- NeonButton
- GlassCard
- HUDStatChip
- AnimatedProgressBar
- GlowBadge
- ScorePulseCell

Feature components:
- LiveStandingsTable
- MatchOpsTimeline
- RuleBuilderEditor
- DisputeReviewPanel
- StreamEmbedDeck
- BracketCanvas
- ClanRecruitmentBoard
- PlayerPerformanceChart

State partitions:
- authStore
- notificationStore
- liveStandingsStore
- matchOpsStore
- streamStore
- adminModerationStore

## 20. Suggested Monorepo Structure

```text
apps/
  web/                    # Next.js app
  api/                    # NestJS or Express API
workers/
  scoring-worker/
  notification-worker/
  anti-cheat-worker/
packages/
  ui/                     # Design system
  config/                 # shared ts/eslint/prettier
  contracts/              # zod/openapi types
  sdk/                    # typed client
  db/                     # prisma schema + migrations
  analytics/              # domain metrics utils
infra/
  docker/
  terraform/
  observability/
```

## 21. Delivery Plan (Execution)

Phase 1 (Weeks 1-2): Foundation
- Auth, roles, clans, base UI kit, event model
- CI, linting, test harness, observability scaffolding

Phase 2 (Weeks 3-5): Scrim Core
- Match scheduling, room management, ready-check, result upload
- Initial scoring engine and provisional standings

Phase 3 (Weeks 6-8): Tournament and Live
- Brackets, progression logic, websocket live dashboard
- Stream embeds and broadcast widgets

Phase 4 (Weeks 9-10): Integrity and Moderation
- Disputes, penalties, anti-cheat flags, admin queues
- Audit logs and sanction system

Phase 5 (Weeks 11-12): Scale and Monetization
- Billing, premium features, ad/sponsor modules
- Performance hardening and mobile QA

## 22. Test Strategy

- Unit tests: scoring formulas, penalty calculators, permissions
- Integration tests: match lifecycle and dispute state machine
- Contract tests: OpenAPI and SDK consistency
- Realtime tests: websocket channels and reconnect semantics
- E2E tests: organizer flow, player flow, spectator flow
- Load tests: 10k concurrent spectators on live standings endpoints

## 23. Observability and Operations

- Structured logs with trace ids
- Metrics: websocket fanout latency, dispute throughput, notification failure rate
- Distributed tracing for API + worker jobs
- SLOs with alerting to Discord and PagerDuty
- Feature flags for gradual rollout of high-risk modules

## 24. MVP Cut (Fastest Competitive Launch)

MVP includes:
- Email and Discord auth
- Clan creation and invites
- Open and invitational scrims
- Match result evidence and verification
- Live standings dashboard
- Basic tournament bracket (single elimination)
- In-app and Discord notifications
- Admin moderation essentials

Defer to post-MVP:
- Swiss format
- Full heatmaps
- Ads and battle-pass economy
- Advanced anti-cheat heuristics

## 25. Immediate Build Checklist

- Finalize product requirements and legal policy for user-generated content
- Choose backend framework: NestJS recommended for module boundaries
- Create Prisma schema and migration plan from this blueprint
- Build design tokens and UI primitives first
- Ship match lifecycle and scoring before advanced analytics
- Add replay-safe event sourcing for standings from day one

## 26. Final Outcome Definition

Target state:
- A professional esports ecosystem purpose-built for Blood Strike communities
- Reliable organizer operations with transparent scoring and moderation
- High-energy spectator experience with realtime competitive storytelling
- Mobile-first performance suitable for Southeast Asian user conditions
