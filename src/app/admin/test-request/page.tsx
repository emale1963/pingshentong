'use client';

import { useState } from 'react';

export default function TestRequest() {
  const [result, setResult] = useState('');

  const testRequest = async () => {
    try {
      const response = await fetch('/api/admin/test-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: 'admin',
          password: '123456',
        }),
        credentials: 'include',
      });

      const data = await response.json();
      setResult(JSON.stringify(data, null, 2));
    } catch (error) {
      setResult(`Error: ${error}`);
    }
  };

  return (
    <div className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-6">请求测试页面</h1>
      
      <button
        onClick={testRequest}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 mb-4"
      >
        测试请求
      </button>

      {result && (
        <pre className="bg-gray-100 p-4 rounded text-sm overflow-auto">
          {result}
        </pre>
      )}
    </div>
  );
}
