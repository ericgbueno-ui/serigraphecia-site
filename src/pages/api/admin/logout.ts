import type { APIRoute } from "astro";
import { ADMIN_COOKIE_NAME } from "../../../lib/server/adminAuth";

export const prerender = false;

export const POST: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(ADMIN_COOKIE_NAME, { path: "/" });
  return redirect("/admin", 302);
};

export const GET: APIRoute = ({ cookies, redirect }) => {
  cookies.delete(ADMIN_COOKIE_NAME, { path: "/" });
  return redirect("/admin", 302);
};
