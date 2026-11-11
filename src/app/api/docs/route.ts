import { NextResponse } from 'next/server';

const openApiSpec = {
  openapi: '3.0.3',
  info: {
    title: 'Cinema Hall Ticket Booking System API',
    version: '1.0.0',
    description:
      'Production-grade REST API for Cinema Hall Ticket Booking with temporary seat locks, double-booking prevention, simulated payments, QR gate check-in, and audit logging.',
    contact: {
      name: 'Algions AI Labs Assessment',
    },
  },
  servers: [
    {
      url: 'http://localhost:3000/api',
      description: 'Local Development Server',
    },
  ],
  tags: [
    { name: 'Authentication', description: 'User registration, login, and session validation' },
    { name: 'Movies', description: 'Movie catalog and discovery' },
    { name: 'Shows', description: 'Showtimes, scheduling, and screen assignment' },
    { name: 'Seats & Holds', description: 'Seat maps, real-time availability, and temporary TTL locks' },
    { name: 'Bookings & Payments', description: 'Atomic booking confirmation, simulated payment, and cancellation' },
    { name: 'Tickets & Gate Entry', description: 'Single-use QR validation and check-in' },
    { name: 'Admin & Reports', description: 'Occupancy reports, financial reconciliation, and audit logs' },
  ],
  paths: {
    '/auth/register': {
      post: {
        tags: ['Authentication'],
        summary: 'Register new user account',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password', 'fullName'],
                properties: {
                  email: { type: 'string', example: 'customer@example.com' },
                  password: { type: 'string', example: 'password123' },
                  fullName: { type: 'string', example: 'Jane Doe' },
                  role: { type: 'string', enum: ['CUSTOMER', 'STAFF', 'ADMIN'], default: 'CUSTOMER' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Registration successful with auth token' },
          400: { description: 'Validation failed' },
          409: { description: 'Email already exists' },
        },
      },
    },
    '/auth/login': {
      post: {
        tags: ['Authentication'],
        summary: 'User login',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['email', 'password'],
                properties: {
                  email: { type: 'string', example: 'customer@example.com' },
                  password: { type: 'string', example: 'password123' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Login successful' },
          401: { description: 'Invalid credentials' },
        },
      },
    },
    '/movies': {
      get: {
        tags: ['Movies'],
        summary: 'List all movies with filtering and search',
        parameters: [
          { name: 'search', in: 'query', schema: { type: 'string' } },
          { name: 'genre', in: 'query', schema: { type: 'string' } },
          { name: 'language', in: 'query', schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'List of movies with active showtimes' },
        },
      },
    },
    '/shows/{id}/seats': {
      get: {
        tags: ['Seats & Holds'],
        summary: 'Get seat map and real-time availability for a show',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        responses: {
          200: { description: 'Screen seats with status (AVAILABLE, HELD, BOOKED)' },
          404: { description: 'Show not found' },
        },
      },
    },
    '/shows/{id}/hold': {
      post: {
        tags: ['Seats & Holds'],
        summary: 'Temporarily hold seats with TTL countdown (Prevents race conditions)',
        parameters: [
          { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
        ],
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['seatIds'],
                properties: {
                  seatIds: { type: 'array', items: { type: 'string' } },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Seats held successfully with expiration time' },
          409: { description: 'Conflict: Seat already held or booked' },
        },
      },
    },
    '/bookings': {
      post: {
        tags: ['Bookings & Payments'],
        summary: 'Confirm booking atomically and issue digital ticket',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['showId', 'seatIds'],
                properties: {
                  showId: { type: 'string' },
                  seatIds: { type: 'array', items: { type: 'string' } },
                  paymentMethod: { type: 'string', default: 'SIMULATED_CARD' },
                },
              },
            },
          },
        },
        responses: {
          201: { description: 'Booking confirmed and ticket issued' },
          409: { description: 'Double-booking conflict prevented' },
        },
      },
    },
    '/tickets/validate': {
      post: {
        tags: ['Tickets & Gate Entry'],
        summary: 'Scan and validate ticket QR code (Simulated single-use entry)',
        requestBody: {
          required: true,
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['qrValidationToken'],
                properties: {
                  qrValidationToken: { type: 'string', example: 'TCK-89AB12CD' },
                },
              },
            },
          },
        },
        responses: {
          200: { description: 'Entry Granted: Valid ticket redeemed' },
          400: { description: 'Entry Denied: Already redeemed or cancelled' },
          404: { description: 'Ticket not found' },
        },
      },
    },
    '/admin/reports': {
      get: {
        tags: ['Admin & Reports'],
        summary: 'Occupancy rates, revenue figures, and mathematical seat reconciliation',
        responses: {
          200: { description: 'Occupancy and reconciliation statistics' },
          403: { description: 'Forbidden (Requires ADMIN or STAFF)' },
        },
      },
    },
  },
};

export async function GET(request: Request) {
  const url = new URL(request.url);
  if (url.searchParams.get('format') === 'json') {
    return NextResponse.json(openApiSpec);
  }

  // Interactive Swagger UI CDN renderer
  const html = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <title>Cinema Booking System - Interactive API Documentation</title>
  <link rel="stylesheet" href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css" />
  <style>
    body { margin: 0; background: #0f172a; }
    .topbar { display: none !important; }
    .swagger-ui .info .title { color: #f8fafc; }
    .swagger-ui { filter: invert(88%) hue-rotate(180deg); }
    .swagger-ui .scheme-container { background: transparent; }
  </style>
</head>
<body>
  <div id="swagger-ui"></div>
  <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js" crossorigin></script>
  <script>
    window.onload = () => {
      window.ui = SwaggerUIBundle({
        spec: ${JSON.stringify(openApiSpec)},
        dom_id: '#swagger-ui',
        deepLinking: true,
        presets: [
          SwaggerUIBundle.presets.apis,
          SwaggerUIBundle.SwaggerUIStandalonePreset
        ],
      });
    };
  </script>
</body>
</html>`;

  return new NextResponse(html, {
    headers: { 'Content-Type': 'text/html; charset=utf-8' },
  });
}

