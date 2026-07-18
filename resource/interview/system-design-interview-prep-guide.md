# System Design Interview Prep Guide

## For Senior Java Backend Engineers (9+ Years Experience)

---

## 1. System Design Interview Framework

### The 4-Step Framework

**Step 1: Understand Requirements (5 min)**
- Ask clarifying questions before designing
- Define functional requirements (what it does)
- Define non-functional requirements (scale, latency)
- Identify constraints and assumptions

**Step 2: Estimate Scale (5 min)**
- Calculate QPS (queries per second)
- Estimate storage needs
- Calculate bandwidth requirements
- Determine memory/cache size

**Step 3: High-Level Design (15 min)**
- Draw system architecture diagram
- Identify core components and services
- Show data flow between components
- Choose appropriate technologies

**Step 4: Deep-Dive (15 min)**
- Discuss each component in detail
- Address bottlenecks and scaling
- Handle failure scenarios
- Optimize for performance

### Time Allocation Strategy

- **Requirements**: 5 minutes
- **Estimation**: 5 minutes
- **High-level design**: 15 minutes
- **Deep-dive**: 15 minutes
- **Trade-offs**: 5 minutes
- **Total**: 45 minutes typical interview

### Common Clarifying Questions

Ask these early in the interview:

- "What is the expected scale?" (users, QPS)
- "What latency requirements?" (p95, p99)
- "What availability target?" (99.9%, 99.99%)
- "What is the read vs write ratio?"
- "Is strong consistency required?"
- "What are the key features?"
- "Any budget or tech stack constraints?"
- "Real-time or batch processing?"

### Communication Tips

- **Explain before drawing**: verbalize your thinking
- **Mention alternatives**: show you know options
- **Discuss trade-offs explicitly**: every choice has costs
- **Use whiteboard effectively**: draw clear diagrams
- **Engage interviewer**: ask if direction is correct
- **Start simple**: add complexity gradually
- **Acknowledge gaps**: admit what you don't know

---

## 2. Capacity Estimation

### QPS Calculation

Formula: `QPS = total_requests / 86400`

Example calculations:

- 1M requests/day = 1,000,000 / 86,400 = ~12 QPS
- 10M requests/day = 10,000,000 / 86,400 = ~116 QPS
- 100M requests/day = 100,000,000 / 86,400 = ~1,157 QPS

Peak QPS = Average QPS * 2-3 (traffic spikes)

Always design for peak, not average.

### Storage Estimation

Formula: `storage = records_per_day * record_size * retention_days`

Example: E-commerce orders

- 1M orders/day * 1KB/order * 30 days = 30GB/month
- Add 20% overhead for indexes = 36GB/month
- Plan for 1 year retention = 432GB

Consider:

- Raw data size
- Index overhead (20-30%)
- Replication factor (2-3x)
- Backup storage (additional copy)

### Bandwidth Estimation

Formula: `bandwidth = QPS * avg_request_response_size`

Example: API service

- 100 QPS * (1KB request + 10KB response)
- = 100 * 11KB = 1,100 KB/s = ~9 Mbps
- Peak: 300 QPS * 11KB = ~27 Mbps

Add 50% buffer for safety margin.

### Memory Estimation

Cache size = hot_data_set * replication_factor

Example: Product catalog cache

- 100K products * 5KB each = 500MB
- Redis overhead (~20%) = 600MB
- Cluster with 3 replicas = 1.8GB total

Rule of thumb: Cache top 20% of data.

### Example: E-Commerce Order System

**Assumptions:**

- 1 million orders per day
- Average order size: 1KB
- Read/write ratio: 10:1
- Retention: 1 year
- Availability: 99.9%

**Calculations:**

- Average QPS: 1M / 86,400 = ~12 QPS
- Peak QPS: 12 * 3 = ~36 QPS
- Daily storage: 1M * 1KB = 1GB/day
- Monthly storage: 30GB + indexes = ~36GB
- Yearly storage: ~432GB
- Bandwidth: 36 QPS * 2KB = ~72 KB/s

**Infrastructure needs:**

- Database: Sharded PostgreSQL cluster
- Cache: Redis cluster (512MB-1GB)
- Message queue: Kafka (order events)
- Load balancer: Nginx/ALB

---

## 3. Core Architecture Patterns

### Monolith vs Microservices

**Monolith:**

- Single deployable unit
- Shared database
- Simple deployment and testing
- Best for: small teams, early stage

**Microservices:**

- Independent deployable services
- Separate databases per service
- Complex deployment (orchestration)
- Best for: large teams, mature systems

**When to choose microservices:**

- Team size > 10 engineers
- Different scaling needs per component
- Need independent deployment cycles
- Clear bounded contexts exist

**When to stay monolithic:**

- Early startup phase
- Small team (< 5 engineers)
- Unclear domain boundaries
- Low traffic volume

### Layered Architecture

Standard 3-tier pattern:

```
Presentation Layer (API/Controllers)
    ↓
Business Layer (Services/Logic)
    ↓
Data Layer (Repositories/DAOs)
```

**Benefits:**

- Separation of concerns
- Easy to test each layer
- Clear dependency direction

**Drawbacks:**

- Can become rigid over time
- Performance overhead (layer traversal)
- May encourage anemic domain models

### Event-Driven Architecture

Pattern: Producer → Broker → Consumer

**Components:**

- **Producer**: generates events
- **Broker**: message queue (Kafka, RabbitMQ)
- **Consumer**: processes events asynchronously

**Use cases:**

- Decouple services
- Handle async workflows
- Enable event sourcing
- Build real-time pipelines

**Benefits:**

- Loose coupling between services
- Better fault isolation
- Natural async processing
- Easy to add new consumers

**Challenges:**

- Eventual consistency
- Debugging distributed flows
- Message ordering guarantees
- Dead letter queue handling

### CQRS (Command Query Responsibility Segregation)

Separate read and write models:

```
Write Model (Commands) → Database
Read Model (Queries) ← Denormalized View
```

**When to use:**

- High read/write ratio disparity
- Complex query requirements
- Different scaling needs for reads/writes

**Benefits:**

- Optimize read and write paths separately
- Scale read replicas independently
- Simplify complex queries

**Drawbacks:**

- Data synchronization complexity
- Eventual consistency issues
- More infrastructure to maintain

### Event Sourcing

Store state changes as events, not current state.

**Concept:**

- Append-only event log
- Rebuild state by replaying events
- Every change is an immutable event

**Use cases:**

- Audit trails required
- Need to reconstruct historical state
- Complex business logic with history

**Benefits:**

- Complete audit trail
- Temporal queries possible
- Easy debugging (replay events)

**Challenges:**

- Complex query patterns
- Event schema evolution
- Snapshot management for performance

### Saga Pattern

Manage distributed transactions across services.

**Two approaches:**

1. **Orchestration**: Central coordinator manages flow
2. **Choreography**: Services react to events

**Orchestration example:**

```
Saga Orchestrator
  → Order Service (create order)
  → Payment Service (charge payment)
  → Inventory Service (reserve stock)
  → If any fails: trigger compensating actions
```

