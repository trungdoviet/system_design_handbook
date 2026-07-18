# Java 17 Interview Preparation Guide

## 1. Core Java Fundamentals (Must Know)

### 1.1 OOP Principles
- **Encapsulation:** Private fields + public getters/setters, access modifiers (`private`, `protected`, `public`, package-private)
- **Inheritance:** `extends` keyword, method overriding (`@Override`), `super()` constructor chaining
- **Polymorphism:** Runtime polymorphism via inheritance/interfaces, compile-time via overloading
- **Abstraction:** Abstract classes vs interfaces, when to use each

### 1.2 Memory Model & JVM Internals
- **Heap vs Stack:** Heap stores objects, stack stores primitives and references
- **Garbage Collection:** Generational GC (Young/Old gen), G1GC (default in Java 17),
    ZGC/Shenandoah (low-latency)
- **Memory Leaks:** Static collections, unclosed resources, listener registrations
- **JIT Compilation:** C1/C2 compilers, escape analysis, inline caching

### 1.3 Exception Handling
```java
// Checked vs Unchecked
try {
    // checked: IOException, SQLException (must handle/declare)
} catch (IOException e) {
    // handle or rethrow
}

// try-with-resources (AutoCloseable)
try (BufferedReader br = new BufferedReader(new FileReader(path))) {
    // auto-closed
}

// Custom exceptions
class BusinessException extends RuntimeException {
    private final String errorCode;
    public BusinessException(String msg, String code) {
        super(msg);
        this.errorCode = code;
    }
}
```

---

## 2. Java 17 Key Features (Interview Focus)

### 2.1 Sealed Classes & Interfaces
Restrict which classes can extend/implement a type:
```java
public sealed interface Shape permits Circle, Rectangle, Triangle {
    double area();
}

public final class Circle implements Shape { /* ... */ }
public non-sealed class Rectangle implements Shape { /* ... */ }
// Only Circle, Rectangle, Triangle can implement Shape
```
**Use Case:** Domain modeling with exhaustive pattern matching, replacing enum-like hierarchies with extensibility.

### 2.2 Pattern Matching for `switch` (Preview → Standard in 17)
```java
String formatted = switch (obj) {
    case Integer i -> String.format("int %d", i);
    case Long l    -> String.format("long %d", l);
    case Double d  -> String.format("double %f", d);
    case String s  -> String.format("String %s", s);
    default        -> obj.toString();
};
```
**Advantage:** Eliminates verbose `instanceof` + cast boilerplate, enables exhaustive checks on sealed types.

### 2.3 Records (Immutable Data Carriers)
```java
public record User(String name, int age, String email) {
    // Compact constructor for validation
    public User {
        if (age < 0) throw new IllegalArgumentException("Age cannot be negative");
    }
    
    // Additional methods
    public String displayName() {
        return name.toUpperCase();
    }
}

// Usage: immutable, equals/hashCode/toString generated
User user = new User("Nhat", 30, "nhat@example.com");
```
**Key Points:**
- All fields are `private final`
- No setters, no inheritance (cannot extend other classes)
- Ideal for DTOs, API responses, configuration objects

### 2.4 Text Blocks (Multi-line Strings)
```java
String json = """
    {
        "name": "Nhat",
        "age": 30,
        "skills": ["Java", "Kotlin", "Spring"]
    }
    """;

// Stripping indentation automatically
String sql = """
    SELECT * FROM users
    WHERE age > ?
    ORDER BY name
    """;
```
**Benefit:** Eliminates string concatenation hell for SQL/JSON/HTML templates.

### 2.5 Helpful NullPointerExceptions
```java
// Before Java 17: NPE at line X, no clue which variable was null
// Java 17+: "Cannot invoke 'String.length()' because 'user.getName()' is null"
String len = user.getName().length(); // Detailed error message
```
**Note:** Enabled by default in Java 17+, critical for debugging production issues.

