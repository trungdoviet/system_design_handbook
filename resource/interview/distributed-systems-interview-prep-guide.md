# Distributed Systems Interview Prep Guide

## 1. Core Distributed Systems Concepts

**Definition**: Components on networked computers coordinate for common goal.

**Why distributed?**
- Scale: Handle more users/data than single machine
- Availability: Survive individual node failures
- Latency: Serve users from closer locations
- Fault isolation: Failure in one part doesn't crash all

**Key Challenges:**
- Network failures: Messages can be lost/delayed
- Clock synchronization: No global clock across nodes
- Partial failures: Some nodes fail, others work
- Concurrent access: Multiple clients modify same data

**Fallacies of Distributed Computing:**
1. Network is reliable (it's not)
2. Latency is zero (network delays exist)
3. Bandwidth is infinite (limited capacity)
4. Network is secure (vulnerable to attacks)
5. Topology doesn't change (nodes join/leave)
6. There is one administrator (multiple teams)
7. Transport cost is zero (data transfer costs)
8. Network is homogeneous (mixed hardware/software)

---

## 2. CAP Theorem & Consistency Models

**CAP Theorem**: Choose 2 of 3:
- **C**onsistency: All reads see latest write
- **A**vailability: Every request gets response
- **P**artition tolerance: System works despite network splits

**In practice**: P is inevitable (networks fail).
Choose CP or AP based on domain needs.

**CP Systems** (Consistency + Partition tolerance):
- Examples: HBase, MongoDB (default config)
- Behavior: Reject requests during partition
- Use case: Financial systems, inventory management

**AP Systems** (Availability + Partition tolerance):
- Examples: Cassandra, DynamoDB, Couchbase
- Behavior: Return stale data during partition
- Use case: Social media feeds, product catalogs

**Consistency Models Hierarchy** (strongest to weakest):
1. Strong consistency
2. Causal consistency
3. Eventual consistency
4. Weak consistency

**Strong Consistency:**
- All reads return most recent write
- Achieved via: Synchronous replication, consensus
- Cost: Higher latency, lower availability
- Protocols: Raft, Paxos, Zab

**Eventual Consistency:**
- Reads may see stale data temporarily
- All replicas converge over time (no new writes)
- Common in: NoSQL databases, CDN caching
- Benefit: High availability, low latency

**Causal Consistency:**
- Preserves causally-related operation order
- If A causes B, all nodes see A before B
- Implementation: Vector clocks track dependencies
- Balance: Stronger than eventual, weaker than strong

**Practical Advice:**
"Most business systems need eventual consistency
for scale. Financial/payment systems need strong
consistency. I choose based on domain requirements."

---

## 3. Consensus Algorithms

**Raft Algorithm:**
- Purpose: Leader election + log replication
- Advantage: Easier to understand than Paxos
- Used in: etcd, Consul, Kafka KRaft mode

**Raft Roles:**
- Leader: Receives all client writes
- Follower: Replicates leader's log entries
- Candidate: Runs for election when leader fails

**Raft Process:**
1. Leader receives write request
2. Appends entry to local log
3. Replicates to follower nodes
4. Commits when majority acknowledge
5. Notifies followers of committed entries

**Leader Election:**
- Random timeout prevents split vote
- Node becomes candidate after timeout
- Requests votes from other nodes
- Majority vote ensures single leader
- Term number prevents old leaders

**Split Brain Prevention:**
- Majority quorum required for decisions
- Leader steps down if loses majority
- Fence old leader before electing new one
- Prevents two leaders accepting writes

**Paxos Algorithm:**
- Theoretical foundation for consensus
- More complex than Raft
- Multi-Paxos used in production systems
- Google Chubby, ZooKeeper use variants

**Paxos Roles:**
- Proposer: Suggests values to accept
- Acceptor: Votes on proposed values
- Learner: Learns decided values

**Paxos Flow:**
1. Proposer sends prepare request
2. Acceptors promise not to accept lower numbers
3. Proposer sends accept request with value
4. Acceptors accept if no higher promise
5. Majority agreement required for decision

**Practical Experience:**
"I don't implement consensus from scratch.
I use etcd for service discovery/config.
Kafka KRaft for broker coordination.
Understanding Raft helps debug leader election
failures and partition recovery scenarios."

---

## 4. Distributed Transactions

**2PC (Two-Phase Commit):**
Phase 1 - Prepare:
- Coordinator asks all participants to prepare
- Participants lock resources, vote yes/no
- If any vote no, transaction aborts

Phase 2 - Commit/Abort:
- If all voted yes: coordinator sends commit
- If any voted no: coordinator sends abort
- Participants release locks after completion

**2PC Problems:**
- Blocking: Coordinator failure leaves participants
locked indefinitely waiting for decision
- Performance: Synchronous, holds locks long time
- Fragile: Network issues cause cascading failures
- Not suitable for microservices architecture

**Saga Pattern:**
Sequence of local transactions with compensating
actions for rollback on failure.

**Orchestrated Saga:**
- Central coordinator controls flow
- Calls each service step-by-step
- On failure: calls compensating actions backward
- Easier to debug, monitor, and maintain state
- Example: Order processing workflow

**Choreographed Saga:**
- Each service emits domain events
- Next service listens and reacts to events
- On failure: emits compensating events
- More decoupled, no central coordinator
- Harder to trace overall transaction flow

**Outbox Pattern:**
Solves dual-write problem (can't atomically write
to database AND publish to message queue).

**How it works:**
1. Write business data to main table
2. Write event message to outbox table
3. Both in same local transaction (atomic)
4. Separate process polls outbox table
5. Publishes events to message queue
6. Deletes published messages from outbox

**Implementation:**
- Transactional outbox table in same database
- CDC (Change Data Capture) with Debezium
- Reads database transaction log directly
- Guarantees at-least-once delivery

**Practical Experience:**
"I use Saga orchestration for order processing:
create order → reserve inventory → process payment
→ ship order. If payment fails, compensate:
release inventory, cancel order.

I never use 2PC across services — too brittle.
For reliable event publishing, I use outbox pattern
with Debezium CDC to read transaction logs."

---

## 5. Message Queues & Event Streaming

**Apache Kafka:**
Distributed event streaming platform.

**Core Concepts:**
- Topics: Categories for messages
- Partitions: Parallelism within topics
- Consumer Groups: Parallel processing units
- Brokers: Kafka server instances
- ZooKeeper/KRaft: Cluster coordination

**Kafka Ordering:**
- Per-partition ordering guaranteed
- Cross-partition ordering NOT guaranteed
- Producer can specify partition key
- Same key always goes to same partition

**Exactly-Once Semantics:**
- Idempotent producer: Prevents duplicate sends
- Transactional consumer: Atomic read-process-write
- Log compaction: Keeps latest value per key
- Requires careful configuration

**Consumer Groups:**
- Each consumer gets subset of partitions
- Enables horizontal scaling
- Rebalancing when consumers join/leave
- Offset tracking for replay capability

**Message Replay:**
- Consumers can reset offset to earlier position
- Critical for bug fixes and reprocessing
- Retention policy determines replay window
- Default: 7 days configurable

**RabbitMQ:**
Message broker with flexible routing.

**Core Concepts:**
- Exchanges: Route messages to queues
- Queues: Store messages until consumed
- Bindings: Rules connecting exchanges to queues
- Routing keys: Determine message destination

**Message Acknowledgment:**
- Consumer acks after successful processing
- Unacked messages requeued on connection loss
- Manual ack gives control over retry logic
- Auto ack risks message loss on crash

**Dead Letter Queues (DLQ):**
- Failed messages routed to separate queue
- Allows analysis of processing failures
- Can set TTL and max retry count
- Essential for debugging production issues

**Advanced Features:**
- Priority queues: Process important first
- Delayed messages: Schedule future delivery
- Message TTL: Auto-expire old messages
- Queue mirroring: High availability

**Kafka vs RabbitMQ:**

| Feature | Kafka | RabbitMQ |
|---------|-------|----------|
| Throughput | Very high | Moderate |
| Replay | Excellent | Limited |
| Routing | Simple | Flexible |
| Per-message ack | No | Yes |
| Use case | Event streaming | Task queues |

**Practical Experience:**
"I use Kafka for event streaming: order events,
tracking updates. High throughput, replay capability
critical for debugging.

RabbitMQ for task queues: send notifications,
process refunds. Routing flexibility, DLQ for
failure analysis.

Never use Kafka as task queue — lacks per-message
acknowledgment and complex routing."

---

## 6. Service Discovery & Load Balancing

**Service Discovery Problem:**
How do services find each other in dynamic
environments where instances scale up/down?

**Client-Side Discovery:**
- Service queries registry directly
- Examples: Eureka, Consul client libraries
- Client chooses instance using load balancing
- Pros: Simple, no extra hop
- Cons: Client must implement LB logic

**Server-Side Discovery:**
- Load balancer queries registry
- Examples: nginx, Envoy, AWS ALB
- Client sends request to load balancer
- LB routes to healthy instance
- Pros: Centralized, language agnostic
- Cons: Extra network hop, LB bottleneck

**DNS-Based Discovery:**
- Services registered via DNS records
- Simple but slow to propagate changes
- TTL issues cause stale routing
- Not suitable for rapid scaling
- Good for stable, infrequent changes

**Load Balancing Algorithms:**

**Round-Robin:**
- Distributes requests evenly across servers
- Simple implementation, fair distribution
- No awareness of server capacity/load
- May overload slower servers

**Weighted Round-Robin:**
- Respects different server capacities
- Assign weights based on CPU/memory
- More powerful servers get more traffic
- Requires manual weight configuration

**Least Connections:**
- Routes to server with fewest active connections
- Better for varied request sizes/durations
- Automatically adapts to server performance
- Requires tracking connection counts

**Consistent Hashing:**
- Routes by request key (user ID, order ID)
- Same key always hits same server
- Critical for cache locality
- Minimal redistribution when nodes change
- Used in: Memcached, Cassandra, DynamoDB

**Random Selection:**
- Randomly picks healthy instance
- Surprisingly effective for homogeneous servers
- Simple implementation, low overhead
- May cause uneven distribution short-term

**Health Checks:**

**Active Health Checks:**
- Load balancer periodically probes instances
- HTTP endpoint, TCP connection, custom script
- Marks unhealthy if probe fails
- Configurable interval and threshold

**Passive Health Checks:**
- Monitors actual request responses
- Marks down after consecutive failures
- Faster detection of real problems
- Combined with active checks for best results

**Circuit Breaker Integration:**
- Opens circuit after health check failures
- Prevents sending traffic to unhealthy instances
- Half-open state tests recovery
- Automatic reintegration when healthy

---

## 7. Fault Tolerance & Resilience

**Failure Types in Distributed Systems:**

**Crash Failures:**
- Server stops responding completely
- Detected via health checks/timeouts
- Recovery: Restart, failover to replica

**Omission Failures:**
- Messages lost or not delivered
- Caused by network issues, buffer overflow
- Mitigation: Retry, acknowledgment, idempotency

**Timing Failures:**
- Operations exceed expected time bounds
- Slow responses, timeouts
- Mitigation: Timeout configuration, backpressure

**Byzantine Failures:**
- Arbitrary/malicious behavior
- Hardest to handle, rare in trusted networks
- Mitigation: Consensus algorithms, validation

**Timeout Strategies:**

**Exponential Backoff:**
- Initial delay: 1 second
- Subsequent: 2s, 4s, 8s, 16s...
- Prevents overwhelming recovering service
- Cap maximum delay (e.g., 60 seconds)

**Jitter (Random Variation):**
- Add random delay to backoff
- Prevents thundering herd problem
- Formula: delay = base * 2^attempt + random(0, jitter)
- Critical for large-scale retries

**Retry Best Practices:**
- Maximum 3 retries typically sufficient
- Exponential backoff + jitter mandatory
- Retry only transient errors (5xx, timeout)
- Never retry client errors (4xx)
- Implement idempotency for safety

**Circuit Breaker Pattern:**

**States:**
- Closed: Normal operation, requests pass through
- Open: All requests rejected immediately
- Half-Open: Trial requests test recovery

**Configuration:**
- Failure threshold: 50% failures in window
- Time window: 10 seconds sliding window
- Recovery timeout: 30 seconds before half-open
- Success threshold: 3 successes to close

**Resilience4j in Spring Boot:**
```java
@CircuitBreaker(name = "paymentService")
@Retry(name = "paymentService", maxAttempts = 3)
@RateLimiter(name = "paymentService")
@Bulkhead(name = "paymentService")
public PaymentResponse processPayment(Order order) {
    // Business logic here
}
```

**Bulkhead Pattern:**
- Limits concurrent calls per downstream service
- Thread pool isolation or semaphore-based
- Prevents cascade failure across services
- If payment slows, search unaffected

**Configuration Example:**
- Payment service: 20 threads max
- Search service: 50 threads max
- Independent thread pools prevent interference

**Rate Limiting:**

**Token Bucket:**
- Tokens added at fixed rate
- Each request consumes one token
- Allows burst up to bucket size
- Smooth rate limiting overall

**Fixed Window:**
- Count requests in time window
- Reject when limit exceeded
- Simple implementation
- Boundary burst issue (double at edges)

**Sliding Window:**
- Tracks requests in rolling window
- Smoother than fixed window
- More memory/computation required
- Better user experience

**Graceful Degradation:**
- Return cached/stale data instead of failing
- Disable non-critical features via feature flags
- Show simplified UI during high load
- Better to serve something than nothing

**Practical Experience:**
"I configure resilience per downstream criticality.

Payment service (critical):
- Aggressive circuit breaker: 5% failure → open
- Retry 3 times with exponential backoff
- Dedicated thread pool (bulkhead)

Recommendation service (non-critical):
- Lenient circuit breaker: 50% failure → open
- No retry, return cached defaults
- Shared thread pool acceptable

Bulkhead prevents cascade failures. Payment thread
pool isolated from search thread pool. One slow
downstream doesn't affect others."

---

## 8. Observability in Distributed Systems

**Three Pillars of Observability:**

**1. Metrics (Time-Series Data):**
- Numerical measurements over time
- Request rate, error rate, latency percentiles
- Resource utilization: CPU, memory, disk, network
- Tool: Prometheus + Grafana

**2. Tracing (Request Flow):**
- Tracks request across service boundaries
- Each request gets unique trace ID
- Each operation creates span with timing
- Tool: Jaeger, Zipkin, OpenTelemetry

**3. Logging (Event Records):**
- Discrete events with timestamps
- Errors, warnings, info messages
- Structured format (JSON) preferred
- Tool: ELK Stack, Loki, Splunk

**Metrics Collection:**

**Key Metrics to Track:**
- Request rate (requests/second)
- Error rate (errors/second, error percentage)
- Latency: p50, p95, p99 percentiles
- Saturation: CPU, memory, thread pool usage
- Custom business metrics (orders processed)

**Prometheus Integration:**
```java
@RestController
public class OrderController {
    private final Counter orderCounter;
    private final Timer orderTimer;
    
    public OrderController(MeterRegistry registry) {
        orderCounter = Counter.builder("orders.total")
            .tag("status", "success")
            .register(registry);
        
        orderTimer = Timer.builder("order.processing.time")
            .register(registry);
    }
}
```

**Distributed Tracing:**

**Trace ID Propagation:**
- Generated at request entry point
- Passed via HTTP headers: X-Trace-ID
- Included in message metadata for async
- Stored in MDC for log correlation

**Span Structure:**
- Span ID: Unique identifier for operation
- Parent Span ID: Links to calling operation
- Trace ID: Groups all spans in request
- Timing: Start time, duration, status

**OpenTelemetry Standard:**
- Vendor-neutral tracing API
- Auto-instrumentation for common frameworks
- Context propagation built-in
- Export to Jaeger, Zipkin, commercial tools

**Structured Logging:**

**JSON Format Example:**
```json
{
  "timestamp": "2024-01-15T10:30:00Z",
  "level": "ERROR",
  "traceId": "abc123def456",
  "spanId": "span789",
  "userId": "user123",
  "service": "order-service",
  "message": "Payment processing failed",
  "error": "TimeoutException",
  "duration_ms": 5000
}
```

**MDC (Mapped Diagnostic Context):**
- Thread-local storage for context
- Automatically included in log output
- Set traceId/spanId at request start
- Clean up after request completes

**Correlation Strategy:**

**Investigation Flow:**
1. See spike in p99 latency on Grafana
2. Identify which service contributes most
3. Find slow traces in Jaeger for that service
4. Identify slowest span in the trace
5. Check logs filtered by traceId and spanId
6. Find root cause from error messages

**Dashboard Design:**
- Overview: Request rate, error rate, latency
- Per-service: Detailed metrics and traces
- Business: Orders, payments, conversions
- Infrastructure: CPU, memory, disk, network

**Practical Experience:**
"I implement full observability stack:

Metrics: Micrometer with custom tags
(service name, endpoint, HTTP status).
Dashboards in Grafana with alerting rules.

Tracing: OpenTelemetry auto-instrumentation.
Span propagation via HTTP headers and Kafka
message headers. Visualization in Jaeger.

Logging: Structured JSON format. traceId and
spanId in MDC for automatic inclusion.
Aggregation in ELK stack with Kibana dashboards.

When p99 latency spikes, my investigation flow:
1. Check Grafana dashboard → identify service
2. Find slow traces in Jaeger → find slow span
3. Correlate to error logs via traceId
4. Root cause identified in 5 minutes

This 3-pillar approach resolves 90% of
production issues quickly."

---

## 9. Data Replication & Partitioning

**Replication Strategies:**

**Single-Leader Replication:**
- All writes go to primary (leader) node
- Reads can go to leader or replicas
- Leader replicates changes to followers
- Examples: MySQL, PostgreSQL, Redis

**Synchronous Replication:**
- Leader waits for replica acknowledgment
- Guarantees strong consistency
- Higher write latency
- Risk: Leader blocked if replica down

**Asynchronous Replication:**
- Leader doesn't wait for replicas
- Lower write latency, better throughput
- Risk: Replica lag, potential data loss
- Most common in production systems

**Multi-Leader Replication:**
- Writes accepted by multiple nodes
- Conflict resolution required
- Methods: Last-write-wins, vector clocks
- Examples: CouchDB, PostgreSQL BDR
- Use case: Multi-region writes

**Leaderless Replication:**
- Any node accepts writes
- Read repair fixes inconsistencies
- Anti-entropy process syncs replicas
- Examples: Cassandra, DynamoDB, Riak
- Tunable consistency via quorum settings

**Partitioning (Sharding):**

**Hash-Based Partitioning:**
- Partition = hash(key) % number_of_partitions
- Even distribution across nodes
- Hot spots unlikely with good hash function
- Problem: Rebalancing expensive when adding nodes
- Solution: Consistent hashing minimizes movement

**Range-Based Partitioning:**
- Keys sorted, ranges assigned to nodes
- Node 1: keys 0-1000, Node 2: 1001-2000
- Good for range queries (WHERE key > X)
- Problem: Hot spots if data not uniform
- Example: Time-series data by date ranges

**Directory-Based Partitioning:**
- Lookup table maps keys to partitions
- Flexible, can move data without client changes
- Problem: Lookup table becomes bottleneck
- Must be highly available and consistent
- Example: MongoDB config servers

**Consistent Hashing:**
- Nodes placed on hash ring (0 to 2^128)
- Key hashed, assigned to nearest node clockwise
- Adding/removing nodes affects minimal keys
- Virtual nodes improve distribution balance
- Used in: DynamoDB, Cassandra, CDNs

**Rebalancing Strategies:**

**Automatic Rebalancing:**
- System detects imbalance automatically
- Moves data between nodes gradually
- Cassandra does this continuously
- Pros: Hands-off, adaptive
- Cons: Background overhead, unpredictable

**Manual Rebalancing:**
- Planned resharding during maintenance
- Control timing and impact
- Requires careful planning and testing
- Pros: Predictable, controlled
- Cons: Downtime or complexity

**Read Repair:**
- Detect inconsistency during read operations
- Fetch from multiple replicas
- Return newest version to client
- Update stale replicas in background
- Leaderless databases use this heavily

**Anti-Entropy:**
- Background process compares replicas
- Merkle trees identify differences efficiently
- Sync only changed data, not entire dataset
- Runs periodically (every few hours)
- Ensures eventual consistency

---

## 10. Common Interview Questions & Model Answers

### Q1: How do you handle partial failures?

**Key Concepts:**
Partial failure means some components fail while
others continue working. Network issues, timeouts,
crashes happen constantly in distributed systems.

**Model Answer:**
"I design for partial failures as the normal case,
not the exception. My strategy has five layers:

1. Timeout: Set appropriate timeouts per operation.
Database query: 5s. External API: 10s. Prevents
indefinite blocking.

2. Retry: For transient failures, retry with
exponential backoff and jitter. Max 3 attempts.
Only retry idempotent operations or 5xx errors.

3. Circuit Breaker: Stop calling failing service
after threshold (e.g., 50% failures in 10s).
Prevents wasting resources on doomed requests.

4. Fallback: Provide alternative behavior. Return
cached data, default values, or simplified response.
Better degraded service than complete failure.

5. Graceful Degradation: Disable non-critical
features under load. Keep core functionality
working even if nice-to-haves are unavailable.

Example: Payment service timeout → retry 2x →
circuit opens → return 'payment delayed, try
later' with order still created. User can retry
payment separately."

### Q2: Explain the Saga pattern.

**Key Concepts:**
Saga manages distributed transactions across
multiple services without 2PC locking.

**Model Answer:**
"Saga is a sequence of local transactions where
each step has a compensating action for rollback.

Two implementation approaches:

Orchestration: Central coordinator calls each
service sequentially. On failure, coordinator
calls compensating actions in reverse order.
Easier to debug, monitor transaction state,
and add new steps. I prefer this for complex
workflows.

Choreography: Each service emits domain events.
Next service listens and reacts. On failure,
compensating events trigger rollbacks. More
decoupled but harder to trace overall flow.

Example: Order processing saga:
1. Create order (compensate: cancel order)
2. Reserve inventory (compensate: release stock)
3. Process payment (compensate: refund payment)
4. Ship order (compensate: cancel shipment)

If step 3 fails, execute compensations:
refund payment → release inventory → cancel order.

For reliable event publishing between steps,
I use the outbox pattern with Debezium CDC
to avoid the dual-write problem."

### Q3: How do you ensure message delivery reliability?

**Key Concepts:**
Message systems provide at-least-once, at-most-
once, or exactly-once guarantees.

**Model Answer:**
"I design for at-least-once delivery with
idempotent consumers to achieve effectively
exactly-once processing.

Strategy:

1. Idempotent Consumers: Design message handlers
to be idempotent. Use unique message IDs stored
in database with unique constraint. Duplicate
messages detected and skipped.

2. Outbox Pattern: Write business data and event
message in same database transaction. Separate
process publishes to message queue. Solves
dual-write problem atomically.

3. Dead Letter Queue: Failed messages after max
retries routed to DLQ. Manual inspection and
reprocessing. Never lose messages silently.

4. Acknowledgment: Consumer acks only after
successful processing. Unacked messages requeued
on consumer crash. Manual ack gives control.

5. Transactional Boundaries: For Kafka, use
transactional consumers with read-process-write
in single transaction. Prevents partial updates.

Example: Order event processing:
- Check if orderId already processed (idempotency)
- If new: update database, emit next event
- If duplicate: skip, return success
- On error: retry 3x, then DLQ

This handles crashes, duplicates, and failures
while maintaining data consistency."

### Q4: How do you handle distributed locking?

**Key Concepts:**
Distributed locks coordinate access to shared
resources across multiple nodes.

**Model Answer:**
"Distributed locking is complex and often
unnecessary. I first ask: can we redesign to
avoid locking entirely?

If locking is truly needed, options:

Redis RedLock:
- Acquire lock on majority of Redis instances
- Fast, simple implementation
- Caveats: Clock skew issues, fencing tokens
needed. Not safe for critical operations without
additional safeguards. I use for non-critical
coordination like cache invalidation.

ZooKeeper Ephemeral Nodes:
- Create ephemeral node as lock
- Automatic cleanup on session expiry
- Strong consistency via ZAB protocol
- Slower than Redis but safer. I use for
leader election and critical coordination.

Database Advisory Locks:
- PostgreSQL pg_advisory_lock()
- Tied to database transaction
- Simple but doesn't scale well
- Good for single-instance applications.

Lease-Based Locking:
- Acquire lease with TTL (e.g., 10 seconds)
- Renew lease while holding lock
- Automatic expiry if holder crashes
- Works with any storage system.

Best Practice:
'I minimize distributed locking by design:
- Use partitioning to isolate data
- Optimistic locking with version numbers
- Eventual consistency where possible
- Only lock when absolutely necessary'

For critical sections, I prefer ZooKeeper or
etcd with proper fencing tokens to prevent
split-brain issues."

### Q5: What is the dual-write problem?

**Key Concepts:**
Cannot atomically write to database and publish
to message queue in single operation.

**Model Answer:**
"The dual-write problem occurs when you need to
update a database and publish an event, but these
are two separate systems with no atomic operation.

Problem scenario:
1. Write order to database ✓
2. Publish order-created event ✗ (fails)
Result: Database updated but downstream services
never notified. Data inconsistency.

Reverse scenario:
1. Publish event ✓
2. Write to database ✗ (fails)
Result: Event published but data not persisted.
Downstream services process non-existent order.

Solutions:

Outbox Pattern (preferred):
- Write business data to main table
- Write event to outbox table (same transaction)
- Atomic: both succeed or both fail
- Separate process polls outbox, publishes events
- Delete published messages from outbox
- Guarantees at-least-once delivery

Debezium CDC:
- Reads database transaction log directly
- Captures all changes automatically
- No application code changes needed
- Publishes changes as events
- Handles outbox pattern elegantly

Transactional Messaging:
- Some message brokers support transactions
- Kafka transactions allow atomic writes
- Still requires careful error handling
- Not all brokers support this

I always use outbox pattern with Debezium.
It's reliable, doesn't block the main transaction,
and handles retries automatically."

### Q6: How do you handle clock skew?

**Key Concepts:**
Physical clocks drift across machines. Cannot
rely on timestamps for ordering events.

**Model Answer:**
"I avoid relying on physical timestamps for
ordering in distributed systems. Clock skew
makes timestamp-based ordering unreliable.

Approaches:

Logical Clocks (Lamport Clocks):
- Counter incremented on each event
- Provides partial ordering
- If A happened before B, clock(A) < clock(B)
- Doesn't capture causality fully

Vector Clocks:
- Array of counters, one per node
- Captures causal relationships precisely
- Can detect concurrent events
- Used in DynamoDB, Riak for conflict detection

TrueTime API (Google Spanner):
- Specialized hardware clocks
- Provides bounded uncertainty window
- Enables external consistency
- Not practical for most systems

Practical Strategies:

1. Avoid timestamp-based ordering:
Use logical ordering via sequence numbers,
version vectors, or causal dependencies.

2. Use server-side timestamps:
If timestamps needed, generate on server side
with synchronized NTP. Better than client clocks.

3. Accept eventual consistency:
For many use cases, exact ordering doesn't matter.
Converge to same state eventually.

4. Hybrid Logical Clocks:
Combine physical time with logical counters.
Used in CockroachDB for snapshot isolation.

Example: In my order processing system, I use
monotonically increasing sequence numbers from
database for ordering. Never rely on createdAt
timestamps for business logic decisions."

### Q7: Explain leader election in distributed systems.

**Key Concepts:**
Leader election selects single coordinator from
multiple candidates in fault-tolerant way.

**Model Answer:**
"Leader election ensures single leader for
coordination tasks like write serialization,
job scheduling, or configuration management.

Approaches:

Raft Election:
- Nodes have random election timeouts
- Timeout expires → become candidate
- Request votes from other nodes
- Majority vote wins election
- Term numbers prevent old leaders
- Split vote prevented by random timeouts

ZooKeeper Ephemeral Nodes:
- Create ephemeral znode as leadership claim
- First to create becomes leader
- Session expiry removes node automatically
- Other nodes watch for deletion
- Watcher triggers new election
- Simple but requires ZooKeeper dependency

Lease-Based Election:
- Acquire lease from distributed store (etcd)
- Lease has TTL (e.g., 10 seconds)
- Leader must renew lease periodically
- If leader crashes, lease expires
- Other nodes compete for new lease
- Works with any KV store with TTL

Split Brain Prevention:
- Require majority quorum for election
- Fence old leader before activating new one
- Use fencing tokens to invalidate old leader
- Prevent two leaders accepting writes simultaneously

My Experience:
'I use etcd for leader election in microservices.
Each instance tries to acquire lease. Winner
becomes leader, runs scheduled jobs. If leader
crashes, lease expires, new election happens
automatically.

For Kafka, KRaft mode uses Raft internally for
broker coordination. I don't implement election
from scratch — use battle-tested libraries.'"

### Q8: How do you design for 99.99% availability?

**Key Concepts:**
99.99% availability = max 52 minutes downtime/year.
Requires redundancy, fast failover, automation.

**Model Answer:**
"Achieving 99.99% availability (four nines)
requires systematic approach across all layers.

Strategies:

1. Redundancy (Eliminate Single Points of Failure):
- Multi-region deployment (active-active or
active-passive)
- Multiple instances per service (min 3)
- Database replication across regions
- Load balancers in multiple AZs

2. Automated Failover:
- Health checks detect failures quickly (< 30s)
- Auto-scaling groups replace unhealthy instances
- Database failover to standby replica
- DNS failover for region-level outages
- Test failover regularly (chaos engineering)

3. Circuit Breakers & Bulkheads:
- Prevent cascade failures across services
- Isolate failures to affected service only
- Graceful degradation instead of total outage
- Rate limiting protects from overload

4. Zero-Downtime Deployments:
- Blue-green deployments for instant rollback
- Canary releases to catch issues early
- Rolling updates with health check gates
- Database migrations backward compatible

5. Monitoring & Alerting:
- Real-time visibility into system health
- Automated incident response runbooks
- On-call rotation with clear escalation
- Post-mortem culture for continuous improvement

6. Capacity Planning:
- Auto-scaling based on demand patterns
- Load testing to find breaking points
- Headroom for traffic spikes (2x normal load)
- Resource quotas prevent exhaustion

Realistic Expectations:
'99.99% is extremely ambitious. I focus on:
- Eliminating known single points of failure
- Fast detection and recovery (< 5 minutes)
- Graceful degradation under partial failure
- Regular disaster recovery testing

Most systems achieve 99.9% (three nines) with
good practices. Four nines requires significant
investment in infrastructure and automation.'"

### Q9: What is Change Data Capture (CDC)?

**Key Concepts:**
CDC captures database changes as events for
downstream processing.

**Model Answer:**
"Change Data Capture reads database transaction
log and publishes changes as events. Enables
real-time data synchronization without modifying
application code.

How it works:
1. CDC tool connects to database
2. Reads transaction log (binlog, WAL, etc.)
3. Parses committed transactions
4. Publishes change events to message queue
5. Downstream services consume events

Tools:
- Debezium: Open-source, supports MySQL,
PostgreSQL, MongoDB, SQL Server
- AWS DMS: Managed CDC service
- Oracle GoldenGate: Enterprise solution

Use Cases:

Outbox Pattern:
- Application writes to outbox table
- Debezium captures insert event
- Publishes to Kafka automatically
- Reliable event sourcing without dual-write

Data Synchronization:
- Sync data to search index (Elasticsearch)
- Replicate to data warehouse (Snowflake)
- Cache invalidation (Redis)
- Real-time analytics pipelines

Audit Logging:
- Capture all data changes automatically
- Compliance requirements (GDPR, SOX)
- Historical data reconstruction
- Debugging data corruption

Benefits:
- No application code changes needed
- Captures all changes including bulk updates
- Decouples producers from consumers
- Reliable: reads from transaction log

Challenges:
- Schema changes require CDC config updates
- Large transactions may cause lag
- Need to handle delete events carefully
- Monitoring CDC pipeline health

My Experience:
'I use Debezium extensively for outbox pattern
and data synchronization. It's reliable, handles
schema evolution reasonably well, and integrates
natively with Kafka Connect. Critical for
building event-driven architectures.'"

### Q10: How do you prevent cascade failures?

**Key Concepts:**
Cascade failure: One service failure triggers
failures in dependent services, spreading like
domino effect.

**Model Answer:**
"Cascade failures are the biggest threat in
microservices. One slow service can take down
entire system. Prevention requires defense in depth.

Strategies:

1. Bulkhead Pattern (Thread Pool Isolation):
- Separate thread pools per downstream service
- Payment service: 20 threads max
- Search service: 50 threads max
- If payment slows, search unaffected
- Prevents resource exhaustion spread

2. Circuit Breaker:
- Monitor failure rate per downstream service
- Open circuit after threshold (e.g., 50% failures)
- Reject requests immediately instead of waiting
- Half-open state tests recovery
- Stops calling failing service

3. Rate Limiting:
- Protect services from traffic spikes
- Token bucket or sliding window algorithms
- Reject excess requests with 429 status
- Prevents overload during incidents

4. Backpressure:
- Signal upstream when overwhelmed
- Reactive streams with bounded buffers
- Drop non-critical requests under load
- Prevents queue buildup and OOM errors

5. Timeout Configuration:
- Set appropriate timeouts per operation
- Database: 5s, External API: 10s
- Prevents thread pool exhaustion from hangs
- Fail fast instead of waiting indefinitely

6. Graceful Degradation:
- Return cached/stale data when service down
- Disable non-critical features
- Simplified responses under load
- Better degraded than broken

7. Asynchronous Communication:
- Use message queues for non-critical paths
- Decouple services temporally
- Buffer absorbs traffic spikes
- Retry failed messages later

Architecture Design:
'Design service dependencies as DAG (Directed
Acyclic Graph). Avoid circular dependencies.
Critical path should have minimal dependencies.
Non-critical features loaded asynchronously.