**Choreography example:**

```
Order Created Event
  → Payment Service listens, charges payment
  → Payment Success Event
  → Inventory Service listens, reserves stock
```

**Compensating transactions:**

- Undo previous steps on failure
- Must be idempotent
- Handle partial failures

### Strangler Fig Pattern

Gradually replace monolith with microservices.

**Strategy:**

1. Identify bounded context to extract
2. Create new microservice for that context
3. Route traffic to new service via proxy
4. Decommission old monolith code
5. Repeat for next context

**Benefits:**

- Low risk migration
- No big-bang rewrite
- Test incrementally

**Challenges:**

- Temporary data duplication
- Routing complexity
- Longer migration timeline

### Sidecar Pattern

Offload cross-cutting concerns to sidecar container.

**Common sidecars:**

- Service mesh proxy (Envoy, Linkerd)
- Logging agent (Fluentd, Filebeat)
- Health check monitor
- Configuration watcher

**Benefits:**

- Separate concerns from main app
- Language-agnostic infrastructure
- Easy to update sidecar independently

**Use in Kubernetes:**

- Each pod has main container + sidecar
- Share network namespace
- Communicate via localhost

---

## 4. Design Walkthrough: E-Commerce Order System

### Requirements

**Functional:**

- Process customer orders
- Track order status lifecycle
- Handle payment integration
- Notify users on status changes
- Support order cancellation

**Non-functional:**

- Process 1M orders/day
- 99.9% availability
- < 500ms p95 latency for order creation
- Strong consistency for inventory

### Scale Estimation

**Traffic:**

- 1M orders/day = ~12 QPS average
- Peak (3x): ~36 QPS
- Read/write ratio: 10:1 (status checks)

**Storage:**

- Order record: ~1KB
- Daily: 1M * 1KB = 1GB
- Monthly: 30GB + indexes = ~36GB
- Yearly: ~432GB

**Bandwidth:**

- Order creation: 2KB request/response
- 36 QPS * 2KB = ~72 KB/s peak

### High-Level Architecture

```
Client App
    ↓
API Gateway (rate limiting, auth)
    ↓
Order Service (core logic)
    ↓
├─→ Payment Service (async)
├─→ Inventory Service (sync reservation)
├─→ Notification Service (async)
└─→ Analytics Service (async)
```

**Data stores:**

- PostgreSQL: orders, order_items tables
- Redis: order status cache, inventory locks
- Kafka: order events stream

### Deep-Dive Topics

#### Order State Machine

States: Created → Paid → Shipped → Delivered

Transitions:

- Created → Paid: payment confirmed
- Paid → Shipped: warehouse dispatches
- Shipped → Delivered: customer receives
- Any → Cancelled: before shipment only

Implementation:

- Use enum for states
- Validate transitions in service layer
- Persist state changes atomically
- Emit state change events

#### Payment Integration

**Idempotency:**

- Generate unique idempotency key per order
- Store key in database with unique constraint
- Retry with same key returns cached result

**Retry strategy:**

- Exponential backoff: 1s, 2s, 4s, 8s
- Max retries: 5 attempts
- Circuit breaker after consecutive failures

**Async confirmation:**

- Payment service sends webhook on completion
- Order service verifies signature
- Update order status to "Paid"

#### Inventory Reservation

**Optimistic locking:**

```sql
UPDATE inventory
SET quantity = quantity - :qty,
    version = version + 1
WHERE product_id = :pid
  AND quantity >= :qty
  AND version = :expected_version
```

Check affected rows > 0 for success.

**TTL-based hold:**

- Reserve inventory for 15 minutes
- Release if payment not completed
- Scheduled job cleans expired holds

**Race condition handling:**

- Database transaction ensures atomicity
- Retry on optimistic lock failure
- Return "out of stock" after max retries

#### Notification System

**Async via message queue:**

- Order service publishes OrderCreated event
- Notification service consumes event
- Decouples order processing from notifications

**Template-based:**

- Store email/SMS templates in config
- Parameterize with order details
- Support localization (multi-language)

**Multi-channel:**

- Email: order confirmation, shipping update
- SMS: delivery notification (high priority)
- Push: real-time status updates
- In-app: notification center

#### Data Model

**orders table:**

```sql
CREATE TABLE orders (
    id BIGINT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    status VARCHAR(20) NOT NULL,
    total_amount DECIMAL(10,2),
    created_at TIMESTAMP,
    updated_at TIMESTAMP,
    INDEX idx_user_status (user_id, status)
);
```

**order_items table:**

```sql
CREATE TABLE order_items (
    id BIGINT PRIMARY KEY,
    order_id BIGINT NOT NULL,
    product_id BIGINT NOT NULL,
    quantity INT NOT NULL,
    price DECIMAL(10,2) NOT NULL,
    FOREIGN KEY (order_id) REFERENCES orders(id)
);
```

**payments table:**

```sql
CREATE TABLE payments (
    id BIGINT PRIMARY KEY,
    order_id BIGINT UNIQUE NOT NULL,
    amount DECIMAL(10,2),
    status VARCHAR(20),
    provider_transaction_id VARCHAR(100),
    created_at TIMESTAMP
);
```

#### Caching Strategy

**Product info cache:**

- Cache product details in Redis
- TTL: 1 hour (products change infrequently)
- Invalidate on product update

**Order status cache:**

- Cache recent order statuses
- TTL: 5 minutes
- Write-through on status change
- Reduces database load for status checks

**Inventory cache:**

- Cache available quantities
- TTL: 30 seconds (high churn)
- Use Redis decrement for reservations
- Sync with database periodically

### Trade-offs Discussion

**Consistency vs Availability (Inventory):**

- Strong consistency: prevent overselling
- Use database transactions for reservations
- Accept slightly higher latency
- Alternative: eventual consistency with compensation

**Sync vs Async (Payment):**

- Sync: immediate feedback, blocks order creation
- Async: faster order creation, complex state mgmt
- Chosen: async with polling for status
- Compromise: reserve inventory synchronously

**Database choice:**

- PostgreSQL: ACID transactions, complex queries
- MongoDB: flexible schema, horizontal scaling
- Chosen: PostgreSQL for order integrity
- Use read replicas for scaling reads

---

## 5. Design Walkthrough: Logistics Tracking System

### Requirements

**Functional:**

- Track packages across multiple countries
- Real-time status updates from carriers
- Notify sellers and buyers on updates
- Support multiple logistics providers
- Detect late shipments automatically

**Non-functional:**

- 5M packages/day across 6 countries
- < 2s latency for status updates
- 99.9% availability
- Support 100+ logistics providers

### Scale Estimation

**Traffic:**

- 5M packages/day = ~58 QPS average
- Peak (3x): ~180 QPS
- Status check queries: 10x writes = 580 QPS

**Storage:**

- Package record: 500 bytes
- Event record: 200 bytes
- Avg 5 events/package = 1KB total
- Daily: 5M * 1KB = 5GB
- Monthly: 150GB + indexes = ~180GB

**Bandwidth:**

