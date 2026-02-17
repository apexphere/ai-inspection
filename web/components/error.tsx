interface ErrorMessageProps {
  title?: string;
  message: string;
  retry?: () => void;
}

export function ErrorMessage({
  title = 'Error',
  message,
  retry,
}: ErrorMessageProps): React.ReactElement {
  return (
    <div className="rounded-lg bg-red-50 p-6 text-center">
      <h3 className="text-lg font-semibold text-red-800">{title}</h3>
      <p className="mt-2 text-sm text-red-600">{message}</p>
      {retry && (
        <button
          onClick={retry}
          className="mt-4 px-4 py-2 bg-red-100 text-red-800 rounded-lg hover:bg-red-200 transition-colors"
        >
          Try Again
        </button>
      )}
    </div>
  );
}

export function ErrorPage({
  message,
  retry,
}: Omit<ErrorMessageProps, 'title'>): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[400px]">
      <ErrorMessage title="Something went wrong" message={message} retry={retry} />
    </div>
  );
}
