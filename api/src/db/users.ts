import { mockDb } from './mock.js';

export interface User {
 id: number;
 email: string;
 password_hash?: string;
 full_name?: string;
 role: string;
 organization?: string;
 is_active: boolean;
 created_at: Date;
 updated_at: Date;
}

export const createUser = async (
 email: string,
 passwordHash: string,
 fullName?: string,
 role?: string
): Promise<User> => {
 return mockDb.createUser(email, passwordHash, fullName, role);
};

export const getUserByEmail = async (email: string): Promise<User | null> => {
 return mockDb.getUserByEmail(email);
};

export const getUserById = async (id: number): Promise<User | null> => {
 return mockDb.getUserById(id);
};

export const updateUser = async (
 id: number,
 updates: Partial<User>
): Promise<User | null> => {
 // Mock implementation - TODO: implement in mock database
 return null;
};

export const deactivateUser = async (id: number): Promise<boolean> => {
 // Mock implementation
 return true;
};

export const listUsers = async (
 limit: number = 50,
 offset: number = 0
): Promise<User[]> => {
 // Mock implementation
 return [];
};
