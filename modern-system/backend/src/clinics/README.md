# Clinics Module

## Overview

The Clinics module manages healthcare facilities in the Infant Vaccination Management System. It provides comprehensive functionality for clinic registration, geospatial search, staff assignment, and vaccine inventory management.

## Features

### 1. Clinic Management
- **Create Clinic**: Register new healthcare facilities with complete information
- **Update Clinic**: Modify clinic details including contact info, address, and facilities
- **Soft Delete**: Deactivate clinics while preserving historical data
- **Find Clinic**: Retrieve clinic by MongoDB ObjectId or human-readable clinic ID

### 2. Geospatial Features
- **GPS-based Search**: Find clinics near a specific location using latitude/longitude
- **Distance Calculation**: Automatically calculate distance from search point
- **Configurable Radius**: Search within specified distance (default: 10km)
- **2dsphere Index**: Optimized geospatial queries using MongoDB's geospatial indexes

### 3. Staff Assignment System
- **Assign Staff**: Link healthcare workers (doctors, nurses, admins) to clinics
- **Remove Staff**: Unassign staff members from clinics
- **Get Staff**: Retrieve all staff members assigned to a clinic
- **Find by Staff**: Get all clinics where a specific user is assigned
- **Duplicate Prevention**: Prevent assigning the same user multiple times

### 4. Vaccine Inventory Management
- **Update Inventory**: Add or remove vaccine stock with quantity tracking
- **Stock Validation**: Prevent negative stock levels
- **Multiple Vaccines**: Track different vaccine types independently
- **Last Restocked**: Automatic timestamp for inventory updates
- **Get Inventory**: Retrieve current stock levels for all vaccines

### 5. Search and Filtering
- **Zone/Wereda/Kebele**: Filter clinics by administrative divisions
- **Clinic Type**: Filter by facility type (hospital, health_center, clinic, health_post)
- **Name Search**: Case-insensitive name matching
- **Combined Filters**: Use multiple filters simultaneously

### 6. Statistics and Analytics
- **Clinic Statistics**: Aggregate data by clinic type
- **Facility Metrics**: Track cold storage, generator, and internet availability
- **Capacity Analysis**: Average capacity by clinic type

## API Endpoints

### Clinic CRUD Operations

#### Create Clinic
```http
POST /clinics
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Bole Health Center",
  "type": "health_center",
  "contactInfo": {
    "phone": "+251911234567",
    "email": "bole@health.gov.et",
    "emergencyContact": "+251911234568"
  },
  "address": {
    "zone": "Addis Ababa",
    "wereda": "Bole",
    "kebele": "03",
    "street": "Bole Road",
    "gpsCoordinates": {
      "lat": 9.0192,
      "lng": 38.7525
    }
  },
  "facilities": {
    "hasColdStorage": true,
    "hasGenerator": true,
    "hasInternet": true,
    "capacity": 150
  },
  "operatingHours": {
    "monday": { "open": "08:00", "close": "17:00" },
    "tuesday": { "open": "08:00", "close": "17:00" },
    "wednesday": { "open": "08:00", "close": "17:00" },
    "thursday": { "open": "08:00", "close": "17:00" },
    "friday": { "open": "08:00", "close": "17:00" },
    "saturday": { "open": "08:00", "close": "13:00" },
    "sunday": { "open": "00:00", "close": "00:00" }
  },
  "vaccineTypes": ["BCG", "OPV", "DPT", "Measles"]
}
```

#### Get All Clinics
```http
GET /clinics
Authorization: Bearer <token>
```

#### Get Clinic by ID
```http
GET /clinics/:id
Authorization: Bearer <token>
```

#### Update Clinic
```http
PATCH /clinics/:id
Authorization: Bearer <token>
Content-Type: application/json

{
  "name": "Updated Clinic Name",
  "contactInfo": {
    "phone": "+251911234567"
  }
}
```

#### Delete Clinic (Soft Delete)
```http
DELETE /clinics/:id
Authorization: Bearer <token>
```

### Geospatial Search

#### Find Nearby Clinics
```http
GET /clinics?lat=9.0192&lng=38.7525&maxDistanceKm=10
Authorization: Bearer <token>
```

#### Search with Filters
```http
GET /clinics?zone=Addis%20Ababa&wereda=Bole&type=health_center
Authorization: Bearer <token>
```

