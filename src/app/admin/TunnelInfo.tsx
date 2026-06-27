"use client";

import { useEffect, useState } from "react";

export default function TunnelInfo() {
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tunnel-url")
      .then((r) => r.json())
      .then((d) => d.url && setTunnelUrl(d.url));
  }, []);

  if (!tunnelUrl) return null;

  return (
    <div className="mt-6 bg-green-50 border border-green-200 rounded-lg p-4">
      <div className="flex items-center gap-2">
        <span className="text-green-700 font-medium text-sm">🌐 外网访问地址：</span>
        <code className="text-sm bg-white px-3 py-1 rounded border border-green-200 text-green-800">
          {tunnelUrl}
        </code>
        <button
          onClick={() => navigator.clipboard.writeText(tunnelUrl)}
          className="text-xs text-green-600 hover:underline ml-2"
        >
          复制
        </button>
      </div>
      <p className="text-xs text-green-500 mt-1">
        将此链接分享给外网参与者即可访问竞拍系统
      </p>
    </div>
  );
}
