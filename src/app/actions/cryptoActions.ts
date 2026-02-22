'use server';

import bcrypt from 'bcrypt';

export const calculateHashServer = async (data: string): Promise<string> => {
  const saltRounds = 10; // Usar um número adequado de salt rounds
  return bcrypt.hash(data, saltRounds);
};

export const compareHashServer = async (data: string, hashedData: string): Promise<boolean> => {
  return bcrypt.compare(data, hashedData);
};