#### Find by Zone and Wereda
```http
GET /clinics/zone/Addis%20Ababa/wereda/Bole
Authorization: Bearer <token>
```

### Staff Management

#### Get Clinic Staff
```http
GET /clinics/:id/staff
Authorization: Bearer <token>
```

#### Assign Staff to Clinic
```http
POST /clinics/:id/staff
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "507f1f77bcf86cd799439011",
  "role": "doctor"
}
```

#### Remove Staff from Clinic
```http
DELETE /clinics/:id/staff/:userId?role=doctor
Authorization: Bearer <token>
```

#### Find Clinics by Staff Member
```http
GET /clinics/staff/:userId
Authorization: Bearer <token>
```

### Inventory Management

#### Get Clinic Inventory
```http
GET /clinics/:id/inventory
Authorization: Bearer <token>
```

#### Update Vaccine Inventory
```http
PATCH /clinics/:id/inventory
Authorization: Bearer <token>
Content-Type: application/json

{
  "vaccineType": "BCG",
  "quantity": 50,
  "batchNumber": "BCG-2024-001",
  "expiryDate": "2025-12-31"
}
```

### Statistics

#### Get Clinic Statistics
```http
GET /clinics/statistics
Authorization: Bearer <token>
```

## Data Models

### Clinic Schema

```typescript
{
  clinicId: string;              // Auto-generated: CL000001
  name: string;
  type: 'hospital' | 'health_center' | 'clinic' | 'health_post';
  contactInfo: {
    phone: string;
    email?: string;
    emergencyContact?: string;
  };
  address: {
    zone: string;
    wereda: string;
    kebele: string;
    street?: string;
    building?: string;
    gpsCoordinates: {
      lat: number;              // -90 to 90
      lng: number;              // -180 to 180
    };
  };
  facilities: {
    hasColdStorage: boolean;
    hasGenerator: boolean;
    hasInternet: boolean;
    capacity: number;           // Daily vaccination capacity
  };
  staff: {
    doctorIds: ObjectId[];
    nurseIds: ObjectId[];
    adminIds: ObjectId[];
  };
  inventory: {
    vaccineTypes: string[];
    lastRestocked?: Date;
    currentStock: Map<string, number>;
  };
  operatingHours: {
    monday?: { open: string; close: string; };
    tuesday?: { open: string; close: string; };
    wednesday?: { open: string; close: string; };
    thursday?: { open: string; close: string; };
    friday?: { open: string; close: string; };
    saturday?: { open: string; close: string; };
    sunday?: { open: string; close: string; };
  };
  audit: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: ObjectId;
    updatedBy?: ObjectId;
  };
  isActive: boolean;
}
```

## Database Indexes

The Clinic schema includes the following indexes for optimal query performance:

1. **clinicId**: Unique index for human-readable clinic IDs
2. **address.gpsCoordinates**: 2dsphere index for geospatial queries
3. **address.zone, address.wereda**: Compound index for location-based searches
4. **type**: Index for filtering by clinic type
5. **facilities.hasColdStorage**: Index for facility-based queries

## Validation Rules

### Create/Update Clinic
- **name**: Required, non-empty string
- **type**: Required, must be one of: hospital, health_center, clinic, health_post
- **contactInfo.phone**: Required, non-empty string
- **address.zone**: Required, non-empty string
- **address.wereda**: Required, non-empty string
- **address.kebele**: Required, non-empty string
- **address.gpsCoordinates.lat**: Required, number between -90 and 90
- **address.gpsCoordinates.lng**: Required, number between -180 and 180
- **facilities.capacity**: Optional, positive number (minimum 1)

### Staff Assignment
- **userId**: Required, valid MongoDB ObjectId
- **role**: Required, must be one of: doctor, nurse, admin

### Inventory Update
- **vaccineType**: Required, non-empty string
- **quantity**: Required, number (can be negative for stock reduction)
- **batchNumber**: Optional string
- **expiryDate**: Optional ISO date string

## Business Logic

### Clinic ID Generation
- Format: `CL` + 6-digit zero-padded number
- Example: `CL000001`, `CL000042`, `CL001234`
- Auto-incremented based on total clinic count

### Geospatial Search
- Uses MongoDB's `$geoNear` aggregation for efficient proximity search
- Calculates distance in meters, converts to kilometers
- Supports configurable maximum distance radius
- Returns results sorted by distance (nearest first)

