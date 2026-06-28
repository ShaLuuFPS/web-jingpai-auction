"use client";

import { useEffect, useState } from "react";

export default function TunnelInfo() {
  const [loading, setLoading] = useState(true);
  const [tunnelUrl, setTunnelUrl] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/tunnel-url")
      .then((r) => r.json())
      .then((d) => {
        if (!cancelled) {
          setTunnelUrl(d.url);
          setLoading(false);
        }
      })
      .catch(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  if (loading) {
    return (
      <div className="mt-6 bg-amber-50 border border-amber-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded-full border-2 border-amber-300 border-t-amber-600 animate-spin" />
          <span className="text-amber-700 text-sm">正在建立隧道连接...</span>
        </div>
        <p className="text-xs text-amber-500 mt-1">
          cloudflared 正在获取外网地址，请稍候
        </p>
      </div>
    );
  }

  if (tunnelUrl) {
    return (
      <div className="mt-6 bg-green-50 border border-green-200 rounded-xl p-4">
        <div className="flex items-center gap-2">
          <span className="text-green-700 font-medium text-sm">外网访问地址：</span>
          <code className="text-sm bg-white px-3 py-1 rounded-lg border border-green-200 text-green-800">
            {tunnelUrl}
          </code>
          <button
            onClick={() => {
              if (navigator.clipboard) {
                navigator.clipboard.writeText(tunnelUrl);
              } else {
                const ta = document.createElement("textarea");
                ta.value = tunnelUrl;
                ta.style.position = "fixed";
                ta.style.left = "-9999px";
                document.body.appendChild(ta);
                ta.select();
                document.execCommand("copy");
                document.body.removeChild(ta);
              }
            }}
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

  return (
    <div className="mt-6 bg-red-50 border border-[#ff6b6b]/30 rounded-xl p-4">
      <span className="text-[#ff6b6b] text-sm">
        未检测到 cloudflared，外网访问不可用
      </span>
    </div>
  );
}