- Update payload: 500 bytes
- 180 QPS * 500B = ~90 KB/s peak

### High-Level Architecture

```
Carrier APIs / Mobile Apps
    ↓
Tracking API Gateway
    ↓
Tracking Service (core logic)
    ↓
├─→ Location Service (GPS processing)
├─→ Notification Hub (alerts)
├─→ Analytics Pipeline (reporting)
└─→ Provider Adapter Layer
```

**Data stores:**

- PostgreSQL: shipments, providers metadata
- Cassandra: shipment_events (time-series)
- Redis: real-time tracking cache
- Kafka: event streaming pipeline

### Deep-Dive Topics

#### Status Tracking Pipeline

Lifecycle states:

- Created: order placed, label generated
- Picked Up: carrier collected package
- In Transit: moving through network
- Out for Delivery: final mile delivery
- Delivered: customer received
- Exception: delay, lost, returned

Implementation:

- State machine validates transitions
- Each update emits TrackingUpdated event
- Historical states stored for audit
- Webhook notifies subscribed services

#### Location Updates

**GPS ingestion:**

- Mobile apps send GPS coordinates
- Carrier APIs provide scan locations
- Normalize to standard format

**Batch vs Real-time:**

- Real-time: WebSocket push to users
- Batch: aggregate for analytics
- Hybrid: real-time for active tracking

**Deduplication:**

- Same location within 1 minute = duplicate
- Use sliding window deduplication
- Store hash of (package_id, location, timestamp)

#### Multi-Country Support

**Challenge:** Different providers per country

**Solution: Adapter Pattern**

```java
interface LogisticsProvider {
    TrackingInfo track(String trackingNumber);
    void cancelShipment(String trackingNumber);
}

class JNTProvider implements LogisticsProvider { ... }
class NinjaVanProvider implements LogisticsProvider { ... }
class LazadaExpressProvider implements LogisticsProvider { ... }
```

**Provider registry:**

- Map country code to default provider
- Allow override per shipment
- Dynamic provider selection based on route

**API normalization:**

- Each adapter converts to internal format
- Standardize status codes
- Unified error handling

#### Real-Time Notifications

**WebSocket for buyers:**

- Persistent connection while tracking
- Push updates immediately
- Fallback to polling if disconnected

**Email/SMS for sellers:**

- Batch notifications (hourly digest)
- Urgent updates sent immediately
- Respect seller preferences

**Notification routing:**

```
Tracking Updated Event
  → Check user preferences
  → Select channels (push/email/SMS)
  → Queue notifications
  → Send via respective gateways
```

#### Data Model

**shipments table:**

```sql
CREATE TABLE shipments (
    id VARCHAR(50) PRIMARY KEY,
    order_id BIGINT,
    seller_id BIGINT,
    buyer_id BIGINT,
    provider_code VARCHAR(20),
    current_status VARCHAR(20),
    origin_country VARCHAR(2),
    destination_country VARCHAR(2),
    expected_delivery_date DATE,
    created_at TIMESTAMP,
    updated_at TIMESTAMP
);
```

**shipment_events table (Cassandra):**

```cql
CREATE TABLE shipment_events (
    shipment_id TEXT,
    event_time TIMESTAMP,
    event_type TEXT,
    location TEXT,
    description TEXT,
    PRIMARY KEY (shipment_id, event_time)
) WITH CLUSTERING ORDER BY (event_time DESC);
```

**logistics_providers table:**

```sql
CREATE TABLE logistics_providers (
    code VARCHAR(20) PRIMARY KEY,
    name VARCHAR(100),
    countries_supported TEXT[],
    api_endpoint VARCHAR(200),
    api_key_encrypted TEXT,
    is_active BOOLEAN
);
```

#### Late Shipment Detection

**Scheduled job:**

- Run every hour
- Query shipments where:
  - current_date > expected_delivery_date
  - status != 'Delivered'
  - status != 'Exception'

**Actions:**

- Flag shipment as "Late"
- Notify seller and buyer
- Trigger investigation workflow
- Update analytics dashboard

**Optimization:**

- Index on (expected_delivery_date, status)
- Process in batches (1000 at a time)
- Use distributed job scheduler

### Trade-offs Discussion

**Real-time vs Batch (Location):**

- Real-time: better UX, higher infra cost
- Batch: cheaper, delayed updates
- Chosen: real-time for active shipments
- Batch for historical/analytics purposes

**Push vs Pull (Notifications):**

- Push: immediate, requires connection mgmt
- Pull: simpler, delayed, client polls
- Chosen: push for critical updates
- Pull as fallback mechanism

**Database choice for events:**

- PostgreSQL: strong consistency, limited scale
- Cassandra: high write throughput, eventual consistency
- Chosen: Cassandra for event volume
- PostgreSQL for shipment metadata

**Cross-border tracking:**

- Single global system: complex, unified
- Per-country systems: simpler, data silos
- Chosen: global system with country adapters
- Balance consistency and flexibility

---

## 6. Design Walkthrough: Chat/Messaging System

### Requirements

**Functional:**

- Real-time messaging between seller and buyer
- Message history retrieval
- Offline message support
- Read receipts and typing indicators
- Support images and attachments

**Non-functional:**

- 10M registered users
- 50K concurrent connections
- 500K messages/day
- < 1s message delivery latency
- 99.9% availability

### Scale Estimation

**Connections:**

- 50K concurrent WebSocket connections
- Each connection: ~10KB memory overhead
- Total: 50K * 10KB = 500MB RAM

**Messages:**

- 500K messages/day = ~6 QPS average
- Peak (5x during promotions): ~30 QPS
- Average message size: 200 bytes
- Daily storage: 500K * 200B = 100MB

**History:**

- Retain 1 year of messages
- Yearly storage: 100MB * 365 = ~36GB
- With indexes and overhead: ~50GB

### High-Level Architecture

```
Mobile/Web Clients
    ↓
Chat Gateway (WebSocket servers)
    ↓
Message Service (routing, persistence)
    ↓
├─→ Presence Service (online status)
├─→ Storage Layer (history)
├─→ Push Notification Service
└─→ Media Storage (attachments)
```

**Infrastructure:**

- Netty/Spring WebFlux: WebSocket servers
- Redis: presence, session mapping
- Cassandra: message history (scale)
- S3/OSS: media attachments
- Kafka: message event streaming

### Deep-Dive Topics

#### Connection Management

**WebSocket server:**

- Use Netty for high-performance I/O
- Spring WebFlux for reactive programming
- Horizontal scaling with load balancer

**Connection pooling:**

- Sticky sessions via consistent hashing
- Map user_id to specific server instance
- Store mapping in Redis

**Heartbeat mechanism:**

- Client sends ping every 30 seconds
- Server responds with pong
- Timeout after 90 seconds = disconnect
- Cleanup stale connections automatically

**Reconnection handling:**

- Exponential backoff: 1s, 2s, 4s, 8s
- Resume from last received sequence number
- Deliver missed messages on reconnect

#### Message Delivery

**Online recipient:**

