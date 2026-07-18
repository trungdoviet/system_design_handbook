# Spring Boot Interview Preparation Guide

## 1. Core Spring Framework Fundamentals (The Foundation)

Before diving into Spring Boot, you must understand the underlying Spring Framework concepts.
Interviewers often test these to ensure you're not just a "Spring Boot user" but a
"Spring developer."

### 1.1 Inversion of Control (IoC) & Dependency Injection (DI)
-   **IoC Container:** `ApplicationContext` vs `BeanFactory`. Know that `ApplicationContext` extends
    `BeanFactory` and adds enterprise features (AOP, i18n, event propagation).
-   **Bean Lifecycle:** Instantiation → Populate Properties → `Aware` Interfaces → `@PostConstruct`
    → Initialization → Ready → `@PreDestroy` → Destruction.
-   **Scopes:** Singleton (default), Prototype, Request, Session, Application. *Crucial: Understand
    thread safety implications of Singleton scope.*
-   **Injection Types:** Constructor (✅ Preferred), Setter, Field (❌ Avoid). Be ready to explain
    *why* constructor injection is better (immutability, testability, required dependencies).
-   **Singleton Thread Safety:** A singleton bean is NOT thread-safe by default. If it has mutable
    state, you must handle concurrency yourself. Prefer immutable singletons (constructor injection
    + final fields). Prototype beans per-request avoid shared state issues.
-   **`@Lazy`:** Defers bean creation until first use. Useful for heavy beans or circular dependency
    resolution. Works on `@Bean` methods, `@Component` classes, or `@Autowired` fields.

```java
// ✅ Best Practice: Constructor Injection
@Service
public class OrderService {
    private final PaymentGateway paymentGateway;
    private final InventoryRepository inventoryRepo;

    public OrderService(PaymentGateway paymentGateway, 
                       InventoryRepository inventoryRepo) {
        this.paymentGateway = paymentGateway;
        this.inventoryRepo = inventoryRepo;
    }
}
```

### 1.2 Aspect-Oriented Programming (AOP)
-   **Key Concepts:** Aspect, Join Point, Pointcut, Advice (@Before, @After, @Around, @AfterReturning, @AfterThrowing).
-   **Use Cases:** Logging, Transaction Management, Security, Caching, Retry Logic.
-   **Proxy Mechanism:** JDK Dynamic Proxy (interfaces only) vs CGLIB (subclassing). Spring Boot 2.x+ defaults to CGLIB for classes
    without interfaces.
