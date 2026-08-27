export class InvalidDispatcherError extends Error {
  constructor(public readonly dispatcher: string) {
    super(`Not a valid dispatcher: ${dispatcher}`);
    this.name = "InvalidDispatcherError";
  }
}
