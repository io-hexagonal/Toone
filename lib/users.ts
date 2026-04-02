import fs from "fs";
import path from "path";
import type { User } from "./types";

const usersPath = path.join(process.cwd(), "content", "users.json");

let cachedUsers: User[] | null = null;

export function getAllUsers(): User[] {
  if (cachedUsers) return cachedUsers;
  const raw = fs.readFileSync(usersPath, "utf-8");
  cachedUsers = JSON.parse(raw) as User[];
  return cachedUsers;
}

export function getUserById(id: string): User | undefined {
  return getAllUsers().find((u) => u.id === id);
}
