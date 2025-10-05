# Web Frontend Environment Configuration

## Development Setup

1. Copy the environment template:
   ```bash
   cp .env.example .env.local
   ```

2. Update `.env.local` with your local API URL (usually `http://localhost:4000`)

3. Start the development server:
   ```bash
   npm run dev
   ```

## Production Deployment

### Environment Variables Required

Set these environment variables in your production environment:

```bash
# Frontend API URL (publicly accessible)
NEXT_PUBLIC_API_URL=https://your-api-domain.com

# Backend API URL (for server-side requests)
API_URL=https://your-api-domain.com
```

### Deployment Platforms

#### Vercel
1. Set environment variables in your Vercel dashboard
2. Add both `NEXT_PUBLIC_API_URL` and `API_URL` with your production API URL

#### Netlify
1. Go to Site Settings > Environment Variables
2. Add both `NEXT_PUBLIC_API_URL` and `API_URL` with your production API URL

#### Docker
```dockerfile
ENV NEXT_PUBLIC_API_URL=https://your-api-domain.com
ENV API_URL=https://your-api-domain.com
```

#### Custom Server
```bash
export NEXT_PUBLIC_API_URL=https://your-api-domain.com
export API_URL=https://your-api-domain.com
npm run build
npm start
```

## Environment Variables Explained

- **`NEXT_PUBLIC_API_URL`**: Used by client-side code (browser) to make API requests
- **`API_URL`**: Used by Next.js server-side code for rewrites and SSR

Both should point to your backend API server.

## Security Notes

- Never commit `.env.local` or production `.env` files to git
- Use HTTPS URLs in production
- Ensure your API server has proper CORS configuration for your frontend domain