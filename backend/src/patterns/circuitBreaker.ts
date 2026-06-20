/**
 * Circuit Breaker Pattern Implementation
 * Prevents cascading failures by stopping requests to failing services
 * States: CLOSED (normal) -> OPEN (failing) -> HALF_OPEN (testing) -> CLOSED
 */

type CircuitBreakerState = 'CLOSED' | 'OPEN' | 'HALF_OPEN';

interface CircuitBreakerConfig {
  failureThreshold?: number;      // Number of failures before opening (default: 5)
  resetTimeout?: number;           // Time in ms before attempting recovery (default: 30000)
  monitorInterval?: number;        // Check interval for state transitions (default: 5000)
  name: string;                   // Service name for logging
}

export class CircuitBreaker {
  private state: CircuitBreakerState = 'CLOSED';
  private failureCount = 0;
  private lastFailureTime: number | null = null;
  private successCount = 0;
  
  private config: Required<CircuitBreakerConfig>;

  constructor(config: CircuitBreakerConfig) {
    this.config = {
      failureThreshold: config.failureThreshold || 5,
      resetTimeout: config.resetTimeout || 30000,
      monitorInterval: config.monitorInterval || 5000,
      name: config.name || 'Service'
    };

    // Check state periodically
    this.startMonitoring();
  }

  /**
   * Check if the circuit breaker allows the request
   */
  canExecute(): boolean {
    this.checkStateTransition();
    
    if (this.state === 'OPEN') {
      console.warn(`[CircuitBreaker] ${this.config.name}: Circuit is OPEN. Request rejected.`);
      return false;
    }
    
    return true;
  }

  /**
   * Record a successful request
   */
  recordSuccess(): void {
    this.failureCount = 0;
    this.successCount++;

    if (this.state === 'HALF_OPEN' && this.successCount >= 2) {
      this.state = 'CLOSED';
      this.successCount = 0;
      console.log(`[CircuitBreaker] ${this.config.name}: Circuit CLOSED (recovered).`);
    }
  }

  /**
   * Record a failed request
   */
  recordFailure(): void {
    this.failureCount++;
    this.lastFailureTime = Date.now();
    this.successCount = 0;

    if (this.failureCount >= this.config.failureThreshold && this.state === 'CLOSED') {
      this.state = 'OPEN';
      console.error(
        `[CircuitBreaker] ${this.config.name}: Circuit OPEN after ${this.failureCount} failures.`
      );
    }
  }

  /**
   * Get current state for monitoring/debugging
   */
  getState() {
    return {
      state: this.state,
      failureCount: this.failureCount,
      lastFailureTime: this.lastFailureTime,
      serviceName: this.config.name
    };
  }

  /**
   * Check if state should transition
   */
  private checkStateTransition(): void {
    if (this.state === 'OPEN' && this.lastFailureTime) {
      const timeSinceFailure = Date.now() - this.lastFailureTime;
      
      if (timeSinceFailure >= this.config.resetTimeout) {
        this.state = 'HALF_OPEN';
        this.failureCount = 0;
        console.warn(`[CircuitBreaker] ${this.config.name}: Circuit HALF_OPEN (testing recovery).`);
      }
    }
  }

  /**
   * Start periodic monitoring (optional, mainly for diagnostics)
   */
  private startMonitoring(): void {
    setInterval(() => {
      this.checkStateTransition();
    }, this.config.monitorInterval);
  }
}

/**
 * Circuit breaker instances per service
 */
export const circuitBreakers = {
  product: new CircuitBreaker({
    name: 'Product Service',
    failureThreshold: 5,
    resetTimeout: 30000
  }),
  auth: new CircuitBreaker({
    name: 'Auth Service',
    failureThreshold: 5,
    resetTimeout: 30000
  }),
  order: new CircuitBreaker({
    name: 'Order Service',
    failureThreshold: 5,
    resetTimeout: 30000
  })
};