### 2.6 Foreign Function & Memory API (Incubator)
Safe access to native memory and foreign functions (replaces JNI for many use cases):
```java
// Allocate off-heap memory
MemorySegment segment = MemorySegment.allocateNative(100);
segment.set(ValueLayout.JAVA_INT, 0, 42);
int value = segment.get(ValueLayout.JAVA_INT, 0);
```
**Use Case:** High-performance interop with C libraries without JNI overhead.

---

## 3. Concurrency & Multithreading (Critical for Senior Roles)

### 3.1 Virtual Threads (Project Loom - Preview in 19, but concept important)
While not in Java 17, understand the direction: lightweight threads that reduce
thread-per-request model overhead. In Java 17, focus on:

### 3.2 ExecutorService & Thread Pools
```java
// Fixed thread pool
ExecutorService executor = Executors.newFixedThreadPool(10);

// Submit tasks
Future<String> future = executor.submit(() -> {
    // long-running task
    return "result";
});

// CompletableFuture (async composition)
CompletableFuture.supplyAsync(() -> fetchData())
    .thenApply(data -> transform(data))
    .thenAccept(result -> save(result))
    .exceptionally(ex -> handleError(ex));
```

### 3.3 Synchronization Primitives
- `synchronized` blocks/methods (monitor lock)
- `ReentrantLock` (explicit lock with fairness option)
- `ReadWriteLock` (multiple readers, single writer)
- `Semaphore` (limit concurrent access)
- `CountDownLatch` / `CyclicBarrier` (coordination)

### 3.4 Concurrent Collections
- `ConcurrentHashMap`: Lock-free reads, segmented writes
- `CopyOnWriteArrayList`: Thread-safe list for read-heavy workloads
- `BlockingQueue` (ArrayBlockingQueue, LinkedBlockingQueue): Producer-consumer patterns
- `AtomicInteger`, `AtomicReference`: Lock-free atomic operations

### 3.5 Common Pitfalls
- **Deadlock:** Always acquire locks in consistent order
- **Visibility:** Use `volatile` for shared flags, or proper synchronization
- **Thread Safety of SimpleDateFormat:** Use `DateTimeFormatter` (immutable, thread-safe) instead

---

## 4. Collections Framework Deep Dive

### 4.1 List Implementations
| Type | Access | Insert/Delete | Thread-Safe | Use Case |
|------|--------|---------------|-------------|----------|
| ArrayList | O(1) | O(n) | No | Random access, iteration |
| LinkedList | O(n) | O(1) | No | Frequent insert/delete at ends |
| CopyOnWriteArrayList | O(1) | O(n) | Yes | Read-heavy concurrent lists |

### 4.2 Map Implementations
| Type | Performance | Thread-Safe | Notes |
|------|-------------|-------------|-------|
| HashMap | O(1) avg | No | Default choice |
| LinkedHashMap | O(1) avg | No | Maintains insertion order |
| TreeMap | O(log n) | No | Sorted keys |
| ConcurrentHashMap | O(1) avg | Yes | Lock-free reads |

### 4.3 Stream API (Functional Programming)
```java
List<String> result = users.stream()
    .filter(u -> u.getAge() > 18)
    .map(User::getName)
    .sorted()
    .distinct()
    .collect(Collectors.toList());

// Parallel streams (use cautiously)
long count = users.parallelStream()
    .filter(u -> u.isActive())
    .count();
```
**Pitfalls:** Parallel streams have overhead; only beneficial for large datasets with CPU-intensive operations.

### 4.4 Optional (Null Safety)
```java
Optional<User> user = findUser(id);
String name = user.map(User::getName)
                  .orElse("Unknown");

// Avoid: optional.get() without isPresent() check
// Prefer: orElse(), orElseGet(), orElseThrow()
```

---

## 5. Spring Boot Ecosystem (Enterprise Java)

### 5.1 Core Annotations
- `@RestController` / `@Service` / `@Repository`: Stereotype annotations
- `@Autowired` / Constructor Injection (preferred over field injection)
- `@Configuration` / `@Bean`: Manual bean definition
- `@Transactional`: Declarative transaction management

