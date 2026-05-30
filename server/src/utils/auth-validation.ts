interface RegisterInput {
  name: string;
  email: string;
  password: string;
}

interface LoginInput {
  email: string;
  password: string;
}

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export const validateRegisterInput = (body: unknown): RegisterInput => {
  const input = body as Partial<RegisterInput>;
  const name = input.name?.trim() || '';
  const email = input.email?.trim().toLowerCase() || '';
  const password = input.password || '';

  if (!name || !email || !password) {
    throw new Error('Name, email, and password are required');
  }

  if (!emailPattern.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  if (password.length < 8) {
    throw new Error('Password must be at least 8 characters');
  }

  return { name, email, password };
};

export const validateLoginInput = (body: unknown): LoginInput => {
  const input = body as Partial<LoginInput>;
  const email = input.email?.trim().toLowerCase() || '';
  const password = input.password || '';

  if (!email || !password) {
    throw new Error('Email and password are required');
  }

  if (!emailPattern.test(email)) {
    throw new Error('Please enter a valid email address');
  }

  return { email, password };
};
