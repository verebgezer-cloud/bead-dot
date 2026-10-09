# 豆点 · 拼豆图纸

拼豆图纸生成是纯前端单页工具；可选的 AI 像素画功能由独立 Worker 调用图像模型。普通转换和图片导出仍在浏览器本地完成。

打开 `index.html` 即可使用。手机浏览器可以点上传框从相册选择图片。豆板规格有 52×52、78×78、104×104 和 120×120；图案尺寸由单独的最长边滑块控制，宽高按原图比例计算。换豆板不会自动改变图案格数；图案放不进较小的豆板时，需要先调小图案。

生成时会把原图绘制到受限的高分辨率工作画布，在边缘背景掩码上识别与外边界连通的背景，再逐个图案格统计其覆盖区域内的颜色。每格将有效像素在调整对比度、饱和度后取线性 RGB 平均值，再匹配到 Lab 色差最近的 MARD 221 色号；一个格只生成一种颜色，不做误差扩散。主体内部的白色或封闭区域仍会生成珠子，只有边缘外部背景留空。

如需先用图像模型把原图转为清晰的像素画，部署 `pixel-art-worker` 中的 Cloudflare Worker，并在 `ai-config.js` 中填入 Worker URL。用户点击“生成像素画并更新图纸”后，网页将上传图片给 Worker；Worker 调用图像模型返回像素画，网页继续按当前图案尺寸逐格匹配 MARD 色号、计数和导出。可随时点“改用原图”。未配置 Worker 时 AI 按钮会保持禁用，普通图纸生成照常可用。

右侧只列实际使用的颜色；开启辅助拼豆后，每一步显示一个色号在整张图中的所有位置和珠子数量。网页适配手机和平板，图纸可缩放并保存为高清 PNG。

色号与 HEX 参考 [Pixel Beads 的 MARD 221 色卡](https://www.pixel-beads.com/zh/mard-bead-color-chart)，包含 A、B、C、D、E、F、G、H、M 系。屏幕、打印机和实物拼豆之间可能存在色差，请按实物珠子核对。

## AI 接口部署

GitHub Pages 不能安全保存图像模型 API 密钥。`pixel-art-worker` 是可选的服务端接口，部署步骤：

1. 注册 Cloudflare 账号并安装 Node.js。进入 `pixel-art-worker` 目录，运行 `npx wrangler login`。PowerShell 若拦截 `npx.ps1`，可用 `npx.cmd wrangler login`。
2. 修改 `wrangler.toml` 中的 `ALLOWED_ORIGINS` 为 GitHub Pages 的来源域名，例如 `https://yourname.github.io`，不要添加仓库路径。
3. 运行 `npx wrangler deploy` 部署 Worker，并记下输出的 `https://...workers.dev` 地址。首次部署时按提示注册一个 `workers.dev` 子域名。
4. 运行 `npx wrangler secret put OPENAI_API_KEY`，在提示中输入 OpenAI API 密钥；密钥只会保存在 Worker，不会进入网页代码或 Git 仓库。
5. 在网站的 `ai-config.js` 中将 `window.PIXEL_ART_API_URL` 设为 Worker 地址，再将 `index.html`、`styles.css`、`mard-app.js`、`board-app.js`、`ai-config.js` 上传到 GitHub Pages。

Worker 限制上传图片为 6 MB 以内的 PNG/JPG/WebP，并暂时设置每个 IP 每 60 秒最多生成 1 次。调用图像模型会产生 API 费用，具体取决于你账户使用的模型与计费方式。请确保 `ALLOWED_ORIGINS` 与你的公开网站来源一致；本地调试时可以暂时增加 `http://localhost:...` 作为另一个允许的来源。