### 5.2 Dependency Injection Patterns
```java
// ✅ Preferred: Constructor injection
@Service
public class UserService {
    private final UserRepository repo;
    
    public UserService(UserRepository repo) {
        this.repo = repo;
    }
}

// ❌ Avoid: Field injection (harder to test, hides dependencies)
@Autowired
private UserRepository repo;
```

### 5.3 Configuration Properties
```java
@ConfigurationProperties(prefix = "app.notification")
public record NotificationConfig(
    String smtpHost,
    int smtpPort,
    boolean enabled
) {}
```
Leverages Java 17 records for immutable config binding.

### 5.4 Testing
- `@SpringBootTest`: Full context integration tests
- `@WebMvcTest`: Slice test for controllers
- `Mockito`: Mock dependencies (`@MockBean`)
- Testcontainers: Real database/cache in tests

---

## 6. Performance & Optimization

### 6.1 Profiling Tools
- **JVisualVM / JConsole:** Heap dumps, thread analysis
- **Arthas:** Alibaba's open-source diagnostic tool (popular in China tech circles)
- **Async Profiler:** Low-overhead CPU/memory profiling

### 6.2 Common Optimizations
- **String Concatenation:** Use `StringBuilder` in loops
- **Collection Sizing:** Pre-size `ArrayList`/`HashMap` if size is known
- **Avoid Autoboxing:** Use primitive arrays (`int[]`) over wrapper collections (`List<Integer>`) when possible
- **Lazy Initialization:** Defer expensive object creation
- **Connection Pooling:** HikariCP for databases, Lettuce/Jedis pooling for Redis

### 6.3 JVM Tuning Basics
- `-Xms` / `-Xmx`: Heap size (set equal to avoid resize overhead)
- `-XX:+UseG1GC`: Enable G1 garbage collector
- `-XX:MaxGCPauseMillis=200`: Target max pause time
- `-XX:+HeapDumpOnOutOfMemoryError`: Auto heap dump on OOM

---

## 7. Java Version Comparison (vs Java 17)

### 7.1 Java 8 → Java 17 Evolution
| Feature | Java 8 | Java 11 | Java 17 | Impact |
|---------|--------|---------|---------|--------|
| Lambda/Streams | ✅ Introduced | ✅ Enhanced | ✅ Mature | Functional programming standard |
| Module System (JPMS) | ❌ | ✅ Introduced | ✅ Refined | Encapsulation, smaller runtimes |
| var (Local Variable Type Inference) | ❌ | ✅ Introduced | ✅ Stable | Reduced verbosity |
| HTTP Client | ❌ (HttpURLConnection) | ✅ New API | ✅ Enhanced | Modern async HTTP |
| Records | ❌ | ❌ | ✅ Standard | Immutable data carriers |
| Sealed Classes |  | ❌ | ✅ Standard | Restricted hierarchies |
| Pattern Matching (switch) | ❌ | ❌ | ✅ Standard | Cleaner type switching |
| Text Blocks |  | ❌ | ✅ Standard | Multi-line strings |
| ZGC/Shenandoah | ❌ | Experimental | Production-ready | Sub-ms pause GC |
| Virtual Threads |  | ❌ | Preview (19+) | Lightweight concurrency |

### 7.2 Why Java 17 Matters for Interviews
- **LTS Status:** Long-Term Support until 2029; most enterprises are migrating from 8/11 to 17
- **Modern Syntax:** Records/sealed classes signal up-to-date knowledge
- **Performance:** G1GC improvements, better JIT optimizations vs Java 8
- **Security:** Removed deprecated APIs (Applet, SecurityManager), stronger defaults
- **Ecosystem Alignment:** Spring Boot 3.x requires Java 17+; staying on 8 limits framework options

### 7.3 Migration Pain Points (Be Ready to Discuss)
- **Reflection Access:** JPMS restricts reflective access to internal APIs; may need `--add-opens` flags
- **Removed APIs:** JAXB, JAX-WS removed from JDK; must add as dependencies
- **Module Path vs Classpath:** Legacy apps may break if they rely on JDK internals
- **GC Changes:** G1GC behavior differs from CMS/Parallel; tuning parameters changed

