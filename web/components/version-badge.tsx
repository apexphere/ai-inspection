export function VersionBadge(): React.ReactElement {
  const sha = process.env.NEXT_PUBLIC_GIT_SHA?.slice(0, 7) || 'local';
  const branch = process.env.NEXT_PUBLIC_GIT_BRANCH || 'local';
  
  return (
    <span className="text-xs text-gray-400" title={`Branch: ${branch}`}>
      v: {sha}
    </span>
  );
}
