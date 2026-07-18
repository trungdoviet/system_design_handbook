# Database & Data Modeling Interview Prep Guide

## 1. SQL Deep Dive

### JOIN Types
- INNER JOIN: Returns matching rows from both tables
- LEFT JOIN: All left table rows + matching right rows
- RIGHT JOIN: All right table rows + matching left rows
- FULL OUTER JOIN: All rows from both tables
- CROSS JOIN: Cartesian product of both tables
- Know when each join type is appropriate for your query

### Subqueries vs CTEs
- CTEs (Common Table Expressions) are more readable
- CTEs can be recursive for hierarchical data
- Prefer CTEs for complex multi-step queries
- Subqueries work but can be hard to read

### Window Functions
- ROW_NUMBER(): Unique row number per partition
- RANK(): Rank with gaps for ties
- DENSE_RANK(): Rank without gaps for ties
- LAG(): Access previous row value
- LEAD(): Access next row value
- SUM OVER(): Running totals and aggregates
- Essential for analytics and reporting queries

### Index Types
- B-tree: Default, supports range queries efficiently
- Hash: Point queries only, no range support
- Composite: Multi-column indexes, order matters
- Covering: Includes all query columns needed
- Partial: Conditional index on subset of rows
- Unique: Enforces column uniqueness constraint

### Index Design Principles
- Put most selective column first in composite index
- Avoid indexing low-cardinality columns alone
- Consider query patterns when designing indexes
- Monitor index usage and remove unused indexes
- Balance read performance vs write overhead

### Query Optimization Techniques
- Use EXPLAIN ANALYZE to check execution plans
- Avoid SELECT * - specify needed columns only
- Use EXISTS instead of IN for subqueries
- Avoid N+1 query problems with proper joins
- Add missing indexes identified by slow queries

### Slow Query Diagnosis Process
1. Check execution plan with EXPLAIN ANALYZE
2. Identify full table scans or inefficient joins
3. Add missing indexes or rewrite query
4. Verify improvement with new execution plan

## 2. Database Scaling Strategies

### Read Replicas
- Scale reads by adding multiple replica instances
- Write operations still go to primary instance
- Replication lag causes potential stale reads
- Route read-only queries to replicas

### Sharding Strategies
- Hash-based: Even distribution across shards
- Range-based: Good for range queries on shard key
- Directory-based: Flexible routing, adds complexity
- Choose shard key based on access patterns

### Connection Pooling
- Use HikariCP for Spring Boot applications
- Pool size formula: (core_count * 2) + disk_spindles
- Monitor connection wait times and pool usage
- Tune max-pool-size based on concurrent load

### Vertical vs Horizontal Scaling
- Vertical: More CPU/memory, simple but limited
- Horizontal: More machines, complex but unlimited
- Vertical has single point of failure risk
- Horizontal requires sharding or replication

### Caching Layers
- Application cache: Caffeine with 5min TTL
- Distributed cache: Redis with 1hr TTL
- Database buffer pool for frequently accessed data
- Implement cache invalidation strategies

## 3. Transaction & Concurrency

### Isolation Levels
- READ_UNCOMMITTED: Allows dirty reads
- READ_COMMITTED: Prevents dirty reads
- REPEATABLE_READ: Prevents non-repeatable reads
- SERIALIZABLE: No anomalies, slowest performance
- Choose level based on consistency requirements

### MVCC (Multi-Version Concurrency Control)
- PostgreSQL and MySQL InnoDB use MVCC
- Readers see snapshot, don't block writers
- Writers create new row versions
- Improves concurrent read/write performance

### Optimistic Locking
- Add version column to table
- Check version in UPDATE WHERE clause
- Fail if version changed, retry operation
- Good for low-conflict read-heavy scenarios

### Pessimistic Locking
- Use SELECT FOR UPDATE to lock rows
- Lock held during entire transaction
- Other transactions wait for lock release
- Good for high-conflict write scenarios

### Deadlock Prevention
- Database detects circular waits automatically
- Aborts one transaction to break deadlock
- Always acquire locks in consistent order
- Keep transactions short to reduce risk

### Practical Approach
- Use optimistic locking for most operations
- Add version column: UPDATE WHERE version = ?
- Use pessimistic locking for payment operations
- Acquire locks in consistent order always

## 4. NoSQL Decision Framework

### Key-Value Stores (Redis, DynamoDB)
- Simple lookups by key
- Caching and session storage
- No complex query capabilities
- Extremely fast for point queries

### Document Stores (MongoDB)
- Flexible schema for evolving data
- Nested objects supported naturally
- Good for content management systems
- Less query flexibility than SQL