---

## 8. Interview Communication Strategy

### 8.1 When Asked About Java Features
Structure your answer:
1. **What it is:** Brief definition
2. **Why it matters:** Problem it solves
3. **Code example:** Show you can use it
4. **Trade-offs:** When NOT to use it

Example for Records:
> "Records are immutable data carriers introduced in Java 16, standardized in 17. They
    eliminate boilerplate for DTOs by auto-generating constructors, equals, hashCode, and
    toString. For example, `record User(String name, int age)` replaces 50+ lines of
    traditional class code. However, they can't extend other classes or have mutable state,
    so they're not suitable for entities with business logic — use regular classes there."

### 8.2 Red Flags to Avoid
- ❌ Saying "I always use synchronized" without mentioning concurrent collections
- ❌ Not knowing difference between `==` and `.equals()`
- ❌ Confusing `AbstractStringBuilder` with `StringBuilder`
- ❌ Claiming parallel streams are always faster
- ❌ Not understanding why constructor injection is preferred

### 8.3 Questions to Ask Interviewer
- "What Java version does your team currently use, and what's the migration plan?"
- "How do you handle backward compatibility when upgrading Java versions?"
- "What profiling tools does your team use for production debugging?"
- "Are you using virtual threads or reactive programming for concurrency?"

---

## 9. Study Checklist

### Must-Know (Senior Level)
- [ ] Java Memory Model (happens-before, volatile semantics)
- [ ] Garbage Collection algorithms (G1, ZGC trade-offs)
- [ ] Concurrent collections internals (CHM segmentation)
- [ ] Stream API pitfalls (stateful operations, parallel overhead)
- [ ] Spring Boot auto-configuration mechanism
- [ ] Transaction propagation levels (REQUIRED, REQUIRES_NEW, etc.)
- [ ] Java 17 features (records, sealed classes, pattern matching)

### Good-to-Know
- [ ] Bytecode basics (javap, class file structure)
- [ ] Classloader hierarchy (bootstrap, extension, application)
- [ ] JNI vs FFM API differences
- [ ] GraalVM native image compilation
- [ ] Project Loom virtual threads architecture

### Practice Problems
- Implement thread-safe cache with TTL
- Design rate limiter using Semaphore/TokenBucket
- Debug memory leak scenario (static map growing unbounded)
- Optimize slow API endpoint (profiling + fix)
- Migrate legacy Java 8 code to Java 17 (identify breaking changes)

---

## 10. Common Interview Questions & Model Answers

### Q1: HashMap vs ConcurrentHashMap
- HashMap: Not thread-safe, allows null keys/values, faster in single-threaded
- ConcurrentHashMap: Thread-safe, no null keys/values
- Uses segment locking (Java 7) / CAS + synchronized (Java 8+)
- Senior answer: "I use HashMap for local computation and ConcurrentHashMap
  for shared caches. For read-heavy scenarios, ConcurrentHashMap performs
  nearly as well as HashMap because reads don't lock. For write-heavy, I
  consider Collections.synchronizedMap or specialized concurrent maps like
  LongAdder-based counters."

### Q2: == vs .equals()
- == compares references (memory address) for objects, values for primitives
- .equals() compares object content/logical equality
- Override hashCode when overriding equals (contract requirement)
- Senior answer: "== checks reference identity. .equals() checks logical
  equality. I always override both together because the contract requires
  equal objects to have equal hashCodes — violating this breaks
  HashMap/HashSet. String literals use == because JVM interns them, but I
  never rely on that in production code."

### Q3: Java Memory Model & Garbage Collection
- Heap: Young (Eden + S0 + S1) → Old/Tenured → Metaspace (Java 8+)
- G1GC (default since Java 9): Region-based, predictable pause times
- ZGC: Sub-millisecond pauses, good for latency-sensitive apps (Java 15+)
- Serial/Parallel GC: For small heaps or throughput-focused workloads
- Senior answer: "I tune GC based on workload. For our order processing
  service (latency-sensitive), I switched from G1 to ZGC and reduced p99
  latency from 200ms to 30ms. For batch jobs, I use Parallel GC for maximum
  throughput. Key flags: -Xmx, -Xms, -XX:MaxGCPauseMillis, -XX:+UseZGC"

