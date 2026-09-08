# 秋招投递助手

一个无需服务器的单页投递记录工具。它记录岗位投递、状态推进、优先级和完整变更时间线；所有运行数据默认保存在当前浏览器。

构建后的 [autumn-recruit-assistant.html](./autumn-recruit-assistant.html) 是可直接打开、可独立分享的单文件版本。

## 使用与开发

直接用现代浏览器打开 `autumn-recruit-assistant.html` 即可使用。数据不会上传到网络。

源码开发：

```bash
npm test
npm run build
```

`src/` 是源码；`scripts/build-single.mjs` 会将 HTML、CSS 和 JavaScript 内联到单文件产物中。

## 功能与设计

- 投递记录：公司、岗位、Base、投递日期、网址、状态、渠道、优先级、备注。
- 完整历史：创建、字段变更、删除与恢复均保留事件记录。
- 数据备份：通过完整 JSON 文件手动导出、导入；导入会替换当前本地数据。
- 组合排序、状态筛选、软删除与彻底删除。
- 亮/暗模式，以及苹果蓝、夜幕紫、森林绿三套内置主题。
- 支持导入、导出完整配色方案；状态和优先级有独立的语义色组。

界面颜色不直接绑定具体主题色。组件引用 CSS 语义变量，例如 `--surface`、`--blue`、`--status-green-fg`、`--priority-high-soft`；运行时由 `src/color-schemes.js` 根据选中的主题和亮暗模式写入这些变量。因此新增主题不需要改动组件结构或业务逻辑。

## 本地存储与分享

浏览器会分别保存以下内容：

| 内容 | 本地存储键 | 是否包含在“导出备份” |
| --- | --- | --- |
| 投递数据与亮/暗模式 | `autumn-recruit-assistant.state.v1.0` | 是 |
| 当前配色选择 | `autumn-recruit-assistant.color-scheme.v1.0` | 否 |
| 已导入配色 | `autumn-recruit-assistant.color-scheme-overrides.v1.0` | 否 |

因此，分享 HTML 文件本身只会带上内置主题和程序，不会带上你的投递数据或自定义配色。若要完整迁移，请同时：

1. 在“数据与安全”导出并导入备份文件。
2. 在“配色方案配置”导出并导入配色文件。

内置主题已打包在 HTML 中；新设备首次打开时默认使用苹果蓝和浅色模式。

## 数据备份 Schema

数据备份的顶层格式如下。项目版本、数据 Schema 版本和配色文件版本均为 `1.0`；解析时会严格拒绝未知字段、错误枚举、无效日期和不完整历史事件。导入会直接替换当前本地数据，请先手动导出当前 JSON 文件。

```json
{
  "type": "autumn-desk-backup",
  "schemaVersion": "1.0",
  "appVersion": "1.0",
  "exportedAt": "2026-09-08T08:00:00.000Z",
  "data": {
    "applications": [],
    "settings": { "theme": "light" }
  }
}
```

### `data.settings`

| 字段 | 类型 | 说明 |
| --- | --- | --- |
| `theme` | `"light" \| "dark"` | 当前亮/暗模式。 |

> 当前选中的配色方案不是数据备份的一部分，请使用单独的配色文件迁移。

备份只接受当前的字符串版本 `"1.0"`；其他版本会被拒绝。

### `data.applications[]`

```json
{
  "id": "app_…",
  "company": "示例公司",
  "position": "产品经理",
  "base": "北京",
  "website": "https://example.com/job",
  "applicationDate": "2026-09-01",
  "status": "已投递",
  "channel": "官网",
  "priority": "中",
  "note": "备注",
  "createdAt": "2026-09-01T08:00:00.000Z",
  "updatedAt": "2026-09-01T08:00:00.000Z",
  "deletedAt": null,
  "history": []
}
```

| 字段 | 类型 / 允许值 | 说明 |
| --- | --- | --- |
| `id` | 非空字符串 | 投递记录 ID。 |
| `company`、`position` | 非空字符串 | 二者组合在同一份数据内必须唯一。创建后不可修改。 |
| `base`、`website`、`note` | 字符串 | 可为空。网址在界面提交时只接受 `http` 或 `https`。 |
| `applicationDate` | `YYYY-MM-DD` | 有效的公历日期。 |
| `status` | `已投递`、`测评`、`笔试`、`一面`、`二面`、`三面`、`HR 面`、`Offer`、`拒绝` | 投递进程。 |
| `channel` | `官网`、`内推`、`boss直聘`、`其他` | 投递渠道。 |
| `priority` | `低`、`中`、`高` | 关注顺序，与状态无关。 |
| `createdAt`、`updatedAt` | ISO 8601 时间字符串 | 创建与最后修改时间。 |
| `deletedAt` | `null` 或 ISO 8601 时间字符串 | 软删除标记。 |
| `history` | 事件数组 | 该投递的完整操作时间线。 |

### `history[]`

```json
{
  "id": "evt_…",
  "operationId": "op_…",
  "type": "field_changed",
  "field": "status",
  "timestamp": "2026-09-02T08:00:00.000Z",
  "from": "已投递",
  "to": "笔试"
}
```

