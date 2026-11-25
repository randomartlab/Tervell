import { expect, test } from 'bun:test';
import * as React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { Schema } from '@tiptap/pm/model';
import { Modal, SidebarRow, PluginSidebarFrameContext, PluginUiTitleContext, WorkspaceRowBadge } from '../apps/electron/src/renderer/components/plugins/native-ui';
import { composerTextSelection } from '../apps/electron/src/renderer/components/plugins/composer-focus';

test('Given 原版侧栏项省略label When 宿主渲染 Then 继承注册标题且保留独立尾部按钮', () => {
  const output = renderToStaticMarkup(
    <PluginSidebarFrameContext.Provider value={{ title: 'Modal examples', section: 'header', testID: 'contract', anchor: { current: null } }}>
      <SidebarRow id="main" active onPress={() => {}} trailing={<button>独立操作</button>} />
    </PluginSidebarFrameContext.Provider>,
  );
  expect(output).toContain('Modal examples');
  expect(output).toContain('data-testid="contract-main"');
  expect(output).toContain('aria-current="page"');
  expect(output.indexOf('</button>')).toBeLessThan(output.indexOf('独立操作'));
});

test('Given Modal中的触发器与Content为同级 When 模态框关闭 Then 触发器可用而内容未挂载', () => {
  const output = renderToStaticMarkup(
    <Modal title="示例" open={false} onOpenChange={() => {}}>
      <button>打开示例</button>
      <Modal.Content><p>应隐藏的内容</p></Modal.Content>
    </Modal>,
  );
  expect(output).toBe('<button>打开示例</button>');
  expect(() => renderToStaticMarkup(<Modal.Content>无根节点</Modal.Content>)).toThrow('Modal');
});

test('Given 仅图标的项目徽标 When 没有显式可访问名称 Then 使用贡献标题且空徽标不占位', () => {
  const output = renderToStaticMarkup(
    <PluginUiTitleContext.Provider value="Needs review"><WorkspaceRowBadge icon="Flag" tone="warning" /></PluginUiTitleContext.Provider>,
  );
  expect(output).toContain('aria-label="Needs review"');
  expect(output).toContain('<svg');
  expect(renderToStaticMarkup(<WorkspaceRowBadge />)).toBe('');
});

test('Given 多段落和换行的输入 When 插件用文本偏移选择 Then 结构节点不造成偏移并夹住越界值', () => {
  const schema = new Schema({ nodes: {
    doc: { content: 'block+' }, paragraph: { group: 'block', content: 'inline*' },
    text: { group: 'inline' }, hardBreak: { inline: true, group: 'inline' },
  } });
  const doc = schema.node('doc', null, [
    schema.node('paragraph', null, [schema.text('ab')]),
    schema.node('paragraph', null, [schema.text('cd')]),
  ]);
  const selection = composerTextSelection(doc, { start: 3, end: 5 });
  expect(doc.textBetween(selection.from, selection.to, '\n', '\n')).toBe('cd');
  expect(composerTextSelection(doc, { start: -5, end: 100 })).toEqual({ from: 1, to: 7 });
  const line = schema.node('doc', null, [schema.node('paragraph', null, [schema.text('中'), schema.node('hardBreak'), schema.text('文')])]);
  const afterBreak = composerTextSelection(line, { start: 2, end: 3 });
  expect(line.textBetween(afterBreak.from, afterBreak.to, '\n', '\n')).toBe('文');
});
