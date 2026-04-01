// 1. 订阅地址配置区
const SUBSCRIPTIONS = [
  { name: "Mitce 订阅", url: "https://app.mitce.net/?sid=500204&token=srvbjgb&app=clashverge" },
  { name: "备用机场 A", url: "https://app.mitce.net/?sid=500204&token=srvbjgb&app=clashverge" },
  { name: "备用机场 B", url: "https://app.mitce.net/?sid=500204&token=srvbjgb&app=clashverge" }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Backend API Logic (流量解析)
    if (url.pathname === "/api/traffic") {
      const results = await Promise.all(SUBSCRIPTIONS.map(async (sub) => {
        try {
          const resp = await fetch(sub.url, { headers: { "User-Agent": "v2rayN/6.23" } });
          const header = resp.headers.get("Subscription-Userinfo");
          if (!header) return { name: sub.name, error: true };
          const parseMatch = (str, key) => {
            const match = str.match(new RegExp(`${key}=(\\d+)`));
            return match ? parseInt(match[1]) : 0;
          };
          const up = parseMatch(header, "upload"), dl = parseMatch(header, "download");
          const total = parseMatch(header, "total"), expire = parseMatch(header, "expire");
          const up_gb = up / (1024 ** 3), dl_gb = dl / (1024 ** 3);
          const used_gb = up_gb + dl_gb, total_gb = total / (1024 ** 3);
          return {
            name: sub.name, up_gb: up_gb.toFixed(2), dl_gb: dl_gb.toFixed(2),
            used_gb: used_gb.toFixed(2), total_gb: total_gb.toFixed(2),
            usage_percent: total_gb > 0 ? ((used_gb / total_gb) * 100).toFixed(1) : 0,
            expire_date: expire ? new Date(expire * 1000).toISOString().split('T')[0] : "无期限"
          };
        } catch (e) { return { name: sub.name, error: true }; }
      }));
      return new Response(JSON.stringify(results), { headers: { "Content-Type": "application/json", "Access-Control-Allow-Origin": "*" } });
    }

    const HTML = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
      <title>订阅监控 • Pure</title>
      <link rel="preconnect" href="https://fonts.googleapis.com">
      <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
      <link href="https://fonts.googleapis.com/css2?family=Playfair+Display:wght@600;700;800&family=JetBrains+Mono:wght@400;500;600&family=Inter:wght@300;400;500;600&display=swap" rel="stylesheet">
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        :root { 
          --primary: 45 93% 47%; 
          --secondary: 266 85% 58%; 
          --accent: 350 80% 60%;
          --foreground: 0 0% 100%; 
          --background: 240 25% 6%; 
          --surface: 240 22% 10%; 
          --muted: 240 15% 15%; 
          --border: 240 10% 20%; 
          --radius: 20px; 
        }
        .light { 
          --primary: 45 93% 47%; 
          --secondary: 266 70% 55%; 
          --accent: 350 75% 55%;
          --foreground: 240 25% 8%; 
          --background: 0 0% 97%; 
          --surface: 0 0% 100%; 
          --muted: 240 5% 90%; 
          --border: 240 6% 85%; 
        }

        * { box-sizing: border-box; }
        html, body { margin: 0; padding: 0; }
        body { 
          background-color: hsl(var(--background)); 
          color: hsl(var(--foreground)); 
          font-family: 'Inter', ui-sans-serif, system-ui; 
          transition: background-color 0.8s cubic-bezier(0.4, 0, 0.2, 1); 
          overflow-x: hidden; 
          position: relative;
        }
        
        #bg-noise {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          pointer-events: none;
          opacity: 0.03;
          z-index: 1;
          background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)'/%3E%3C/svg%3E");
        }
        
        #bg-gradient {
          position: fixed;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          z-index: 0;
          background: 
            radial-gradient(at 0% 0%, hsl(var(--secondary) / 0.15) 0px, transparent 50%),
            radial-gradient(at 100% 0%, hsl(var(--accent) / 0.1) 0px, transparent 50%),
            radial-gradient(at 100% 100%, hsl(var(--primary) / 0.12) 0px, transparent 50%),
            radial-gradient(at 0% 100%, hsl(var(--secondary) / 0.08) 0px, transparent 50%);
        }

        @keyframes shimmer { 
          0% { opacity: 0.3; } 
          50% { opacity: 0.7; } 
          100% { opacity: 0.3; } 
        }
        .skeleton { 
          animation: shimmer 2s infinite; 
          background: linear-gradient(90deg, hsl(var(--muted)) 25%, hsl(var(--muted) / 0.5) 50%, hsl(var(--muted)) 75%);
          background-size: 200% 100%;
          animation: shimmer-sweep 2s infinite;
          border-radius: 8px; 
        }
        @keyframes shimmer-sweep {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }

        .animate { 
          animation: reveal 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards; 
          opacity: 0; 
          transform: translateY(20px);
        }
        @keyframes reveal { 
          0% { transform: translateY(20px); opacity: 0; } 
          100% { transform: translateY(0); opacity: 1; } 
        }

        .lux-card { 
          background: hsl(var(--surface) / 0.7); 
          backdrop-filter: blur(20px);
          border: 1px solid hsl(var(--border));
          border-radius: var(--radius); 
          padding: 2rem; 
          position: relative;
          overflow: hidden;
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lux-card::before {
          content: '';
          position: absolute;
          top: 0;
          left: 0;
          right: 0;
          height: 2px;
          background: linear-gradient(90deg, hsl(var(--primary)), hsl(var(--secondary)), hsl(var(--accent)));
          transform: scaleX(0);
          transform-origin: left;
          transition: transform 0.6s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .lux-card:hover { 
          border-color: hsl(var(--primary) / 0.5); 
          transform: translateY(-4px);
          box-shadow: 
            0 20px 40px -20px hsl(var(--primary) / 0.2),
            0 0 0 1px hsl(var(--border));
        }
        .lux-card:hover::before {
          transform: scaleX(1);
        }
        
        .progress-track { 
          background-color: hsl(var(--muted)); 
          border-radius: 999px; 
          height: 12px; 
          overflow: hidden; 
          position: relative;
        }
        .progress-track::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, hsl(var(--foreground) / 0.05) 50%, transparent 100%);
          pointer-events: none;
        }
        .progress-fill { 
          height: 100%; 
          transition: width 2s cubic-bezier(0.34, 1.56, 0.64, 1), background 0.3s ease; 
          border-radius: 999px;
          position: relative;
        }
        .progress-fill::after {
          content: '';
          position: absolute;
          inset: 0;
          background: linear-gradient(90deg, transparent 0%, hsl(0 0% 100% / 0.3) 50%, transparent 100%);
          animation: shine 3s infinite;
        }
        @keyframes shine {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
        .progress-normal { background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary))); }
        .progress-warning { background: linear-gradient(135deg, hsl(35 90% 55%), hsl(25 95% 50%)); }
        .progress-danger { background: linear-gradient(135deg, hsl(var(--accent)), hsl(10 85% 55%)); }

        .status-badge {
          position: relative;
          padding: 0.5rem 1rem;
          border-radius: 999px;
          font-size: 0.7rem;
          font-weight: 700;
          letter-spacing: 0.08em;
          text-transform: uppercase;
          overflow: hidden;
          z-index: 1;
        }
        .status-badge::before {
          content: '';
          position: absolute;
          inset: 0;
          border-radius: inherit;
          padding: 1px;
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary)));
          -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
          -webkit-mask-composite: xor;
          mask-composite: exclude;
          opacity: 0.5;
        }
        .status-normal { background: hsl(var(--muted) / 0.8); }
        .status-error { background: hsl(var(--accent) / 0.15); color: hsl(var(--accent)); }

        .theme-toggle { 
          position: relative; 
          width: 64px; 
          height: 32px; 
          background: linear-gradient(135deg, hsl(var(--muted)), hsl(var(--surface))); 
          border: 1px solid hsl(var(--border)); 
          border-radius: 999px; 
          cursor: pointer; 
          transition: all 0.5s cubic-bezier(0.4, 0, 0.2, 1);
          box-shadow: inset 0 2px 8px hsl(0 0% 0% / 0.1);
        }
        .theme-knob { 
          position: absolute; 
          top: 3px; 
          left: 3px; 
          width: 26px; 
          height: 26px; 
          background: linear-gradient(135deg, hsl(var(--foreground)), hsl(var(--foreground) / 0.8)); 
          border-radius: 50%; 
          display: flex; 
          align-items: center; 
          justify-content: center; 
          transition: transform 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55); 
          box-shadow: 0 4px 12px hsl(0 0% 0% / 0.2);
        }
        .light .theme-knob { 
          transform: translateX(32px); 
          background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary))); 
        }
        
        .theme-icon { 
          width: 14px; 
          height: 14px; 
          color: hsl(var(--background)); 
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1); 
          position: absolute;
        }

        .icon-sun { opacity: 1; transform: scale(1) rotate(0deg); }
        .icon-moon { opacity: 0; transform: scale(0.4) rotate(-90deg); }
        .light .icon-sun { opacity: 0; transform: scale(0.4) rotate(90deg); }
        .light .icon-moon { opacity: 1; transform: scale(1) rotate(0deg); }

        .refresh-btn {
          padding: 0.875rem;
          border-radius: 1rem;
          background: hsl(var(--muted) / 0.6);
          border: 1px solid hsl(var(--border));
          cursor: pointer;
          transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .refresh-btn:hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--primary) / 0.5);
          transform: scale(1.05);
        }
        .refresh-btn:active {
          transform: scale(0.95);
        }

        h1 { font-family: 'Playfair Display', serif; }
        .mono { font-family: 'JetBrains Mono', monospace; }
        
        .stat-label {
          font-size: 0.65rem;
          letter-spacing: 0.12em;
          text-transform: uppercase;
          font-weight: 600;
          opacity: 0.6;
        }
        
        .divider {
          height: 1px;
          background: linear-gradient(90deg, transparent, hsl(var(--border)), transparent);
        }
        
        .glow-text {
          text-shadow: 0 0 30px hsl(var(--primary) / 0.3);
        }
      </style>
      <script>
        (function() {
          const savedTheme = localStorage.theme || 'dark';
          if (savedTheme === 'light') document.documentElement.classList.add('light');
        })();

        let cachedData = null;

        function toggleTheme() {
          const html = document.documentElement;
          const isLight = html.classList.toggle('light');
          localStorage.theme = isLight ? 'light' : 'dark';
        }

        function renderSkeleton() {
          const app = document.getElementById('app');
          let skeletons = '';
          for(let i=0; i<3; i++) {
            skeletons += \`
              <section class="lux-card flex flex-col space-y-8 opacity-60">
                <div class="flex justify-between items-start">
                  <div class="space-y-2">
                    <div class="h-7 w-32 skeleton"></div>
                    <div class="h-4 w-24 skeleton"></div>
                  </div>
                  <div class="h-8 w-16 skeleton"></div>
                </div>
                <div class="space-y-6">
                  <div class="flex justify-between items-end">
                    <div class="h-4 w-20 skeleton"></div>
                    <div class="h-8 w-16 skeleton"></div>
                  </div>
                  <div class="h-3 w-full skeleton"></div>
                  <div class="grid grid-cols-2 gap-8 pt-2">
                    <div class="space-y-2">
                      <div class="h-3 w-12 skeleton"></div>
                      <div class="h-6 w-20 skeleton"></div>
                    </div>
                    <div class="space-y-2">
                      <div class="h-3 w-12 skeleton"></div>
                      <div class="h-6 w-20 skeleton"></div>
                    </div>
                  </div>
                </div>
              </section>\`;
          }
          app.innerHTML = skeletons;
        }

        function renderApp(data) {
          const app = document.getElementById('app');
          let html = '';
          data.forEach((sub, index) => {
            let progressClass = 'progress-normal';
            let textColor = 'text-primary';
            if (sub.usage_percent > 85) {
              progressClass = 'progress-danger';
            } else if (sub.usage_percent > 60) {
              progressClass = 'progress-warning';
            }
            html += \`
              <section class="lux-card flex flex-col space-y-8 animate" style="animation-delay: \${index * 0.1}s">
                <div class="flex justify-between items-start">
                  <div class="space-y-2">
                    <h2 class="text-2xl font-bold tracking-tight" style="font-family: 'Playfair Display', serif;">\${sub.name}</h2>
                    <p class="stat-label mono">到期 • <span class="opacity-100">\${sub.expire_date}</span></p>
                  </div>
                  <span class="status-badge \${sub.error ? 'status-error' : 'status-normal'}">
                    \${sub.error ? '异常' : '正常'}
                  </span>
                </div>
                <div class="space-y-6">
                  <div class="flex justify-between items-end">
                     <span class="stat-label">流量负载</span>
                     <span class="text-3xl font-black mono glow-text" style="color: hsl(\${sub.usage_percent > 85 ? 'var(--accent)' : sub.usage_percent > 60 ? '35 90% 55%' : 'var(--primary)'});">\${sub.usage_percent}%</span>
                  </div>
                  <div class="progress-track">
                    <div class="progress-fill \${progressClass}" style="width: \${sub.usage_percent}%"></div>
                  </div>
                  <div class="grid grid-cols-2 gap-8 pt-2">
                     <div class="space-y-2">
                        <span class="stat-label">上传量</span>
                        <p class="text-xl font-bold mono">\${sub.up_gb} <span class="text-sm font-normal opacity-50">GB</span></p>
                     </div>
                     <div class="space-y-2 pl-6 border-l border-border">
                        <span class="stat-label">下载量</span>
                        <p class="text-xl font-bold mono">\${sub.dl_gb} <span class="text-sm font-normal opacity-50">GB</span></p>
                     </div>
                  </div>
                  <div class="divider my-2"></div>
                  <div class="flex justify-between stat-label pt-1">
                    <span>已用 • <span class="opacity-100 mono text-base">\${sub.used_gb} GB</span></span>
                    <span>总计 • <span class="opacity-100 mono text-base">\${sub.total_gb} GB</span></span>
                  </div>
                </div>
              </section>\`;
          });
          app.innerHTML = html;
        }

        async function load(isRefresh = false) {
          const app = document.getElementById('app');
          const syncIcon = document.getElementById('sync-icon');
          if (isRefresh) { 
            syncIcon.classList.add('animate-spin'); 
            app.style.opacity = '0.4';
            app.style.transform = 'scale(0.98)';
          } else { 
            renderSkeleton(); 
          }
          try {
            const res = await fetch('/api/traffic');
            const data = await res.json();
            cachedData = data;
            renderApp(data);
          } catch (e) {
            app.innerHTML = '<div class="col-span-full py-20 text-center animate"><div class="text-6xl mb-4">⚠️</div><p class="text-xl font-bold" style="color: hsl(var(--accent));">数据同步失败</p></div>';
          } finally { 
            if (isRefresh) {
              syncIcon.classList.remove('animate-spin');
            }
            app.style.opacity = '1';
            app.style.transform = 'scale(1)';
          }
        }
        document.addEventListener('DOMContentLoaded', load);
      </script>
    </head>
    <body class="flex justify-center min-h-screen">
      <div id="bg-gradient"></div>
      <div id="bg-noise"></div>
      <main class="w-full max-w-7xl px-6 sm:px-8 py-12 sm:py-20 z-10 space-y-14 relative">
        <header class="animate flex flex-col sm:flex-row justify-between items-start sm:items-end gap-6">
          <div class="space-y-3">
            <h1 class="text-4xl sm:text-5xl font-extrabold tracking-tight">订阅监控</h1>
            <p class="stat-label">实时追踪双向流量与到期状态</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="theme-toggle" onclick="toggleTheme()">
              <div class="theme-knob">
                <svg class="theme-icon icon-sun" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707.707M12 7a5 5 0 100 10 5 5 0 000-10z"></path></svg>
                <svg class="theme-icon icon-moon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              </div>
            </div>
            <button onclick="load(true)" class="refresh-btn">
               <svg id="sync-icon" class="w-6 h-6" style="color: hsl(var(--foreground) / 0.7);" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>
        </header>
        <div id="app" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start transition-all duration-500"></div>
        <footer class="animate pt-8 border-t border-border">
          <div class="flex flex-col sm:flex-row justify-between items-center gap-4">
            <p class="stat-label">© 2026 CCCC4444</p>
            <div class="flex items-center gap-6">
              <span class="stat-label opacity-40">STABLE</span>
              <span class="mono font-bold text-lg" style="background: linear-gradient(135deg, hsl(var(--primary)), hsl(var(--secondary))); -webkit-background-clip: text; -webkit-text-fill-color: transparent; background-clip: text;">V5.1.0</span>
            </div>
          </div>
        </footer>
      </main>
    </body>
    </html>
    `;

    return new Response(HTML, { headers: { "Content-Type": "text/html;charset=UTF-8" } });
  }
}
