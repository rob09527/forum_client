/**
 * 发帖工具栏「更多」下拉支持的 md-editor 内置命令(仅低频功能)。
 * md-editor-v3 内部 ToolDirective 未导出(库的声明 bug),这里定义子集字面量,
 * 子集成员都是 ToolDirective 的合法值,传给 execCommand 无需 cast。
 */
export type MoreCommand = 'strikeThrough' | 'h1' | 'h2' | 'h3' | 'task' | 'table'
