const { createClient } = require('@libsql/client');

async function main() {
  const db = createClient({
    url: process.env.DATABASE_URL,
    authToken: process.env.TURSO_AUTH_TOKEN,
  });

  console.log('Creating CRM tables...');

  // Doctor table for CRM scheduling
  await db.execute(`
    CREATE TABLE IF NOT EXISTS CRMDoctor (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      specialization TEXT,
      phone TEXT,
      email TEXT,
      availableDays TEXT DEFAULT 'Mon,Tue,Wed,Thu,Fri,Sat',
      startTime TEXT DEFAULT '10:00',
      endTime TEXT DEFAULT '20:00',
      slotDuration INTEGER DEFAULT 30,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Treatment price list
  await db.execute(`
    CREATE TABLE IF NOT EXISTS TreatmentPrice (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      category TEXT,
      price REAL NOT NULL DEFAULT 0,
      duration INTEGER DEFAULT 30,
      description TEXT,
      active INTEGER NOT NULL DEFAULT 1,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Patient table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Patient (
      id TEXT PRIMARY KEY,
      patientId TEXT NOT NULL UNIQUE,
      firstName TEXT NOT NULL,
      lastName TEXT,
      phone TEXT NOT NULL,
      phone2 TEXT,
      email TEXT,
      dateOfBirth TEXT,
      age INTEGER,
      gender TEXT,
      bloodGroup TEXT,
      address TEXT,
      city TEXT DEFAULT 'Vijayawada',
      state TEXT DEFAULT 'Andhra Pradesh',
      pincode TEXT,
      occupation TEXT,
      referredBy TEXT,
      medicalHistory TEXT,
      dentalHistory TEXT,
      allergies TEXT,
      currentMedications TEXT,
      emergencyContactName TEXT,
      emergencyContactPhone TEXT,
      insuranceProvider TEXT,
      insuranceNumber TEXT,
      category TEXT DEFAULT 'New',
      photo TEXT,
      notes TEXT,
      totalVisits INTEGER DEFAULT 0,
      totalSpent REAL DEFAULT 0,
      balanceDue REAL DEFAULT 0,
      lastVisitDate DATETIME,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Patient_patientId ON Patient(patientId);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Patient_phone ON Patient(phone);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Patient_firstName ON Patient(firstName);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Patient_category ON Patient(category);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Patient_lastVisitDate ON Patient(lastVisitDate);`);

  // Appointment table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Appointment (
      id TEXT PRIMARY KEY,
      appointmentId TEXT NOT NULL UNIQUE,
      patientId TEXT NOT NULL,
      patientName TEXT NOT NULL,
      doctorId TEXT,
      doctorName TEXT,
      date TEXT NOT NULL,
      time TEXT NOT NULL,
      endTime TEXT,
      duration INTEGER DEFAULT 30,
      status TEXT DEFAULT 'scheduled',
      treatmentType TEXT,
      reason TEXT,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Patient(id)
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Appointment_date ON Appointment(date);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Appointment_doctorId ON Appointment(doctorId);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Appointment_status ON Appointment(status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Appointment_patientId ON Appointment(patientId);`);

  // Patient Visit / Clinical Record
  await db.execute(`
    CREATE TABLE IF NOT EXISTS PatientVisit (
      id TEXT PRIMARY KEY,
      visitId TEXT NOT NULL UNIQUE,
      patientId TEXT NOT NULL,
      patientName TEXT NOT NULL,
      doctorId TEXT,
      doctorName TEXT,
      appointmentId TEXT,
      date TEXT NOT NULL,
      chiefComplaint TEXT,
      diagnosis TEXT,
      treatmentDone TEXT,
      prescription TEXT,
      notes TEXT,
      followUpDate TEXT,
      totalAmount REAL DEFAULT 0,
      discount REAL DEFAULT 0,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Patient(id),
      FOREIGN KEY (appointmentId) REFERENCES Appointment(id)
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_PatientVisit_patientId ON PatientVisit(patientId);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_PatientVisit_date ON PatientVisit(date);`);

  // Payment / Invoice table
  await db.execute(`
    CREATE TABLE IF NOT EXISTS Payment (
      id TEXT PRIMARY KEY,
      paymentId TEXT NOT NULL UNIQUE,
      patientId TEXT NOT NULL,
      patientName TEXT NOT NULL,
      visitId TEXT,
      invoiceNumber TEXT NOT NULL UNIQUE,
      amount REAL NOT NULL DEFAULT 0,
      paidAmount REAL DEFAULT 0,
      balanceAmount REAL DEFAULT 0,
      paymentMethod TEXT,
      status TEXT DEFAULT 'pending',
      date TEXT NOT NULL,
      dueDate TEXT,
      items TEXT,
      notes TEXT,
      createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (patientId) REFERENCES Patient(id),
      FOREIGN KEY (visitId) REFERENCES PatientVisit(id)
    );
  `);

  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Payment_patientId ON Payment(patientId);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Payment_status ON Payment(status);`);
  await db.execute(`CREATE INDEX IF NOT EXISTS idx_Payment_date ON Payment(date);`);

  // Seed treatment prices
  const treatments = [
    { name: 'Consultation / Checkup', category: 'General', price: 300, duration: 15 },
    { name: 'Teeth Cleaning / Scaling', category: 'Preventive', price: 800, duration: 30 },
    { name: 'Root Canal Treatment (Anterior)', category: 'Endodontic', price: 3500, duration: 60 },
    { name: 'Root Canal Treatment (Premolar)', category: 'Endodontic', price: 4500, duration: 60 },
    { name: 'Root Canal Treatment (Molar)', category: 'Endodontic', price: 5500, duration: 90 },
    { name: 'Dental Filling (Composite)', category: 'Restorative', price: 1500, duration: 30 },
    { name: 'Dental Filling (Glass Ionomer)', category: 'Restorative', price: 800, duration: 20 },
    { name: 'Tooth Extraction (Simple)', category: 'Surgical', price: 1000, duration: 20 },
    { name: 'Tooth Extraction (Surgical)', category: 'Surgical', price: 2500, duration: 45 },
    { name: 'Wisdom Tooth Removal', category: 'Surgical', price: 4000, duration: 60 },
    { name: 'Dental Crown (Metal)', category: 'Prosthodontic', price: 3000, duration: 45 },
    { name: 'Dental Crown (Ceramic)', category: 'Prosthodontic', price: 5000, duration: 45 },
    { name: 'Dental Crown (Zirconia)', category: 'Prosthodontic', price: 8000, duration: 45 },
    { name: 'Dental Bridge (per unit)', category: 'Prosthodontic', price: 5000, duration: 60 },
    { name: 'Dental Implant (Single Tooth)', category: 'Implant', price: 25000, duration: 90 },
    { name: 'Dental Implant (Abutment + Crown)', category: 'Implant', price: 35000, duration: 90 },
    { name: 'Denture (Complete)', category: 'Prosthodontic', price: 12000, duration: 60 },
    { name: 'Denture (Partial)', category: 'Prosthodontic', price: 8000, duration: 45 },
    { name: 'Teeth Whitening', category: 'Cosmetic', price: 5000, duration: 60 },
    { name: 'Dental Veneer (per tooth)', category: 'Cosmetic', price: 8000, duration: 45 },
    { name: 'Braces (Metal)', category: 'Orthodontic', price: 25000, duration: 30 },
    { name: 'Braces (Ceramic)', category: 'Orthodontic', price: 35000, duration: 30 },
    { name: 'Invisalign / Clear Aligner', category: 'Orthodontic', price: 80000, duration: 30 },
    { name: 'Gum Treatment (Cleaning)', category: 'Periodontic', price: 1500, duration: 30 },
    { name: 'Gum Surgery', category: 'Periodontic', price: 8000, duration: 60 },
    { name: 'Fluoride Treatment', category: 'Preventive', price: 500, duration: 15 },
    { name: 'Dental Sealant (per tooth)', category: 'Preventive', price: 400, duration: 10 },
    { name: 'Night Guard / Mouth Guard', category: 'Preventive', price: 2000, duration: 30 },
    { name: 'X-Ray (Periapical)', category: 'Diagnostic', price: 200, duration: 10 },
    { name: 'X-Ray (OPG)', category: 'Diagnostic', price: 400, duration: 15 },
    { name: 'CBCT Scan', category: 'Diagnostic', price: 1500, duration: 20 },
    { name: 'Laser Gum Treatment', category: 'Periodontic', price: 3000, duration: 30 },
    { name: 'Tooth Sensitivity Treatment', category: 'General', price: 1000, duration: 20 },
    { name: 'Bad Breath Treatment', category: 'General', price: 800, duration: 20 },
    { name: 'Full Mouth Rehabilitation', category: 'Prosthodontic', price: 150000, duration: 120 },
    { name: 'Smile Design / Makeover', category: 'Cosmetic', price: 50000, duration: 60 },
    { name: 'Pediatric Dental Checkup', category: 'Pediatric', price: 400, duration: 15 },
    { name: 'Pediatric Filling', category: 'Pediatric', price: 1000, duration: 20 },
    { name: 'Pit & Fissure Sealant', category: 'Pediatric', price: 500, duration: 15 },
    { name: 'Emergency Dental Visit', category: 'Emergency', price: 1000, duration: 20 },
  ];

  const existing = await db.execute('SELECT COUNT(*) as c FROM TreatmentPrice');
  if (existing.rows[0].c === 0) {
    const crypto = require('crypto');
    for (const t of treatments) {
      const id = 'tp_' + crypto.randomBytes(6).toString('hex');
      await db.execute({
        sql: `INSERT INTO TreatmentPrice (id, name, category, price, duration, description, active) VALUES (?, ?, ?, ?, ?, ?, 1)`,
        args: [id, t.name, t.category, t.price, t.duration, `${t.name} at Mouth Care Solutions, Vijayawada`]
      });
    }
    console.log(`Seeded ${treatments.length} treatment prices`);
  } else {
    console.log('Treatment prices already exist');
  }

  // Seed CRM Doctors (matching website doctors)
  const existingDocs = await db.execute('SELECT COUNT(*) as c FROM CRMDoctor');
  if (existingDocs.rows[0].c === 0) {
    const crypto = require('crypto');
    const doctors = [
      { name: 'Dr. R. Suresh Babu', specialization: 'Orthodontist', phone: '9866344866' },
      { name: 'Dr. P. Rama Devi', specialization: 'Endodontist', phone: '' },
      { name: 'Dr. K. Venkateswara Rao', specialization: 'Oral & Maxillofacial Surgeon', phone: '' },
      { name: 'Dr. Lakshmi Prasanna', specialization: 'Periodontist', phone: '' },
      { name: 'Dr. N. Srikanth', specialization: 'Prosthodontist', phone: '' },
      { name: 'Dr. M. Padmavathi', specialization: 'Pediatric Dentist', phone: '' },
      { name: 'Dr. A. Rajesh Kumar', specialization: 'Implantologist', phone: '' },
      { name: 'Dr. B. Kavitha', specialization: 'Cosmetic Dentist', phone: '' },
      { name: 'Dr. Ch. Srinivasa Rao', specialization: 'General Dentist', phone: '' },
      { name: 'Dr. T. Divya', specialization: 'Oral Pathologist', phone: '' },
    ];

    for (const d of doctors) {
      const id = 'doc_' + crypto.randomBytes(6).toString('hex');
      await db.execute({
        sql: 'INSERT INTO CRMDoctor (id, name, specialization, phone, active) VALUES (?, ?, ?, ?, 1)',
        args: [id, d.name, d.specialization, d.phone]
      });
    }
    console.log(`Seeded ${doctors.length} CRM doctors`);
  } else {
    console.log('CRM doctors already exist');
  }

  // Add frontoffice user (uses bcryptjs, same as auth system)
  const existingUsers = await db.execute({
    sql: "SELECT COUNT(*) as c FROM AdminUser WHERE username = 'frontoffice'",
    args: []
  });
  if (existingUsers.rows[0].c === 0) {
    const crypto = require('crypto');
    const bcrypt = require('bcryptjs');
    const foPassword = process.env.FRONT_OFFICE_PASSWORD;
    if (!foPassword) {
      console.log('WARNING: Set FRONT_OFFICE_PASSWORD env var to create frontoffice user');
    } else {
      const hash = bcrypt.hashSync(foPassword, 12);
      const id = 'fo_' + crypto.randomBytes(8).toString('hex');
      await db.execute({
        sql: 'INSERT INTO AdminUser (id, username, passwordHash, name, role) VALUES (?, ?, ?, ?, ?)',
        args: [id, 'frontoffice', hash, 'Front Office', 'frontoffice']
      });
      console.log('Front office user created successfully');
    }
  } else {
    console.log('Front office user already exists');
  }

  // Verify
  const tables = await db.execute("SELECT name FROM sqlite_master WHERE type='table' ORDER BY name;");
  console.log('\nAll database tables:');
  tables.rows.forEach(r => console.log('  - ' + r.name));
  console.log('\nCRM database setup complete!');
}

main().catch(e => { console.error(e); process.exit(1); });
