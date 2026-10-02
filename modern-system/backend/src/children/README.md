# Children Module

## Overview

The Children module manages child registration, vaccination scheduling, and digital vaccination card generation for the Infant Vaccination Management System. This module implements automated vaccination schedule generation based on the Ethiopian EPI (Expanded Programme on Immunization) schedule.

## Features

### 1. Child Registration (Requirement 4.1, 4.2)
- Captures complete child information (name, birthdate, blood type, photo)
- Automatically links child to mother (bidirectional relationship)
- Generates unique child ID (format: C00000001)
- Records medical information (birth weight, height, allergies)

### 2. Automated Vaccination Scheduling (Requirement 5.1, 5.2)
- Generates complete vaccination schedule based on birthdate
- Follows Ethiopian EPI vaccination protocol:
  - **Birth**: BCG, OPV 0
  - **6 weeks**: OPV 1, Pentavalent 1, PCV 1, Rota 1
  - **10 weeks**: OPV 2, Pentavalent 2, PCV 2, Rota 2
  - **14 weeks**: OPV 3, Pentavalent 3, PCV 3, IPV
  - **9 months**: Measles 1
  - **15 months**: Measles 2
- Automatically updates vaccination statuses (pending → overdue)
- Tracks upcoming and overdue vaccinations

### 3. Vaccination Administration (Requirement 4.5)
- Records vaccination administration with:
  - Date administered
  - Batch number
  - Healthcare worker who administered
  - Clinic location
  - Doctor approval (if required)
  - Notes
- Updates vaccination status to "completed"

### 4. Digital Vaccination Card (Requirement 7.1, 7.2, 7.3, 7.4)
- Generates digital vaccination card with:
  - Child information
  - Complete vaccination history
  - Upcoming vaccination schedule
  - QR code linking to child's record
  - Secure share token for sharing with schools/healthcare providers
- Maintains version history of cards
- Supports card regeneration

### 5. Medical Tracking (Requirement 21.1, 21.3, 21.8)
- **Contraindications**: Track medical conditions preventing vaccination
  - Type, reason, flagged by doctor, date flagged
  - Can be activated/deactivated
- **Adverse Reactions**: Record vaccine adverse reactions
  - Vaccine type, reaction description, severity (mild/moderate/severe)
  - Treatment administered, reported by, date reported
- **Allergies**: Manage child's allergy list

### 6. Child Profile (Requirement 4.6)
- Complete child profile with:
  - Personal information
  - Vaccination schedule with status
  - Medical history
  - Digital card information
  - Audit trail

## API Endpoints

### Child Management
- `POST /children` - Create new child with automated schedule
- `GET /children` - Get all children or search with criteria
- `GET /children/:id` - Get child by ID
- `GET /children/:id/profile` - Get complete child profile
- `PATCH /children/:id` - Update child information
- `DELETE /children/:id` - Delete child (also removes from mother)
- `GET /children/mother/:motherId` - Get all children for a mother

### Vaccination Management
- `POST /children/:id/vaccinations` - Record vaccination administration
- `GET /children/:id/upcoming` - Get upcoming vaccinations (next 30 days)
- `GET /children/:id/overdue` - Get overdue vaccinations
- `GET /children/:id/progress` - Get vaccination completion percentage

### Medical Management
- `POST /children/:id/contraindications` - Add contraindication
- `PATCH /children/:id/contraindications/:index/deactivate` - Deactivate contraindication
- `POST /children/:id/adverse-reactions` - Add adverse reaction
- `POST /children/:id/allergies` - Add allergy
- `DELETE /children/:id/allergies/:allergy` - Remove allergy

### Digital Card
- `POST /children/:id/digital-card` - Generate digital vaccination card with QR code

## Data Transfer Objects (DTOs)

### CreateChildDto
```typescript
{
  motherId: string;           // Required: Mother's ID
  clinicId?: string;          // Optional: Primary clinic
  personalInfo: {
    firstName: string;
    middleName?: string;
    lastName: string;
    birthDate: string;        // ISO date string
    bloodType?: string;       // A+, A-, B+, B-, AB+, AB-, O+, O-
    photoUrl?: string;
  };
  medicalInfo?: {
    birthWeight?: number;
    birthHeight?: number;
    allergies?: string[];
  };
  createdBy?: string;         // User ID who created the record
}
```

