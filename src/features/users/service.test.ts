import { describe, expect, it, vi } from "vitest";

import { NotFoundError } from "@/lib/errors";

import type { UsersRepository } from "./repository";
import { createUsersService } from "./service";
import type { Profile, UserAccount } from "./types";

const account: UserAccount = {
  id: "u1",
  email: "a@b.com",
  phone: null,
  role: "customer",
  status: "active",
  isVerified: true,
  createdAt: "2026-01-01T00:00:00Z",
  updatedAt: "2026-01-01T00:00:00Z",
};

const profile: Profile = {
  userId: "u1",
  fullName: "Reem",
  displayName: null,
  avatarUrl: null,
  bio: null,
  gender: null,
  dateOfBirth: null,
  locale: "ar",
  cityId: null,
  updatedAt: "2026-01-01T00:00:00Z",
};

function fakeRepo(overrides: Partial<UsersRepository> = {}): UsersRepository {
  return {
    findAccount: vi.fn().mockResolvedValue(account),
    findProfile: vi.fn().mockResolvedValue(profile),
    updateProfile: vi.fn().mockResolvedValue(profile),
    listAccounts: vi.fn().mockResolvedValue({ items: [account], total: 1 }),
    adminUpdate: vi.fn().mockResolvedValue(account),
    ...overrides,
  };
}

describe("UsersService", () => {
  it("getMe() returns account + profile", async () => {
    const service = createUsersService(fakeRepo());
    const me = await service.getMe("u1");
    expect(me.account.id).toBe("u1");
    expect(me.profile?.fullName).toBe("Reem");
  });

  it("getMe() throws NotFoundError when the account is missing", async () => {
    const service = createUsersService(
      fakeRepo({ findAccount: vi.fn().mockResolvedValue(null) }),
    );
    await expect(service.getMe("x")).rejects.toBeInstanceOf(NotFoundError);
  });

  it("adminUpdate() throws NotFoundError when the user is missing", async () => {
    const service = createUsersService(
      fakeRepo({ adminUpdate: vi.fn().mockResolvedValue(null) }),
    );
    await expect(
      service.adminUpdate("x", { status: "suspended" }),
    ).rejects.toBeInstanceOf(NotFoundError);
  });

  it("list() returns a paginated envelope", async () => {
    const service = createUsersService(fakeRepo());
    const result = await service.list({ page: 1, pageSize: 20 });
    expect(result.total).toBe(1);
  });
});