### Column Stores (Cassandra)
- Wide rows for time-series data
- High write throughput capability
- Eventual consistency model
- Good for analytics and logging

### Graph Databases (Neo4j)
- Relationship-heavy data modeling
- Social networks and recommendations
- Complex graph traversals efficient
- Not suitable for simple CRUD

### Decision Framework
- Start with SQL for most applications
- Move to NoSQL with clear justification
- Consider schema flexibility needs
- Evaluate specific query patterns required

## 5. Data Modeling Best Practices

### Normalization vs Denormalization
- Normalize to 3NF for data consistency
- Denormalize for read performance gains
- Trade-off: write complexity vs read speed
- Consider join costs in denormalization

### When to Denormalize
- Read-heavy tables with frequent access
- Tables frequently joined together
- Analytics and reporting queries
- Dashboard and summary views

### When to Normalize
- Write-heavy systems with many updates
- Data integrity is critical requirement
- Regulatory compliance requires it
- Complex relationships between entities

### Soft Delete vs Hard Delete
- Soft delete: is_deleted flag for audit trail
- Hard delete: permanent removal of data
- Use soft delete for business records
- Use hard delete for GDPR compliance

### Temporal Data Management
- Add created_at and updated_at to every table
- Use event log for detailed audit trails
- Separate audit table for historical changes
- Track who made changes with user_id

### Practical Approach
- Start normalized (3NF) for correctness
- Denormalize specific read-heavy paths
- Use materialized views for summaries
- Cache denormalized data for dashboards

## 6. Migration & Schema Evolution

### Flyway vs Liquibase
- Flyway: Simpler, SQL scripts, version-based
- Liquibase: More flexible, XML/YAML/JSON
- Liquibase has better rollback support
- Choose based on team preference and needs

### Migration Best Practices
- Never modify existing migration scripts
- Always add new migrations for changes
- Test migrations on staging environment
- Keep migrations small and focused

### Zero-Downtime Migration Strategy
1. Add new column as nullable
2. Deploy code writing to both columns
3. Backfill data from old to new column
4. Deploy code reading from new column
5. Remove old column in final migration

### Rollback Strategy
- Keep rollback scripts for each migration
- Test rollback procedure on staging first
- Understand data impact before rollback
- Have contingency plan for failed migrations

## 7. Common Interview Questions

### Q1: How do you optimize slow queries?
- Run EXPLAIN ANALYZE on the query
- Identify full table scans or bad joins
- Add missing indexes or rewrite query
- Verify improvement with new plan

### Q2: Explain ACID properties
- Atomicity: All or nothing execution
- Consistency: Valid state transitions only
- Isolation: Concurrent transactions safe
- Durability: Committed data persists

### Q3: What's the N+1 problem?
- One query for parent records
- N queries for child records each
- Fix with JOIN FETCH or EntityGraph
- Use DTO projection to avoid it

### Q4: When do you use NoSQL vs SQL?
- SQL for consistency and complex queries
- NoSQL for scale and schema flexibility
- Evaluate query patterns and data model
- Consider team expertise and tooling

### Q5: How do you handle schema migrations?
- Use Flyway or Liquibase for versioning
- Implement zero-downtime strategy
- Make backward-compatible changes only
- Test thoroughly on staging environment

### Q6: Optimistic vs pessimistic locking?
- Optimistic: Version check, retry on conflict
- Pessimistic: Lock row, wait for release
- Optimistic for low-conflict scenarios
- Pessimistic for high-contention writes

### Q7: How do you design indexes?
- Most selective column first in composite
- Cover common query patterns efficiently
- Avoid over-indexing due to write cost
- Monitor and remove unused indexes

### Q8: What is connection pooling?
- Reuse database connections efficiently
- HikariCP is default in Spring Boot
- Tune pool size based on concurrent load
- Monitor wait times and pool utilization

### Q9: How do you handle replication lag?
- Read from primary for own writes
- Accept stale reads for other users
- Implement read-after-write consistency
- Use session affinity for user requests

### Q10: Explain MVCC concept
- Multiple versions of rows maintained
- Readers see consistent snapshot
- Writers create new row versions
- No blocking between readers and writers

## 8. Final Checklist

- [ ] Can explain ACID and isolation levels
- [ ] Know 5+ index types and use cases
- [ ] Can optimize slow queries step-by-step
- [ ] Understand sharding strategies clearly
- [ ] Know optimistic vs pessimistic locking
- [ ] Can design normalized schemas properly
- [ ] Understand Flyway migration process
- [ ] Know zero-downtime deployment steps
- [ ] Understand NoSQL decision framework
- [ ] Can discuss trade-offs for decisions