- Push via WebSocket immediately
- Acknowledge receipt from client
- Mark as delivered in database

**Offline recipient:**

- Store message in database
- Send push notification (APNs/FCM)
- Deliver when user reconnects
- Mark as pending until delivered

**Delivery flow:**

```
Sender → Chat Gateway
  → Message Service
  → Check recipient presence
  → If online: push via WebSocket
  → If offline: store + push notification
  → Acknowledge to sender
```

#### Message Ordering

**Challenge:** Ensure correct order in conversations

**Solution: Sequence numbers**

- Each conversation has monotonic sequence
- Server assigns sequence on receive
- Client displays messages by sequence

**Implementation:**

```sql
INSERT INTO messages (
    conversation_id,
    sequence_number,
    sender_id,
    content,
    created_at
) VALUES (...);
```

- Use database auto-increment or Redis INCR
- Guarantee uniqueness and ordering
- Handle duplicates via idempotency

**Server-side ordering:**

- All ordering logic on server
- Clients trust server sequence
- Resolve conflicts server-side

#### Presence Service

**Track online/offline status:**

- Store in Redis: user_id → status
- Status values: online, offline, away
- TTL: 60 seconds (auto-expire if no heartbeat)

**Heartbeat mechanism:**

- Client sends heartbeat every 30s
- Update Redis TTL on heartbeat
- Expired key = user offline

**Subscription model:**

- Users subscribe to contacts' presence
- Publish presence changes via pub/sub
- Notify subscribers on status change

**Redis structure:**

```
presence:user_123 = "online" (TTL 60s)
presence:subscribers:user_123 = [user_456, user_789]
```

#### Storage Strategy

**Conversation history:**

- Cassandra for horizontal scaling
- Partition by conversation_id
- Cluster by timestamp (descending)

**Recent messages cache:**

- Store last 50 messages in Redis
- List structure: conversation_id → messages
- Faster than database for recent chat

**Media attachments:**

- Upload to S3/OSS
- Store URL in message record
- Generate presigned URLs for access
- CDN for fast delivery

**Cassandra schema:**

```cql
CREATE TABLE messages (
    conversation_id UUID,
    message_id TIMEUUID,
    sender_id BIGINT,
    content TEXT,
    attachment_url TEXT,
    created_at TIMESTAMP,
    PRIMARY KEY (conversation_id, message_id)
) WITH CLUSTERING ORDER BY (message_id DESC);
```

#### Group Chat vs 1:1

**1:1 chat:**

- Direct message delivery
- Simple presence tracking
- Two participants only

**Group chat:**

- Fan-out message to all members
- Track read status per member
- Handle join/leave events
- Larger message amplification

**Delivery strategy:**

- 1:1: push directly to recipient
- Group: iterate members, push individually
- Rate limit to prevent spam
- Batch notifications for large groups

### Trade-offs Discussion

**WebSocket vs SSE vs Long-polling:**

- WebSocket: full duplex, low latency, complex
- SSE: server-to-client only, simpler
- Long-polling: universal support, high overhead
- Chosen: WebSocket for real-time bidirectional

**Cassandra vs PostgreSQL for history:**

- Cassandra: high write throughput, horizontal scale
- PostgreSQL: strong consistency, complex queries
- Chosen: Cassandra for message volume
- Use PostgreSQL for conversation metadata

**In-memory vs persistent sessions:**

- In-memory: fast, lost on restart
- Persistent (Redis): survives restarts, slower
- Chosen: Redis for session mapping
- Balance performance and reliability

**Message encryption:**

- End-to-end: highest security, complex key mgmt
- Transport-only (TLS): simpler, server can read
- Chosen: TLS for transport, encrypt at rest
- Consider E2E for sensitive conversations

---

## 7. Design Walkthrough: Notification Platform

### Requirements

**Functional:**

- Multi-channel: email, SMS, push, in-app
- Template-based message composition
- User preference management
- Delivery tracking and analytics
- Priority-based routing

**Non-functional:**

- 10M notifications/day
- < 5s delivery for urgent notifications
- 99.9% availability
- Support 50+ notification templates

### Scale Estimation

**Traffic:**

- 10M notifications/day = ~116 QPS average
- Peak (3x): ~350 QPS
- Channel distribution: 40% push, 30% email, 20% SMS, 10% in-app

**Storage:**

- Notification record: 500 bytes
- Daily: 10M * 500B = 5GB
- Monthly: 150GB + indexes = ~180GB
- Retention: 90 days = ~540GB

**Templates:**

- 50 templates * 5KB each = 250KB
- Negligible storage impact
- Cache in application memory

### High-Level Architecture

```
Internal Services
    ↓
Notification API (validate, enqueue)
    ↓
Notification Router (channel selection)
    ↓
├─→ Email Sender (SES/SendGrid)
├─→ SMS Sender (Twilio/local provider)
├─→ Push Sender (APNs/FCM)
└─→ In-App Notification Store
```

**Infrastructure:**

- Kafka: notification event queue
- Redis: rate limiting, deduplication
- PostgreSQL: templates, preferences, logs
- Worker pools: parallel channel sending

### Deep-Dive Topics

#### Channel Routing

**User preference-based:**

- Each user sets preferred channels
- Respect opt-out preferences
- Fallback to alternative channels

**Fallback chains:**

```
Priority 1: Push notification
  → If failed or user offline
Priority 2: Email
  → If bounced
Priority 3: SMS (urgent only)
```

**Routing logic:**

```java
List<Channel> determineChannels(NotificationRequest req) {
    UserPreferences prefs = getUserPreferences(req.userId);
    
    if (req.priority == URGENT) {
        return Arrays.asList(PUSH, SMS, EMAIL);
    }
    
    return prefs.getPreferredChannels();
}
```

**Channel health monitoring:**

- Track delivery success rate per channel
- Circuit breaker on high failure rate
- Automatic fallback to healthy channels

#### Template Engine

**Parameterized templates:**

```
Hello {{userName}}, your order {{orderId}} 
has been shipped. Expected delivery: {{deliveryDate}}.
```

**Localization:**

- Store templates per language
- Detect user language from profile
- Fallback to default language (English)

**Versioning:**

- Each template has version number
- Active notifications use template snapshot
- Allows template updates without breaking in-flight

**Template storage:**

```sql
CREATE TABLE notification_templates (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100),
    channel VARCHAR(20),
    language VARCHAR(5),
    version INT,
    content TEXT,
    is_active BOOLEAN,
    created_at TIMESTAMP
);
```

#### Delivery Guarantees

**At-least-once delivery:**

- Retry on transient failures
- Exponential backoff: 1s, 2s, 4s, 8s, 16s
- Max retries: 5 attempts

**Dead Letter Queue (DLQ):**

- Move failed notifications to DLQ
- Manual inspection and retry
- Alert on DLQ growth

**Deduplication:**

- Generate idempotency key per notification
- Store processed keys in Redis (TTL 24h)
- Skip duplicate notifications

**Idempotency key:**

```
key = hash(userId + templateId + timestamp + uniqueSuffix)
```

#### Rate Limiting

