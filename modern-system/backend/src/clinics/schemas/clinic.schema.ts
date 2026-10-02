import { Prop, Schema, SchemaFactory } from '@nestjs/mongoose';
import { Document, Types } from 'mongoose';

@Schema({ timestamps: true })
export class OperatingHours {
  @Prop({ default: '08:00' })
  open: string;

  @Prop({ default: '17:00' })
  close: string;
}

@Schema({ timestamps: true })
export class ClinicFacilities {
  @Prop({ default: false })
  hasColdStorage: boolean;

  @Prop({ default: false })
  hasGenerator: boolean;

  @Prop({ default: false })
  hasInternet: boolean;

  @Prop({ default: 100 })
  capacity: number;
}

@Schema({ timestamps: true })
export class Clinic extends Document {
  @Prop({ required: true, unique: true })
  clinicId: string;

  @Prop({ required: true })
  name: string;

  @Prop({
    required: true,
    enum: ['hospital', 'health_center', 'clinic', 'health_post'],
  })
  type: 'hospital' | 'health_center' | 'clinic' | 'health_post';

  @Prop({
    type: {
      phone: { type: String, required: true },
      email: { type: String },
      emergencyContact: { type: String },
    },
    required: true,
  })
  contactInfo: {
    phone: string;
    email?: string;
    emergencyContact?: string;
  };

  @Prop({
    type: {
      zone: { type: String, required: true },
      wereda: { type: String, required: true },
      kebele: { type: String, required: true },
      street: { type: String },
      building: { type: String },
      // GeoJSON order is [longitude, latitude]. `ClinicsService.search` queries
      // this field with `$geoNear`, which requires the Point representation.
      gpsCoordinates: {
        type: {
          type: String,
          enum: ['Point'],
          default: 'Point',
        },
        coordinates: {
          type: [Number],
          validate: {
            validator: (value: number[]) => value.length === 2,
            message: 'coordinates must be [longitude, latitude]',
          },
        },
      },
    },
    required: true,
  })
  address: {
    zone: string;
    wereda: string;
    kebele: string;
    street?: string;
    building?: string;
    gpsCoordinates?: {
      type: 'Point';
      coordinates: [number, number];
    };
  };

  @Prop({
    type: {
      hasColdStorage: { type: Boolean, default: false },
      hasGenerator: { type: Boolean, default: false },
      hasInternet: { type: Boolean, default: false },
      capacity: { type: Number, default: 100 },
    },
    default: {
      hasColdStorage: false,
      hasGenerator: false,
      hasInternet: false,
      capacity: 100,
    },
  })
  facilities: ClinicFacilities;

  @Prop({
    type: {
      doctorIds: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
      nurseIds: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
      adminIds: { type: [{ type: Types.ObjectId, ref: 'User' }], default: [] },
    },
    default: {
      doctorIds: [],
      nurseIds: [],
      adminIds: [],
    },
  })
  staff: {
    doctorIds: Types.ObjectId[];
    nurseIds: Types.ObjectId[];
    adminIds: Types.ObjectId[];
  };

  @Prop({
    type: {
      vaccineTypes: { type: [String], default: [] },
      lastRestocked: { type: Date },
      currentStock: { type: Map, default: {} },
    },
    default: {
      vaccineTypes: [],
      lastRestocked: null,
      currentStock: {},
    },
  })
  inventory: {
    vaccineTypes: string[];
    lastRestocked?: Date;
    currentStock: Map<string, number>;
  };

  @Prop({
    type: {
      monday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '17:00' },
      },
      tuesday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '17:00' },
      },
      wednesday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '17:00' },
      },
      thursday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '17:00' },
      },
      friday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '17:00' },
      },
      saturday: {
        open: { type: String, default: '08:00' },
        close: { type: String, default: '13:00' },
      },
      sunday: {
        open: { type: String, default: '00:00' },
        close: { type: String, default: '00:00' },
      },
    },
    default: {},
  })
  operatingHours: {
    monday?: OperatingHours;
    tuesday?: OperatingHours;
    wednesday?: OperatingHours;
    thursday?: OperatingHours;
    friday?: OperatingHours;
    saturday?: OperatingHours;
    sunday?: OperatingHours;
  };

  @Prop({
    type: {
      createdAt: { type: Date, default: Date.now },
      updatedAt: { type: Date, default: Date.now },
      createdBy: { type: Types.ObjectId, ref: 'User' },
      updatedBy: { type: Types.ObjectId, ref: 'User' },
    },
  })
  audit: {
    createdAt: Date;
    updatedAt: Date;
    createdBy?: Types.ObjectId;
    updatedBy?: Types.ObjectId;
  };

  @Prop({ default: true })
  isActive: boolean;
}

export const ClinicSchema = SchemaFactory.createForClass(Clinic);

// Create indexes. `clinicId` is already unique via its @Prop.
ClinicSchema.index({ 'address.gpsCoordinates': '2dsphere' });
ClinicSchema.index({ 'address.zone': 1, 'address.wereda': 1 });
ClinicSchema.index({ type: 1 });
ClinicSchema.index({ 'facilities.hasColdStorage': 1 });
