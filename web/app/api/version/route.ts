import { NextResponse } from 'next/server';

export function GET(): NextResponse {
  return NextResponse.json({
    sha: process.env.NEXT_PUBLIC_GIT_SHA,
    shortSha: process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 7),
    branch: process.env.NEXT_PUBLIC_GIT_BRANCH,
    buildTime: process.env.NEXT_PUBLIC_BUILD_TIME,
  });
}
