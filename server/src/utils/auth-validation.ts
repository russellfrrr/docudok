interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

export class AuthValidationError extends Error {}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const maxNameLength = 80;
const minPasswordLength = 8;
const maxPasswordLength = 128;

export const validateRegisterInput = (body: unknown): RegisterInput => {
  const input = body as Partial<RegisterInput>;
  const name = input.name?.trim() || '';
  const email = input.email?.trim().toLowerCase() || '';
  const password = input.password || '';

  if (!name || !email || !password) {
    throw new AuthValidationError('Name, email, and password are required');
  }

  if (!emailPattern.test(email)) {
    throw new AuthValidationError('Please enter a valid email address');
  }

  if (name.length > maxNameLength) {
    throw new AuthValidationError(`Name must be ${maxNameLength} characters or fewer`);
  }

  if (password.length < minPasswordLength) {
    throw new AuthValidationError(
      `Password must be at least ${minPasswordLength} characters`
    );
  }

  if (password.length > maxPasswordLength) {
    throw new AuthValidationError(
      `Password must be ${maxPasswordLength} characters or fewer`
    );
  }

  return { name, email, password };
};

export const validateLoginInput = (body: unknown): LoginInput => {
  const input = body as Partial<LoginInput>;
  const email = input.email?.trim().toLowerCase() || '';
  const password = input.password || '';

  if (!email || !password) {
    throw new AuthValidationError('Email and password are required');
  }

  if (!emailPattern.test(email)) {
    throw new AuthValidationError('Please enter a valid email address');
  }

  return { email, password };
};