**Per-user throttling:**

- Max 10 push notifications/hour
- Max 5 SMS/day (cost control)
- Unlimited email (lower cost)

**Implementation:**

- Redis counter per user per channel
- Sliding window algorithm
- Reject if limit exceeded

**Redis structure:**

```
rate:push:user_123:2024-01-15-14 = 7 (TTL 3600s)
```

**Batch email delivery:**

- Queue emails for batch sending
- Send every 5 minutes
- Reduces SMTP connection overhead
- Improves deliverability

#### Priority Handling

**Urgent notifications:**

- Bypass queue, send immediately
- Use dedicated high-priority worker pool
- Examples: payment failure, security alert

**Informational notifications:**

- Queue for batch processing
- Send hourly or daily digest
- Examples: weekly summary, promotions

**Priority queue implementation:**

- Kafka topic partitioning by priority
- Separate consumer groups per priority
- Urgent: dedicated workers, no batching

#### Analytics and Tracking

**Metrics to track:**

- Delivery rate: sent vs delivered
- Open rate: delivered vs opened (email/push)
- Click-through rate: opened vs clicked
- Bounce rate: invalid addresses
- Unsubscribe rate: user opt-outs

**Tracking implementation:**

- Embed tracking pixel in emails
- Push notification open callbacks
- Link click tracking via redirect service

**Analytics storage:**

- Time-series database (InfluxDB/TimescaleDB)
- Aggregate metrics hourly/daily
- Dashboard for monitoring trends

**Alerting:**

- Alert if delivery rate drops below 90%
- Alert if bounce rate exceeds 5%
- Monitor DLQ size continuously

### Trade-offs Discussion

**At-least-once vs Exactly-once:**

- At-least-once: simpler, may duplicate
- Exactly-once: complex, performance impact
- Chosen: at-least-once with deduplication
- Accept rare duplicates for simplicity

**Real-time vs Batch (Email):**

- Real-time: immediate delivery, higher cost
- Batch: delayed, cost-effective, better deliverability
- Chosen: batch for informational, real-time for urgent
- Balance user experience and cost

**Template rendering location:**

- Server-side: consistent, centralized
- Client-side: flexible, caching benefits
- Chosen: server-side for email/SMS
- Client-side for in-app notifications

**Channel redundancy:**

- Send via multiple channels: higher reach, annoying
- Single channel: cleaner, may miss user
- Chosen: primary channel with fallback
- Respect user preferences strictly

---

## 8. Design Walkthrough: Rate Limiting Service

### Requirements

**Functional:**

- Per-user rate limiting
- Multiple tiers (free/premium/enterprise)
- Distributed enforcement across instances
- Dynamic configuration updates
- Graceful degradation on failures

**Non-functional:**

- 100M API calls/day
- < 5ms latency for rate check
- 99.99% availability
- Support 1000+ endpoints

### Scale Estimation

**Traffic:**

- 100M calls/day = ~1,157 QPS average
- Peak (3x): ~3,500 QPS
- Rate check per API call: 1:1 ratio

**Storage:**

- Rate counters in Redis only
- No persistent storage needed
- Redis memory: ~1GB for counters

**Configuration:**

- 1000 endpoints * 3 tiers = 3000 rules
- Negligible storage impact
- Cache in application memory

### High-Level Architecture

```
API Clients
    ↓
API Gateway
    ↓
Rate Limiter Middleware
    ↓
Redis Cluster (counter store)
    ↓
Config Service (dynamic rules)
```

**Components:**

- API Gateway: intercept all requests
- Rate Limiter: check limits before forwarding
- Redis: atomic counter operations
- Config Service: manage rate limit rules

### Deep-Dive Topics

#### Rate Limiting Algorithms

**Fixed Window:**

- Divide time into fixed intervals (1 minute)
- Count requests per window
- Reset counter at window boundary

Pros: Simple, low memory
Cons: Burst at window boundaries

**Sliding Window:**

- Track requests in rolling time window
- More accurate than fixed window
- Use sorted set in Redis

Pros: Smooth rate limiting
Cons: Higher memory, complex implementation

**Token Bucket:**

- Bucket fills with tokens at fixed rate
- Each request consumes one token
- Reject if bucket empty

Pros: Allows short bursts, smooth long-term
Cons: Complex state management

**Leaky Bucket:**

- Requests enter queue
- Process at constant rate
- Reject if queue full

Pros: Smooth output rate
Cons: Fixed processing rate, no burst

**Recommendation:**

- Token bucket for most APIs
- Fixed window for simple use cases
- Sliding window for strict requirements

#### Distributed Enforcement

**Redis atomic operations:**

```lua
-- Lua script for atomic increment
local key = KEYS[1]
local limit = tonumber(ARGV[1])
local ttl = tonumber(ARGV[2])

local current = redis.call('GET', key)
if current == false then
    redis.call('SET', key, 1)
    redis.call('EXPIRE', key, ttl)
    return 1
end

current = tonumber(current)
if current >= limit then
    return 0
end

redis.call('INCR', key)
return 1
```

**Benefits of Lua scripts:**

- Atomic execution in Redis
- Reduce network round-trips
- Consistent behavior across instances

**Key structure:**

```
rate:{endpoint}:{userId}:{window}
Example: rate:/api/orders:user_123:2024-01-15-14-30
```

#### Configuration Management

**Per-endpoint limits:**

```yaml
/api/orders:
  free_tier: 100/hour
  premium_tier: 1000/hour
  enterprise_tier: 10000/hour

/api/products:
  free_tier: 1000/hour
  premium_tier: 10000/hour
  enterprise_tier: unlimited
```

**Dynamic adjustment:**

- Store config in ZooKeeper/etcd
- Watch for config changes
- Update in-memory cache immediately
- No restart required

**Tier management:**

- Map user to tier in user service
- Cache tier mapping in Redis (TTL 1 hour)
- Override per-user limits for special cases

#### Response Headers

**Standard headers:**

```
HTTP/1.1 429 Too Many Requests
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 0
X-RateLimit-Reset: 1705334400
Retry-After: 60
```

**Header meanings:**

- X-RateLimit-Limit: max requests allowed
- X-RateLimit-Remaining: requests left in window
- X-RateLimit-Reset: Unix timestamp when window resets
- Retry-After: seconds to wait before retrying

**Client behavior:**

- Check remaining before sending request
- Backoff when approaching limit
- Respect Retry-After on 429 response

#### Failover Strategy

**Redis unavailable:**

- Fallback to local in-memory rate limiting
- Less accurate but prevents total failure
- Merge counters when Redis recovers

**Local rate limiter:**

- Use Caffeine/Guava cache
- Per-instance limits (divide by instance count)
- Simpler algorithms (fixed window)

**Degradation modes:**

1. Normal: Redis-based distributed limiting
2. Degraded: Local in-memory limiting
3. Emergency: Disable rate limiting (last resort)

**Monitoring:**

- Alert on Redis connection failures
- Track fallback activation frequency
- Monitor rate limit effectiveness

### Trade-offs Discussion