### Q4: volatile Keyword
- Guarantees visibility: Writes by one thread immediately visible to others
- Prevents instruction reordering (happens-before relationship)
- Does NOT guarantee atomicity: volatile count++ is still unsafe
- Use AtomicInteger for atomic operations
- Senior answer: "volatile ensures visibility but not atomicity. I use it
  for simple boolean flags like 'isRunning' or 'isShutdown'. For counters,
  I use AtomicInteger. For complex state, I use synchronized or locks. The
  common mistake is thinking volatile int++ is safe — it's a
  read-modify-write that's NOT atomic."

### Q5: JVM Class Loading
- Bootstrap ClassLoader: Loads core JDK classes (rt.jar)
- Extension ClassLoader: Loads ext directory classes
- Application ClassLoader: Loads application classes from classpath
- Delegation principle: Parent-first — child asks parent before loading
- Senior answer: "Class loading follows parent-first delegation.
  ClassNotFoundException means the class was never found.
  NoClassDefFoundError means it was found earlier but failed to initialize.
  In Spring Boot, I've debugged classpath conflicts where two versions of
  the same library exist — using -verbose:class helps identify which loader
  loaded the class."

### Q6: Thread Lifecycle
- NEW → RUNNABLE (start()) → BLOCKED (waiting for lock)
- → WAITING (wait/join) → TIMED_WAITING (sleep/wait with timeout)
- → TERMINATED
- Thread states monitored via Thread.getState()
- Dead threads cannot be restarted
- Senior answer: "I rarely create raw threads. I use ExecutorService for
  thread pool management. The key insight is that RUNNABLE doesn't mean
  running — it means the thread is ready to run but may be waiting for CPU
  time. BLOCKED means waiting for a synchronized lock. WAITING means
  indefinite wait. For production, I monitor thread states via Arthas or
  JMX."

### Q7: Fail-Fast vs Fail-Safe Iterators
- Fail-fast: Throw ConcurrentModificationException if modified during
  iteration (HashMap, ArrayList)
- Fail-safe: Don't throw exception, work on copy or tolerate modifications
  (ConcurrentHashMap, CopyOnWriteArrayList)
- Fail-fast uses modCount to detect structural changes
- Senior answer: "Fail-fast iterators detect concurrent modifications via
  modCount. This is a best-effort mechanism — it's not guaranteed. For
  concurrent collections, I use ConcurrentHashMap which has weakly
  consistent iterators — they reflect state at creation time but tolerate
  concurrent modifications. CopyOnWriteArrayList is fail-safe but expensive
  for writes, so I use it only for read-heavy listener lists."

### Q8: Handling Memory Leaks
- Common causes: Static collections growing indefinitely, unclosed resources
  (streams, connections), listener callbacks not deregistered
- ThreadLocal not removed in thread pools
- Detection: Heap dump analysis (jmap -dump), Eclipse MAT, Arthas dashboard
- Prevention: Always use try-with-resources, limit static collection size
- Senior answer: "I detect leaks through monitoring. If heap grows steadily
  without GC reclaiming, I take a heap dump and analyze with Eclipse MAT.
  Common patterns: ThreadLocal in thread pools (threads are reused but
  ThreadLocal values persist), static Maps used as caches without eviction,
  unclosed InputStreams. I prevent these by always using try-with-resources
  and WeakHashMap for caches."

### Q9: Java Module System (JPMS)
- Introduced in Java 9, mandatory encapsulation in Java 17
- module-info.java defines exports (public API) and requires (dependencies)
- Strong encapsulation: Only exported packages are accessible
- Challenges: Many libraries not modularized, need --add-opens for reflection
- Senior answer: "JPMS enforces strong encapsulation at the package level.
  Only explicitly exported packages are accessible. This breaks
  reflection-based frameworks (Spring, Hibernate) which access private
  fields. In Spring Boot 3.x, the framework handles --add-opens
  automatically. For custom code needing reflective access, I use
  MethodHandles which are more performant and compliant."

