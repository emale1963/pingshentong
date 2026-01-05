'use client';

export default function TestLayout() {
  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-4">Layout测试页面</h1>
      <p className="text-gray-600">
        这个页面受AdminLayout保护。如果你能看到这个内容，说明：
      </p>
      <ul className="list-disc list-inside mt-4 space-y-2 text-gray-700">
        <li>已成功登录</li>
        <li>Cookie正确设置</li>
        <li>AdminLayout没有报错</li>
      </ul>

      <div className="mt-8 p-4 bg-blue-50 rounded">
        <h2 className="font-semibold mb-2">如果看到页面空白或被重定向：</h2>
        <ol className="list-decimal list-inside space-y-1 text-sm">
          <li>说明未登录或cookie未设置</li>
          <li>请先访问 <a href="/admin/login" className="text-blue-600 underline">/admin/login</a> 登录</li>
          <li>或者访问 <a href="/admin/quick-test" className="text-blue-600 underline">/admin/quick-test</a> 快速测试</li>
        </ol>
      </div>
    </div>
  );
}
