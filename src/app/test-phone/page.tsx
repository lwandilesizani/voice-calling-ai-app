"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function TestPhonePage() {
  const [assistantId, setAssistantId] = useState("");
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runTest = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const response = await fetch('/api/vapi/test-phone-number', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          assistant_id: assistantId
        }),
      });
      
      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || `Failed with status ${response.status}`);
      }
      
      const data = await response.json();
      setResults(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      console.error('Test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container mx-auto py-10">
      <h1 className="text-2xl font-bold mb-6">Phone Number API Test</h1>
      
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Test Parameters</CardTitle>
          <CardDescription>Configure the test parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="assistant-id">Assistant ID (Optional)</Label>
              <Input 
                id="assistant-id" 
                placeholder="Enter assistant ID" 
                value={assistantId}
                onChange={(e) => setAssistantId(e.target.value)}
              />
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button onClick={runTest} disabled={loading}>
            {loading ? 'Running Test...' : 'Run Test'}
          </Button>
        </CardFooter>
      </Card>
      
      {error && (
        <Card className="mb-6 border-red-500">
          <CardHeader>
            <CardTitle className="text-red-500">Error</CardTitle>
          </CardHeader>
          <CardContent>
            <pre className="bg-red-50 p-4 rounded text-red-500 overflow-auto">{error}</pre>
          </CardContent>
        </Card>
      )}
      
      {results && (
        <Card>
          <CardHeader>
            <CardTitle>Test Results</CardTitle>
            <CardDescription>Results of different phone number formats</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">
              {results.map((result: any, index: number) => (
                <div key={index} className={`p-4 rounded border ${result.success ? 'border-green-500 bg-green-50' : 'border-red-500 bg-red-50'}`}>
                  <h3 className="font-bold mb-2">Format {index + 1}</h3>
                  <div className="mb-2">
                    <h4 className="font-semibold">Request:</h4>
                    <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(result.format, null, 2)}</pre>
                  </div>
                  {result.success ? (
                    <div>
                      <h4 className="font-semibold text-green-700">Success:</h4>
                      <pre className="bg-gray-100 p-2 rounded">{JSON.stringify(result.result, null, 2)}</pre>
                    </div>
                  ) : (
                    <div>
                      <h4 className="font-semibold text-red-700">Error:</h4>
                      <pre className="bg-gray-100 p-2 rounded">{result.error}</pre>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
} 