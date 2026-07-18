# Cloud & DevOps Interview Prep Guide

## 1. Containerization & Docker

### Docker Basics
- Image: Immutable template for containers
- Container: Running instance of an image
- Registry: Storage for Docker images
- Dockerfile: Instructions to build images
- Docker Compose: Multi-container orchestration

### Multi-Stage Builds
- Build stage: Compile with Maven and JDK
- Run stage: Copy artifacts to JRE-only image
- Reduces image size from 400MB to 100MB
- Smaller images deploy faster and safer

### Dockerfile Best Practices
- Use specific base image tags, not :latest
- Minimize layers by combining commands
- Order commands by change frequency
- Least frequent changes at top of file

### Docker Compose Usage
- Define multi-container local development
- Specify service dependencies clearly
- Configure health checks for services
- Mount volumes for persistent data

## 2. Kubernetes Fundamentals

### Core Objects
- Pod: Smallest deployable unit in K8s
- Deployment: Manages pod replicas and updates
- Service: Provides stable network access
- ConfigMap: Stores non-sensitive configuration
- Secret: Stores sensitive configuration data

### Key Concepts
- Labels: Key-value pairs to identify resources
- Selectors: Filter resources by label criteria
- Namespaces: Isolate resources within cluster
- Health Probes: Liveness, readiness, startup

### Scaling Strategies
- Horizontal Pod Autoscaler (HPA)
- Scales based on CPU, memory, custom metrics
- Cluster Autoscaler adds nodes when needed
- Define min and max replica counts properly

### Networking Options
- ClusterIP: Internal service communication
- NodePort: External access via node IP
- LoadBalancer: Cloud provider load balancer
- Ingress: HTTP routing with host/path rules

### Practical Deployment
- Deploy Spring Boot as Deployments
- Use 2+ replicas for high availability
- Configure HPA for auto-scaling needs
- Map readiness probe to Actuator endpoint
- Never use NodePort in production environments
- Always use Ingress for external routing

## 3. CI/CD Pipelines

### Pipeline Stages
1. Build: Compile source code and dependencies
2. Unit Test: Run fast isolated unit tests
3. Integration Test: Test component interactions
4. Security Scan: Check for vulnerabilities
5. Deploy to Staging: Deploy to test environment
6. Smoke Test: Verify basic functionality
7. Deploy to Production: Release to users

### CI/CD Tool Comparison
- Jenkins: Mature, flexible, self-hosted
- GitHub Actions: Cloud-native, simple setup
- GitLab CI: Integrated with GitLab platform
- Choose based on existing infrastructure

### Deployment Strategies

#### Rolling Update
- Gradual replacement of old pods
- Zero downtime during deployment
- Both versions run during transition
- Default strategy in Kubernetes

#### Blue-Green Deployment
- Two identical production environments
- Switch traffic instantly between them
- Easy rollback by switching back
- Requires double the resources

#### Canary Deployment
- Deploy to small subset of traffic first
- Monitor metrics and error rates closely
- Gradually expand to more traffic
- Safest but slowest deployment method

#### Feature Flags
- Deploy code but disable features initially
- Enable features gradually per user group
- Decouples deployment from feature release
- Quick rollback without redeployment

### Practical Approach
- Use canary for critical services
- Deploy payment services to 5% traffic
- Monitor for 30 minutes before expanding
- Use feature flags for non-critical features
- Blue-green for simple affordable services

## 4. Infrastructure as Code

### Terraform Basics
- Declarative cloud resource provisioning
- State file tracks current infrastructure
- Modules enable code reusability
- Plan shows changes before applying

### Ansible Basics
- Configuration management tool
- Imperative playbook-based approach
- Good for application configuration
- Agentless architecture simplifies setup

### Tool Comparison
- Terraform: Provisioning cloud resources
- Create VPC, EKS clusters, databases
- Ansible: Configure servers and applications
- Install software, set configuration files

### Best Practices
- Store state remotely in S3 bucket
- Use DynamoDB for state locking
- Create reusable modules for patterns
- Version control all infrastructure code
- Test changes with terraform plan first