-   **Pitfall:** Self-invocation bypasses proxy (calling method A from method B in same class won't trigger AOP on A).

### 1.3 Spring MVC & Web Layer
-   **DispatcherServlet:** Front controller pattern. Know the request flow: HandlerMapping →
    Controller → ViewResolver/MessageConverter.
-   **REST Annotations:** `@RestController`, `@RequestMapping`, `@GetMapping`, `@PostMapping`,
    `@PathVariable`, `@RequestParam`, `@RequestBody`, `@ResponseBody`.
-   **Exception Handling:** `@ControllerAdvice` + `@ExceptionHandler` for global error handling.
    Return consistent error response structure.
-   **Validation:** `@Valid` / `@Validated` with Bean Validation (JSR 380). Custom validators via
    `ConstraintValidator`.
-   **Content Negotiation:** `@RequestMapping(produces = "application/json")`. Spring uses
    `Accept` header or URL extension to determine response format.

### 1.4 Error Handling Patterns
-   **Global Exception Handler:** Use `@RestControllerAdvice` + `@ExceptionHandler` to centralize
    error responses. Return a consistent error DTO across all endpoints.
    ```java
    @RestControllerAdvice
    public class GlobalExceptionHandler {
        @ExceptionHandler(BusinessException.class)
        public ResponseEntity<ErrorResponse> handleBusiness(
                BusinessException ex) {
            return ResponseEntity.status(ex.getStatusCode())
                .body(new ErrorResponse(ex.getCode(), ex.getMessage()));
        }
        
        @ExceptionHandler(MethodArgumentNotValidException.class)
        public ResponseEntity<ErrorResponse> handleValidation(
                MethodArgumentNotValidException ex) {
            String details = ex.getBindingResult().getFieldErrors()
                .stream()
                .map(e -> e.getField() + ": " + e.getDefaultMessage())
                .collect(Collectors.joining("; "));
            return ResponseEntity.badRequest()
                .body(new ErrorResponse("VALIDATION_ERROR", details));
        }
    }
    ```
-   **RFC 7807 (ProblemDetail):** Spring Boot 3.x provides `ProblemDetail` class for standard
    error responses. Use `ErrorResponseBuilder` to create machine-readable error details.
    ```java
    @ExceptionHandler(ResourceNotFoundException.class)
    public ProblemDetail handleNotFound(ResourceNotFoundException ex) {
        ProblemDetail pd = ProblemDetail.forStatusAndDetail(
            HttpStatus.NOT_FOUND, ex.getMessage());
        pd.setTitle("Resource Not Found");
        pd.setProperty("resourceId", ex.getResourceId());
        return pd;
    }
    ```
-   **Custom Error Attributes:** Extend `DefaultErrorAttributes` to add custom fields to the
    default `/error` response (e.g., add `errorCode`, `timestamp` format).

---

## 2. Spring Boot Core Concepts (What Makes It "Boot")

### 2.1 Auto-Configuration Magic
-   **How it works:** `@EnableAutoConfiguration` imports `AutoConfigurationImportSelector`, which reads
    `META-INF/spring.factories` (Boot 2.x) or
    `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.imports` (Boot 3.x).
-   **Conditional Annotations:** `@ConditionalOnClass`, `@ConditionalOnMissingBean`, `@ConditionalOnProperty`,
    `@ConditionalOnWebApplication`. *Be ready to write a custom auto-configuration.*
-   **Debugging Auto-config:** Use `--debug` flag or `/actuator/conditions` endpoint to see what was applied/skipped
    and why.

### 2.2 Starter Dependencies
-   **Purpose:** Opinionated dependency management. `spring-boot-starter-web` pulls in Tomcat, Spring MVC, Jackson,
    Validation, etc.
-   **Custom Starters:** Know how to create one for internal libraries (auto-config + starter pom).
-   **Dependency Management:** `spring-boot-dependencies` BOM ensures compatible versions. Never override versions manually unless necessary.

### 2.3 Configuration & Profiles
-   **Property Sources Order:** Command line args > JNDI > Java System Properties > OS Env vars >
    `application-{profile}.yml` > `application.yml` > `@PropertySource`.
-   **Profile Activation:** `spring.profiles.active=dev`, `@ActiveProfiles("test")`, Maven profiles.
-   **Type-Safe Config:** `@ConfigurationProperties` binding to POJOs/Records. Validation with `@Validated`.
-   **Externalized Config:** Spring Cloud Config, Vault, Consul for secrets management.

```java
@ConfigurationProperties(prefix = "app.datasource")
@Validated
public record DataSourceConfig(
    @NotBlank String url,
    @Min(1) int maxPoolSize,
    Duration connectionTimeout
) {}
```

### 2.4 Actuator & Observability
-   **Key Endpoints:** `/health`, `/info`, `/metrics`, `/env`, `/beans`, `/mappings`, `/threaddump`,
    `/heapdump`.
-   **Security:** Always secure actuator endpoints in production
    (`management.endpoints.web.exposure.include=health,info`).
-   **Micrometer:** Metrics collection (counters, gauges, timers). Integration with Prometheus/Grafana.
-   **Distributed Tracing:** Micrometer Tracing + Brave/OTel. Trace ID propagation across services.

### 2.5 Spring Boot Internals & Startup Process
-   **Startup Flow:** `SpringApplication.run()` → create `ApplicationContext` → register beans →
    execute auto-configuration → refresh context → start embedded server.
-   **`SpringApplication` Hooks:** `ApplicationListener`, `ApplicationContextInitializer`,
    `BootstrapRegistryInitializer`. Customize startup via `SpringApplication` builder.
-   **Lazy Initialization:** `spring.main.lazy-initialization=true` defers bean creation. Faster
    startup but slower first request. Not recommended for production (errors surface late).
-   **Embedded Servers:** Tomcat (default), Jetty, Undertow. Tomcat is mature and stable. Undertow
    is lightweight with better async support. Switch by excluding default and adding starter.
    ```xml
    <!-- Switch to Undertow -->
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-web</artifactId>
        <exclusions>
            <exclusion>
                <groupId>org.springframework.boot</groupId>
                <artifactId>spring-boot-starter-tomcat</artifactId>
            </exclusion>
        </exclusions>
    </dependency>
    <dependency>
        <groupId>org.springframework.boot</groupId>
        <artifactId>spring-boot-starter-undertow</artifactId>
    </dependency>
    ```
-   **Banner:** Customizable via `banner.txt` in resources. `spring.main.banner-mode=off` to disable.

### 2.6 Event-Driven Architecture
-   **Built-in Events:** `ApplicationContextInitializedEvent`, `ApplicationPreparedEvent`,
    `ContextRefreshedEvent`, `ApplicationStartedEvent`, `ApplicationReadyEvent`,
    `ApplicationFailedEvent`. Listen with `@EventListener` or `ApplicationListener`.
-   **Custom Events:** Extend `ApplicationEvent`. Publish with `ApplicationEventPublisher`.
    ```java
    public class OrderCreatedEvent extends ApplicationEvent {
        private final Order order;
        public OrderCreatedEvent(Object source, Order order) {
            super(source);
            this.order = order;
        }
    }
    
    @Service
    public class OrderService {
        @Autowired private ApplicationEventPublisher publisher;
        
        public void createOrder(Order order) {
            // save order...
            publisher.publishEvent(new OrderCreatedEvent(this, order));
        }
    }
    
    @Component
    public class NotificationListener {
        @EventListener
        public void onOrderCreated(OrderCreatedEvent event) {
            // send notification
        }
    }
    ```
-   **Async Events:** Use `@Async @EventListener` for non-blocking event processing. Ensure
    `@EnableAsync` is configured on a configuration class.
-   **Transactional Events:** `@TransactionalEventListener(phase = AFTER_COMMIT)` ensures listener
    executes only after transaction commits successfully. Phase options: BEFORE_COMMIT, AFTER_COMMIT,
    AFTER_ROLLBACK, AFTER_COMPLETION.

---

## 3. Data Access & Transactions

### 3.1 Spring Data JPA / JDBC
-   **Repository Abstraction:** `CrudRepository`, `PagingAndSortingRepository`, `JpaRepository`. Derived query methods
    (`findByLastNameAndAgeGreaterThan`).
-   **N+1 Problem:** Eager vs Lazy loading, `@EntityGraph`, `JOIN FETCH`, DTO projections. *This is a guaranteed
    interview question.*
-   **Pagination:** `Pageable`, `Slice`. Avoid `OFFSET` for large datasets; use keyset pagination.
-   **Connection Pooling:** HikariCP (default). Key configs: `maximum-pool-size`, `minimum-idle`,
    `connection-timeout`, `max-lifetime`.

### 3.2 Transaction Management
-   **Declarative:** `@Transactional`. Propagation levels: REQUIRED (default), REQUIRES_NEW, NESTED, SUPPORTS,
    NOT_SUPPORTED, MANDATORY, NEVER.
-   **Isolation Levels:** DEFAULT, READ_UNCOMMITTED, READ_COMMITTED, REPEATABLE_READ, SERIALIZABLE. Understand dirty
    reads, non-repeatable reads, phantom reads.
-   **Pitfalls:**
    -   Self-invocation bypasses transactional proxy
    -   Private methods can't be proxied
    -   Exception type matters: rolls back on RuntimeException/Error by default, not checked exceptions
    -   Read-only transactions for optimization hints

```java
@Transactional(propagation = Propagation.REQUIRES_NEW, 
             isolation = Isolation.READ_COMMITTED,
             rollbackFor = BusinessException.class)
public void processPayment(Order order) {
    // ...
}
```

### 3.3 NoSQL & Reactive Data
-   **Redis:** `StringRedisTemplate`, `RedisTemplate`, caching with `@Cacheable`, distributed locks with Redisson.
-   **MongoDB:** `MongoRepository`, reactive `ReactiveMongoRepository`.
-   **Elasticsearch:** `ElasticsearchRepository`, custom queries with `@Query`.
-   **Reactive Stack:** WebFlux, R2DBC (reactive DB access). Understand backpressure, Mono/Flux operators.

---

## 4. Security (Spring Security)

### 4.1 Authentication & Authorization
-   **Filter Chain:** `SecurityFilterChain` bean configuration. Order of filters matters.
-   **Authentication Providers:** DAO, LDAP, OAuth2, JWT, SAML.
-   **Authorization:** Role-based (`hasRole('ADMIN')`), permission-based (`hasAuthority('READ_ORDER')`), method-level
    (`@PreAuthorize`, `@Secured`).
-   **CSRF Protection:** Enabled by default for stateful apps; disable for stateless APIs.

### 4.2 OAuth2 & JWT
-   **OAuth2 Flows:** Authorization Code (web apps), Client Credentials (service-to-service), Resource Owner Password
    (legacy).
-   **JWT Structure:** Header.Payload.Signature. Signing algorithms (HS256, RS256). Token validation with
    `JwtDecoder`.
-   **Resource Server:** `@EnableResourceServer`, token introspection, scope-based authorization.

```java
@Bean
public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
    http
        .authorizeHttpRequests(auth -> auth
            .requestMatchers("/api/public/**").permitAll()
            .requestMatchers("/api/admin/**").hasRole("ADMIN")
            .anyRequest().authenticated()
        )
        .oauth2ResourceServer(oauth2 -> oauth2
            .jwt(jwt -> jwt.decoder(jwtDecoder()))
        );
    return http.build();
}
```

---

## 5. Testing Strategy

### 5.1 Test Slices
-   **`@SpringBootTest`:** Full context. Slow but comprehensive. Use for integration tests.
-   **`@WebMvcTest`:** Controller layer only. Mock service beans. Fast.
-   **`@DataJpaTest`:** Repository layer only. Embedded DB (H2). Transactional by default.
-   **`@JsonTest`:** Serialization/deserialization only.

### 5.2 Mocking & Testcontainers
-   **Mockito:** `@MockBean` (replaces bean in context), `@SpyBean` (wraps real bean). Verify interactions with
    `verify()`.
-   **Testcontainers:** Real PostgreSQL/Redis/RabbitMQ in Docker for integration tests. More reliable than
    H2/embedded.
-   **WireMock:** Mock external HTTP services.

```java
@WebMvcTest(OrderController.class)
class OrderControllerTest {
    @Autowired MockMvc mockMvc;
    @MockBean OrderService orderService;
    
    @Test
    void shouldCreateOrder() throws Exception {
        when(orderService.create(any())).thenReturn(new Order(1L));
        
        mockMvc.perform(post("/api/orders")
                .contentType(MediaType.APPLICATION_JSON)
                .content("{\"productId\": 123}"))
            .andExpect(status().isCreated());
    }
}
```

---

## 6. Performance & Production Readiness

### 6.1 Common Bottlenecks
-   **Database:** N+1 queries, missing indexes, unbounded result sets, connection pool exhaustion.
-   **Memory:** Leaks (static collections, unclosed streams), excessive object creation, large session data.
-   **CPU:** Synchronous blocking calls in high-throughput paths, inefficient algorithms, excessive logging.
-   **Network:** Chatty microservices, large payloads, no compression.

### 6.2 Optimization Techniques
-   **Caching:** `@Cacheable`, Redis cache, local Caffeine cache. Cache invalidation strategies.
-   **Async Processing:** `@Async`, `CompletableFuture`, message queues (Kafka/RabbitMQ) for decoupling.
-   **Batch Operations:** `JdbcTemplate.batchUpdate()`, JPA batch inserts, bulk deletes.
-   **Profiling:** Arthas, Async Profiler, VisualVM, Spring Boot Actuator metrics.

### 6.3 Resilience Patterns
-   **Retry:** Spring Retry / Resilience4j `@Retry`. Exponential backoff, jitter.
-   **Circuit Breaker:** Resilience4j `@CircuitBreaker`. Open/Half-Open/Closed states. Fallback methods.
-   **Rate Limiting:** Bucket4j, Sentinel. Prevent overload.
-   **Bulkhead:** Limit concurrent calls to downstream services.

---

## 7. Spring Boot Version Comparison

### 7.1 Major Version Evolution

| Feature | Boot 2.7 (Legacy) | Boot 3.0 (Current LTS) | Boot 3.2+ (Latest) |
    Impact |
|---------|-------------------|----------------------|--------------------|
| **Java Baseline** | Java 8+ | **Java 17+** | Java 17+ | Mandatory upgrade path |
| **Jakarta EE** | javax.* | **jakarta.*** | jakarta.* | All imports must change |
| **Native Image** | Experimental | **Production-ready** | Enhanced | Faster startup, lower memory |
| **Observability** | Sleuth + Zipkin | **Micrometer Tracing** | OTel native | Standardized tracing API |
| **Problem Details** | Custom format | **RFC 7807** | Enhanced | Standardized error responses |
| **Virtual Threads** |  | Preview (3.2+) | **Stable (3.3+)** | Lightweight concurrency |
| **HTTP Interface** | RestTemplate | WebClient | **HttpInterface** | Declarative HTTP clients |
| **Configuration** | spring.factories | **.imports files** | Enhanced | Faster startup, modular |
| **Deprecations** | Many legacy APIs | Clean slate | Modern only | Cleaner codebase |

### 7.2 Boot 3.3+ Specific Features (Latest)
-   **Virtual Threads (Project Loom):** `spring.threads.virtual.enabled=true` enables virtual threads
    for Tomcat request processing and `@Async` tasks. 1M+ concurrent connections with minimal
    memory. Replaces reactive in many use cases.
-   **Observability API:** New `Observation` API unifies metrics and tracing. Create custom
    observations with `ObservationRegistry`. Single API for both Micrometer metrics and tracing.
    ```java
    @Observed(name = "order.create", contextualName = "create-order")
    public Order createOrder(OrderRequest request) {
        // automatically timed and traced
    }
    ```
-   **` RestClient`:** New synchronous HTTP client (fluent API). Replaces RestTemplate as the
    recommended blocking HTTP client. Similar interface to WebClient but synchronous.
    ```java
    RestClient restClient = RestClient.create();
    Order order = restClient.get()
        .uri("https://api.example.com/orders/{id}", orderId)
        .retrieve()
        .body(Order.class);
    ```
-   **GraalVM AOT Processing:** Build-time analysis replaces runtime reflection. `spring-aot`
    module processes bean definitions at compile time. Faster native image builds in 3.3+.
-   **CDS (Class Data Sharing):** Spring Boot 3.3 supports JVM CDS for faster startup. Generate
    CDS archive with `java -Dspring.context.classes=... -jar app.jar` then reuse for subsequent
    starts. ~30% faster startup without native image trade-offs.

### 7.3 Critical Migration Pain Points (Be Ready to Discuss)

#### Jakarta Namespace Change (Biggest Breaking Change)
```java
// ❌ Spring Boot 2.x
import javax.persistence.Entity;
import javax.validation.constraints.NotNull;
import javax.servlet.http.HttpServletRequest;

// ✅ Spring Boot 3.x
import jakarta.persistence.Entity;
import jakarta.validation.constraints.NotNull;
import jakarta.servlet.http.HttpServletRequest;
```
**Impact:** All dependencies using `javax.*` must have Jakarta-compatible versions. Hibernate Validator, Bean
Validation, Servlet API all changed.

#### Java 17 Requirement
-   **Removed APIs:** SecurityManager (deprecated), Applet, RMI registry
-   **Strong Encapsulation:** Reflective access to JDK internals blocked by default. May need
    `--add-opens java.base/java.lang=ALL-UNNAMED`
-   **Sealed Classes/Records:** Now part of language; leverage in domain modeling

#### Native Image Compilation
```bash
# Build native executable
./mvnw -Pnative native:compile

# Result: 50MB binary, <100ms startup, 50MB RSS vs 300MB+ JVM
```
**Trade-offs:** Longer build time, some reflection/proxy limitations, smaller ecosystem support.

### 7.4 Migration Strategy (Step-by-Step)
-   **Phase 1 - Assessment:** Inventory all dependencies. Identify `javax.*` imports. Check
    third-party libraries for Jakarta-compatible versions. Run Spring Boot 3.x migration report
    (`spring-boot-migrator` tool).
-   **Phase 2 - Java Upgrade:** Upgrade JDK to 17+. Fix any removed API usage (SecurityManager,
    Applet APIs). Test all `--add-opens` flags needed for reflective access.
-   **Phase 3 - Dependency Migration:** Upgrade Spring Boot parent to 3.x. Update all
    `javax.*` imports to `jakarta.*`. Upgrade Hibernate, Validator, and Servlet API dependencies.
    Update Spring Security (filter chain DSL changes).
-   **Phase 4 - Configuration Migration:** Replace `spring.factories` with `.imports` files for
    custom auto-configurations. Update property names that changed (e.g.,
    `spring.redis.*` → `spring.data.redis.*`). Update `@ConstructorBinding` usage.
-   **Phase 5 - Testing & Validation:** Run full test suite. Check Actuator endpoint changes.
    Verify metrics/tracing setup (Sleuth → Micrometer Tracing). Performance baseline comparison.

### 7.5 When to Choose Which Version

| Scenario | Recommended Version | Reason |
|----------|---------------------|--------|
| New project | **3.3+** | Latest features, virtual threads, long support |
| Existing 2.7 app | Plan migration to 3.x | 2.7 OSS support ended Nov 2023 |
| Legacy Java 8/11 app | Stay on 2.7 until Java upgrade | Can't run 3.x on older Java |
| High-density deployment | 3.x + Native Image | 10x resource reduction |
| Reactive stack needed | 3.x | Better WebFlux/R2DBC maturity |
| Simple CRUD monolith | 3.x still preferred | Future-proof, better tooling |

---

## 8. Interview Communication Strategy

### 8.1 Answer Structure for Technical Questions
Use the **"Concept → Implementation → Trade-off"** framework:

> **Q: "How do you handle transactions in Spring Boot?"**
> 
> **Concept:** "Spring provides declarative transaction management via AOP proxies. The `@Transactional` annotation
    defines transaction boundaries, propagation behavior, and isolation levels."
> 
> **Implementation:** "I typically use `@Transactional(readOnly = true)` for queries and
    `@Transactional(rollbackFor = BusinessException.class)` for commands. For complex flows, I use `REQUIRES_NEW` for
    audit logs that must persist even if main transaction rolls back."
> 
> **Trade-off:** "However, self-invocation bypasses the proxy, so internal method calls won't be transactional. Also,
    `@Transactional` on private methods doesn't work. For fine-grained control, I sometimes use `TransactionTemplate`
    programmatically."

### 8.2 Red Flags That Signal Junior Level
-   ❌ "I just add `@Transactional` everywhere"
-   ❌ Using field injection (`@Autowired` on fields)
-   ❌ Not knowing difference between `@Component`, `@Service`, `@Repository`
-   ❌ Saying "RestTemplate is fine for new projects" (it's in maintenance mode)
-   ❌ Not understanding N+1 problem or how to fix it
-   ❌ Confusing `@Configuration` with `@Component`
-   Never having used Actuator or profiling tools

### 8.3 Questions to Ask the Interviewer
-   "What Spring Boot version are you running, and what's the migration plan?"
-   "How do you handle database migrations? Flyway/Liquibase?"
-   "What's your testing strategy? Unit vs integration test ratio?"
-   "Do you use reactive programming (WebFlux) or traditional MVC?"
-   "How do you monitor production applications? APM tools?"
-   "Are you moving toward native images or virtual threads?"

---

## 9. Study Checklist

### Must-Know (Senior Level)
- [ ] Bean lifecycle & scopes (thread safety implications)
- [ ] AOP proxy mechanism & self-invocation pitfall
- [ ] Transaction propagation & isolation levels
- [ ] N+1 problem & solutions (EntityGraph, JOIN FETCH, DTO projection)
- [ ] Auto-configuration internals & custom auto-config creation
- [ ] Security filter chain & OAuth2/JWT implementation
- [ ] Test slices & Testcontainers usage
- [ ] Actuator endpoints & Micrometer metrics
- [ ] Spring Boot 3.x breaking changes (Jakarta, Java 17)
- [ ] Connection pool tuning (HikariCP parameters)

### Good-to-Know
- [ ] GraalVM native image compilation & limitations
- [ ] Virtual threads (Project Loom) integration
- [ ] R2DBC & reactive data access
- [ ] Spring Cloud Gateway & service mesh patterns
- [ ] Event-driven architecture with ApplicationEvents
- [ ] Batch processing with Spring Batch
- [ ] GraphQL with Spring for GraphQL

### Practical Exercises
- [ ] Build REST API with validation, global error handling, OpenAPI docs
- [ ] Implement OAuth2 resource server with JWT validation
- [ ] Create custom starter with auto-configuration
- [ ] Optimize slow endpoint (profile → identify bottleneck → fix)
- [ ] Write integration tests with Testcontainers (PostgreSQL + Redis)
- [ ] Migrate sample app from Boot 2.7 to 3.3 (handle Jakarta namespace)
- [ ] Configure circuit breaker with Resilience4j
- [ ] Set up distributed tracing with Micrometer + OTel

---

## 10. Common Interview Questions & Model Answers

### 10.1 Spring Core Questions

**Q1: "Explain the difference between `ApplicationContext` and `BeanFactory`."**
-   `BeanFactory` is the basic container: lazy bean loading, basic DI.
-   `ApplicationContext` extends `BeanFactory`: adds AOP, i18n, event publishing,
    resource loading, BeanPostProcessor auto-registration.
-   **Senior answer:** "I always use `ApplicationContext`. The lazy loading in `BeanFactory`
    sounds nice, but it means errors surface at runtime instead of startup. `ApplicationContext`
    catches misconfiguration early, which is critical in production."

**Q2: "Why is constructor injection preferred over field injection?"**
-   **Immutability:** Fields can be `final`, ensuring dependencies don't change after construction.
-   **Testability:** No need for reflection-based injection in tests; just pass mocks in constructor.
-   **Explicit dependencies:** All required dependencies are visible in constructor signature.
-   **Null safety:** Spring validates all constructor args are provided; no `@Autowired(required=false)`
    surprise.
-   **Senior answer:** "Constructor injection makes dependencies explicit and immutable. When I
    see a class with 10 `@Autowired` fields, I know it's doing too much. Constructor injection
    naturally limits that because a 10-arg constructor is a design smell."

**Q3: "What happens when two beans have the same type? How do you resolve it?"**
-   **`@Primary`:** Marks the default bean when multiple candidates exist.
-   **`@Qualifier("beanName")`:** Specifies which bean to inject by name.
-   **Custom qualifier annotations:** `@Qualifier` + `@Target` + `@Retention` for domain-specific
    selection (e.g., `@CacheDataSource`, `@MainDataSource`).
-   **Senior answer:** "I prefer custom qualifier annotations over `@Qualifier("name")`
    because string-based qualifiers are fragile — rename the bean and the injection breaks.
    Custom annotations like `@ProductionDataSource` are type-safe and self-documenting."

**Q4: "Explain the bean lifecycle in Spring."**
-   Instantiation → Populate properties → `BeanNameAware`/`BeanFactoryAware`/`ApplicationContextAware`
    → `@PostConstruct` → `InitializingBean.afterPropertiesSet()` → Custom init method →
    Ready for use → `@PreDestroy` → `DisposableBean.destroy()` → Custom destroy method.
-   **Senior answer:** "I use `@PostConstruct` for initialization and `@PreDestroy` for cleanup.
    They're JSR-250 standard, not Spring-specific. I avoid `InitializingBean` because it couples
    code to Spring's API. If I need finer control, I use `BeanPostProcessor` to intercept all
    beans of a certain type."

**Q5: "What is the N+1 problem in JPA and how do you fix it?"**
-   **Problem:** Fetching 1 parent entity triggers N additional queries for N child entities.
    Example: `List<Order>` → each `Order.getItems()` triggers a separate SELECT.
-   **Solutions:**
    -   `@EntityGraph(attributePaths = "items")` — fetch graph at query level.
    -   `JOIN FETCH` in JPQL: `SELECT o FROM Order o JOIN FETCH o.items`.
    -   DTO projections — select only needed columns, no entity hydration.
    -   `@BatchSize(size = 50)` — Hibernate loads collections in batches.
-   **Senior answer:** "I profile every query in integration tests with Hibernate statistics
    enabled (`spring.jpa.properties.hibernate.generate_statistics=true`). For read-heavy paths,
    I use DTO projections. For write paths, I use `@EntityGraph`. I never rely on EAGER loading
    — it's a global setting that causes N+1 everywhere."

### 10.2 Spring Boot Specific Questions

**Q6: "How does Spring Boot auto-configuration work internally?"**
-   `@SpringBootApplication` = `@EnableAutoConfiguration` + `@ComponentScan` +
    `@Configuration`.
-   `@EnableAutoConfiguration` triggers `AutoConfigurationImportSelector`, which loads
    candidates from `META-INF/spring/org.springframework.boot.autoconfigure.AutoConfiguration.
    imports` (Boot 3.x) or `spring.factories` (Boot 2.x).
-   Each auto-config class uses `@Conditional` annotations to decide if it should apply:
    `@ConditionalOnClass` (classpath check), `@ConditionalOnMissingBean` (no user-defined bean),
    `@ConditionalOnProperty` (config property check).
-   **Senior answer:** "Auto-configuration is just `@Configuration` classes with conditions.
    User-defined beans always take priority via `@ConditionalOnMissingBean`. I can debug what
    applied with `--debug` flag or `/actuator/conditions`. When writing custom starters, I always
    include a `@ConditionalOnMissingBean` so users can override defaults."

**Q7: "What is the difference between `@Component`, `@Service`, and `@Repository`?"**
-   **`@Component`:** Generic stereotype. Marks any class as a Spring-managed bean.
-   **`@Service`:** Semantically marks a service layer class. No additional behavior.
-   **`@Repository`:** Marks a DAO/persistence class. **Key difference:** enables automatic
    `PersistenceExceptionTranslationPostProcessor` — converts native DB exceptions into Spring's
    `DataAccessException` hierarchy.
-   **Senior answer:** "`@Repository` is the only one with actual added behavior — exception
    translation. `@Service` and `@Controller` are purely semantic. I use them for clarity and
    for AOP pointcuts that target specific layers (e.g., `@Around("@within(org.springframework
    .stereotype.Service)")` for service-layer logging)."

**Q8: "How do you handle exceptions in a Spring Boot REST API?"**
-   **Local:** `@ExceptionHandler` in a single controller. Limited scope.
-   **Global:** `@RestControllerAdvice` + `@ExceptionHandler`. Centralized, consistent.
-   **RFC 7807 (Boot 3.x):** Return `ProblemDetail` for machine-readable error responses.
-   **Best practices:** Always return consistent error structure (code, message, timestamp).
    Never expose stack traces in production. Log the full exception, return sanitized message.
-   **Senior answer:** "I use `@RestControllerAdvice` with RFC 7807 `ProblemDetail` in Boot 3.x.
    Each business exception type has its own handler. I include a correlation ID in error
    responses so support can trace the issue. In Boot 2.x, I built a custom `ErrorResponse`
    DTO that mirrors RFC 7807 structure."

**Q9: "Explain `@Transactional` propagation levels with real examples."**
-   **REQUIRED (default):** Join existing transaction; create new if none exists. Most common.
    Use for: standard service methods.
-   **REQUIRES_NEW:** Always create new independent transaction. Suspends existing one.
    Use for: audit logging that must persist even if main flow fails.
-   **NESTED:** Create nested transaction (savepoint) within existing. Rollback only nested
    on failure; outer continues. Use for: retryable sub-operations. Requires DB savepoint support.
-   **SUPPORTS:** Join existing if present; execute non-transactionally if none. Use for: read
    methods that don't require a transaction.
-   **NOT_SUPPORTED:** Always execute non-transactionally. Suspends existing transaction.
    Use for: operations that must not be transactional (e.g., sending notifications).
-   **Senior answer:** "I default to REQUIRED for commands and SUPPORTS or readOnly REQUIRED
    for queries. I use REQUIRES_NEW sparingly — only for audit logs. NESTED is useful but
    requires savepoint support, which some DBs don't offer. I never use MANDATORY or NEVER
    in practice."

**Q10: "What are the common `@Transactional` pitfalls?"**
-   **Self-invocation:** Calling `this.methodB()` from `this.methodA()` bypasses the proxy.
    `methodB`'s `@Transactional` is ignored. Fix: inject self-reference, use `AopContext`,
    or refactor into separate service.
-   **Private methods:** Proxies can't intercept private methods. `@Transactional` on private
    is silently ignored.
-   **Checked exceptions:** Default rollback only on `RuntimeException` and `Error`. Use
    `rollbackFor = Exception.class` or specific checked exceptions.
-   **Read-only optimization:** `@Transactional(readOnly = true)` hints to Hibernate to skip
    dirty checking. Also signals to DB driver for read optimizations. Doesn't prevent writes.
-   **Senior answer:** "Self-invocation is the #1 pitfall I see in production. When I need
    internal transactional calls, I inject the service into itself (`@Lazy @Autowired
    OrderService self`) or use `TransactionTemplate` for programmatic control. I always specify
    `rollbackFor` explicitly — relying on defaults is a bug waiting to happen."

### 10.3 Security Questions

**Q11: "How does Spring Security's filter chain work?"**
-   `SecurityFilterChain` is a list of filters applied before the request reaches the controller.
    Each filter has a specific role: `UsernamePasswordAuthenticationFilter`,
    `JwtAuthenticationFilter`, `ExceptionTranslationFilter`, `FilterSecurityInterceptor`.
-   Order matters — authentication must come before authorization.
-   In Boot 3.x, `HttpSecurity` DSL configures the chain declaratively.
-   **Senior answer:** "Spring Security is a chain of servlet filters. The `DelegatingFilterProxy`
    bridges the Servlet and Spring worlds. I customize the chain by adding filters at specific
    positions: `addFilterBefore(jwtFilter, UsernamePasswordAuthenticationFilter.class)`.
    I always disable CSRF for stateless REST APIs and enable it for web apps with sessions."

**Q12: "How do you implement JWT authentication in Spring Boot?"**
-   **Flow:** Client sends JWT in `Authorization: Bearer <token>` header.
    `JwtAuthenticationFilter` extracts token → validates signature/claims → creates
    `Authentication` object → sets in `SecurityContextHolder`.
-   **Components:** `JwtDecoder` (validates token), `JwtAuthenticationProvider` (converts claims
    to authorities), custom `OncePerRequestFilter` for token extraction.
-   **Boot 3.x:** Use `oauth2ResourceServer().jwt()` for built-in JWT support.
-   **Senior answer:** "In Boot 3.x, I use the built-in OAuth2 resource server with
    `JwtDecoder`. For custom claims, I implement `JwtAuthenticationConverter` to extract
    roles from the token. I always store JWTs in cookies with `SameSite=Strict` for web apps,
    and use Bearer header for APIs. Refresh tokens go to Redis with short TTL."

### 10.4 Architecture & Design Questions

**Q13: "When would you choose WebFlux over traditional MVC?"**
-   **MVC (servlet-based):** Thread-per-request model. Simpler, more debugging tools, wider
    ecosystem. Best for CRUD apps, moderate concurrency.
-   **WebFlux (reactive):** Event-loop model (Netty). Handles massive concurrency with few
    threads. Best for streaming, real-time, high-concurrency I/O-bound apps.
-   **Trade-off:** WebFlux is harder to debug, test, and reason about. Reactive operators are
    complex. JDBC is blocking — must use R2DBC. Existing blocking libraries are problematic.
-   **Senior answer:** "I default to MVC unless I have a clear concurrency need (>10K
    simultaneous connections). Virtual threads in Boot 3.3+ make MVC competitive for high
    concurrency without the reactive complexity. I use WebFlux only for streaming endpoints
    or when the downstream services are all reactive."

**Q14: "How do you design a multi-module Spring Boot project?"**
-   **Module layers:** API (DTOs, facades) → Service (business logic) → Repository (data access)
    → Start (configuration, entry point). Each module has its own pom.xml.
-   **Dependency rule:** Start depends on Service; Service depends on Repository and API.
    API has no internal dependencies. Never let Repository depend on Service.
-   **Enforcement:** Use Maven multi-module structure. API module publishes as a separate
    artifact for external consumers.
-   **Senior answer:** "I separate modules by deployment unit and API contract. The API
    module contains only DTOs and interfaces — no implementation. This lets external consumers
    depend on the thin API jar instead of the full service. I use `spring-boot-starter-parent`
    for the root pom and module-specific BOMs for version alignment."

**Q15: "How do you implement caching in Spring Boot?"**
-   **`@Cacheable`:** Cache method result. Key based on parameters.
    `@Cacheable(value = "orders", key = "#orderId")`.
-   **`@CachePut`:** Update cache without affecting method execution.
-   **`@CacheEvict`:** Remove from cache. `allEntries = true` for full eviction.
-   **Cache backends:** Redis (distributed, persistent), Caffeine (local, high-performance),
    EhCache (local with disk persistence). Configure via `CacheManager`.
-   **Senior answer:** "I use a two-level cache: Caffeine (local, 5min TTL) for hot data,
    Redis (distributed, 1hr TTL) for shared data. For cache invalidation, I prefer event-driven
    eviction over TTL — when an order updates, I publish an event that evicts the specific key.
    I always set `spring.cache.type=none` in test profiles to avoid stale test data."

### 10.5 Performance & Production Questions

**Q16: "How do you optimize a slow Spring Boot endpoint?"**
-   **Step 1: Measure:** Add Micrometer `@Timed` or custom timer. Check Actuator `/metrics`.
    Use APM tools (Arthas, Dynatrace) to identify bottleneck.
-   **Step 2: Identify:** Is it DB (slow query), network (external API), or CPU (heavy logic)?
    Enable Hibernate statistics to count queries. Check connection pool metrics.
-   **Step 3: Fix:**
    -   DB: Add indexes, fix N+1, use DTO projections, keyset pagination.
    -   Network: Async calls, caching external responses, batch API calls.
    -   CPU: Cache computations, optimize algorithms, offload to background.
-   **Senior answer:** "I start with observability — every endpoint has `@Timed`. When latency
    spikes, I check `/actuator/metrics/http.server.requests` for p99, then drill into DB query
    times. In one case, I found an N+1 generating 500 queries per request. Switching to
    `@EntityGraph` cut latency from 2s to 50ms."

**Q17: "How do you handle circuit breakers in Spring Boot?"**
-   **Resilience4j** is the recommended library (Spring Cloud Netflix Hystrix is deprecated).
-   **Circuit Breaker states:** Closed (normal) → Open (failing, reject all) → Half-Open
    (trial requests to check recovery).
-   **Configuration:** `failureRateThreshold=50`, `waitDurationInOpenState=60s`,
    `permittedNumberOfCallsInHalfOpenState=10`, `slidingWindowSize=100`.
-   **Fallback:** Define fallback method with same signature. Returns default/cached response.
-   **Senior answer:** "I configure circuit breakers per downstream service, not per method.
    For critical paths (payment), I use aggressive thresholds (10% failure → open). For
    non-critical (recommendations), I use lenient thresholds (50% failure). Fallbacks return
    cached data or graceful degradation, never null."

**Q18: "What monitoring and observability do you set up for production?"**
-   **Metrics:** Micrometer → Prometheus → Grafana. Key metrics: request latency (p50/p95/p99),
    error rate, DB connection pool usage, JVM memory/GC, thread pool saturation.
-   **Tracing:** Micrometer Tracing → OpenTelemetry → Jaeger/Zipkin. Correlate requests across
    services. Identify slow spans in distributed calls.
-   **Logging:** Structured JSON logging (Logback + `logstash-logback-encoder`). Correlation ID
    in MDC for request tracing. Centralized in Elasticsearch/Kibana.
-   **Health:** Actuator `/health` with custom indicators (DB, Redis, external APIs).
    Kubernetes liveness/readiness probes mapped to Actuator.
-   **Senior answer:** "I implement the three pillars: metrics (Prometheus/Grafana dashboards),
    traces (OTel/Jaeger for cross-service correlation), and logs (JSON format with traceId in
    MDC). Every service has a `/health/readiness` probe for Kubernetes. I set alerts on p99
    latency > 2s and error rate > 1%."

### 10.6 Version-Specific Questions

**Q19: "What are the biggest changes in Spring Boot 3.x vs 2.x?"**
-   **Jakarta namespace:** `javax.*` → `jakarta.*`. All imports must change. This is the #1
    migration pain point. Every dependency must have a Jakarta-compatible version.
-   **Java 17 minimum:** No more Java 8/11 support. Leverage sealed classes, records, pattern
    matching for switch in domain modeling.
-   **Observability:** Spring Cloud Sleuth → Micrometer Tracing + OpenTelemetry. Single API
    for both metrics and traces. `Observation` API unifies them.
-   **Native Image:** Production-ready GraalVM support. AOT processing at compile time.
    50MB binary, <100ms startup. Trade-off: limited reflection, longer build.
-   **Configuration:** `spring.factories` → `.imports` files. Faster startup, more modular.
-   **Senior answer:** "The Jakarta namespace change is the biggest hurdle — every import
    and every dependency changes. I plan migration in phases: first upgrade Java, then update
    dependencies to Jakarta-compatible versions, then switch Spring Boot version. I use OpenRewrite
    recipes for automated `javax` → `jakarta` refactoring."

**Q20: "How do virtual threads change Spring Boot development?"**
-   **What:** Virtual threads are JVM-managed lightweight threads (Project Loom, Java 21+).
    1M+ concurrent virtual threads with ~1KB stack vs 1MB platform thread.
-   **Boot 3.3+:** `spring.threads.virtual.enabled=true` enables virtual threads for
    Tomcat request handling and `@Async` tasks.
-   **Impact:** Many use cases that required WebFlux (high concurrency with few threads) can
    now use traditional MVC with virtual threads. Simpler code, same concurrency.
-   **Caveats:** Virtual threads don't help with CPU-bound work — they benefit I/O-bound work
    (DB calls, external APIs). Pinning issues with `synchronized` blocks — prefer
    `ReentrantLock`.
-   **Senior answer:** "Virtual threads are the biggest shift since reactive programming.
    For I/O-bound services (most CRUD APIs), I can now use simple MVC code with virtual threads
    instead of complex WebFlux chains. I still use WebFlux for streaming, but for 90% of
    endpoints, virtual threads + MVC is simpler and equally performant."

---

## 11. Final Tips

1.  **Understand the "Why":** Don't just memorize annotations; understand the problems they
    solve and their trade-offs.
2.  **Read Source Code:** Spring Framework source is well-documented. Reading
    `@Transactional` or auto-config implementation builds deep understanding.
3.  **Build Projects:** Tutorial hell doesn't prepare you for interviews. Build something
    broken, debug it, fix it.
4.  **Stay Current:** Follow Spring Blog, Baeldung, Vlad Mihalcea, Josh Long's tweets.
    Spring evolves fast.
5.  **Explain Clearly:** Technical depth + communication skills = senior engineer. Practice
    explaining complex concepts simply.
6.  **Know Your Resume:** Every project listed should have a story: challenge → solution →
    impact → lessons learned.

Good luck with your Spring Boot interviews! 🚀