### Q10: Comparator vs Comparable
- Comparable: Natural ordering defined in class itself (compareTo)
- Class implements Comparable<T>
- Comparator: Custom ordering defined externally (compare)
- Separate class or lambda
- Senior answer: "Comparable defines natural ordering within the class —
  it's the default sort order. Comparator is external and flexible — I can
  have multiple comparators for different sort criteria. In practice, I
  always provide both: Comparable for the most common order (e.g., by ID),
  and Comparator constants for alternatives (by date, by priority). This
  follows the Single Responsibility Principle."

### Q11: Designing Thread-Safe Code
- Immutable objects are inherently thread-safe (final fields, no setters)
- Thread confinement: Restrict object access to single thread
- Synchronized blocks: Protect critical sections with intrinsic locks
- Concurrent collections: ConcurrentHashMap, AtomicReference
- Lock-free algorithms: AtomicInteger.compareAndSet(), LongAdder
- Senior answer: "Thread safety starts with immutability — all my DTOs and
  domain events are immutable (records or final-field classes). For mutable
  shared state, I use the narrowest synchronization scope. I prefer
  concurrent collections over synchronized wrappers. For counters, LongAdder
  outperforms AtomicLong under high contention. The hierarchy: immutable >
  thread-confined > concurrent collection > synchronized > lock"

### Q12: Spring @Transactional Pitfalls
- Self-invocation bypasses proxy (calling this.methodB() doesn't start new
  transaction)
- Private methods can't be proxied by AOP
- Default rollback only on RuntimeException, not checked exceptions
- readOnly=true is a hint, not enforced — writes still work
- Solution: Use @Lazy self-injection, TransactionTemplate, or refactor
- Senior answer: "Self-invocation is the #1 pitfall. When I need internal
  transactional calls, I inject the service into itself with @Lazy
  @Autowired, or use TransactionTemplate for programmatic control. I always
  specify rollbackFor = Exception.class explicitly — relying on
  RuntimeException default is a bug waiting to happen. For audit logs that
  must persist on failure, I use REQUIRES_NEW."

### Q13: Common Design Patterns in Java
- Singleton: Spring beans are singletons by default (container-managed)
- Factory: Spring ApplicationContext is a factory, @Bean methods are factory
  methods
- Strategy: Lambda expressions replace strategy pattern (Comparator, Function)
- Observer: Spring ApplicationEvent + @EventListener
- Builder: Lombok @Builder, or manual for complex object construction
- Template Method: Spring's JdbcTemplate, RestTemplate define algorithm
  skeletons
- Senior answer: "In Spring, most GoF patterns are built-in. Singleton is
  container-managed. Factory is @Bean. Strategy is replaced by lambdas.
  Observer is ApplicationEvent. I use Builder for complex DTOs and Template
  Method for algorithm frameworks. The key insight is that modern Java
  (lambdas, records, sealed interfaces) reduces the need for many
  traditional patterns."

### Q14: CompletableFuture Usage
- Async composition: supplyAsync, thenApply, thenAccept, exceptionally
- Combining: thenCombine (merge two async results), allOf (wait for all)
- Error handling: exceptionally, handle (recover from errors)
- Custom executor: supplyAsync(() -> ..., executor) for thread pool control
- Senior answer: "CompletableFuture is my go-to for async orchestration. I
  chain operations: fetch from DB → transform → send notification, all
  non-blocking. I always supply a custom executor — never use
  ForkJoinPool.commonPool() in production because it's shared across the
  JVM and unbounded. For combining results, thenCombine merges two async
  calls, allOf waits for all. The pitfall: forgetting exceptionally() leaves
  errors silently dropped."

