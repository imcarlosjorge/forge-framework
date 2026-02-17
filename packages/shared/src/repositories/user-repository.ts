import { User } from "../domain/user";

export interface UserRepository {
  findById(id: string): Promise<User | null>;
}
