// Re-export from the new API lib
export * from "../lib/api";
import apiModule from "../lib/api";

// Legacy exports for backward compatibility
export const apiClient = apiModule;
export const apiService = apiModule;
export default apiModule;