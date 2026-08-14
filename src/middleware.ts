import { defineMiddleware } from "astro:middleware";

export const onRequest = defineMiddleware(async (context, next) => {
  const SECRET_PASS = import.meta.env.SITE_PASSWORD;
  const SECRET_KEY = import.meta.env.SITE_KEY;
  const url = new URL(context.request.url);

  // check if user already has a valid session cookie
  const authCookie = context.cookies.get("auth")?.value;
  if (authCookie === "true") {
    return next();
  }

  // 2. magic link check
  const queryPass = url.searchParams.get("key");
  if (queryPass === SECRET_KEY) {
    context.cookies.set("auth", "true", {
      path: "/",
      httpOnly: true,
      secure: true,
      maxAge: 60 * 60 * 24 * 30, // 30 days
    });

    // Remove query param from URL so it looks clean
    url.searchParams.delete("key");
    return context.redirect("/", 302);
  }

  // 3. Handle Password Form Submission
  if (context.request.method === "POST") {
    const contentType = context.request.headers.get("content-type") || "";

    // Ensure Content-Type is valid before calling formData()
    if (
      contentType.includes("application/x-www-form-urlencoded") ||
      contentType.includes("multipart/form-data")
    ) {
      try {
        const formData = await context.request.formData();
        if (formData.get("password") === SECRET_PASS) {
          context.cookies.set("auth", "true", {
            path: "/",
            httpOnly: true,
            secure: true,
            maxAge: 60 * 60 * 24 * 30,
          });
          return context.redirect(url.pathname, 302);
        }
      } catch (err) {
        console.error("Form data parsing failed:", err);
      }
    }
  }

  // 4. Render Password Gate
  return new Response(
    `<!DOCTYPE html>
    <html lang="en">
      <head>
        <meta charset="UTF-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <script src="https://cdn.tailwindcss.com"></script>
        <title>In Loving Memory of Edric Sum</title>
      </head>
      <body class="flex items-center justify-center min-h-screen p-4">
        <div class="max-w-md w-full bg-white rounded-2xl shadow-sm border border-stone-200 p-8 text-center space-y-6">
          <h1 class="text-2xl text-stone-900 font-medium">In Loving Memory of Edric Sum</h1>
          <p class="text-stone-600 text-sm leading-relaxed">
            Please enter password to access the memorial page.
          </p>
          <form method="POST" class="space-y-4">
            <input
              type="password"
              name="password"
              placeholder="Enter password"
              required
              class="w-full border border-stone-300 rounded-md focus:ring-2 focus:ring-stone-400 focus:outline-none text-center text-lg"
            />
            <button
              type="submit"
              class="w-full py-2 bg-black hover:bg-stone-900 text-white font-medium rounded-md transition-colors text-sm"
            >
              Access Memorial
            </button>
          </form>
        </div>
      </body>
    </html>`,
    {
      status: 401,
      headers: { "Content-Type": "text/html" },
    },
  );
});
