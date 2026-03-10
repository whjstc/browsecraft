# 示例：LinkedIn 外联（最小可复现）

## 目标

给指定关键词的目标用户发送连接请求（演示流程，不含自动发送敏感操作）。

## 步骤

```bash
browsecraft start
browsecraft open https://www.linkedin.com
browsecraft snapshot
browsecraft fill "input[role=combobox]" "founder shanghai saas"
browsecraft press Enter
browsecraft wait-for "main"
browsecraft screenshot linkedin-search.png
```

## 成功标准

- 能进入搜索结果页
- 能看到结果列表主区域
- 能输出截图用于人工复核