**Fixed Window vs Sliding Window:**

- Fixed: simple, bursty at boundaries
- Sliding: smooth, complex implementation
- Chosen: sliding window for production
- Fixed for internal/non-critical APIs

**Distributed vs Local:**

- Distributed: accurate, Redis dependency
- Local: fast, inaccurate across instances
- Chosen: distributed for user-facing APIs
- Local for internal service-to-service

**Strict vs Lenient:**

- Strict: reject immediately on limit
- Lenient: allow small overflow (10%)
- Chosen: strict for paid APIs
- Lenient for free tier (better UX)

**Synchronous vs Async checking:**

- Sync: block request until check complete
- Async: check in background, log violations
- Chosen: sync for enforcement
- Async for analytics/monitoring

---

## 9. Database Design Decisions

### SQL vs NoSQL Decision Framework

**Choose SQL (PostgreSQL, MySQL) when:**

- Data has structured, predictable schema
- Complex queries with joins required
- Strong consistency and ACID transactions
- Referential integrity important
- Moderate scale (< 100M rows per table)

**Choose NoSQL (MongoDB, Cassandra) when:**

- Schema is flexible or evolving
- High write throughput needed (> 10K writes/sec)
- Horizontal scaling is critical
- Eventual consistency acceptable
- Simple query patterns (key-value, document)

**Hybrid approach:**

- SQL for transactional data (orders, payments)
- NoSQL for high-volume data (events, logs)
- Use both based on access patterns

### Sharding Strategies

**Hash-based sharding:**

- Shard key = hash(user_id) % num_shards
- Even distribution across shards
- Good for uniform access patterns

Pros: Balanced load, simple routing
Cons: Range queries inefficient, resharding hard

**Range-based sharding:**

- Shard by date range or ID range
- Shard 1: Jan-Mar, Shard 2: Apr-Jun, etc.

Pros: Efficient range queries, easy archiving
Cons: Uneven distribution, hot shards possible

**Directory-based sharding:**

- Lookup service maps key to shard
- Flexible routing logic
- Can move data between shards

Pros: Maximum flexibility, easy rebalancing
Cons: Extra lookup hop, single point of failure

**Sharding best practices:**

- Choose shard key carefully (high cardinality)
- Avoid hot shards (uneven distribution)
- Plan for resharding from day one
- Use consistent hashing for minimal movement

### Replication Strategies

**Primary-Secondary (Master-Slave):**

- One primary handles writes
- Multiple secondaries handle reads
- Async replication from primary to secondaries

Use case: Read-heavy workloads
Risk: Replication lag, stale reads

**Multi-Primary (Active-Active):**

- Multiple nodes accept writes
- Conflict resolution required
- Complex but highly available

Use case: Multi-region deployments
Risk: Write conflicts, complex merging

**Consensus-based (Raft/Paxos):**

- Majority vote for commits
- Strong consistency guaranteed
- Lower write throughput

Use case: Critical financial data
Risk: Higher latency, lower availability

**Replication factor:**

- Factor of 3: balance of safety and cost
- Factor of 5: maximum durability
- Consider geographic distribution

### Indexing Strategies

**B-tree index:**

- Default index type in most databases
- Efficient for range queries and sorting
- O(log n) lookup time

Use for: WHERE col > value, ORDER BY, BETWEEN

**Hash index:**

- Exact match lookups only
- O(1) lookup time
- Not suitable for ranges

Use for: WHERE col = value (equality only)

**Composite index:**

- Index on multiple columns
- Order matters (leftmost prefix rule)
- Covers queries on leading columns

Example: INDEX (last_name, first_name)
Works for: WHERE last_name = 'Smith'
Works for: WHERE last_name = 'Smith' AND first_name = 'John'
Does NOT work for: WHERE first_name = 'John' alone

**Covering index:**

- Index contains all queried columns
- Avoids table lookup (index-only scan)
- Faster but uses more storage

Example: SELECT age FROM users WHERE name = 'John'
Covering index: INDEX (name, age)

**Index best practices:**

- Index foreign keys and frequently queried columns
- Avoid over-indexing (slows writes)
- Monitor unused indexes and remove them
- Use EXPLAIN to verify index usage

### Caching Layers

**Application cache (Caffeine/Guava):**

- In-memory, fastest access
- Per-application-instance
- Lost on restart

Use for: Frequently accessed, rarely changed data

**Distributed cache (Redis/Memcached):**

- Shared across instances
- Survives application restarts
- Network latency (~1ms)

Use for: Session data, shared state, rate limits

**Database cache (buffer pool):**

- Built into database engine
- Automatic management
- Stores recently accessed pages

Use for: Hot database rows and indexes

**Cache invalidation strategies:**

- TTL-based: expire after fixed time
- Write-through: update cache on write
- Cache-aside: check cache, fallback to DB
- Invalidate-on-write: delete cache entry

**Cache pitfalls:**

- Cache penetration: query non-existent keys
- Cache avalanche: many keys expire at once
- Hot key problem: single key gets heavy traffic
- Solution: randomize TTL, use local cache

---

## 10. Common Interview Questions with Model Answers

### Q1: Design a URL Shortener

**Approach:**

- Generate short code from long URL
- Store mapping in database
- Redirect short code to original URL

**Key decisions:**

- Hash function: MD5/SHA then base62 encode
- Collision handling: check existence, retry
- Code length: 7 chars = 3.5 trillion combos
- Database: key-value store (Redis + persistent)

**Trade-offs:**

- Pre-generate codes vs generate on-demand
- In-memory cache for popular URLs
- Analytics tracking adds overhead

**Senior answer:**

"Use consistent hashing for sharding by short
code. Cache hot URLs in Redis with LRU eviction.
Generate codes sequentially to avoid collisions.
Track click analytics asynchronously via Kafka."

### Q2: Design a Web Crawler

**Approach:**

- Maintain URL frontier (queue of URLs)
- Fetch pages, extract links, add to frontier
- Respect robots.txt and rate limits

**Key decisions:**

- URL deduplication: Bloom filter or hash set
- Politeness: delay between requests per domain
- Distributed crawling: partition by domain
- Storage: store raw HTML + extracted data

**Trade-offs:**

- Breadth-first vs depth-first crawling
- Freshness vs coverage (recrawl frequency)
- Single-threaded vs multi-threaded per domain

**Senior answer:**

"Use distributed queue (Kafka) for URL frontier.
Partition by domain hash for locality. Implement
adaptive politeness based on server response time.
Use Bloom filter for efficient deduplication at
scale. Store crawled data in HDFS for processing."

### Q3: Design a News Feed System

**Approach:**

- Aggregate posts from followed users
- Rank by relevance/recency
- Paginate for infinite scroll

**Key decisions:**

- Fan-out on write: pre-compute feeds
- Fan-out on read: aggregate at request time
- Hybrid: fan-out for celebrities, pull for others

**Trade-offs:**

- Fan-out write: fast reads, expensive writes
- Fan-out read: cheap writes, slow reads
- Storage cost vs latency trade-off

**Senior answer:**