| 字段 | 说明 |
| --- | --- |
| `type` | `created`、`field_changed`、`soft_deleted`、`restored` 之一。 |
| `operationId` | 同一次提交产生的字段变更共享同一 ID。 |
| `field`、`from`、`to` | 仅 `field_changed` 使用；其他事件必须均为 `null`。`field` 仅可为可编辑字段。 |
| `timestamp` | 有效 ISO 8601 时间字符串。 |

## 配色文件 Schema

配色使用独立文件，顶层格式如下：

```json
{
  "type": "autumn-desk-color-schemes",
  "version": "1.0",
  "exportedAt": "2026-09-08T08:00:00.000Z",
  "schemes": [
    {
      "id": "my-blue",
      "label": "海盐蓝",
      "light": { "blue": "#1677ff" },
      "dark": { "blue": "#75b5ff" }
    }
  ]
}
```

| 字段 | 规则 | 说明 |
| --- | --- | --- |
| `type` | 固定为 `autumn-desk-color-schemes` | 文件类型。 |
| `version` | 当前为 `"1.0"` | 配色格式版本。 |
| `schemes` | 最多 20 项 | 配色方案列表。 |
| `id` | 匹配 `[a-z][a-z0-9-]{1,31}` | 唯一主题 ID。与内置 ID 重名会覆盖对应内置方案。 |
| `label` | 非空，最多 24 个字符 | 下拉菜单中的显示名称。 |
| `light`、`dark` | token 到颜色的对象 | 分别为浅色和暗色模式覆盖颜色。 |

每个颜色值必须是 `#RRGGBB` 或 `#RRGGBBAA`。导入时，未提供的 token 会从内置基础调色板补齐；为使方案在其他设备上完全一致，建议通过界面的“导出配色”得到完整文件后再编辑。配色文件会严格校验：未知 token（包括旧的色相命名）和无效颜色值都会被拒绝。

### 支持的配色 token

| 分组 | token | 用途 |
| --- | --- | --- |
| 结构与文字 | `canvas`、`surface`、`surfaceRaised`、`surfaceSubtle`、`surfaceHover`、`ink`、`muted`、`mutedStrong`、`mutedSoft`、`line`、`lineSubtle` | 页面底色、卡片、输入框、文字与分隔线。 |
| 主交互 | `blue`、`blueHover`、`blueSoft`、`navy`、`focusRing`、`overlay` | 主按钮、链接、选中/高亮、焦点环、抽屉遮罩。名字保留 `blue` 是历史 API；它可以是任意主题主色。 |
| 状态：已投递 | `statusSubmitted*` | 对应“已投递”。 |
| 状态：测评 | `statusAssessment*` | 对应“测评”，与全局 `blue*` 主交互色完全独立。 |
| 状态：笔试 | `statusWrittenTest*` | 对应“笔试”。 |
| 状态：一面 / 二面 / 三面 | `statusFirstInterview*`、`statusSecondInterview*`、`statusThirdInterview*` | 分别对应三轮技术 / 业务面试。 |
| 状态：HR 面 | `statusHrInterview*` | 对应“HR 面”。 |
| 状态：Offer / 拒绝 | `statusOffer*`、`statusRejected*` | 分别对应“Offer”和“拒绝”。 |
| 优先级 | `priorityLow*`、`priorityMedium*`、`priorityHigh*` | 低、中、高优先级；同样有 `Fg`、`Soft`、`Fill`，与九个状态 token 也完全独立。 |

每个状态和优先级组都有 `Fg`（文字）、`Soft`（浅色背景）、`Fill`（实色条与标记）。名称只标识它服务的界面位置，不限制实际使用什么颜色；可在每个主题、每个亮暗模式中任意单独设置。例如：

```json
{
  "priorityHighFg": "#b4235c",
  "priorityHighSoft": "#fff0f6",
  "priorityHighFill": "#d13b78"
}
```

导入行为：导入文件会作为新的“自定义配色集合”保存，然后与三套内置主题合并。新 ID 会出现在内置主题之后；与 `apple`、`indigo`、`jade` 重名的 ID 会覆盖内置主题。再次导入另一份文件会替换此前导入的自定义集合，因此要保留旧方案，应先导出当前配色、合并编辑后再导入。

## 源码结构

| 路径 | 职责 |
| --- | --- |
| `src/app.js` | 渲染、事件绑定、视图状态、导入导出入口。 |
| `src/core.js` | 投递创建、更新、排序、时间线事件等业务规则。 |
| `src/schema.js` | 数据字段、枚举与默认值。 |
| `src/validation.js` | 数据与备份的严格校验。 |
| `src/storage.js` | LocalStorage 中投递数据的读写与旧版本标记规范化。 |
| `src/backup.js` | 数据 JSON 备份的构建、校验与导入解析。 |
| `src/color-schemes.js` | 默认主题、配色校验、合并与 CSS 变量应用。 |
| `src/styles.css` | 布局和语义 token 驱动的组件样式。 |
