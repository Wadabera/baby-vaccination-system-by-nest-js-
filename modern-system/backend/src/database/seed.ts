/**
 * Idempotent seed script.
 *
 * Creates one account per role plus a demo clinic, mother and child so the
 * application can be exercised immediately after `npm run seed`.
 *
 * Run with: npm run seed
 */
import 'dotenv/config';
import * as argon2 from 'argon2';
import mongoose, { type Document, type Model } from 'mongoose';
import { User, UserRole, UserSchema } from '../users/schemas/user.schema';
import { Clinic, ClinicSchema } from '../clinics/schemas/clinic.schema';
import { Mother, MotherSchema } from '../mothers/schemas/mother.schema';
import { Child, ChildSchema } from '../children/schemas/child.schema';
import { Post, PostSchema } from '../posts/schemas/post.schema';
import {
  generateSchedule,
  generateMotherSchedule,
} from '../children/utils/schedule-generator';

/**
 * Register a model from the same schema factory the application uses.
 *
 * NestJS injects models at runtime, but this standalone script has no
 * injection container. Reusing the exported schema keeps indexes and defaults
 * identical to what the running app uses.
 */
const modelOf = <T extends Document>(
  name: string,
  schema: Parameters<typeof mongoose.model>[1],
): Model<T> =>
  (mongoose.models[name] as Model<T>) ??
  mongoose.model<T>(name, schema as never);

/**
 * Shared demo password for every seeded account.
 *
 * Defaults to `Vaccinate@2024`. The symbol must be one the API accepts
 * (`@ $ ! % * ? &`) — `#` is not in that set, and seeding one would create
 * accounts that cannot later change their own password.
 */
const DEMO_PASSWORD = process.env.SEED_PASSWORD ?? 'Vaccinate@2024';

const PASSWORD_PATTERN = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&]).{8,}$/;

function assertUsablePassword(password: string): void {
  if (!PASSWORD_PATTERN.test(password)) {
    throw new Error(
      `SEED_PASSWORD does not satisfy the password policy: ${JSON.stringify(password)}\n` +
        'It needs 8+ characters with an uppercase letter, a lowercase letter, a number ' +
        'and one of the symbols @ $ ! % * ? & .',
    );
  }
}

interface SeedUser {
  username: string;
  email: string;
  role: UserRole;
  firstName: string;
  lastName: string;
  phoneNumber: string;
}

type SeedDose = {
  vaccineName: string;
  dueDate: Date;
  status: string;
  givenDate?: Date;
  batchNumber?: string;
  notes?: string;
};

/**
 * Marks the named doses as administered, with a batch number and a
 * plausible administration date.
 *
 * Without this every seeded child shows a schedule that is entirely
 * `pending`, so the coverage rings read 0%, the timelines have no
 * completed entries, and the "next dose" hints have nothing to
 * differentiate. Demo data has to include history to be worth looking at.
 *
 * Doses whose due date is still in the future are left pending, so the
 * schedule stays honest about what is actually due.
 *
 * Accepts Mongoose subdocuments as well as plain objects: spreading a
 * subdocument copies its internal bookkeeping rather than its schema
 * fields, so `toObject()` is used when one is handed in.
 */
const markDosesGiven = (
  schedule: Array<SeedDose | Document>,
  givenNames: string[],
): SeedDose[] => {
  const now = Date.now();

  const plain = schedule.map((dose) => {
    const raw =
      typeof (dose as Document).toObject === 'function'
        ? (dose as Document).toObject()
        : { ...(dose as SeedDose) };

    return {
      vaccineName: raw.vaccineName,
      dueDate: new Date(raw.dueDate),
      status: raw.status,
      givenDate: raw.givenDate,
      batchNumber: raw.batchNumber,
      notes: raw.notes,
    } as SeedDose;
  });

  return plain.map((dose, index) => {
    if (!givenNames.includes(dose.vaccineName)) return dose;

    // Only doses already due can have been given. Administering on the
    // due date itself is what a clinic actually does.
    const due = dose.dueDate.getTime();
    if (due > now) return dose;

    return {
      ...dose,
      status: 'completed',
      givenDate: new Date(due),
      // Plausible, unique-per-dose batch number so the traceability
      // column in the health card is populated.
      batchNumber: `BATCH${String(100000 + index * 137).slice(0, 6)}`,
      notes: 'Administered at the clinic.',
    };
  });
};

const USERS: SeedUser[] = [
  {
    username: 'admin',
    email: 'admin@vaccination.et',
    role: UserRole.ADMIN,
    firstName: 'System',
    lastName: 'Administrator',
    phoneNumber: '+251911000001',
  },
  {
    username: 'registrar',
    email: 'registrar@vaccination.et',
    role: UserRole.REGISTRAR,
    firstName: 'Registrars',
    lastName: 'Office',
    phoneNumber: '+251911000002',
  },
  {
    username: 'doctor',
    email: 'doctor@vaccination.et',
    role: UserRole.DOCTOR,
    firstName: 'Tesfaye',
    lastName: 'Bekele',
    phoneNumber: '+251911000003',
  },
  {
    username: 'parent',
    email: 'parent@vaccination.et',
    role: UserRole.PARENT,
    firstName: 'Marta',
    lastName: 'Gebre',
    phoneNumber: '+251911000004',
  },
];