"Use hybrid approach: fan-out for users with <
10K followers, pull for influencers. Store feed
in Redis sorted sets (score = timestamp). Use
ML ranking for personalization. Cache paginated
results for 5 minutes to reduce computation."

### Q4: Design a Key-Value Store

**Approach:**

- Distribute data across nodes
- Handle replication for fault tolerance
- Support get/put/delete operations

**Key decisions:**

- Consistent hashing for data distribution
- Replication factor: 3 copies minimum
- Vector clocks for conflict detection
- Read repair for consistency

**Trade-offs:**

- Strong consistency vs high availability
- Synchronous vs asynchronous replication
- Leader-based vs leaderless replication

**Senior answer:**

"Implement consistent hashing with virtual nodes
for even distribution. Use quorum reads/writes
(R + W > N) for tunable consistency. Implement
hinted handoff for temporary node failures. Use
Merkle trees for efficient anti-entropy repair."

### Q5: Design a Search Engine

**Approach:**

- Crawl web pages
- Build inverted index (term → documents)
- Rank results by relevance

**Key decisions:**

- Inverted index: term frequency, doc frequency
- Ranking: TF-IDF, PageRank, BM25
- Sharding: distribute index by term or document
- Query processing: parse, expand, rank

**Trade-offs:**

- Index freshness vs indexing cost
- Precision vs recall in results
- Real-time indexing vs batch processing

**Senior answer:**

"Build inverted index with TF-IDF scoring. Shard
by term hash for balanced distribution. Use
BM25 for better ranking than TF-IDF. Implement
query caching for popular searches. Update index
incrementally using log-structured merge trees."

### Q6: How Do You Handle Distributed Transactions?

**Approach:**

- Avoid distributed transactions when possible
- Use Saga pattern for necessary cases
- Implement compensating actions

**Key decisions:**

- Orchestration vs choreography for Sagas
- Idempotency for retry safety
- Outbox pattern for reliable event publishing

**Trade-offs:**

- Strong consistency (2PC) vs availability (Saga)
- Complexity vs correctness guarantees
- Performance vs durability

**Senior answer:**

"Prefer eventual consistency via event-driven
architecture. Use Saga pattern with orchestration
for complex workflows. Implement outbox pattern
to ensure atomic DB write + event publish. Make
all operations idempotent for safe retries. Use
compensating transactions for rollback scenarios."

### Q7: How Do You Design for High Availability?

**Approach:**

- Eliminate single points of failure
- Implement automatic failover
- Monitor system health continuously

**Key decisions:**

- Redundancy: multiple instances per component
- Load balancing: distribute traffic evenly
- Health checks: detect unhealthy instances
- Circuit breaker: prevent cascade failures

**Trade-offs:**

- Cost vs availability (more replicas = costlier)
- Consistency vs availability (CAP theorem)
- Complexity vs reliability

**Senior answer:**

"Deploy across multiple availability zones minimum.
Use active-active architecture for critical services.
Implement circuit breakers with fallback mechanisms.
Design for graceful degradation under load. Use
chaos engineering to test failure scenarios proactively."

### Q8: Data Consistency Across Services?

**Approach:**

- Accept eventual consistency for most cases
- Use event-driven synchronization
- Avoid dual-write problems

**Key decisions:**

- Event sourcing for audit trail
- Outbox pattern for reliable messaging
- Compensating transactions for rollback

**Trade-offs:**

- Strong consistency vs system complexity
- Sync calls vs async events
- Data duplication vs join complexity

**Senior answer:**

"Embrace eventual consistency for cross-service
data. Use transactional outbox pattern to ensure
atomic state change + event publication. Implement
idempotent event consumers for safe retries. Use
CDC (Change Data Capture) for legacy systems. Only
use strong consistency within service boundaries."

### Q9: Design a Distributed Cache

**Approach:**

- Distribute cache across multiple nodes
- Handle cache invalidation efficiently
- Prevent cache stampedes

**Key decisions:**

- Consistent hashing for key distribution
- Cache eviction: LRU, LFU, or TTL-based
- Hot key handling: replicate to multiple nodes
- Cache penetration: bloom filters for missing keys

**Trade-offs:**

- Consistency vs performance
- Memory usage vs hit rate
- Complexity vs simplicity

**Senior answer:**

"Use consistent hashing with virtual nodes for
distribution. Implement cache-aside pattern with
mutex locks to prevent stampedes. Use bloom filters
to avoid cache penetration for non-existent keys.
Replicate hot keys across nodes. Set randomized
TTLs to prevent cache avalanche."

### Q10: How Do You Scale a Database?

**Approach:**

- Optimize queries and indexes first
- Add read replicas for read-heavy workloads
- Shard for write scaling

**Key decisions:**

- Vertical scaling: upgrade hardware (limited)
- Horizontal scaling: add more nodes (complex)
- Caching: reduce database load significantly
- Connection pooling: manage concurrent connections

**Trade-offs:**

- Read replicas: eventual consistency risk
- Sharding: complex queries across shards
- Caching: stale data possibility

**Senior answer:**

"Start with query optimization and proper indexing.
Add read replicas for read-heavy workloads with
connection pooling. Implement application-level
caching (Redis) to reduce DB load. Shard only when
necessary, choosing shard key carefully. Consider
database-specific features like partitioning and
materialized views before full sharding."

### Q11: Design a Rate Limiter

**Approach:**

- Track request counts per user/endpoint
- Enforce limits using chosen algorithm
- Return appropriate HTTP status codes

**Key decisions:**

- Algorithm: token bucket, sliding window, fixed
- Storage: Redis for distributed, memory for local
- Granularity: per-user, per-IP, per-endpoint

**Trade-offs:**

- Accuracy vs performance
- Distributed vs local enforcement
- Strict vs lenient limiting

**Senior answer:**

"Use token bucket algorithm for smooth rate limiting
with burst allowance. Store counters in Redis with
Lua scripts for atomic operations. Implement sliding
window for accurate tracking. Return 429 status with
Retry-After header. Add X-RateLimit headers for client
visibility. Fallback to local limiting if Redis fails."

### Q12: Design a Unique ID Generator

**Approach:**

- Generate unique IDs across distributed systems
- Ensure monotonic increasing (optional)
- Minimize coordination overhead

**Key decisions:**

- UUID v4: random, no coordination needed
- Snowflake: timestamp + machine ID + sequence
- Database sequence: simple but centralized

**Trade-offs:**

- Uniqueness vs sortability
- Coordination vs independence
- ID size vs readability

**Senior answer:**

"Use Twitter Snowflake algorithm for sortable, unique
IDs without central coordination. Combine timestamp
(41 bits), machine ID (10 bits), and sequence (12 bits).
Handles clock skew with wait mechanism. Generates IDs
at ~400K/sec per machine. Alternative: UUID v4 for
simplicity when sorting not required."

---

## 11. Trade-off Analysis Templates

### Consistency vs Availability (CAP Theorem)

**Context:** Distributed systems cannot guarantee all
three: Consistency, Availability, Partition tolerance

**When to prioritize Consistency:**

