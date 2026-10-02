# Mother-Child Relationship Management

## Overview

This document describes the implementation of the mother-child relationship management system for Task 5.3 of the Infant Vaccination System Migration project.

## Requirements Addressed

- **Requirement 3.6**: Mother profile displays all registered children linked to the mother
- **Requirement 4.1**: Child registration system links to mother
- **Requirement 21.1**: Medical history review system allows viewing complete medical history

## Implementation Details

### 1. Data Model

The bidirectional relationship between Mother and Child entities is maintained through:

- **Mother Schema**: Contains `childrenIds` array storing ObjectId references to Child documents
- **Child Schema**: Contains `motherId` field storing ObjectId reference to Mother document

### 2. DTOs (Data Transfer Objects)

#### CreateMotherDto
Validates mother registration data including:
- Personal information (name, birthdate, blood type, photo)
- Contact information (phone, alternate phone, email)
- Address (zone, wereda, kebele, GPS coordinates)
- Medical history (allergies, chronic conditions, adverse reactions, notes)

#### UpdateMotherDto
Extends CreateMotherDto with partial updates using `@nestjs/mapped-types`

#### UpdateMedicalHistoryDto
Allows updating specific medical history fields:
- Allergies
- Chronic conditions
- Previous adverse reactions
- Clinical notes

#### LinkChildDto
Validates child ID for linking/unlinking operations

#### MotherProfileResponseDto
Structured response containing:
- Complete mother information
- Populated children data with vaccination schedules
- Medical information for both mother and children

### 3. Service Methods

#### Profile Management

**`getMotherProfile(id: string): Promise<MotherProfileResponseDto>`**
- Retrieves mother data with all linked children
- Populates complete child information including vaccination schedules
- Returns structured profile response

**`getMotherChildren(motherId: string): Promise<Child[]>`**
- Returns all children linked to a specific mother
- Useful for listing children without full profile data

#### Relationship Management

**`linkChild(motherId: string, childId: string): Promise<Mother>`**
- Links a child to a mother
- Validates both mother and child exist
- Prevents duplicate links
- Updates mother's childrenIds array

**`unlinkChild(motherId: string, childId: string): Promise<Mother>`**
- Removes child from mother's childrenIds
- Maintains data integrity

#### Medical History Management

**`updateMedicalHistory(id: string, medicalHistoryDto: UpdateMedicalHistoryDto): Promise<Mother | null>`**
- Updates mother's medical history
- Merges with existing data (doesn't overwrite unspecified fields)

**`addAllergy(id: string, allergy: string): Promise<Mother>`**
- Adds a single allergy to medical history
- Prevents duplicates

**`removeAllergy(id: string, allergy: string): Promise<Mother>`**
- Removes a specific allergy from medical history

**`addChronicCondition(id: string, condition: string): Promise<Mother>`**
- Adds a chronic condition to medical history
- Prevents duplicates

**`removeChronicCondition(id: string, condition: string): Promise<Mother>`**
- Removes a specific chronic condition from medical history

### 4. API Endpoints

All endpoints require JWT authentication (`@UseGuards(JwtAuthGuard)`)

#### Profile Endpoints

**GET `/mothers/:id/profile`**
- Returns complete mother profile with populated children
- Response: `MotherProfileResponseDto`

**GET `/mothers/:id/children`**
- Returns all children for a specific mother
- Response: `Child[]`

#### Relationship Endpoints

**POST `/mothers/:id/link-child`**
- Links a child to a mother
- Body: `{ childId: string }`
- Response: Updated `Mother` document

**POST `/mothers/:id/unlink-child`**
- Unlinks a child from a mother
- Body: `{ childId: string }`
- Response: Updated `Mother` document

#### Medical History Endpoints

**PATCH `/mothers/:id/medical-history`**
- Updates medical history
- Body: `UpdateMedicalHistoryDto`
- Response: Updated `Mother` document

**POST `/mothers/:id/medical-history/allergies`**
- Adds an allergy
- Body: `{ allergy: string }`
- Response: Updated `Mother` document

**DELETE `/mothers/:id/medical-history/allergies/:allergy`**
- Removes an allergy
- Response: Updated `Mother` document

**POST `/mothers/:id/medical-history/chronic-conditions`**
- Adds a chronic condition
- Body: `{ condition: string }`
- Response: Updated `Mother` document

**DELETE `/mothers/:id/medical-history/chronic-conditions/:condition`**
- Removes a chronic condition
- Response: Updated `Mother` document

### 5. Schema Fixes

Fixed Mongoose schema issues for nested objects:

#### Mother Schema
- Changed `MotherVaccination` from `@Schema()` decorated class to plain schema object
- Prevents "Invalid schema configuration" errors

#### Child Schema
- Changed `VaccineDose`, `Contraindication`, and `AdverseReaction` from `@Schema()` decorated classes to plain schema objects
- Ensures proper Mongoose schema compilation

### 6. Testing

Comprehensive unit tests cover:
- Mother profile retrieval with populated children
- Medical history updates
- Child linking/unlinking operations
- Allergy and chronic condition management
- Error handling (NotFoundException, BadRequestException)

All 11 tests pass successfully.

## Usage Examples

### Get Mother Profile with Children

```typescript
GET /mothers/M00000001/profile

Response:
{
  "_id": "507f1f77bcf86cd799439011",
  "motherId": "M00000001",
  "personalInfo": {
    "firstName": "Jane",
    "lastName": "Doe",
    "birthDate": "1990-01-01T00:00:00.000Z"
  },
  "children": [
    {
      "_id": "507f1f77bcf86cd799439012",
      "childId": "C00000001",
      "personalInfo": {
        "firstName": "Baby",
        "lastName": "Doe",
        "birthDate": "2023-01-01T00:00:00.000Z"
      },
      "schedule": [
        {
          "vaccineName": "BCG",
          "dueDate": "2023-01-01T00:00:00.000Z",
          "status": "completed"
        }
      ]
    }
  ]
}
```

### Link Child to Mother

```typescript
POST /mothers/M00000001/link-child
Body: { "childId": "507f1f77bcf86cd799439012" }

Response: Updated Mother document with child in childrenIds array
```

### Update Medical History

```typescript
PATCH /mothers/M00000001/medical-history
Body: {
  "allergies": ["Penicillin", "Peanuts"],
  "chronicConditions": ["Diabetes"],
  "notes": "Patient requires special monitoring"
}

Response: Updated Mother document with new medical history
```

## Integration with Children Module

The Children module already imports MothersModule, enabling:
- Automatic linking when a child is created with a motherId
- Bidirectional relationship maintenance
- Consistent data integrity

## Future Enhancements

Potential improvements for future iterations:
1. Add pagination for mothers with many children
2. Implement medical history versioning/audit trail
3. Add medical history search and filtering
4. Implement medical history sharing with healthcare providers
5. Add medical history import from external systems

## Security Considerations

- All endpoints require JWT authentication
- Role-based access control should be implemented to restrict:
  - Parents to view only their own children
  - Healthcare workers to view/edit patient data
  - Doctors to access complete medical histories
- Medical history data should be encrypted at rest
- Audit logging for all medical history changes

## Performance Considerations

- Mother profile endpoint uses efficient MongoDB queries with `$in` operator
- Indexes on `childrenIds` and `motherId` fields optimize relationship queries
- Consider implementing caching for frequently accessed profiles
- For mothers with many children, consider implementing pagination

## Conclusion

This implementation provides a robust foundation for managing mother-child relationships and medical histories in the Infant Vaccination System. The bidirectional relationship ensures data consistency, while the comprehensive API enables flexible data management for healthcare workers and parents.
