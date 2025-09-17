import { QueryClient, QueryFunction } from "@tanstack/react-query";

class APIError extends Error {
  constructor(public status: number, message: string, public response?: Response) {
    super(message);
    this.name = 'APIError';
  }
}

async function throwIfResNotOk(res: Response) {
  if (!res.ok) {
    let errorMessage: string;
    try {
      const errorData = await res.json();
      errorMessage = errorData.message || errorData.error || res.statusText;
    } catch {
      // If response is not JSON, fall back to text
      try {
        errorMessage = (await res.text()) || res.statusText;
      } catch {
        errorMessage = res.statusText;
      }
    }

    // Provide more user-friendly error messages
    switch (res.status) {
      case 400:
        throw new APIError(res.status, `Bad request: ${errorMessage}`, res);
      case 401:
        throw new APIError(res.status, 'Please log in to continue', res);
      case 403:
        throw new APIError(res.status, 'You do not have permission to perform this action', res);
      case 404:
        throw new APIError(res.status, 'The requested resource was not found', res);
      case 500:
        throw new APIError(res.status, 'Server error. Please try again later', res);
      case 503:
        throw new APIError(res.status, 'Service temporarily unavailable. Please try again later', res);
      default:
        throw new APIError(res.status, errorMessage || 'An unexpected error occurred', res);
    }
  }
}

export async function apiRequest(
  method: string,
  url: string,
  data?: unknown | undefined,
): Promise<Response> {
  try {
    const res = await fetch(url, {
      method,
      headers: data ? { "Content-Type": "application/json" } : {},
      body: data ? JSON.stringify(data) : undefined,
      credentials: "include",
    });

    await throwIfResNotOk(res);
    return res;
  } catch (error) {
    // Handle network errors
    if (error instanceof TypeError) {
      throw new APIError(0, 'Network error. Please check your internet connection and try again');
    }
    // Re-throw APIError and other errors as-is
    throw error;
  }
}

type UnauthorizedBehavior = "returnNull" | "throw";
export const getQueryFn: <T>(options: {
  on401: UnauthorizedBehavior;
}) => QueryFunction<T> =
  ({ on401: unauthorizedBehavior }) =>
  async ({ queryKey }) => {
    try {
      const res = await fetch(queryKey.join("/") as string, {
        credentials: "include",
      });

      if (unauthorizedBehavior === "returnNull" && res.status === 401) {
        return null;
      }

      await throwIfResNotOk(res);
      return await res.json();
    } catch (error) {
      // Handle network errors
      if (error instanceof TypeError) {
        throw new APIError(0, 'Network error. Please check your internet connection and try again');
      }
      // Re-throw APIError and other errors as-is
      throw error;
    }
  };

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      queryFn: getQueryFn({ on401: "throw" }),
      refetchInterval: false,
      refetchOnWindowFocus: false,
      staleTime: 5 * 60 * 1000, // 5 minutes cache for better performance
      retry: (failureCount, error) => {
        // Don't retry on 4xx errors except for network errors
        if (error instanceof APIError && error.status >= 400 && error.status < 500 && error.status !== 0) {
          return false;
        }
        // Retry up to 2 times for network errors and 5xx errors
        return failureCount < 2;
      },
      gcTime: 10 * 60 * 1000, // Keep unused data for 10 minutes
    },
    mutations: {
      retry: (failureCount, error) => {
        // Don't retry mutations on 4xx errors except for network errors
        if (error instanceof APIError && error.status >= 400 && error.status < 500 && error.status !== 0) {
          return false;
        }
        // Retry once for network errors and 5xx errors
        return failureCount < 1;
      },
    },
  },
});

// Export APIError for use in components
export { APIError };
