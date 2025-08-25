import { useState } from "react";
import { apiService, ApiError } from "@/services/api";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function HealthPage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCheck = async () => {
    setLoading(true);
    setError(null);
    setResult(null);
    try {
      const res = await apiService.checkHealth();
      setResult(res);
    } catch (err) {
      const message = err instanceof ApiError ? err.message : (err as Error)?.message || "Unknown error";
      setError(message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-6">
      <Card className="w-full max-w-xl">
        <CardHeader>
          <CardTitle>API Health Check</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-3">
            <Button onClick={handleCheck} disabled={loading}>
              {loading ? "Checking..." : "Check /api/health"}
            </Button>
            <span className="text-sm text-muted-foreground">
              Base: {import.meta.env.VITE_API_BASE_URL || "(not set)"}
            </span>
          </div>
          {error && (
            <div className="text-red-600 text-sm">{error}</div>
          )}
          {result && (
            <pre className="bg-muted p-3 rounded text-sm overflow-x-auto">
{JSON.stringify(result, null, 2)}
            </pre>
          )}
        </CardContent>
      </Card>
    </div>
  );
}


