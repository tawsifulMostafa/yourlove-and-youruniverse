export const dynamic = "force-dynamic";

export async function GET() {
  const version =
    process.env.VERCEL_GIT_COMMIT_SHA ||
    process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA ||
    process.env.npm_package_version ||
    "local";

  return Response.json({ version });
}
