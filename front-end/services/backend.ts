/** Builds links to the untouched Express backend. Set NEXT_PUBLIC_BACKEND_URL when it is hosted elsewhere. */
export function backendPath(path: string) { return `${process.env.NEXT_PUBLIC_BACKEND_URL ?? ""}${path}`; }