async function seed(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    throw new Error('MONGODB_URI is not set. Copy .env.example to .env first.');
  }

  assertUsablePassword(DEMO_PASSWORD);

  await mongoose.connect(uri);
  console.log('Connected to MongoDB');

  const UserModel = modelOf<User>(User.name, UserSchema);
  const ClinicModel = modelOf<Clinic>(Clinic.name, ClinicSchema);
  const MotherModel = modelOf<Mother>(Mother.name, MotherSchema);
  const ChildModel = modelOf<Child>(Child.name, ChildSchema);
  const PostModel = modelOf<Post>(Post.name, PostSchema);

  const passwordHash = await argon2.hash(DEMO_PASSWORD, {
    type: argon2.argon2id,
    memoryCost: 65536,
    timeCost: 3,
    parallelism: 4,
  });

  // --- users --------------------------------------------------------------
  const userIds: Record<string, mongoose.Types.ObjectId> = {};
  for (const seedUser of USERS) {
    const existing = await UserModel.findOne({ email: seedUser.email }).exec();
    if (existing) {
      userIds[seedUser.role] = existing._id;
      console.log(`user exists: ${seedUser.email}`);
      continue;
    }

    const created = await new UserModel({
      username: seedUser.username,
      email: seedUser.email,
      passwordHash,
      role: seedUser.role,
      profile: {
        firstName: seedUser.firstName,
        lastName: seedUser.lastName,
        phoneNumber: seedUser.phoneNumber,
      },
      settings: {
        notifications: { email: true, sms: true, push: false },
        language: 'en',
        timezone: 'Africa/Addis_Ababa',
      },
      audit: { createdAt: new Date(), updatedAt: new Date() },
      isActive: true,
    }).save();

    userIds[seedUser.role] = created._id;
    console.log(`created user: ${seedUser.email} (${seedUser.role})`);
  }

  // --- clinic -------------------------------------------------------------
  let clinic = await ClinicModel.findOne({ clinicId: 'CL000001' }).exec();
  if (!clinic) {
    clinic = await new ClinicModel({
      clinicId: 'CL000001',
      name: 'Jimmma Health Centre',
      type: 'health_center',
      contactInfo: { phone: '+251911100100', email: 'jimmma@clinic.et' },
      address: {
        zone: 'South West Ethiopia',
        wereda: 'Jimmma',
        kebele: '01',
        gpsCoordinates: { type: 'Point', coordinates: [36.83, 7.67] },
      },
      facilities: {
        hasColdStorage: true,
        hasGenerator: true,
        hasInternet: true,
        capacity: 50,
      },
      staff: {
        doctorIds: userIds[UserRole.DOCTOR] ? [userIds[UserRole.DOCTOR]] : [],
        nurseIds: [],
        adminIds: userIds[UserRole.ADMIN] ? [userIds[UserRole.ADMIN]] : [],
      },
      audit: { createdAt: new Date(), updatedAt: new Date() },
    }).save();
    console.log('created clinic: CL000001');
  } else {
    console.log('clinic exists: CL000001');
  }

  // --- mother + child -----------------------------------------------------
  let mother = await MotherModel.findOne({ motherId: 'M00000001' }).exec();
  if (!mother) {
    mother = await new MotherModel({
      motherId: 'M00000001',
      personalInfo: {
        firstName: 'Selam',
        lastName: 'Gebremariam',
        birthDate: new Date('1994-05-12'),
        bloodType: 'O+',
      },
      contactInfo: { phoneNumber: '+251911200200' },
      address: { zone: 'South West Ethiopia', wereda: 'Jimmma', kebele: '02' },
      schedule: generateMotherSchedule(new Date()),
      medicalHistory: {
        allergies: [],
        chronicConditions: [],
        previousAdverseReactions: [],
        notes: '',
      },
      childrenIds: [],
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userIds[UserRole.REGISTRAR],
      },
    }).save();
    console.log('created mother: M00000001');
  } else {
    console.log('mother exists: M00000001');
  }

  let child = await ChildModel.findOne({ childId: 'C00000001' }).exec();
  if (!child) {
    // A birth date four months back means several doses are already due,
    // which makes the dashboards and reminder lists non-empty.
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 4);

    child = await new ChildModel({
      childId: 'C00000001',
      motherId: mother._id,
      clinicId: clinic._id,
      personalInfo: {
        firstName: 'Dawit',
        lastName: 'Gebremariam',
        birthDate,
        bloodType: 'O+',
      },
      schedule: markDosesGiven(generateSchedule(birthDate), ['BCG', 'OPV 0']),
      medicalInfo: {
        birthWeight: 3.2,
        birthHeight: 50,
        allergies: [],
        contraindications: [],
        adverseReactions: [],
      },
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userIds[UserRole.REGISTRAR],
      },
    }).save();

    console.log('created child: C00000001');
  } else {
    console.log('child exists: C00000001');
  }

  // A second child, older and partly vaccinated, so the coverage rings,
  // dose timelines and "next dose" hints show real progress rather than a
  // wall of pending doses.
  const SECOND_CHILD_ID = 'C00090002';
  let secondChild = await ChildModel.findOne({
    childId: SECOND_CHILD_ID,
  }).exec();
  if (!secondChild) {
    const birthDate = new Date();
    birthDate.setMonth(birthDate.getMonth() - 11);

    secondChild = await new ChildModel({
      childId: SECOND_CHILD_ID,
      motherId: mother._id,
      clinicId: clinic._id,
      personalInfo: {
        firstName: 'Selam',
        lastName: 'Gebremariam',
        birthDate,
        bloodType: 'A+',
      },
      schedule: markDosesGiven(generateSchedule(birthDate), [
        'BCG',
        'OPV 0',
        'OPV 1',
        'Pentavalent 1',
        'PCV 1',
        'Rota 1',
        'OPV 2',
        'Pentavalent 2',
        'PCV 2',
        'Rota 2',
      ]),
      medicalInfo: {
        birthWeight: 3.0,
        birthHeight: 49,
        allergies: [],
        contraindications: [],
        adverseReactions: [],
      },
      audit: {
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: userIds[UserRole.REGISTRAR],
      },
    }).save();

    console.log(`created child: ${SECOND_CHILD_ID}`);
  } else {
    console.log(`child exists: ${SECOND_CHILD_ID}`);
  }

  // --- backfill dose history on the demo children ------------------------
  //
  // Children created by an earlier version of this script carry an
  // all-pending schedule, which leaves the coverage rings at 0% and the
  // timelines empty. Only doses that are still `pending` with no
  // `givenDate` are filled in, so re-running never overwrites anything a
  // clinician has since recorded.
  const demoHistory: Record<string, string[]> = {
    C00000001: ['BCG', 'OPV 0'],
    [SECOND_CHILD_ID]: [
      'BCG',
      'OPV 0',
      'OPV 1',
      'Pentavalent 1',
      'PCV 1',
      'Rota 1',
      'OPV 2',
      'Pentavalent 2',
      'PCV 2',
      'Rota 2',
    ],
  };

  for (const [childId, givenNames] of Object.entries(demoHistory)) {
    const target = await ChildModel.findOne({ childId }).exec();
    if (!target) continue;

    const current = target.schedule ?? [];
    if (current.length === 0) continue;

    const before = current.filter((d) => d.status === 'completed').length;

    const filled = markDosesGiven(current, givenNames);

    // Preserve any dose a clinician has already recorded: only untouched
    // entries are taken from the freshly generated list.
    const merged = filled.map((dose, index) =>
      current[index]?.givenDate ? current[index] : dose,
    );

    const after = merged.filter((d) => d.status === 'completed').length;
    if (after === before) continue;

    // Saved through the document rather than `updateOne`, so Mongoose
    // casts the schedule through the schema as it does everywhere else.
    target.schedule = merged;
    await target.save();

    console.log(`backfilled ${after - before} dose(s) for ${childId}`);
  }

  // --- parent to child links ---------------------------------------------
  //
  // Deliberately outside the create blocks above. Keeping the link inside
  // `if (!child)` meant it only ever ran on a brand-new database: re-seeding
  // an existing one left the parent account with no children, so the parent
  // portal showed an empty state.
  const childrenForParent = await ChildModel.find({
    childId: { $in: ['C00000001', SECOND_CHILD_ID] },
  })
    .select('_id')
    .exec();

  const demoChildIds = childrenForParent.map((c) => c._id);

  if (demoChildIds.length > 0) {
    // `$set` rather than `$addToSet`: the demo parent should show exactly
    // the two demo children. An earlier run linked a test-fixture child in
    // here, and additive updates would keep showing it.
    await UserModel.updateOne(
      { _id: userIds[UserRole.PARENT] },
      { $set: { childrenIds: demoChildIds } },
    ).exec();

    await MotherModel.updateOne(
      { _id: mother._id },
      {
        $addToSet: {
          childrenIds: { $each: demoChildIds },
        },
      },
    ).exec();
  }

  console.log(
    `linked ${demoChildIds.length} demo child record(s) to the parent account`,
  );

  // --- sample post --------------------------------------------------------
  const postCount = await PostModel.countDocuments().exec();
  if (postCount === 0) {
    await new PostModel({
      title: 'National Immunization Week',
      category: 'Announcement',
      description:
        'Immunization week runs from the 1st to the 7th. Bring your child to the nearest health centre with their vaccination card to receive any outstanding doses.',
      images: [],
      dateOfPost: new Date(),
    }).save();
    console.log('created sample post');
  }

  console.log('\nSeed complete. Sign in with any of:');
  for (const seedUser of USERS) {
    console.log(
      `  ${seedUser.role.padEnd(9)} ${seedUser.email} / ${DEMO_PASSWORD}`,
    );
  }
  console.log('\nThe username (e.g. "admin") works as the identifier too.');

  await mongoose.disconnect();
}

seed().catch(async (error) => {
  console.error('Seed failed:', error);
  await mongoose.disconnect().catch(() => undefined);
  process.exit(1);
});
