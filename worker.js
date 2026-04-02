// 1. 订阅地址配置区
const SUBSCRIPTIONS = [
  { name: "Mitce 订阅", url: "#" },
  { name: "备用机场 A", url: "#" },
  { name: "备用机场 B", url: "#" }
];

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);

    // Helper: 为 fetch 添加超时控制
    const fetchWithTimeout = (resource, options, timeout = 5000) => {
      return Promise.race([
        fetch(resource, options),
        new Promise((_, reject) => setTimeout(() => reject(new Error('timeout')), timeout))
      ]);
    };

    // Backend API Logic (流量解析)
    if (url.pathname === "/api/traffic") {
      const results = await Promise.all(SUBSCRIPTIONS.map(async (sub) => {
        try {
          const resp = await fetchWithTimeout(sub.url, { headers: { "User-Agent": "v2rayN/6.23" } });
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
            name: sub.name, 
            up_gb: up_gb.toFixed(2), 
            dl_gb: dl_gb.toFixed(2),
            used_gb: used_gb.toFixed(2), 
            total_gb: total_gb.toFixed(2),
            usage_percent: total_gb > 0 ? ((used_gb / total_gb) * 100).toFixed(1) : 0,
            expire_date: expire ? new Date(expire * 1000).toISOString().split('T')[0] : "无期限"
          };
        } catch (e) { 
          return { name: sub.name, error: true }; 
        }
      }));
      
      return new Response(JSON.stringify(results), { 
        headers: { 
          "Content-Type": "application/json", 
          "Access-Control-Allow-Origin": "*",
          "Cache-Control": "public, max-age=60" // 添加缓存控制，缓存 60 秒
        } 
      });
    }

    const HTML = `
    <!DOCTYPE html>
    <html lang="zh-CN">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover">
      <title>订阅监控 • Pure</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <style>
        :root { --primary: 195 90% 45%; --foreground: 240 10% 4%; --background: 0 0% 100%; --muted: 240 5% 96%; --border: 240 6% 90%; --radius: 1rem; }
        .dark { --primary: 195 95% 85%; --foreground: 0 0% 98%; --background: 240 20% 4%; --muted: 240 6% 12%; --border: 240 4% 20%; }

        body { background-color: hsl(var(--background)); color: hsl(var(--foreground)); font-family: ui-sans-serif, system-ui; transition: background-color 0.5s ease; overflow-x: hidden; }
        #highlight-gradient { background-image: linear-gradient(hsl(var(--primary) / 0.25), transparent); height: 60vh; width: 100%; position: absolute; top: 0; left: 0; z-index: 0; transition: background-image 0.5s ease; }
        
        @keyframes shimmer { 0% { opacity: 0.5; } 50% { opacity: 0.8; } 100% { opacity: 0.5; } }
        .skeleton { animation: shimmer 1.5s infinite; background-color: hsl(var(--muted)); border-radius: 0.5rem; }

        .animate { animation: fade-up 0.6s cubic-bezier(0.2, 0.8, 0.2, 1) forwards; opacity: 0; }
        @keyframes fade-up { 0% { transform: translateY(15px); opacity: 0; } 100% { transform: translateY(0); opacity: 1; } }

        .pure-card { background-color: hsl(var(--background) / 0.4); backdrop-filter: blur(8px); border: 1px solid hsl(var(--border)); border-radius: var(--radius); padding: 1.75rem; transition: border-color 0.3s ease, opacity 0.3s ease; }
        .pure-card:hover { border-color: hsl(var(--primary) / 0.5); }
        .progress-track { background-color: hsl(var(--muted)); border-radius: 99px; height: 8px; overflow: hidden; }
        .progress-fill { background-color: hsl(var(--primary)); height: 100%; transition: width 1.5s cubic-bezier(0.34, 1.56, 0.64, 1); box-shadow: 0 0 15px hsl(var(--primary) / 0.3); }

        /* 主题胶囊开关：图标随动核心 CSS */
        .theme-toggle { position: relative; width: 56px; height: 28px; background-color: hsl(var(--muted)); border: 1px solid hsl(var(--border)); border-radius: 99px; cursor: pointer; transition: all 0.3s ease; }
        .theme-knob { 
          position: absolute; top: 2px; left: 2px; width: 22px; height: 22px; 
          background-color: hsl(var(--foreground)); border-radius: 50%; 
          display: flex; align-items: center; justify-content: center; 
          transition: transform 0.4s cubic-bezier(0.68, -0.55, 0.265, 1.55), background-color 0.3s; 
          overflow: hidden;
        }
        .dark .theme-knob { transform: translateX(28px); background-color: hsl(var(--primary)); }
        
        .theme-icon { 
          position: absolute; width: 14px; height: 14px; 
          color: hsl(var(--background)); 
          transition: opacity 0.3s ease, transform 0.4s ease; 
        }

        /* 初始状态：白天显示太阳，隐藏月亮 */
        .icon-sun { opacity: 1; transform: scale(1) rotate(0deg); }
        .icon-moon { opacity: 0; transform: scale(0.5) rotate(-45deg); }

        /* 暗黑模式状态映射 */
        .dark .icon-sun { opacity: 0; transform: scale(0.5) rotate(45deg); }
        .dark .icon-moon { opacity: 1; transform: scale(1) rotate(0deg); }
      </style>
      <script>
        (function() {
          const savedTheme = localStorage.theme || (window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light');
          if (savedTheme === 'dark') document.documentElement.classList.add('dark');
        })();

        let cachedData = null;

        function toggleTheme() {
          const html = document.documentElement;
          const isDark = html.classList.toggle('dark');
          localStorage.theme = isDark ? 'dark' : 'light';
        }

        function renderSkeleton() {
          const app = document.getElementById('app');
          let skeletons = '';
          for(let i=0; i<3; i++) {
            skeletons += \`
              <section class="pure-card flex flex-col space-y-8 opacity-50">
                <div class="flex justify-between"><div class="h-6 w-24 skeleton"></div><div class="h-5 w-12 skeleton"></div></div>
                <div class="space-y-5">
                  <div class="flex justify-between"><div class="h-3 w-16 skeleton"></div><div class="h-6 w-10 skeleton"></div></div>
                  <div class="h-2 w-full skeleton"></div>
                  <div class="grid grid-cols-2 gap-6 pt-2"><div class="h-10 w-full skeleton"></div><div class="h-10 w-full skeleton"></div></div>
                </div>
              </section>\`;
          }
          app.innerHTML = skeletons;
        }

        function renderApp(data) {
          const app = document.getElementById('app');
          let html = '';
          data.forEach((sub) => {
            // 处理异常节点
            if (sub.error) {
              html += \`
                <section class="pure-card flex flex-col space-y-8 animate border-red-500/30 bg-red-500/5">
                  <div class="flex justify-between items-start">
                    <div class="space-y-1">
                      <h2 class="text-2xl font-bold tracking-tight">\${sub.name}</h2>
                      <p class="text-[10px] text-red-500/70 font-mono tracking-[0.2em]">获取数据失败</p>
                    </div>
                    <span class="px-3 py-1 bg-red-500/10 border border-red-500/20 rounded-full text-[9px] font-black uppercase tracking-widest text-red-500">
                      异常
                    </span>
                  </div>
                  <div class="flex-1 flex flex-col items-center justify-center py-6 space-y-2 opacity-60">
                    <svg class="w-8 h-8 text-red-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                    <p class="text-xs text-muted-foreground font-medium">无法连接或解析订阅信息</p>
                  </div>
                </section>\`;
              return;
            }

            // 处理正常节点
            const colorClass = sub.usage_percent > 85 ? 'text-red-500' : (sub.usage_percent > 60 ? 'text-orange-500' : 'text-primary');
            html += \`
              <section class="pure-card flex flex-col space-y-8 animate">
                <div class="flex justify-between items-start">
                  <div class="space-y-1">
                    <h2 class="text-2xl font-bold tracking-tight">\${sub.name}</h2>
                    <p class="text-[10px] text-muted-foreground font-mono tracking-[0.2em] opacity-70">到期: \${sub.expire_date}</p>
                  </div>
                  <span class="px-3 py-1 bg-primary/10 border border-primary/20 rounded-full text-[9px] font-black uppercase tracking-widest text-primary">
                    正常
                  </span>
                </div>
                <div class="space-y-5">
                  <div class="flex justify-between items-end font-medium">
                     <span class="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">流量负载</span>
                     <span class="\${colorClass} text-xl font-black">\${sub.usage_percent}%</span>
                  </div>
                  <div class="progress-track"><div class="progress-fill" style="width: \${sub.usage_percent}%"></div></div>
                  <div class="grid grid-cols-2 gap-6 py-2">
                     <div class="space-y-1">
                        <span class="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">上传量</span>
                        <p class="text-lg font-bold font-mono">\${sub.up_gb} <small class="text-[10px] font-normal opacity-40 uppercase">GB</small></p>
                     </div>
                     <div class="space-y-1 border-l border-border pl-6">
                        <span class="text-[9px] text-muted-foreground uppercase font-bold tracking-tighter opacity-60">下载量</span>
                        <p class="text-lg font-bold font-mono">\${sub.dl_gb} <small class="text-[10px] font-normal opacity-40 uppercase">GB</small></p>
                     </div>
                  </div>
                  <div class="flex justify-between text-[10px] text-muted-foreground font-black uppercase tracking-[0.2em] pt-4 border-t border-border/50">
                    <span>已用: \${sub.used_gb}G</span>
                    <span>总计: \${sub.total_gb}G</span>
                  </div>
                </div>
              </section>\`;
          });
          app.innerHTML = html;
        }

        async function load(isRefresh = false) {
          const app = document.getElementById('app');
          const syncIcon = document.getElementById('sync-icon');
          if (isRefresh) { syncIcon.classList.add('animate-spin'); app.style.opacity = '0.5'; }
          else { renderSkeleton(); }
          try {
            const res = await fetch('/api/traffic');
            const data = await res.json();
            cachedData = data;
            renderApp(data);
          } catch (e) {
            app.innerHTML = '<div class="col-span-full py-20 text-red-500 font-bold text-center animate">数据同步失败</div>';
          } finally { 
            if (isRefresh) syncIcon.classList.remove('animate-spin'); 
            app.style.opacity = '1';
          }
        }
        document.addEventListener('DOMContentLoaded', load);
      </script>
    </head>
    <body class="flex justify-center min-h-screen">
      <div id="highlight-gradient"></div>
      <main class="w-full max-w-7xl px-8 py-16 z-10 space-y-14">
        <header class="animate flex justify-between items-end">
          <div class="space-y-2">
            <h1 class="text-4xl font-extrabold tracking-tight">订阅监控</h1>
            <p class="text-muted-foreground font-medium opacity-80 tracking-wide text-xs uppercase">实时追踪双向流量与到期状态</p>
          </div>
          <div class="flex items-center gap-4">
            <div class="theme-toggle" onclick="toggleTheme()">
              <div class="theme-knob">
                <svg class="theme-icon icon-sun" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707.707M12 7a5 5 0 100 10 5 5 0 000-10z"></path></svg>
                <svg class="theme-icon icon-moon" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"></path></svg>
              </div>
            </div>
            <button onclick="load(true)" class="group p-2.5 rounded-2xl border border-border bg-muted/20 hover:bg-muted/50 transition-all">
               <svg id="sync-icon" class="w-5 h-5 text-muted-foreground group-hover:text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path></svg>
            </button>
          </div>
        </header>
        <div id="app" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 items-start transition-opacity duration-300"></div>
        <footer class="animate text-[10px] uppercase tracking-[0.1em] text-muted-foreground pt-12 border-t border-border flex justify-between font-bold">
          <a href="https://github.com/C-4-C-4/SubPulse" target="_blank" class="hover:text-primary transition-colors">https://github.com/C-4-C-4/SubPulse</a>
          <div class="flex gap-6"><span class="opacity-40">STABLE</span><span class="text-primary tracking-tighter">V1</span></div>
        </footer>
      </main>
    </body>
    </html>
    `;

    return new Response(HTML, { 
      headers: { 
        "Content-Type": "text/html;charset=UTF-8",
        "Cache-Control": "public, max-age=3600" // 缓存HTML页面
      } 
    });
  }
}