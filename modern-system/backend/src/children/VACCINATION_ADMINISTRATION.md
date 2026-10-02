# Vaccination Administration System

## Overview

The vaccination administration system provides comprehensive tracking and validation for vaccine administration in the Infant Vaccination Management System. This document describes the workflow, validation rules, and best practices for recording vaccinations.

## Requirements Addressed

- **Requirement 4.5**: Record vaccination with date, batch number, and healthcare worker
- **Requirement 5.3**: Healthcare worker assignment with proper validation
- **Requirement 9.5**: Clinic location recording for each vaccination

## Vaccination Recording Workflow

### 1. Prerequisites

Before recording a vaccination, ensure:
- Child is registered in the system
- Healthcare worker (nurse or doctor) is registered and active
- Clinic is registered and active
- Child has no active contraindications

### 2. Recording a Vaccination

**Endpoint**: `POST /children/:childId/vaccinations`

**Request Body** (`RecordVaccinationDto`):
```json
{
  "doseIndex": 0,
  "administeredBy": "507f1f77bcf86cd799439011",
  "batchNumber": "BATCH123456",
  "clinicId": "507f1f77bcf86cd799439012",
  "approvedBy": "507f1f77bcf86cd799439013",
  "notes": "Vaccination administered successfully"
}
```

**Field Descriptions**:
- `doseIndex` (required): Index of the vaccination dose in the child's schedule (0-based)
- `administeredBy` (required): MongoDB ObjectId of the healthcare worker (must be nurse or doctor)
- `batchNumber` (required): Vaccine batch number (6-20 alphanumeric characters, letters/numbers/hyphens only)
- `clinicId` (required): MongoDB ObjectId of the clinic where vaccination was administered
- `approvedBy` (optional): MongoDB ObjectId of the doctor who approved the vaccination
- `notes` (optional): Additional notes about the vaccination (max 500 characters)

### 3. Validation Rules

The system performs the following validations in order:

#### 3.1 Child Validation
- Child must exist in the system
- Dose index must be valid (within the child's vaccination schedule)
- Vaccination at the specified dose index must not already be completed

#### 3.2 Healthcare Worker Validation
- Healthcare worker must exist in the system
- Healthcare worker must have either `nurse` or `doctor` role
- Healthcare worker must be active (not deactivated)

#### 3.3 Clinic Validation
- Clinic must exist in the system
- Clinic must be active (not deactivated)

#### 3.4 Doctor Approval Validation (if provided)
- Approving doctor must exist in the system
- Approving user must have `doctor` role (not nurse, parent, or admin)
- Approving doctor must be active

#### 3.5 Contraindication Check
- Child must not have any active contraindications
- If active contraindications exist, vaccination is blocked with detailed error message

#### 3.6 Batch Number Validation
- Batch number must be 6-20 characters long
- Batch number must contain only letters, numbers, and hyphens
- Examples of valid batch numbers:
  - `BATCH123456`
  - `VAC-2024-001`
  - `LOT-ABC-123`
  - `2024-BATCH-001`

### 4. Success Response

Upon successful vaccination recording:
- Vaccination status is updated to `completed`
- Current date/time is recorded as `givenDate`
- All provided information is stored in the child's vaccination schedule
- Audit information is updated

**Response**:
```json
{
  "_id": "507f1f77bcf86cd799439014",
  "childId": "C00000001",
  "schedule": [
    {
      "vaccineName": "BCG",
      "dueDate": "2024-01-01T00:00:00.000Z",
      "status": "completed",
      "givenDate": "2024-01-15T10:30:00.000Z",
      "batchNumber": "BATCH123456",
      "administeredBy": "507f1f77bcf86cd799439011",
      "clinicId": "507f1f77bcf86cd799439012",
      "approvedBy": "507f1f77bcf86cd799439013",
      "notes": "Vaccination administered successfully"
    }
  ],
  "audit": {
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

## Error Handling

### Common Errors

#### 404 Not Found
- **Child not found**: `Child with ID {childId} not found`
- **Healthcare worker not found**: `Healthcare worker with ID {administeredBy} not found`
- **Clinic not found**: `Clinic with ID {clinicId} not found`
- **Doctor not found**: `Doctor with ID {approvedBy} not found`

#### 400 Bad Request
- **Invalid dose index**: `Invalid dose index: {doseIndex}`
- **Already completed**: `Vaccination at dose index {doseIndex} has already been administered`
- **Invalid batch number**: `Invalid batch number format: {batchNumber}. Batch number must be 6-20 alphanumeric characters`
- **Inactive clinic**: `Clinic {clinicId} is not active and cannot be used for vaccination administration`

#### 403 Forbidden
- **Invalid role for administration**: `User {administeredBy} does not have permission to administer vaccinations. Only nurses and doctors can administer vaccines. Current role: {role}`
- **Inactive healthcare worker**: `Healthcare worker {administeredBy} is not active and cannot administer vaccinations`
- **Invalid role for approval**: `User {approvedBy} is not a doctor and cannot approve vaccinations. Current role: {role}`
- **Inactive doctor**: `Doctor {approvedBy} is not active and cannot approve vaccinations`
- **Active contraindications**: `Cannot administer vaccination. Child has {count} active contraindication(s): {types}`

## Best Practices

### 1. Batch Number Management
- Use consistent batch number formats across your organization
- Include date information in batch numbers for easier tracking
- Keep batch numbers between 6-20 characters for optimal storage and readability

### 2. Healthcare Worker Assignment
- Always assign the actual healthcare worker who administered the vaccine
- Ensure healthcare workers are properly registered with correct roles
- Deactivate healthcare workers who leave the organization rather than deleting them

### 3. Clinic Location Tracking
- Record the actual clinic where vaccination occurred
- Keep clinic information up-to-date
- Use clinic data for analytics and coverage reporting

### 4. Doctor Approval
- Require doctor approval for special cases (e.g., delayed vaccinations, medical exceptions)
- Document approval reasons in the notes field
- Maintain audit trail of all approvals

### 5. Contraindication Management
- Always check for active contraindications before administering vaccines
- Document contraindications with clear reasons
- Deactivate contraindications when they are resolved rather than deleting them

## Security Considerations

### Role-Based Access Control
- Only users with `nurse` or `doctor` roles can administer vaccinations
- Only users with `doctor` role can approve vaccinations
- All vaccination records include audit information (who, when)

### Data Integrity
- Batch numbers are validated to prevent data entry errors
- Vaccination status cannot be changed once marked as completed
- All foreign key references (user, clinic) are validated before recording

### Audit Trail
- Every vaccination record includes:
  - Who administered it (`administeredBy`)
  - Where it was administered (`clinicId`)
  - When it was administered (`givenDate`)
  - Who approved it (`approvedBy`, if applicable)
  - Vaccine batch number for traceability

## Testing

Comprehensive unit tests are provided in `children.service.vaccination.spec.ts` covering:
- Successful vaccination recording
- All validation scenarios
- Error handling
- Edge cases (inactive users, contraindications, etc.)

Run tests with:
```bash
npm test -- children.service.vaccination.spec.ts
```

## Related Documentation

- [Child Registration](./README.md)
- [Contraindication Management](./dto/add-contraindication.dto.ts)
- [Adverse Reaction Tracking](./dto/add-adverse-reaction.dto.ts)
- [Digital Vaccination Card](./utils/digital-card-generator.ts)

## Support

For questions or issues related to vaccination administration:
1. Check this documentation first
2. Review the unit tests for examples
3. Check the API documentation (Swagger/OpenAPI)
4. Contact the development team
