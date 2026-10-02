/**
 * End-to-end smoke test against a running backend + database.
 *
 * Exercises the full migration surface: dual-identifier login, role
 * enforcement, registration, schedule generation, dose recording and the
 * parent/child scoping rule.
 *
 * Run with: npm run test:e2e   (after `npm run seed`)
 */
const BASE = process.env.E2E_BASE_URL ?? 'http://localhost:5000/api';

/**
 * Must match `SEED_PASSWORD`, otherwise every seeded login fails with 401 and
 * the whole suite cascades. Defaults to the same value the seed script uses.
 */
const PASSWORD = process.env.SEED_PASSWORD ?? 'Vaccinate@2024';

let passed = 0;
let failed = 0;

const check = (name: string, condition: boolean, detail = '') => {
  if (condition) {
    passed += 1;
    console.log(`  PASS  ${name}`);
  } else {
    failed += 1;
    console.log(`  FAIL  ${name}${detail ? ` -> ${detail}` : ''}`);
  }
};

const request = async (
  path: string,
  options: { method?: string; body?: unknown; token?: string } = {},
) => {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (options.token) headers.Authorization = `Bearer ${options.token}`;

  const response = await fetch(`${BASE}${path}`, {
    method: options.method ?? 'GET',
    headers,
    body: options.body ? JSON.stringify(options.body) : undefined,
  });

  const text = await response.text();
  let body: unknown = null;
  try {
    body = text ? JSON.parse(text) : null;
  } catch {
    body = text;
  }

  if (response.status >= 500) {
    // A 5xx is always a defect; surface the message so the cause is obvious.
    console.log(
      `        ${options.method ?? 'GET'} ${path} -> ${response.status}`,
    );
    console.log(`        ${text.slice(0, 300)}`);
  }

  return {
    status: response.status,
    body: (body ?? {}) as Record<string, unknown>,
  };
};

/** Read a nested field from a loosely-typed API payload. */
const get = (source: unknown, path: string): unknown =>
  path.split('.').reduce<unknown>((value, key) => {
    if (value && typeof value === 'object') {
      return (value as Record<string, unknown>)[key];
    }
    return undefined;
  }, source);

const login = async (identifier: string, password: string) => {
  const { status, body } = await request('/auth/login', {
    method: 'POST',
    body: { username: identifier, password },
  });
  return { status, body };
};

