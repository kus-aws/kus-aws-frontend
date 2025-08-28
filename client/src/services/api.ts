// Re-export from the new API lib
export * from "../lib/api";
import { apiService } from "../lib/api";

// Legacy exports for backward compatibility
export const apiClient = apiService;
export default apiService;