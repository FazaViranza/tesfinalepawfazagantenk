// ==========================================
// UMKM.AI - BACKEND VALIDATION
// ==========================================

const nameRegex = /^[A-Za-zÀ-ÿ\s]+$/;
const phoneRegex = /^\d+$/;
const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const integerRegex = /^\d+$/;

// ==========================================
// VALIDATE NAME
// ==========================================

const validateName = (value) => {
  if (typeof value !== 'string') {
    return 'Nama harus berupa teks.';
  }

  const name = value.trim();

  if (!name) {
    return 'Nama wajib diisi.';
  }

  if (!nameRegex.test(name)) {
    return 'Nama hanya boleh berisi huruf dan spasi.';
  }

  if (name.length < 2) {
    return 'Nama minimal 2 karakter.';
  }

  if (name.length > 100) {
    return 'Nama maksimal 100 karakter.';
  }

  return null;
};

// ==========================================
// VALIDATE EMAIL
// ==========================================

const validateEmail = (value) => {
  if (typeof value !== 'string') {
    return 'Email harus berupa teks.';
  }

  const email = value.trim();

  if (!email) {
    return 'Email wajib diisi.';
  }

  if (!emailRegex.test(email)) {
    return 'Format email tidak valid.';
  }

  if (email.length > 150) {
    return 'Email maksimal 150 karakter.';
  }

  return null;
};

// ==========================================
// VALIDATE PHONE
// ==========================================

const validatePhone = (value) => {
  if (typeof value !== 'string') {
    return 'Nomor HP harus berupa teks angka.';
  }

  const phone = value.trim();

  if (!phone) {
    return 'Nomor HP wajib diisi.';
  }

  if (!phoneRegex.test(phone)) {
    return 'Nomor HP hanya boleh berisi angka.';
  }

  if (phone.length < 10 || phone.length > 15) {
    return 'Nomor HP harus terdiri dari 10-15 angka.';
  }

  return null;
};

// ==========================================
// VALIDATE PASSWORD
// ==========================================

const validatePassword = (value, required = true) => {
  if (!value && required) {
    return 'Password wajib diisi.';
  }

  if (!value && !required) {
    return null;
  }

  if (typeof value !== 'string') {
    return 'Password harus berupa teks.';
  }

  if (value.length < 6) {
    return 'Password minimal 6 karakter.';
  }

  if (value.length > 100) {
    return 'Password maksimal 100 karakter.';
  }

  return null;
};

// ==========================================
// VALIDATE NON-NEGATIVE NUMBER
// ==========================================

const validateNumber = (
  value,
  fieldName = 'Nilai'
) => {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return `${fieldName} wajib diisi.`;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${fieldName} harus berupa angka.`;
  }

  if (number < 0) {
    return `${fieldName} tidak boleh kurang dari 0.`;
  }

  return null;
};

// ==========================================
// VALIDATE INTEGER
// ==========================================

const validateInteger = (
  value,
  fieldName = 'Nilai'
) => {
  if (
    value === '' ||
    value === null ||
    value === undefined
  ) {
    return `${fieldName} wajib diisi.`;
  }

  if (!integerRegex.test(String(value))) {
    return `${fieldName} harus berupa angka bulat.`;
  }

  const number = Number(value);

  if (!Number.isSafeInteger(number)) {
    return `${fieldName} tidak valid.`;
  }

  if (number < 0) {
    return `${fieldName} tidak boleh kurang dari 0.`;
  }

  return null;
};

// ==========================================
// VALIDATE TEXT
// ==========================================

const validateText = (
  value,
  fieldName = 'Field',
  maxLength = 255
) => {
  if (typeof value !== 'string') {
    return `${fieldName} harus berupa teks.`;
  }

  const text = value.trim();

  if (!text) {
    return `${fieldName} wajib diisi.`;
  }

  if (text.length > maxLength) {
    return `${fieldName} maksimal ${maxLength} karakter.`;
  }

  return null;
};

// ==========================================
// VALIDATE URL
// ==========================================

const validateUrl = (value) => {
  if (!value || !value.trim()) {
    return null;
  }

  try {
    const url = new URL(value.trim());

    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'URL harus menggunakan HTTP atau HTTPS.';
    }

    return null;
  } catch {
    return 'Format URL tidak valid.';
  }
};

module.exports = {
  validateName,
  validateEmail,
  validatePhone,
  validatePassword,
  validateNumber,
  validateInteger,
  validateText,
  validateUrl,
};