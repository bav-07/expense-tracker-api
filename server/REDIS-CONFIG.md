# Redis Configuration Guide

## TLS Configuration for Production

The Redis configuration has been updated to support TLS connections, which are required for most production Redis services including Redis Cloud, AWS ElastiCache, and others.

## Configuration Options

### Method 1: Individual Settings (Recommended)
```bash
REDIS_HOST=your-redis-host.redis-cloud.com
REDIS_PORT=10355
REDIS_PASSWORD=your_password_here
```

### Method 2: Connection URL
```bash
REDIS_URL=redis://default:password@host:port
# or for TLS:
REDIS_URL=rediss://default:password@host:port
```

## TLS Support

The system automatically enables TLS for:
- Redis Cloud instances (domains containing `redis-cloud.com`)
- Production environments with TLS-enabled Redis providers

### Manual TLS Configuration

If you need custom TLS settings, you can modify the `initializeRedis()` method in `redisTokenManager.ts`:

```typescript
redisConfig.tls = {
  rejectUnauthorized: false, // For self-signed certificates
  // ca: fs.readFileSync('path/to/ca-cert.pem'), // Custom CA
  // cert: fs.readFileSync('path/to/client-cert.pem'), // Client cert
  // key: fs.readFileSync('path/to/client-key.pem'), // Client key
};
```

## Redis Providers & TLS Requirements

### Redis Cloud
- **TLS Required**: Yes (auto-configured)
- **Port**: Usually 10000+ range
- **URL Format**: `redis://username:password@host:port`

### AWS ElastiCache
- **TLS Required**: Optional (configure if enabled)
- **Port**: 6379 (non-TLS) or 6380 (TLS)
- **URL Format**: `redis://host:port` or `rediss://host:port`

### Azure Cache for Redis
- **TLS Required**: Yes (auto-configured)
- **Port**: 6380
- **URL Format**: `rediss://host:port`

### DigitalOcean Managed Redis
- **TLS Required**: Yes
- **Port**: 25061
- **URL Format**: `rediss://username:password@host:port`

## Development vs Production

### Development (Local Redis)
```bash
# No TLS required
REDIS_HOST=localhost
REDIS_PORT=6379
# No password needed for local development
```

### Production
```bash
# TLS automatically enabled for redis-cloud.com domains
REDIS_HOST=your-instance.redis-cloud.com
REDIS_PORT=10355
REDIS_PASSWORD=your_secure_password
```

## Troubleshooting

### Connection Errors
1. **Certificate errors**: Set `rejectUnauthorized: false` for development
2. **Timeout errors**: Check firewall and network connectivity
3. **Auth errors**: Verify username/password combination

### Testing Connection
```bash
# Test Redis connection with redis-cli
redis-cli -h your-host -p your-port -a your-password --tls

# Or without TLS
redis-cli -h your-host -p your-port -a your-password
```

## Security Best Practices

1. **Always use TLS in production**
2. **Use strong passwords** (32+ characters)
3. **Restrict access** by IP/network when possible
4. **Rotate passwords** regularly
5. **Monitor connection logs** for suspicious activity

## Fallback Behavior

The system includes automatic fallback to in-memory storage if Redis is unavailable:
- Development: Falls back gracefully with warnings
- Production: Logs errors but continues operation (not recommended for scale)