### Staff Assignment
- Prevents duplicate assignments (same user + role + clinic)
- Validates user ID format before assignment
- Maintains separate arrays for doctors, nurses, and admins
- Supports finding all clinics for a specific staff member

### Inventory Management
- Tracks stock levels per vaccine type
- Prevents negative stock (throws BadRequestException)
- Automatically updates lastRestocked timestamp
- Supports adding new vaccine types dynamically
- Uses MongoDB Map for efficient stock tracking

## Error Handling

### Common Errors

#### NotFoundException
- Thrown when clinic ID is not found
- Thrown when trying to remove non-existent staff member

#### BadRequestException
- Thrown for invalid user IDs
- Thrown when trying to reduce stock below zero
- Thrown when assigning already-assigned staff member

## Testing

The module includes comprehensive unit tests covering:
- Clinic creation with auto-generated IDs
- CRUD operations (create, read, update, delete)
- Geospatial search functionality
- Staff assignment and removal
- Inventory management with validation
- Error handling for edge cases

Run tests:
```bash
npm test -- clinics.service.spec.ts
```

## Usage Examples

### Example 1: Create a Clinic with Full Details
```typescript
const clinic = await clinicsService.create({
  name: 'Bole Health Center',
  type: 'health_center',
  contactInfo: {
    phone: '+251911234567',
    email: 'bole@health.gov.et',
  },
  address: {
    zone: 'Addis Ababa',
    wereda: 'Bole',
    kebele: '03',
    gpsCoordinates: {
      lat: 9.0192,
      lng: 38.7525,
    },
  },
  facilities: {
    hasColdStorage: true,
    hasGenerator: true,
    hasInternet: true,
    capacity: 150,
  },
  vaccineTypes: ['BCG', 'OPV', 'DPT'],
});
```

### Example 2: Find Nearby Clinics
```typescript
const nearbyClinics = await clinicsService.findNearby(
  9.0192,  // latitude
  38.7525, // longitude
  5        // max distance in km
);
```

### Example 3: Assign Staff to Clinic
```typescript
await clinicsService.assignStaff(
  'CL000001',              // clinic ID
  '507f1f77bcf86cd799439011', // user ID
  'doctor'                 // role
);
```

### Example 4: Update Vaccine Inventory
```typescript
await clinicsService.updateInventory('CL000001', {
  vaccineType: 'BCG',
  quantity: 50,
  batchNumber: 'BCG-2024-001',
  expiryDate: '2025-12-31',
});
```

### Example 5: Search Clinics with Multiple Filters
```typescript
const clinics = await clinicsService.search({
  zone: 'Addis Ababa',
  wereda: 'Bole',
  type: 'health_center',
  name: 'Bole',
});
```

## Integration with Other Modules

### Users Module
- Staff assignment links User documents to Clinic documents
- Validates user IDs before assignment
- Supports finding clinics by staff member

### Vaccinations Module
- Clinics are referenced when recording vaccinations
- Inventory tracking supports vaccination administration
- Clinic location used for vaccination records

### Analytics Module
- Clinic statistics feed into dashboard analytics
- Facility metrics support coverage analysis
- Geographic distribution for regional reports

## Future Enhancements

1. **Appointment Scheduling**: Integrate with clinic operating hours
2. **Capacity Management**: Track daily vaccination appointments vs capacity
3. **Inventory Alerts**: Notify when vaccine stock is low
4. **Batch Tracking**: Full batch number and expiry date management
5. **Multi-language Support**: Clinic names and addresses in local languages
6. **Photo Upload**: Clinic facility photos for parent reference
7. **Rating System**: Parent feedback and clinic ratings
8. **Route Planning**: Optimal route calculation for mobile vaccination teams

## Requirements Mapping

This module implements the following requirements from the specification:

- **Requirement 9.1**: Clinic registration with name, address (zone/wereda/kebele), GPS coordinates, contact info
- **Requirement 9.2**: Staff assignment system to link healthcare workers to clinics
- **Requirement 9.3**: Vaccine inventory tracking (vaccine type, quantity, expiry dates, batch numbers)
- **Requirement 9.4**: Operating hours management

## License

Part of the Infant Vaccination Management System - Ethiopia Ministry of Health
