// ==========================================
// UMKM.AI - FRONTEND VALIDATION
// ==========================================

export const nameRegex = /^[A-Za-zÀ-ÿ\s]+$/;

export const phoneRegex = /^\d+$/;

export const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const positiveNumberRegex = /^\d+(\.\d+)?$/;

export const integerRegex = /^\d+$/;

// ==========================================
// VALIDATE NAME
// ==========================================

export const validateName = (value) => {
  const name = value?.trim();

  if (!name) {
    return 'Nama wajib diisi.';
  }

  if (!nameRegex.test(name)) {
    return 'Nama hanya boleh berisi huruf dan spasi.';
  }

  if (name.length < 2) {
    return 'Nama minimal 2 karakter.';
  }

  return '';
};

// ==========================================
// VALIDATE EMAIL
// ==========================================

export const validateEmail = (value) => {
  const email = value?.trim();

  if (!email) {
    return 'Email wajib diisi.';
  }

  if (!emailRegex.test(email)) {
    return 'Format email tidak valid.';
  }

  return '';
};

// ==========================================
// VALIDATE PHONE
// ==========================================

export const validatePhone = (value) => {
  const phone = value?.trim();

  if (!phone) {
    return 'Nomor HP wajib diisi.';
  }

  if (!phoneRegex.test(phone)) {
    return 'Nomor HP hanya boleh berisi angka.';
  }

  if (phone.length < 10 || phone.length > 15) {
    return 'Nomor HP harus terdiri dari 10-15 angka.';
  }

  return '';
};

// ==========================================
// VALIDATE PASSWORD
// ==========================================

export const validatePassword = (value, required = true) => {
  if (!value && required) {
    return 'Password wajib diisi.';
  }

  if (!value && !required) {
    return '';
  }

  if (value.length < 6) {
    return 'Password minimal 6 karakter.';
  }

  if (value.length > 100) {
    return 'Password maksimal 100 karakter.';
  }

  return '';
};

// ==========================================
// VALIDATE PRODUCT PRICE
// ==========================================

export const validatePrice = (value, fieldName = 'Harga') => {
  if (value === '' || value === null || value === undefined) {
    return `${fieldName} wajib diisi.`;
  }

  const number = Number(value);

  if (!Number.isFinite(number)) {
    return `${fieldName} harus berupa angka.`;
  }

  if (number < 0) {
    return `${fieldName} tidak boleh kurang dari 0.`;
  }

  return '';
};

// ==========================================
// VALIDATE INTEGER
// ==========================================

export const validateInteger = (
  value,
  fieldName = 'Nilai'
) => {
  if (value === '' || value === null || value === undefined) {
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

  return '';
};

// ==========================================
// VALIDATE TEXT
// ==========================================

export const validateText = (
  value,
  fieldName = 'Field',
  maxLength = 255
) => {
  const text = value?.trim();

  if (!text) {
    return `${fieldName} wajib diisi.`;
  }

  if (text.length > maxLength) {
    return `${fieldName} maksimal ${maxLength} karakter.`;
  }

  return '';
};

// ==========================================
// VALIDATE URL
// ==========================================

export const validateUrl = (value) => {
  if (!value || !value.trim()) {
    return '';
  }

  try {
    const url = new URL(value.trim());

    if (!['http:', 'https:'].includes(url.protocol)) {
      return 'URL harus menggunakan HTTP atau HTTPS.';
    }

    return '';
  } catch {
    return 'Format URL tidak valid.';
  }
};