## 5. Monitoring & Observability

### Prometheus
- Pull-based metrics collection system
- Scrapes metrics from exposed endpoints
- Stores time-series data efficiently
- PromQL for powerful query language

### Grafana
- Visualization dashboard platform
- Connects to Prometheus data source
- Create custom dashboards easily
- Configure alert rules and notifications

### Key Dashboards
- Infrastructure: CPU, memory, disk usage
- Application: Request rate, latency, errors
- Business: Orders per minute, revenue
- Database: Connection pool, query times

### Alerting Strategy
- Alert on symptoms not causes
- High error rate is symptom to alert on
- High CPU is cause, investigate instead
- Page only for SLO violations

### SLA/SLO/SLI Definitions
- SLA: External contract with penalties
- SLO: Internal target like 99.9% uptime
- SLI: Actual measurement of service level
- Example SLI: successful requests / total

## 6. Security & Compliance

### Network Security
- VPC for network isolation
- Subnet segmentation for tiers
- Security groups control traffic flow
- WAF protects against web attacks
- DDoS protection for availability

### Identity Management
- IAM roles for service permissions
- Service accounts for applications
- RBAC for access control
- Follow least-privilege principle always

### Secrets Management
- Use HashiCorp Vault for secrets
- AWS Secrets Manager is alternative
- Never store secrets in code repository
- Inject secrets at runtime securely
- Avoid secrets in CI pipeline logs

### Container Security
- Scan images for known vulnerabilities
- Use Trivy or similar scanning tools
- Run containers as non-root user
- Use read-only filesystem where possible
- Limit container capabilities

### Compliance Requirements
- Maintain audit trails for actions
- Encrypt data at rest and in transit
- Implement key rotation policies
- Log all access attempts for review

## 7. Common Interview Questions

### Q1: How do you design CI/CD pipeline?
- Include build, test, security stages
- Add deployment to staging environment
- Run smoke tests before production
- Use canary or blue-green strategy

### Q2: Explain Kubernetes health probes
- Liveness: Restart container if unhealthy
- Readiness: Remove from service if not ready
- Startup: Wait for slow-starting containers
- Configure appropriate thresholds

### Q3: What deployment strategy do you use?
- Canary for critical payment services
- Blue-green for simple stateless services
- Feature flags for gradual feature rollout
- Rolling update as default strategy

### Q4: How do you handle secrets?
- Store in Vault or AWS Secrets Manager
- Inject at runtime via environment variables
- Never commit to code or config files
- Implement secret rotation policy

### Q5: How do you monitor production?
- Collect metrics with Prometheus
- Visualize with Grafana dashboards
- Alert on SLO violations immediately
- Correlate traces for debugging

### Q6: Explain Terraform state
- State file defines current infrastructure
- Store remotely in S3 for team access
- Use DynamoDB for state locking
- Never modify state file manually

### Q7: How do you optimize Docker images?
- Use multi-stage builds effectively
- Specify exact base image versions
- Minimize number of layers created
- Use JRE-only for runtime stage

### Q8: What is HPA in Kubernetes?
- Horizontal Pod Autoscaler
- Scales pods based on metrics
- Requires metrics-server installed
- Configure min and max replicas

### Q9: How do you handle zero-downtime?
- Use rolling update deployment strategy
- Configure readiness probes properly
- New pods must pass health checks
- Old pods terminated after new are ready

### Q10: Explain SLO vs SLA difference
- SLO is internal reliability target
- SLA is external contract with penalties
- SLO should be stricter than SLA
- Track SLI to measure against SLO

## 8. Final Checklist

- [ ] Can explain Docker multi-stage builds
- [ ] Understand Kubernetes core objects
- [ ] Know 3+ deployment strategies clearly
- [ ] Can design complete CI/CD pipeline
- [ ] Understand Terraform state management
- [ ] Know Prometheus and Grafana usage
- [ ] Understand SLO/SLI/SLA definitions
- [ ] Know secrets management best practices
- [ ] Can configure health probes properly
- [ ] Understand container security basics