### Q15: System Design Approach for Java Apps
- Start with requirements: Scale (QPS, data volume), latency targets
- Choose architecture: Monolith for simplicity, microservices for scaling
- Data strategy: SQL vs NoSQL, caching (Redis), sharding for scale
- Resilience: Circuit breaker, retry, rate limiting, graceful degradation
- Observability: Metrics, traces, logs — the three pillars
- Senior answer: "I start with constraints: what QPS, what latency, what
  availability? For <10K QPS, a well-designed monolith with proper caching
  handles it. For >100K QPS, microservices with independent scaling become
  necessary. I always include resilience patterns: circuit breaker for
  downstream failures, retry with backoff for transient errors, rate
  limiting for overload. Observability is non-negotiable — every service has
  metrics, traces, and structured logs."

---

## 11. Design Patterns for Interviews

### Core Patterns
- **Singleton:** Spring-managed vs manual implementation
  - Use Spring @Component/@Service for singleton beans
  - Manual: private constructor + static instance + getInstance()
  - Thread-safe: use enum or double-checked locking with volatile
- **Factory Method:** Create objects without specifying exact class
  - Spring @Bean methods are factory methods
  - Example: BeanFactory.getBean("userService")
  - Use when object creation logic is complex
- **Builder:** Construct complex objects step-by-step
  - Lombok @Builder annotation generates builder pattern
  - Manual: static inner Builder class with fluent API
  - Use for objects with many optional parameters
- **Strategy:** Define interchangeable algorithms
  - Replaced by lambdas in modern Java: Comparator.comparing()
  - Example: PaymentStrategy interface with CreditCard/PayPal implementations
  - Use when you need to switch algorithms at runtime
- **Observer:** Notify dependents of state changes
  - Spring ApplicationEvent + @EventListener
  - Example: OrderPlacedEvent → EmailListener, SmsListener
  - Use for decoupled event-driven architectures
- **Decorator:** Add behavior dynamically via wrapping
  - Java I/O streams: BufferedReader wraps InputStreamReader
  - Example: LoggingDecorator wraps UserService to add logging
  - Use to extend functionality without subclassing
- **Template Method:** Define algorithm skeleton, defer steps to subclasses
  - Spring's JdbcTemplate handles connection/exception, you provide SQL
  - Example: AbstractController with template processRequest() method
  - Use when algorithm structure is fixed but steps vary

### Anti-Patterns to Avoid
- **God Object:** One class doing everything (violates SRP)
  - Solution: Split into focused, single-responsibility classes
- **Golden Hammer:** Using favorite tool for every problem
  - Example: Using microservices for simple CRUD app
  - Solution: Choose architecture based on actual requirements
- **Premature Optimization:** Optimizing before measuring
  - Example: Adding caching before profiling shows bottleneck
  - Solution: Profile first, optimize hot paths only

---

## 12. System Design Basics

### Scalability Principles
- **Vertical Scaling:** Add more resources (CPU, RAM) to single server
  - Pros: Simple, no code changes needed
  - Cons: Hardware limits, single point of failure
  - Use for: Small-scale applications, quick wins
- **Horizontal Scaling:** Add more servers behind load balancer
  - Pros: Unlimited scale, fault tolerance
  - Cons: Complexity (stateless design, distributed systems)
  - Use for: High-traffic applications, cloud-native architectures

### Load Balancing Strategies
- **Round-Robin:** Distribute requests evenly across servers
  - Simple, works well for homogeneous servers
- **Consistent Hashing:** Same client always hits same server
  - Useful for session affinity, cache locality
  - Minimizes cache misses when servers are added/removed
- **Weighted:** More powerful servers get more traffic
  - Based on CPU capacity, response time, or custom metrics
  - Use when servers have different capabilities

### Caching Strategies
- **Cache-Aside (Lazy Loading):** App checks cache first, loads from DB on miss
  - Pros: Simple, cache only stores requested data
  - Cons: Cache miss penalty, stale data possible
  - Use for: Read-heavy workloads with infrequent updates
- **Write-Through:** Write to cache and DB simultaneously
  - Pros: Cache always consistent with DB
  - Cons: Higher write latency
  - Use for: Critical data where consistency is paramount
