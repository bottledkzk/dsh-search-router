# dsh-search-router 安装与搭载说明

## 一、安装方式

### 1. 从 npm 安装（推荐）

```bash
npx -y @deepseek-ai/dsh plugin --profile web add dsh-search-router
```

- 安装的是预构建产物：`lib/index.js`（Host）与 `lib/client.js`（设置面板）。
- 安装后必须重启 dsh web 进程；浏览器打开设置页时强刷（`Ctrl+F5`）。

### 2. 从 GitHub 仓库安装

```bash
npx -y @deepseek-ai/dsh plugin --profile web add git+https://github.com/bottledkzk/dsh-search-router.git
```

### 3. 本地源码链接安装

```bash
dsh plugin --profile web add /path/to/dsh-search-router
```

> 本地链接安装要求插件目录已构建出 `lib/index.js` 与 `lib/client.js`。

## 二、构建（仅源码开发需要）

```bash
cd dsh-search-router
pnpm install
npm run build
```

产物：

- `lib/index.js`：Host 插件
- `lib/client.js`：Client 设置卡片

如无本地 devDependencies，可指定 DSH 源码 checkout：

```bash
DSH_CHECKOUT=/path/to/deepseek-harness npm run build
```

## 三、安装后验证

1. `dsh --profile web --dump-config` 应看到：
   - `web.searchProvider = router`
   - `web.fetchProvider = http`
   - `web-search-router` 插件条目
2. 打开 **设置 → 插件 → 插件配置 → 搜索路由**：
   - 应显示中文设置卡片
   - 可切换搜索后端
   - Key 保存后以脱敏方式显示
3. 会话中调用 `search_router_status` / `search_router_switch` 验证工具已注册。

## 四、不同宿主的注意点

| 环境 | 注意 |
|---|---|
| Linux / WSL | 原生 symlink，直接 `dsh plugin add /path` 即可 |
| Windows | 需要启用/允许 junction；DSH 官方会走 junction 链接。构建时避免 CRLF 脚本问题，或先 `sed -i 's/\r$//' scripts/build.sh` |
| macOS | 同 Linux |

## 五、卸载

```bash
npx -y @deepseek-ai/dsh plugin --profile web remove dsh-search-router
```

然后重启 dsh。若 `web.searchProvider` 仍指向 `router`，在 profile 用户配置层改回 `deepseek-official`（或删除覆盖让其回落到唯一可用 provider）。

## 六、回退与密钥

- 默认回退链：`anysearch -> deepseek-official`
- 密钥优先级：面板填写 > 环境变量 > `~/.dsh/.env` > `~/.dsh/.credentials.yaml`
- 详细设置与注意事项见 [SETTINGS.md](SETTINGS.md)