- Financial transactions (payments, balances)
- Inventory management (prevent overselling)
- User authentication (security critical)

**When to prioritize Availability:**

- Social media feeds (stale data acceptable)
- Product catalogs (minor inconsistencies OK)
- Analytics dashboards (approximate values fine)

**Practical application:**

- Use strong consistency within service boundaries
- Accept eventual consistency across services
- Implement reconciliation jobs for drift detection

**Interview tip:** Always mention CAP theorem and
explain your choice based on business requirements.

### Latency vs Throughput

**Latency:** Time to process single request

**Throughput:** Number of requests per second

**When to prioritize Latency:**

- User-facing APIs (search, checkout)
- Real-time systems (chat, gaming)
- Interactive applications

**When to prioritize Throughput:**

- Batch processing (analytics, reports)
- Background jobs (email sending, data sync)
- Log aggregation pipelines

**Optimization techniques:**

- Reduce latency: caching, connection pooling, CDN
- Increase throughput: parallelism, batching, async

**Trade-off example:**

Batching reduces latency per item but increases
overall throughput. Choose based on use case.

### Simplicity vs Flexibility

**Simplicity benefits:**

- Easier to understand and maintain
- Fewer bugs and edge cases
- Faster development velocity

**Flexibility benefits:**

- Adapts to changing requirements
- Supports diverse use cases
- Future-proof design

**When to choose Simplicity:**

- Early-stage products (requirements unclear)
- Small teams (limited maintenance capacity)
- Well-understood problems

**When to choose Flexibility:**

- Mature platforms (many integrations)
- Large teams (specialized components)
- Evolving requirements

**Balance strategy:**

Start simple, add flexibility incrementally as
requirements become clear. Avoid premature abstraction.

### Cost vs Performance

**Cost optimization:**

- Right-size infrastructure (avoid over-provisioning)
- Use spot instances for batch jobs
- Implement auto-scaling based on demand
- Cache aggressively to reduce compute

**Performance optimization:**

- Invest in faster hardware/SSDs
- Add more replicas for load distribution
- Use premium network tiers
- Implement aggressive caching

**Decision framework:**

- Calculate cost per transaction
- Set performance budgets (p95 latency targets)
- Monitor cost trends alongside performance
- Optimize for cost-effective performance

**Cloud cost tips:**

- Use reserved instances for steady workloads
- Implement lifecycle policies for data storage
- Monitor and alert on cost anomalies
- Regular right-sizing reviews

### Reliability vs Complexity

**Reliability improvements:**

- Add redundancy (multiple instances)
- Implement automatic failover
- Use circuit breakers for resilience
- Add comprehensive monitoring

**Complexity costs:**

- More components = more failure modes
- Harder to debug and troubleshoot
- Increased operational overhead
- Higher cognitive load for team

**Balance approach:**

- Add reliability features incrementally
- Measure reliability improvements quantitatively
- Document complexity trade-offs explicitly
- Simplify where possible without sacrificing SLOs

**Rule of thumb:**

Each reliability feature should provide measurable
improvement. Avoid adding complexity "just in case."

---

## 12. Final Checklist

### Architecture Design Skills

- [ ] Can draw high-level architecture for 5 systems
  - E-commerce platform
  - Social media feed
  - Chat/messaging system
  - URL shortener
  - Video streaming service

- [ ] Can estimate capacity for QPS, storage, bandwidth
  - Calculate QPS from daily volume
  - Estimate storage with retention period
  - Compute bandwidth requirements
  - Size cache layers appropriately

- [ ] Understand CAP theorem and apply to decisions
  - Know when to sacrifice consistency
  - Know when to sacrifice availability
  - Explain trade-offs clearly

### Database Knowledge

- [ ] Know 3+ database sharding strategies
  - Hash-based sharding
  - Range-based sharding
  - Directory-based sharding
  - When to use each strategy

- [ ] Can explain Saga pattern for distributed txns
  - Orchestration vs choreography
  - Compensating transactions
  - Idempotency requirements

- [ ] Understand consistency models
  - Strong consistency (ACID)
  - Eventual consistency
  - Causal consistency
  - When to use each model

### API Design

- [ ] Can design idempotent APIs
  - Idempotency keys implementation
  - Retry-safe operations
  - Duplicate detection strategies

- [ ] Know REST best practices
  - Proper HTTP status codes
  - Versioning strategies
  - Pagination patterns
  - Error handling conventions

### Caching Strategies

- [ ] Know 3+ caching strategies and invalidation
  - Cache-aside pattern
  - Write-through caching
  - Write-behind caching
  - TTL-based expiration
  - Invalidate-on-write pattern

- [ ] Handle cache challenges
  - Cache penetration (bloom filters)
  - Cache avalanche (randomize TTL)
  - Hot key problem (replication)
  - Cache stampede (mutex locks)

### Communication Skills

- [ ] Can discuss trade-offs for every design decision
  - Always present alternatives
  - Explain why you chose specific approach
  - Acknowledge limitations honestly

- [ ] Practice whiteboard drawing
  - Draw architectures on paper in 15 minutes
  - Use clear labels and arrows
  - Show data flow direction

### Preparation Actions

- [ ] Review 5+ system design case studies
- [ ] Practice explaining designs aloud
- [ ] Study real-world architectures (Netflix, Uber)
- [ ] Mock interviews with peers (minimum 3)
- [ ] Prepare questions to ask interviewer

---

## Quick Reference: Key Numbers

**Common scale benchmarks:**

- 1K QPS: Small startup, single server
- 10K QPS: Medium company, needs caching
- 100K QPS: Large company, needs sharding
- 1M QPS: Tech giant, global distribution

**Latency targets:**

- < 10ms: Cache hit, in-memory operation
- < 100ms: Database query, good UX
- < 500ms: Complex operation, acceptable
- > 1s: Needs optimization or async

**Storage costs (approximate):**

- SSD: $0.10-0.20 per GB/month
- HDD: $0.02-0.05 per GB/month
- S3 standard: $0.023 per GB/month
- S3 infrequent: $0.0125 per GB/month

**Memory guidelines:**

- JVM heap: 4-8GB typical, max 32GB
- Redis instance: 1-10GB typical
- Cache hit rate target: > 80%
- Connection pool size: CPU cores * 2-4

---

## Recommended Resources

**Books:**

- "Designing Data-Intensive Applications" by Kleppmann
- "System Design Interview" by Alex Xu (Vol 1 & 2)
- "Building Microservices" by Sam Newman

**Online Courses:**

- Grokking the System Design Interview (Educative)
- System Design Primer (GitHub - free)
- MIT 6.824 Distributed Systems (free)

**Practice Platforms:**

- Pramp (mock interviews)
- Interviewing.io (technical prep)
- LeetCode system design tag

**Blogs:**

- Netflix Tech Blog
- Uber Engineering Blog
- AWS Architecture Blog
- High Scalability (highscalability.com)

---

*Good luck with your system design interviews!*
*Remember: communicate clearly, think aloud, and
show your reasoning process. The journey matters
as much as the final design.*