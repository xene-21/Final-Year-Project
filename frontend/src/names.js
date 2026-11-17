// Realistic generic names for mock accounts and student datasets.

const FIRST_NAMES = [
  'Chinedu', 'Amina', 'Tunde', 'David', 'Blessing', 'Femi', 'Grace', 'Ibrahim', 'Ngozi', 'Samuel',
  'Folake', 'Kelechi', 'Fatima', 'Oluwaseun', 'Zainab', 'Emmanuel', 'Chioma', 'Farouk', 'Deborah', 'Ayomide',
  'Joy', 'Mustapha', 'Faith', 'Chukwuma', 'Halima', 'Daniel', 'Ruth', 'Abubakar', 'Simi', 'Uche',
  'Precious', 'Victor', 'Maryam', 'Adeola', 'Chidi', 'Damilola', 'Hauwa', 'Kayode', 'Temitope', 'Osas',
  'Esther', 'Olamide', 'Peace', 'Bolaji', 'Rita', 'Chibuzor', 'Aisha', 'Idris', 'Gloria', 'Boluwatife',
];

const LAST_NAMES = [
  'Okonkwo', 'Bello', 'Bakare', 'Adeleke', 'Eze', 'Oladipo', 'Danjuma', 'Musa', 'Obi', 'Alabi',
  'Sani', 'Ajayi', 'Ibrahim', 'Okafor', 'Babatunde', 'Balogun', 'Garba', 'Nnamdi', 'Olawale', 'Mohammed',
  'Nwosu', 'Adeniyi', 'Abiola', 'Yusuf', 'Ogunleye', 'Ojo', 'Lawal', 'Aliyu', 'Chukwu', 'Adeyemi',
  'Adebayo', 'Okeke', 'Usman', 'Fashola', 'Kalu', 'Oluwole', 'Shehu', 'Falana', 'Ogundipe', 'Sanusi',
];

export function getGenericStudentName(idx) {
  const i = Math.max(1, Number(idx) || 1);
  const first = FIRST_NAMES[(i - 1) % FIRST_NAMES.length];
  const last = LAST_NAMES[(Math.floor((i - 1) / FIRST_NAMES.length) * 3 + (i * 7)) % LAST_NAMES.length];
  return `${first} ${last}`;
}

export function normalizeUser(user) {
  if (!user) return user;
  let fullName = user.fullName || '';

  // Replace placeholder mock names with realistic generic names
  if (/^dr\s*lecturer$/i.test(fullName) || user.email === 'lecturer@portal.test') {
    fullName = 'Dr. Babatunde Adeyemi';
  } else if (/^portal\s*admin$/i.test(fullName) || /^test\s*admin$/i.test(fullName) || user.email === 'admin@portal.test') {
    fullName = 'Engr. Funke Adeleke';
  } else {
    const studentMatch = fullName.match(/^student\s+(\d+)$/i) || (user.email && user.email.match(/^student(\d+)@/i));
    if (studentMatch) {
      fullName = getGenericStudentName(studentMatch[1]);
    }
  }

  return { ...user, fullName };
}

export function formatStudentName(s) {
  if (!s) return 'Student';
  return normalizeUser(s).fullName;
}

export function getGreetingName(user) {
  if (!user) return '';
  const fullName = (user.fullName || '').trim();
  if (!fullName) return '';

  const parts = fullName.split(/\s+/);
  const titles = ['dr', 'dr.', 'prof', 'prof.', 'engr', 'engr.', 'mr', 'mr.', 'mrs', 'mrs.', 'ms', 'ms.'];

  // If the first word is a title, return the next word (the actual first name)
  if (titles.includes(parts[0].toLowerCase())) {
    return parts[1] || parts[0];
  }

  // Otherwise just the first name
  return parts[0];
}
