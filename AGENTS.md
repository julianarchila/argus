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
- **Domain Module Pattern**: Following SST's domain-driven architecture with namespace organization

### Core Components
- `packages/core/` - Shared business logic organized by domain
  - `article/` - Article management domain
  - `site/` - Site tracking domain
  - `feed/` - Feed processing domain
  - `parser/` - Content parsing domain
  - `shared/` - Cross-domain utilities
- `apps/functions/` - AWS Lambda functions (feed-cron, article-processor)
- `apps/api/` - REST API (placeholder, not implemented)
- `apps/web-extension/` - Browser extension (placeholder, not implemented)
- `apps/data-processing/` - ML/analytics pipeline (placeholder, not implemented)
- `infra/` - SST infrastructure definitions

### Event Flow
1. **Feed Cron** (every 2 hours in prod, 24 hours in dev) → scrapes XML feeds → publishes `feed.articles.discovered` events
2. **Event Handler** (single "fat lambda") → receives all events via `bus.subscriber()` → routes events based on type:
   - `feed.articles.discovered` → parses article content → stores in database → publishes `article.created` events
   - `article.created` → logs creation (future: embedding generation)
   - `article.updated` → logs update (future: re-process embeddings)
   - `article.processed` → logs processing (future: trigger ML pipeline, notifications)
3. **Future**: Article processing → embedding generation → clustering → notifications

### Domain System
- **Domain Boundaries**: Each business concept organized as a namespace module
- **Feed.processCron()**: Shared function for feed processing used by both Lambda and scripts
- **Article.create()**: Domain operation for creating articles with event publishing
- **Parser.processArticle()**: Domain operation for parsing article content
- **Site.updateLastProcessed()**: Domain operation for tracking site processing state
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
- **Location**: `packages/core/src/parser/sites/`

## Event Bus System
- **Architecture**: Uses SST's native event bus utilities (`sst/aws/bus` and `sst/event`)
- **Bus**: `ArgusEventBus` with automatic event routing
- **Events**: `feed.articles.discovered`, `article.created`, `article.updated`, `article.processed`
- **Type Safety**: SST's `event.builder()` with Zod validation and automatic metadata generation
- **Publishing**: `bus.publish(Resource.ArgusEventBus, EventType, payload)`
- **Consuming**: `bus.subscriber([EventTypes], handler)` with type-safe event handling
- **Metadata**: Automatic correlation IDs, timestamps, versioning for observability
- **Centralized Events**: Events are defined within each domain namespace using shared `defineEvent` utility
- **Domain Integration**: Events accessible via `Article.Events.Created`, `Feed.Events.ArticlesDiscovered`, etc.

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
- **Domain Pattern**: Use namespace imports (`Article.create()`, `Feed.processCron()`) - avoid direct function imports
- **Shared Logic**: Extract reusable business logic to domain namespaces for consistency
- **Event Organization**: Events are defined within domain index files using centralized `defineEvent` utility from `core/src/event.ts`
- **Event Access**: Access events via domain namespaces (e.g., `Article.Events.Created`) rather than separate event files

## Missing Features (Opportunities)
- **API Layer**: No REST/GraphQL API for data access
- **Web Interface**: No frontend for browsing articles
- **Search**: No full-text search capability
- **ML Pipeline**: Event schemas exist but no embedding/clustering implementation
- **Web Extension**: Directory exists but empty
- **Monitoring**: No alerting or observability
- **Testing**: No test suite configured