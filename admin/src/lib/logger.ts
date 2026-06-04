export function logSafe(message: string) {
  if (process.env.NODE_ENV !== "production") {
    console.log(message);
  }
}
