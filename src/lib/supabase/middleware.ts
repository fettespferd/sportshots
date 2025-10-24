import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

export async function updateSession(request: NextRequest) {
  let supabaseResponse = NextResponse.next({
    request,
  });

  // Use placeholder values that pass Supabase validation during build
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || "https://xyzcompany.supabase.co";
  const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Inh5emNvbXBhbnkiLCJyb2xlIjoiYW5vbiIsImlhdCI6MTY0MjQ0ODAwMCwiZXhwIjoxOTU4MDI0MDAwfQ.placeholder";

  const supabase = createServerClient(
    supabaseUrl,
    supabaseKey,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // IMPORTANT: Avoid writing any logic between createServerClient and
  // supabase.auth.getUser(). A simple mistake could make it very hard to debug
  // issues with users being randomly logged out.

  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Protected routes logic
  if (
    !user &&
    (request.nextUrl.pathname.startsWith("/dashboard") ||
     request.nextUrl.pathname.startsWith("/photographer") ||
     request.nextUrl.pathname.startsWith("/admin") ||
     request.nextUrl.pathname.startsWith("/orders"))
  ) {
    // Redirect to sign in
    const url = request.nextUrl.clone();
    url.pathname = "/signin";
    url.searchParams.set("redirect", request.nextUrl.pathname);
    return NextResponse.redirect(url);
  }

  // Role-based protection
  if (user) {
    const { data: profile } = await supabase
      .from("profiles")
      .select("role, photographer_status")
      .eq("id", user.id)
      .single();

    // Photographer routes - Admins haben auch Zugriff!
    if (request.nextUrl.pathname.startsWith("/photographer")) {
      const isPhotographer =
        profile?.role === "photographer" &&
        profile?.photographer_status === "approved";
      const isAdmin = profile?.role === "admin";

      if (!isPhotographer && !isAdmin) {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }

    // Admin routes - nur für Admins
    if (request.nextUrl.pathname.startsWith("/admin")) {
      if (profile?.role !== "admin") {
        const url = request.nextUrl.clone();
        url.pathname = "/";
        return NextResponse.redirect(url);
      }
    }
  }

  // IMPORTANT: You *must* return the supabaseResponse object as it is. If you're
  // creating a new response object with NextResponse.next() make sure to:
  // 1. Pass the request in it, like so:
  //    const myNewResponse = NextResponse.next({ request })
  // 2. Copy over the cookies, like so:
  //    myNewResponse.cookies.setAll(supabaseResponse.cookies.getAll())
  // 3. Change the myNewResponse object to fit your needs, but avoid changing
  //    the cookies!
  // 4. Finally:
  //    return myNewResponse
  // If this is not done, you may be causing the browser and server to go out
  // of sync and terminate the user's session prematurely.

  return supabaseResponse;
}

