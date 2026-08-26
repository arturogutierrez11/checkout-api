export class AdminUserNotFoundError extends Error {
  constructor(public readonly adminUserId: string) {
    super(`Admin user not found: ${adminUserId}`);
    this.name = "AdminUserNotFoundError";
  }
}