### RecordVaccinationDto
```typescript
{
  doseIndex: number;          // Index in schedule array
  administeredBy: string;     // User ID of healthcare worker
  batchNumber?: string;       // Vaccine batch number
  clinicId?: string;          // Clinic where administered
  approvedBy?: string;        // Doctor who approved (if required)
  notes?: string;             // Additional notes
}
```

### AddContraindicationDto
```typescript
{
  type: string;               // Type of contraindication
  reason: string;             // Medical reason
  flaggedBy: string;          // Doctor ID who flagged
}
```

### AddAdverseReactionDto
```typescript
{
  vaccineType: string;        // Vaccine that caused reaction
  reaction: string;           // Description of reaction
  severity: 'mild' | 'moderate' | 'severe';
  reportedBy: string;         // User ID who reported
  treatment?: string;         // Treatment administered
}
```

## Utilities

### Schedule Generator (`utils/schedule-generator.ts`)
- `generateSchedule(birthDate: Date)`: Generates complete vaccination schedule
- `VACCINE_PROTOCOLS`: Array of vaccine protocols with timing

### Digital Card Generator (`utils/digital-card-generator.ts`)
- `generateQRCode(childId, baseUrl)`: Generates QR code data URL
- `generateShareToken()`: Generates secure 64-character hex token
- `prepareDigitalCardData(child, includeQRCode, qrCodeDataUrl, shareToken)`: Prepares card data
- `calculateVaccinationProgress(schedule)`: Calculates completion percentage
- `getUpcomingVaccinations(schedule)`: Returns vaccinations due in next 30 days
- `getOverdueVaccinations(schedule)`: Returns past-due vaccinations
- `updateVaccinationStatuses(schedule)`: Updates statuses based on current date

## Testing

### Unit Tests
- **Schedule Generator**: 9 tests covering all vaccination timing scenarios
- **Digital Card Generator**: 18 tests covering QR code generation, card data preparation, and vaccination tracking

Run tests:
```bash
npm test -- children/utils/schedule-generator.spec.ts
npm test -- children/utils/digital-card-generator.spec.ts
```

All tests passing ✓

## Dependencies

- `@nestjs/common`: NestJS core functionality
- `@nestjs/mongoose`: MongoDB integration
- `mongoose`: MongoDB ODM
- `class-validator`: DTO validation
- `class-transformer`: DTO transformation
- `qrcode`: QR code generation
- `crypto`: Secure token generation

## Integration

### Mother-Child Relationship
- Bidirectional relationship maintained automatically
- When child is created, automatically added to mother's `childrenIds`
- When child is deleted, automatically removed from mother's `childrenIds`
- Mother profile displays all linked children

### Authentication
- All endpoints protected with `JwtAuthGuard`
- Requires valid JWT token in Authorization header

### Audit Trail
- All create/update operations tracked with:
  - `createdAt`, `updatedAt` timestamps
  - `createdBy`, `updatedBy` user IDs

## Future Enhancements

1. **PDF Generation**: Generate printable PDF vaccination cards
2. **Notification Integration**: Send reminders for upcoming/overdue vaccinations
3. **Batch Operations**: Support bulk child registration
4. **Advanced Search**: Search by vaccination status, age range, clinic
5. **Analytics**: Vaccination coverage statistics by region/clinic
6. **Mobile App Support**: Optimize for mobile vaccination card viewing

## Requirements Mapping

- **4.1**: Child registration system captures required information ✓
- **4.2**: Unique child ID generation ✓
- **4.3**: View, update, search child records ✓
- **4.4**: Vaccination tracking (R1-R5) ✓
- **4.5**: Record vaccination with date, batch number, healthcare worker ✓
- **4.6**: Child profile displays complete vaccination history ✓
- **5.1**: Automated vaccination schedule generation ✓
- **5.2**: Calculate due dates based on birthdate ✓
- **7.1**: Digital vaccination card system ✓
- **7.2**: QR code links to child's record ✓
- **7.3**: Card sharing system ✓
- **7.4**: Card version history ✓
- **21.1**: Medical history review ✓
- **21.3**: Contraindication flagging ✓
- **21.8**: Adverse reaction tracking ✓
