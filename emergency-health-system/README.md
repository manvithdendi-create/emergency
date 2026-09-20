# Emergency Health Alert & Response System

A production-ready emergency health alert and response system built with React, Supabase, and modern web technologies.

## Features

- **Four User Roles**: Patient, Hospital, Responder, Admin
- **Real-time Emergency Tracking**: Live updates via Supabase Realtime
- **SOS Emergency Workflow**: One-tap emergency activation with GPS location
- **Hospital Queue Management**: Accept emergencies, assign responders
- **Responder Mobile Interface**: Live navigation, status updates
- **Admin Dashboard**: Analytics, user management, audit logs
- **Secure**: Row Level Security (RLS) policies, JWT authentication
- **Responsive Design**: Mobile-first, accessible UI

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite
- **Styling**: Tailwind CSS
- **Backend**: Supabase (PostgreSQL, Auth, Realtime, Storage, Edge Functions)
- **Maps**: Leaflet / React-Leaflet (OpenStreetMap)
- **Forms**: React Hook Form + Zod validation
- **State Management**: React Context + Hooks

## Prerequisites

- Node.js 18+
- npm or yarn
- Supabase account
- Google Maps API key (optional, for enhanced maps)

## Quick Start

### 1. Clone and Install

```bash
cd emergency-health-system
npm install
```

### 2. Supabase Setup