Monitoring:
Track dependency health dashboards. Alert on
circuit breaker state changes. Quick detection
prevents cascade spread.

Real Example:
Payment service slowed due to database lock.
Without bulkhead, all threads blocked. Search,
recommendation, catalog all affected. System-wide
outage.

With bulkhead + circuit breaker:
Payment threads isolated. Circuit opened after
10s. Search/recommendation continued normally.
Only payment affected. Degraded but functional.'"

---

## 11. Final Checklist

Review these before your interview:

- [ ] Understand CAP theorem trade-offs
  Know when to choose CP vs AP for scenarios

- [ ] Explain Raft consensus algorithm
  Why preferred over Paxos? Leader election?

- [ ] Master Saga pattern
  Orchestration vs choreography differences
  Compensating transactions design

- [ ] Understand outbox pattern deeply
  Why solves dual-write problem?
  Debezium CDC integration

- [ ] Know 3+ resilience patterns
  Circuit breaker, retry, bulkhead, rate limiting
  When to apply each pattern

- [ ] Explain consistent hashing
  How minimizes rebalancing impact?
  Virtual nodes for balance

- [ ] Understand distributed tracing
  Trace ID and span ID propagation
  Correlation with metrics and logs

- [ ] Know replication strategies
  Single-leader, multi-leader, leaderless
  Trade-offs for each approach

- [ ] Discuss trade-offs for every decision
  No perfect solution, only compromises
  Show senior-level thinking

- [ ] Practice system design end-to-end
  Design distributed system with 5+ services
  Address scalability, reliability, consistency

**Key Mindset:**
Show practical experience, not just theory.
Discuss real scenarios you've handled.
Acknowledge complexity and trade-offs.
Demonstrate learning from production incidents.

Good luck with your interview!