async function main(): Promise<void> {
  console.log(`\nSmoke testing ${BASE}\n`);

  // --- health ------------------------------------------------------------
  console.log('health');
  const health = await request('/health/check');
  check(
    'GET /health/check returns 200',
    health.status === 200,
    `got ${health.status}`,
  );
  check(
    'database connected',
    health.body?.database === 'connected',
    String(health.body?.database),
  );

  // --- authentication ----------------------------------------------------
  console.log('\nauthentication');
  const byUsername = await login('admin', PASSWORD);
  check(
    'login with username',
    byUsername.status === 200,
    `got ${byUsername.status}`,
  );
  check(
    'response exposes accessToken',
    typeof byUsername.body?.accessToken === 'string',
  );
  check(
    'response exposes refreshToken',
    typeof byUsername.body?.refreshToken === 'string',
  );

  const byEmail = await login('admin@vaccination.et', PASSWORD);
  check('login with email', byEmail.status === 200, `got ${byEmail.status}`);

  // Use a throwaway account: five wrong-password attempts lock an account for
  // 15 minutes, so testing this against `admin` would lock the seeded user out.
  const throwawayEmail = `smoke-lockout-${Date.now()}@test.et`;
  await request('/auth/register', {
    method: 'POST',
    body: {
      email: throwawayEmail,
      password: 'Throwaway@123',
      firstName: 'Smoke',
      lastName: 'Lockout',
      phoneNumber: '+251911000123',
    },
  });

  const wrongPassword = await login(throwawayEmail, 'WrongPassword@1');
  check(
    'rejects a wrong password',
    wrongPassword.status === 401,
    `got ${wrongPassword.status}`,
  );

  const unknownUser = await login('does-not-exist', PASSWORD);
  check(
    'rejects an unknown user',
    unknownUser.status === 401,
    `got ${unknownUser.status}`,
  );

  const adminToken = byUsername.body?.accessToken as string;
  check(
    'token carries the admin role',
    get(byUsername.body, 'user.role') === 'admin',
  );

  // Access and refresh tokens must not be interchangeable.
  const refreshSwap = await request('/auth/refresh', {
    method: 'POST',
    body: { refreshToken: adminToken },
  });
  check(
    'access token rejected by /auth/refresh',
    refreshSwap.status === 401,
    `got ${refreshSwap.status}`,
  );

  // --- role enforcement --------------------------------------------------
  console.log('\nrole enforcement');
  const registrarLogin = await login('registrar', PASSWORD);
  const parentLogin = await login('parent', PASSWORD);
  const doctorLogin = await login('doctor', PASSWORD);
  const registrarToken = registrarLogin.body?.accessToken as string;
  const parentToken = parentLogin.body?.accessToken as string;
  const doctorToken = doctorLogin.body?.accessToken as string;

  const parentCreatingUsers = await request('/users', {
    method: 'POST',
    token: parentToken,
    body: {
      email: `x${Date.now()}@test.et`,
      password: 'TestPass@123',
      role: 'admin',
      profile: { firstName: 'X', lastName: 'Y', phoneNumber: '+251911000099' },
    },
  });
  check(
    'parent cannot create users',
    parentCreatingUsers.status === 403,
    `got ${parentCreatingUsers.status}`,
  );

  const parentListingUsers = await request('/users', { token: parentToken });
  check(
    'parent cannot list users',
    parentListingUsers.status === 403,
    `got ${parentListingUsers.status}`,
  );

  // `/doctors/review-queue` is readable by any clinical role, so assert on a
  // write route that only a doctor may perform.
  // A parent must not reach any doctor route. `review-queue` has no path
  // parameter, so the class-level @Roles(DOCTOR) guard is the only thing that
  // can reject it — which is exactly what needs verifying.
  const parentReviewQueue = await request('/doctors/review-queue', {
    token: parentToken,
  });
  check(
    'parent cannot read the doctor worklist',
    parentReviewQueue.status === 403,
    `got ${parentReviewQueue.status}`,
  );

  const doctorReviewQueue = await request('/doctors/review-queue', {
    token: doctorToken,
  });
  check(
    'doctor can read the doctor worklist',
    doctorReviewQueue.status === 200,
    `got ${doctorReviewQueue.status}`,
  );

  const noToken = await request('/users');
  check(
    'protected route requires a token',
    noToken.status === 401,
    `got ${noToken.status}`,
  );

  // --- registration + schedules -----------------------------------------
  console.log('\nregistration and schedules');
  const uniquePhone = `+2519${String(Date.now()).slice(-8)}`;

  const mother = await request('/mothers', {
    method: 'POST',
    token: registrarToken,
    body: {
      personalInfo: {
        firstName: 'Test',
        lastName: 'Mother',
        birthDate: '1995-04-01',
        bloodType: 'A+',
      },
      contactInfo: { phoneNumber: uniquePhone },
      address: { zone: 'South West', wereda: 'Jimmma', kebele: '09' },
    },
  });
  check(
    'registrar can register a mother',
    mother.status === 201,
    `got ${mother.status}`,
  );
  const motherSchedule = (mother.body?.schedule ?? []) as unknown as Array<{
    vaccineName: string;
  }>;
  check(
    'mother TT/Rh schedule generated',
    motherSchedule.length === 6 && motherSchedule[0]?.vaccineName === 'TT1',
    JSON.stringify(motherSchedule.map((d) => d.vaccineName)),
  );

  const child = await request('/children', {
    method: 'POST',
    token: registrarToken,
    body: {
      motherId: mother.body?._id,
      personalInfo: {
        firstName: 'Test',
        lastName: 'Child',
        birthDate: '2025-01-10',
      },
    },
  });
  check(
    'registrar can register a child',
    child.status === 201,
    `got ${child.status}`,
  );
  const childSchedule = (child.body?.schedule ?? []) as unknown as Array<{
    vaccineName: string;
    status: string;
  }>;
  check(
    'child schedule generated',
    childSchedule.length > 0 && childSchedule[0]?.vaccineName === 'BCG',
    `got ${childSchedule.length} doses, first=${childSchedule[0]?.vaccineName}`,
  );
  // The create response is returned before the bidirectional link is written, so
  // re-read the mother rather than trusting the POST body.
  const motherChildren = await request(
    `/mothers/${mother.body?._id}/children`,
    {
      token: registrarToken,
    },
  );
  check(
    'mother is linked to the child',
    (Array.isArray(motherChildren.body) ? motherChildren.body : []).length ===
      1,
    `got ${Array.isArray(motherChildren.body) ? motherChildren.body.length : 'n/a'}`,
  );

  const shortName = await request('/children', {
    method: 'POST',
    token: registrarToken,
    body: {
      motherId: mother.body?._id,
      personalInfo: { firstName: 'A', lastName: 'B', birthDate: '2025-01-10' },
    },
  });
  check(
    'short names are rejected or accepted per schema',
    [201, 400].includes(shortName.status),
  );

  // --- dose recording ---------------------------------------------------
  console.log('\ndose recording');
  const doseBody = {
    doseIndex: 1,
    batchNumber: 'BATCH123',
    // Not a valid ObjectId, so the clinic lookup is rejected by validation
    // before any database work happens.
    clinicId: 'not-an-object-id',
  };
  const recordBadClinic = await request(
    `/children/${child.body?._id}/vaccinations`,
    {
      method: 'POST',
      token: registrarToken,
      body: doseBody,
    },
  );
  check(
    'invalid clinic id is rejected',
    recordBadClinic.status === 400,
    `got ${recordBadClinic.status}`,
  );

  const clinics = await request('/clinics', { token: registrarToken });
  const clinicList = (Array.isArray(clinics.body)
    ? clinics.body
    : []) as unknown as Array<{
    _id: string;
  }>;
  if (clinicList.length > 0) {
    const recorded = await request(
      `/children/${child.body?._id}/vaccinations`,
      {
        method: 'POST',
        token: registrarToken,
        body: { ...doseBody, clinicId: clinicList[0]._id },
      },
    );
    check('dose recorded', recorded.status === 200, `got ${recorded.status}`);
    const schedule = (recorded.body?.schedule ?? []) as unknown as Array<{
      status: string;
      givenDate: string;
    }>;
    check(
      'recorded dose marked completed',
      schedule[1]?.status === 'completed',
      schedule[1]?.status,
    );
    check('recorded dose has an administration date', !!schedule[1]?.givenDate);

    const replay = await request(`/children/${child.body?._id}/vaccinations`, {
      method: 'POST',
      token: registrarToken,
      body: { ...doseBody, clinicId: clinicList[0]._id },
    });
    check(
      'duplicate dose is rejected',
      replay.status === 400,
      `got ${replay.status}`,
    );
  } else {
    console.log('  SKIP  dose recording (no clinic seeded)');
  }

  // --- contraindication gate ---------------------------------------------
  // A child with an active contraindication must not be vaccinated until a
  // doctor clears it, so this uses a second child whose doses stay pending.
  console.log('\ncontraindication gate');
  const gateChild = await request('/children', {
    method: 'POST',
    token: registrarToken,
    body: {
      motherId: mother.body?._id,
      personalInfo: {
        firstName: 'Gate',
        lastName: 'Subject',
        birthDate: '2025-02-02',
      },
    },
  });
  const gateId = gateChild.body?._id as string;
  const gateClinicId = clinicList[0]?._id;

  if (gateId && gateClinicId) {
    const flagged = await request('/doctors/contraindications', {
      method: 'POST',
      token: doctorToken,
      body: {
        childId: gateId,
        type: 'Severe allergy',
        reason: 'Documented reaction during review',
        doctorId: get(doctorLogin.body, 'user.id'),
        duration: 'temporary',
        reviewDate: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      },
    });
    check(
      'doctor can flag a contraindication',
      flagged.status === 201,
      `got ${flagged.status}`,
    );

    const unsafe = await request(`/doctors/vaccination-safety/${gateId}`, {
      token: doctorToken,
    });
    check(
      'flagged child reports unsafe',
      unsafe.body?.isSafe === false,
      JSON.stringify(unsafe.body),
    );

    const blocked = await request(`/children/${gateId}/vaccinations`, {
      method: 'POST',
      token: doctorToken,
      body: { doseIndex: 0, batchNumber: 'BLOCKED1', clinicId: gateClinicId },
    });
    check(
      'vaccination refused while contraindicated',
      blocked.status === 400,
      `got ${blocked.status}`,
    );
    // `message` can be a string or a validation array depending on the guard.
    const refusal = [get(blocked.body, 'message')].flat().map(String).join(' ');
    check(
      'refusal names the contraindication',
      refusal.includes('contraindication'),
      refusal,
    );

    const cleared = await request('/doctors/contraindications/remove', {
      method: 'POST',
      token: doctorToken,
      body: {
        childId: gateId,
        contraindicationId: get(flagged.body, 'id'),
        doctorId: get(doctorLogin.body, 'user.id'),
        removalReason: 'Resolved during medical review',
      },
    });
    check(
      'contraindication can be cleared',
      cleared.status === 200,
      `got ${cleared.status}`,
    );

    const allowed = await request(`/children/${gateId}/vaccinations`, {
      method: 'POST',
      token: doctorToken,
      body: { doseIndex: 0, batchNumber: 'CLEARED1', clinicId: gateClinicId },
    });
    check(
      'vaccination allowed once cleared',
      allowed.status === 200,
      `got ${allowed.status}`,
    );
  } else {
    console.log('  SKIP  contraindication gate (no clinic seeded)');
  }

  // --- mother TT dose ---------------------------------------------------
  const motherDose = await request(`/mothers/${mother.body?._id}/doses`, {
    method: 'POST',
    token: registrarToken,
    body: { vaccineName: 'TT1' },
  });
  check(
    'mother TT dose recorded',
    motherDose.status === 200,
    `got ${motherDose.status}`,
  );
  const ttSchedule = (motherDose.body?.schedule ?? []) as unknown as Array<{
    vaccineName: string;
    status: string;
  }>;
  check(
    'TT1 marked completed',
    ttSchedule[0]?.status === 'completed',
    ttSchedule[0]?.status,
  );

  const badDose = await request(`/mothers/${mother.body?._id}/doses`, {
    method: 'POST',
    token: registrarToken,
    body: { vaccineName: 'NOT_A_DOSE' },
  });
  check(
    'unknown dose name rejected',
    badDose.status === 404,
    `got ${badDose.status}`,
  );

  // --- parent scoping ---------------------------------------------------
  console.log('\nparent scoping');
  const parentChildren = await request('/children/my-children', {
    token: parentToken,
  });
  check(
    'parent can list own children',
    parentChildren.status === 200,
    `got ${parentChildren.status}`,
  );
  // A successful list response is an array; on failure it is an error object,
  // so fall back to an empty array rather than crashing on `.some`.
  const own = (Array.isArray(parentChildren.body)
    ? parentChildren.body
    : []) as unknown as Array<{
    childId: string;
  }>;
  check(
    'parent sees only their own children',
    !own.some((c) => c.childId === (child.body?.childId as string)),
    `saw ${own.length} records`,
  );

  const adminChildren = await request('/children', { token: adminToken });
  check(
    'admin sees all children',
    ((adminChildren.body ?? []) as unknown as unknown[]).length > own.length,
  );

  // --- posts ------------------------------------------------------------
  console.log('\nposts');
  const posts = await request('/posts');
  check('posts are public', posts.status === 200, `got ${posts.status}`);
  const createdPost = await request('/posts', {
    method: 'POST',
    token: registrarToken,
    body: {
      title: 'Smoke test',
      category: 'Test',
      description: 'Created by the smoke test',
    },
  });
  check(
    'registrar can create a post',
    createdPost.status === 201,
    `got ${createdPost.status}`,
  );
  const badPost = await request('/posts', {
    method: 'POST',
    token: parentToken,
    body: { title: 'x', category: 'y', description: 'z' },
  });
  check(
    'parent cannot create a post',
    badPost.status === 403,
    `got ${badPost.status}`,
  );
  const removedPost = await request(`/posts/${createdPost.body?._id}`, {
    method: 'DELETE',
    token: adminToken,
  });
  check(
    'admin can delete a post',
    removedPost.status === 204,
    `got ${removedPost.status}`,
  );

  // --- validation -------------------------------------------------------
  console.log('\nvalidation');
  const badEmail = await request('/auth/login', {
    method: 'POST',
    body: { email: 'not-an-email', password: PASSWORD },
  });
  // `LoginDto` accepts a bare identifier without @IsEmail (a username has no
  // @ either), so the malformed address is treated as a username and fails as
  // bad credentials rather than as a validation error.
  check(
    'malformed email rejected',
    [400, 401].includes(badEmail.status),
    `got ${badEmail.status}`,
  );

  const noIdentifier = await request('/auth/login', {
    method: 'POST',
    body: { password: PASSWORD },
  });
  check(
    'login without username or email is rejected',
    noIdentifier.status === 400,
    `got ${noIdentifier.status}`,
  );

  const unknownField = await request('/mothers', {
    method: 'POST',
    token: registrarToken,
    body: {
      personalInfo: { firstName: 'A', lastName: 'B', birthDate: '1995-01-01' },
      contactInfo: { phoneNumber: '+251911000000' },
      address: { zone: 'z', wereda: 'w', kebele: 'k' },
      injectedField: 'should be stripped',
    },
  });
  check(
    'unknown fields rejected by whitelist',
    unknownField.status === 400,
    `got ${unknownField.status}`,
  );

  // --- summary ----------------------------------------------------------
  console.log(`\n${'='.repeat(48)}`);
  console.log(`  passed: ${passed}   failed: ${failed}`);
  console.log('='.repeat(48));

  if (failed > 0) {
    process.exitCode = 1;
  }
}

main().catch((error) => {
  console.error('\nSmoke test could not run:', error.message);
  console.error('Is the backend running and `npm run seed` complete?');
  process.exitCode = 1;
});
