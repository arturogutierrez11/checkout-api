/** Hardcoded — checkout.api has no access to auth.api's user accounts, and there are only two people dispatching orders. */
export const DISPATCHERS = [
  "Arturo Gutierrez",
  "Valentin Fernandez Caride",
] as const;

export type Dispatcher = (typeof DISPATCHERS)[number];
