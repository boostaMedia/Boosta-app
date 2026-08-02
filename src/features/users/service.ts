import { NotFoundError } from "@/lib/errors";
import type { Paginated } from "@/types";

import type { UsersRepository } from "./repository";
import type {
  AdminUpdateUserInput,
  ListUsersParams,
  Me,
  Profile,
  UpdateProfileInput,
  UserAccount,
} from "./types";

export interface UsersService {
  getMe(userId: string): Promise<Me>;
  updateMyProfile(userId: string, input: UpdateProfileInput): Promise<Profile>;
  list(params: ListUsersParams): Promise<Paginated<UserAccount>>;
  get(id: string): Promise<UserAccount>;
  adminUpdate(id: string, input: AdminUpdateUserInput): Promise<UserAccount>;
}

export function createUsersService(repo: UsersRepository): UsersService {
  return {
    async getMe(userId) {
      const account = await repo.findAccount(userId);
      if (!account) throw new NotFoundError("User not found.");
      const profile = await repo.findProfile(userId);
      return { account, profile };
    },

    async updateMyProfile(userId, input) {
      return repo.updateProfile(userId, input);
    },

    async list(params) {
      const { items, total } = await repo.listAccounts(params);
      return {
        items,
        page: params.page,
        pageSize: params.pageSize,
        total,
        totalPages: Math.max(1, Math.ceil(total / params.pageSize)),
      };
    },

    async get(id) {
      const account = await repo.findAccount(id);
      if (!account) throw new NotFoundError("User not found.");
      return account;
    },

    async adminUpdate(id, input) {
      const updated = await repo.adminUpdate(id, input);
      if (!updated) throw new NotFoundError("User not found.");
      return updated;
    },
  };
}
