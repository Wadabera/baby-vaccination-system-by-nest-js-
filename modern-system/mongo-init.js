// Collection names and indexes matching the Mongoose schemas.
// Mongoose creates collections and most indexes itself, but declaring the
// unique constraints here means they exist from the first connection.
db = db.getSiblingDB('vaccination');

const ensureCollection = (name) => {
  if (!db.getCollectionNames().includes(name)) {
    db.createCollection(name);
  }
};

['users', 'mothers', 'children', 'clinics', 'posts', 'notifications',
 'contraindicationentries', 'adversereactionentries'].forEach(ensureCollection);

db.users.createIndex({ email: 1 }, { unique: true });
db.users.createIndex({ username: 1 }, { unique: true, sparse: true });
db.users.createIndex({ role: 1 });
db.users.createIndex({ clinicId: 1 });
db.users.createIndex({ 'profile.phoneNumber': 1 });
db.users.createIndex({ childrenIds: 1 });
db.users.createIndex({ isActive: 1 });

db.mothers.createIndex({ motherId: 1 }, { unique: true });
db.mothers.createIndex({ 'contactInfo.phoneNumber': 1 });
db.mothers.createIndex({ 'address.zone': 1, 'address.wereda': 1, 'address.kebele': 1 });
db.mothers.createIndex({ childrenIds: 1 });
db.mothers.createIndex({ 'schedule.dueDate': 1 });
db.mothers.createIndex({ 'schedule.status': 1 });
db.mothers.createIndex({ 'medicalHistory.allergies': 1 });

db.children.createIndex({ childId: 1 }, { unique: true });
db.children.createIndex({ motherId: 1 });
db.children.createIndex({ 'personalInfo.birthDate': 1 });
db.children.createIndex({ 'schedule.dueDate': 1 });
db.children.createIndex({ 'schedule.status': 1 });
db.children.createIndex({ 'medicalInfo.contraindications.isActive': 1 });

db.clinics.createIndex({ clinicId: 1 }, { unique: true });
db.clinics.createIndex({ 'address.gpsCoordinates': '2dsphere' });
db.clinics.createIndex({ 'address.zone': 1, 'address.wereda': 1 });
db.clinics.createIndex({ type: 1 });

db.posts.createIndex({ category: 1 });
db.posts.createIndex({ dateOfPost: -1 });

db.notifications.createIndex({ status: 1, scheduledFor: 1 });
db.notifications.createIndex({ childId: 1, type: 1 });

db.contraindicationentries.createIndex({ childId: 1, isActive: 1 });
db.contraindicationentries.createIndex({ childId: 1, dateFlagged: -1 });

db.adversereactionentries.createIndex({ childId: 1, dateReported: -1 });
db.adversereactionentries.createIndex({ severity: 1 });

print('MongoDB initialization completed successfully!');