- **Write-Behind (Write-Back):** Write to cache, async write to DB
  - Pros: Fast writes, batches DB updates
  - Cons: Risk of data loss if cache fails
  - Use for: High-write throughput, eventual consistency acceptable
- **Invalidation Strategies:** TTL (time-based), explicit invalidation on update
  - Combine TTL + explicit invalidation for best results

### Database Design
- **Indexing:** B-tree indexes speed up queries, slow down writes
  - Index columns used in WHERE, JOIN, ORDER BY clauses
  - Avoid over-indexing: each index adds write overhead
  - Use EXPLAIN ANALYZE to verify index usage
- **Sharding:** Split database horizontally by key (user_id, region)
  - Pros: Distributes load, enables horizontal scaling
  - Cons: Complex queries across shards, rebalancing challenges
  - Use for: Very large datasets (>100M rows per table)
- **Replication:** Master-slave or master-master setups
  - Read replicas for scaling read operations
  - Master handles writes, slaves handle reads
  - Eventual consistency between master and replicas
- **CAP Theorem:** Can only guarantee 2 of 3: Consistency, Availability, Partition tolerance
  - CP systems (MongoDB, HBase): Prioritize consistency
  - AP systems (Cassandra, DynamoDB): Prioritize availability
  - Choose based on business requirements

### Microservices Architecture
- **Service Discovery:** Services register themselves, clients discover them
  - Tools: Eureka, Consul, Kubernetes DNS
  - Enables dynamic scaling, fault tolerance
- **API Gateway:** Single entry point for all client requests
  - Handles authentication, rate limiting, request routing
  - Tools: Spring Cloud Gateway, Kong, AWS API Gateway
- **Inter-Service Communication:**
  - Synchronous: REST/HTTP, gRPC (better performance)
  - Asynchronous: Message queues (Kafka, RabbitMQ) for decoupling
  - Use sync for immediate responses, async for background processing

### Resilience Patterns
- **Circuit Breaker:** Stop calling failing service after threshold
  - States: Closed (normal), Open (failing), Half-Open (testing)
  - Tools: Resilience4j, Hystrix (deprecated)
  - Prevents cascading failures across services
- **Retry with Backoff:** Retry failed operations with increasing delays
  - Exponential backoff: 1s, 2s, 4s, 8s...
  - Add jitter to prevent thundering herd
  - Set max retries to avoid infinite loops
- **Bulkhead:** Isolate resources to prevent single failure from affecting all
  - Thread pool isolation per service call
  - Semaphore-based limiting concurrent calls
  - Like ship bulkheads containing water damage
- **Rate Limiting:** Control request rate per client/service
  - Token bucket, sliding window algorithms
  - Prevents overload, protects downstream services
  - Tools: Redis-based counters, API gateway policies

### Observability (Three Pillars)
- **Metrics:** Numerical data over time (CPU, memory, request count, latency)
  - Tools: Prometheus, Grafana, Micrometer
  - Use for: Alerting, capacity planning, trend analysis
  - Key metrics: QPS, p50/p95/p99 latency, error rate
- **Tracing:** Track request flow across services
  - Tools: Jaeger, Zipkin, OpenTelemetry
  - Distributed tracing shows full request path
  - Identify bottlenecks in multi-service calls
- **Logging:** Structured logs with context (timestamp, level, trace_id)
  - Tools: ELK Stack (Elasticsearch, Logstash, Kibana), Splunk
  - Use JSON format for easy parsing
  - Correlate logs with trace_id for debugging

---

## 13. Final Tips

1. **Depth > Breadth:** Knowing GC internals deeply beats superficial knowledge of 20 features
2. **Real Examples:** Prepare 2-3 war stories where you solved performance/concurrency issues
3. **Code on Whiteboard:** Practice writing clean Java without IDE autocomplete
4. **Explain Trade-offs:** Every technical decision has pros/cons; articulate both
5. **Stay Current:** Follow JDK release notes, OpenJDK mailing lists, Baeldung/Vlad Mihalcea blogs

Good luck with your Java interviews! 🚀