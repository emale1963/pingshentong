'use client';

export default function QuickTest() {
  const handleLogin = async () => {
    try {
      console.log('开始登录...');

      const response = await fetch('/api/admin/simple-login', {
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

      console.log('响应状态:', response.status, response.ok);

      const text = await response.text();
      console.log('响应文本:', text);

      try {
        const data = JSON.parse(text);
        console.log('解析后的数据:', data);

        if (response.ok && data.success) {
          console.log('登录成功，准备跳转...');
          setTimeout(() => {
            window.location.href = '/admin/dashboard';
          }, 500);
        } else {
          alert('登录失败: ' + (data.error || '未知错误'));
        }
      } catch (e) {
        console.error('JSON解析失败:', e);
        alert('JSON解析失败: ' + text);
      }
    } catch (error) {
      console.error('登录错误:', error);
      alert('登录错误: ' + (error instanceof Error ? error.message : String(error)));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100 p-8">
      <div className="bg-white p-8 rounded-lg shadow-lg max-w-md w-full">
        <h1 className="text-2xl font-bold mb-6">快速测试登录</h1>
        
        <p className="text-sm text-gray-600 mb-4">
          点击下方按钮测试登录功能。查看浏览器控制台（F12）获取详细日志。
        </p>
        
        <button
          onClick={handleLogin}
          className="w-full bg-blue-600 text-white py-3 px-4 rounded-lg hover:bg-blue-700 text-lg font-medium"
        >
          测试登录（admin/123456）
        </button>

        <div className="mt-6 text-xs text-gray-500 space-y-2">
          <p>测试步骤：</p>
          <ol className="list-decimal list-inside space-y-1">
            <li>点击上方登录按钮</li>
            <li>打开浏览器控制台（按F12）</li>
            <li>查看Console标签中的日志</li>
            <li>如果成功，会自动跳转到dashboard</li>
          </ol>
        </div>
      </div>
    </div>
  );
}