1. Create a new Supabase project at [supabase.com](https://supabase.com)
2. Go to Settings → API to get your project URL and anon key
3. Copy `.env.example` to `.env` and fill in your credentials:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Database Migration

1. In Supabase Dashboard, go to SQL Editor
2. Run the migration file: `supabase/migrations/001_initial_schema.sql`
3. This creates all tables, indexes, RLS policies, triggers, and functions

### 4. Seed Data (Optional)

Run the seed file to populate with demo data:

```sql
-- In Supabase SQL Editor
-- First create demo users in Authentication → Users
-- Then run: supabase/seed/seed.sql
```

### 5. Edge Functions Deployment

Deploy the Edge Functions for notifications:

```bash
# Install Supabase CLI
npm install -g supabase

# Login and link project
supabase login
supabase link --project-ref your-project-ref

# Deploy functions
supabase functions deploy send-notification
supabase functions deploy process-emergency
supabase functions deploy notify-responders
```

### 6. Start Development Server

```bash
npm run dev
```

Visit `http://localhost:3000`

## Demo Credentials

After running seed data, use these credentials:

| Role | Email | Password |
|------|-------|----------|
| Patient | patient@demo.com | password123 |
| Hospital | hospital@demo.com | password123 |
| Responder | responder@demo.com | password123 |
| Admin | admin@demo.com | password123 |

## Project Structure

```
emergency-health-system/
├── public/
├── src/
│   ├── components/
│   │   ├── ui/           # Reusable UI components
│   │   └── Layout.tsx    # Main layout with sidebar
│   ├── context/
│   │   ├── AuthContext.tsx      # Authentication state
│   │   └── EmergencyContext.tsx # Emergency realtime state
│   ├── hooks/
│   │   ├── useGeolocation.ts    # Browser geolocation
│   │   ├── useSupabase.ts       # Supabase RPC hooks
│   │   └── useToast.ts          # Toast notifications
│   ├── pages/
│   │   ├── auth/           # Login, Register, Password reset
│   │   ├── patient/        # Patient portal pages
│   │   ├── hospital/       # Hospital portal pages
│   │   ├── responder/      # Responder portal pages
│   │   └── admin/          # Admin portal pages
│   ├── services/
│   │   ├── supabase.ts     # Supabase client
│   │   └── database.types.ts # TypeScript types
│   ├── styles/
│   │   └── index.css       # Global styles + Tailwind
│   ├── types/
│   │   └── index.ts        # Shared TypeScript types
│   ├── utils/
│   │   └── helpers.ts      # Utility functions
│   ├── App.tsx             # Main app with routing
│   └── main.tsx            # Entry point
├── supabase/
│   ├── migrations/
│   │   └── 001_initial_schema.sql  # Complete database schema
│   ├── functions/          # Edge Functions
│   │   ├── send-notification/
│   │   ├── process-emergency/
│   │   └── notify-responders/
│   └── seed/
│       └── seed.sql        # Demo data
├── package.json
├── tsconfig.json
├── vite.config.ts
├── tailwind.config.js
└── README.md
```

## Database Schema

Key tables with RLS policies:

- **profiles**: User profiles linked to Supabase Auth
- **emergency_contacts**: Patient emergency contacts
- **hospitals**: Hospital information and capacity
- **responders**: Responder profiles and availability
- **emergencies**: Emergency incidents with full lifecycle
- **emergency_responses**: Responder activity log
- **notifications**: User notifications
- **audit_logs**: Security audit trail

## Role Permissions

| Resource | Patient | Hospital | Responder | Admin |
|----------|---------|----------|-----------|-------|
| Own Profile | R/W | R/W | R/W | R/W |
| Emergency Contacts | R/W | - | - | R |
| Own Emergencies | R/W | - | - | R/W |
| Nearby Emergencies | - | R | - | R |
| Assigned Emergencies | - | R/W | R/W | R/W |
| All Emergencies | - | - | - | R/W |
| Responders | - | R/W (own) | - | R/W |
| Hospitals | - | R/W (own) | - | R/W |
| Users | - | - | - | R/W |
| Audit Logs | - | - | - | R |

## Emergency Lifecycle

1. **Patient presses SOS** → Confirmation screen
2. **GPS Location captured** → Browser Geolocation API
3. **Emergency created** → Supabase database
4. **Real-time broadcast** → Supabase Realtime
5. **Hospitals notified** → Edge Function
6. **Hospital accepts** → Status: `accepted`
7. **Responder assigned** → Status: `on_the_way`
8. **Responder en route** → Live location tracking
9. **Responder arrives** → Status: `arrived`
10. **Patient transported** → Status: `resolved`

## Environment Variables

```env
# Required
VITE_SUPABASE_URL=your-project-url
VITE_SUPABASE_ANON_KEY=your-anon-key

# Optional - for enhanced maps
VITE_GOOGLE_MAPS_API_KEY=your-google-maps-key
```

## Production Deployment

### Build

```bash
npm run build
```

### Deploy to Vercel/Netlify

1. Connect your repository
2. Add environment variables
3. Deploy

### Supabase Production Checklist

- [ ] Enable Row Level Security on all tables
- [ ] Configure Auth providers (Email, OAuth)
- [ ] Set up SMTP for password reset emails
- [ ] Configure Storage buckets for avatars/documents
- [ ] Set up Edge Functions with service role key
- [ ] Enable Realtime for required tables
- [ ] Configure CORS for your domain
- [ ] Set up database backups
- [ ] Configure monitoring and alerts

## Security Features

- **Row Level Security**: All data access controlled by PostgreSQL policies
- **JWT Authentication**: Secure token-based auth with refresh
- **Role-based Access**: Strict permissions per user role
- **Audit Logging**: All critical actions logged
- **Secure Edge Functions**: Service role key only in backend
- **Input Validation**: Zod schemas on all forms

## Accessibility

- WCAG 2.1 AA compliant
- Semantic HTML
- ARIA labels and roles
- Keyboard navigation
- High contrast colors
- Focus indicators
- Screen reader support

## Browser Support

- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+
- Mobile browsers (iOS Safari, Chrome Android)

## API Reference

### Supabase RPC Functions

```sql
-- Get nearby hospitals
get_nearby_hospitals(user_lat, user_lng, radius_km, limit_count)

-- Get available responders
get_available_responders(hospital_id, lat, lng, radius_km)

-- Assign responder to emergency
assign_responder_to_emergency(emergency_id, responder_id, hospital_id)

-- Update emergency status
update_emergency_status(emergency_id, new_status, user_id, user_role)

-- Log audit event
log_audit_event(user_id, action, entity_type, entity_id, old_data, new_data)
```

### Realtime Subscriptions

```typescript
// Emergency updates
supabase.channel('emergencies_changes')
  .on('postgres_changes', { event: '*', schema: 'public', table: 'emergencies' }, callback)
  .subscribe()

// Responder location updates
supabase.channel('responders_changes')
  .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'responders' }, callback)
  .subscribe()
```

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run lint and typecheck: `npm run lint && npm run typecheck`
5. Submit a pull request

## License

MIT License - see LICENSE file for details

## Support

For issues and questions:
- GitHub Issues: [Create an issue](https://github.com/your-repo/issues)
- Documentation: [Wiki](https://github.com/your-repo/wiki)
- Email: support@emergencyalert.example.com

---

Built with ❤️ for emergency response teams worldwide