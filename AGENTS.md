# Agents Guide for Argus

## Project Overview
**Argus** is a news aggregation and processing system that automatically collects, processes, and stores articles from Colombian news sites using an event-driven architecture on AWS.

## Build/Test Commands
- `pnpm dev` - Start SST development server
- `pnpm run typecheck` - Run TypeScript type checking (in scripts package)
- `pnpm run feed-parser` - Run feed parser script
- `pnpm run article-parser` - Run article parser script
- `pnpm run trigger-cron` - Manually trigger feed cron job (dev-friendly)
- `pnpm run db` - Run drizzle-kit database commands (in core package)
- No test suite currently configured

## Architecture
- **Event-Driven Microservices**: Uses SST EventBridge Bus for decoupled communication
- **Monorepo**: pnpm workspaces with Turbo for build orchestration
- **Infrastructure**: SST v3 for AWS serverless deployment
- **Database**: Drizzle ORM with libSQL (Turso) database
- **Runtime**: TypeScript with ESM modules on AWS Lambda

### Core Components
- `packages/core/` - Shared business logic (database, events, parsers, jobs)
- `apps/functions/` - AWS Lambda functions (feed-cron, article-processor)
- `apps/api/` - REST API (placeholder, not implemented)
- `apps/web-extension/` - Browser extension (placeholder, not implemented)
- `apps/data-processing/` - ML/analytics pipeline (placeholder, not implemented)
- `infra/` - SST infrastructure definitions

### Event Flow
1. **Feed Cron** (every 2 hours in prod, 24 hours in dev) → scrapes XML feeds → publishes `articles.new` events
2. **Article Processor** → receives events via `bus.subscriber()` → parses article content → stores in database → publishes `articles.processed` events
3. **Future**: Article processing → embedding generation → clustering → notifications

### Job System
- **Shared Business Logic**: Core job functions in `packages/core/src/jobs/`
- **executeFeedCron()**: Shared function used by both scheduled Lambda and manual trigger script
- **Environment-aware**: Different schedules and limits for dev vs production
- **Manual Triggering**: `pnpm run trigger-cron` for immediate testing without waiting for schedule

## Database Schema
```sql
-- Main articles table
articles: id, url, title, text, markdown, author, publication_date, lastmod, site_name, keywords, created_at

-- Site tracking for incremental processing
site_tracking: site_name, last_processed
```

## Site Parsers
- **Extensible architecture**: Add new sites by implementing `SiteConfig` interface
- **Current sites**: elTiempo, elEspectador (Colombian news)
- **Parser types**: FeedParser (XML/RSS) + ArticleParser (HTML content extraction)
- **Location**: `packages/core/src/parsers/sites/`

## Event Bus System
- **Architecture**: Uses SST's native event bus utilities (`sst/aws/bus` and `sst/event`)
- **Bus**: `ArgusEventBus` with automatic event routing
- **Events**: `articles.new`, `articles.processed`, `embeddings.generated`, `clusters.updated`
- **Type Safety**: SST's `event.builder()` with Zod validation and automatic metadata generation
- **Publishing**: `bus.publish(Resource.ArgusEventBus, EventType, payload)`
- **Consuming**: `bus.subscriber([EventTypes], handler)` with type-safe event handling
- **Metadata**: Automatic correlation IDs, timestamps, versioning for observability

## Code Style
- Use double quotes for strings
- Prefer `const` over `let`
- Use camelCase for variables/functions, PascalCase for types/interfaces
- Add JSDoc comments for exported functions
- Use explicit return types for functions
- Import statements: external packages first, then workspace packages with `@argus/`
- Use arrow functions for simple functions, regular functions for complex ones
- Error handling: try/catch blocks with proper error logging via console.error
- Use `?.` optional chaining and `??` nullish coalescing
- Type safety: enable `noUncheckedIndexedAccess` in tsconfig
- **Event Bus**: Use SST's native utilities (`bus.publish()`, `bus.subscriber()`) - avoid custom event utilities
- **Shared Logic**: Extract reusable business logic to `packages/core/src/jobs/` for consistency between Lambda handlers and scripts

## Missing Features (Opportunities)
- **API Layer**: No REST/GraphQL API for data access
- **Web Interface**: No frontend for browsing articles
- **Search**: No full-text search capability
- **ML Pipeline**: Event schemas exist but no embedding/clustering implementation
- **Web Extension**: Directory exists but empty
- **Monitoring**: No alerting or observability
- **Testing**: No test suite configured