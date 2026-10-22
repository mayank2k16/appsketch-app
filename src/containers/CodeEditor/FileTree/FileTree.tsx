import { Ionicons } from '@expo/vector-icons';
import * as React from 'react';
import {
  Modal,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import type { FileTreeNode } from '@/api/coder';
import { PressableScale } from '@/components/ui';
import { haptic } from '@/lib/haptics';
import type { AppColors } from '@/lib/theme';

function PromptActions({
  colors,
  onCancel,
  onDone,
}: {
  colors: AppColors;
  onCancel: () => void;
  onDone: () => void;
}) {
  const light = colors.statusBar !== 'light-content';
  return (
    <View style={pm.actions}>
      <PressableScale onPress={onCancel} style={pm.actionBtn}>
        <Text style={{ color: colors.textSub, fontWeight: '600' }}>Cancel</Text>
      </PressableScale>
      <PressableScale
        onPress={onDone}
        style={[
          pm.actionBtn,
          { backgroundColor: colors.accent, borderRadius: 8 },
        ]}
      >
        {/* The label had no colour (default black): invisible on white's ink
            fill. Dark keeps the default. */}
        <Text
          style={{
            fontWeight: '700',
            color: light ? colors.accentOn : undefined,
          }}
        >
          Done
        </Text>
      </PressableScale>
    </View>
  );
}

/** Simple inline "enter a name" modal — replaces Vite's `window.prompt` (no
 * DOM equivalent in RN) for create/rename operations. */
function PromptModal({
  visible,
  title,
  initialValue = '',
  colors,
  onSubmit,
  onCancel,
}: {
  visible: boolean;
  title: string;
  initialValue?: string;
  colors: AppColors;
  onSubmit: (value: string) => void;
  onCancel: () => void;
}) {
  const [value, setValue] = React.useState(initialValue);
  const light = colors.statusBar !== 'light-content';
  React.useEffect(() => {
    if (visible) setValue(initialValue);
  }, [visible, initialValue]);

  return (
    <Modal
      onShow={haptic.soft}
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onCancel}
    >
      <Pressable
        onPressIn={haptic.tap}
        style={[pm.backdrop, light && { backgroundColor: colors.sheetOverlay }]}
        onPress={onCancel}
      >
        <Pressable
          style={[
            pm.card,
            {
              backgroundColor: colors.codeEditorSurface,
              borderColor: colors.codeEditorBorder,
            },
          ]}
        >
          <Text style={[pm.title, { color: colors.text }]}>{title}</Text>
          <TextInput
            value={value}
            onChangeText={setValue}
            autoFocus
            placeholder="name"
            placeholderTextColor={colors.codeEditorTextMuted}
            style={[
              pm.input,
              { color: colors.text, borderColor: colors.codeEditorBorder },
            ]}
          />
          <PromptActions
            colors={colors}
            onCancel={onCancel}
            onDone={() => value.trim() && onSubmit(value.trim())}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

type PendingAction =
  | { kind: 'createFile'; parentPath: string }
  | { kind: 'createFolder'; parentPath: string }
  | { kind: 'rename'; path: string; name: string };

function Row({
  node,
  depth,
  colors,
  selectedPath,
  expanded,
  onToggle,
  onSelectFile,
  onLongPress,
}: {
  node: FileTreeNode;
  depth: number;
  colors: AppColors;
  selectedPath: string | null;
  expanded: Set<string>;
  onToggle: (path: string) => void;
  onSelectFile: (path: string) => void;
  onLongPress: (node: FileTreeNode) => void;
}) {
  const isDir = node.type === 'dir';
  const isOpen = expanded.has(node.path);
  const isSelected = node.path === selectedPath;

  return (
    <>
      <PressableScale
        scaleTo={0.98}
        onPress={() => (isDir ? onToggle(node.path) : onSelectFile(node.path))}
        onLongPress={() => {
          haptic.longPress();
          onLongPress(node);
        }}
        style={[
          st.row,
          { paddingLeft: 12 + depth * 16 },
          isSelected && { backgroundColor: colors.codeEditorTabBg },
        ]}
      >
        <Ionicons
          name={
            isDir
              ? isOpen
                ? 'chevron-down'
                : 'chevron-forward'
              : 'document-text-outline'
          }
          size={14}
          color={colors.codeEditorTextMuted}
        />
        <Ionicons
          name={
            isDir
              ? isOpen
                ? 'folder-open-outline'
                : 'folder-outline'
              : 'code-slash-outline'
          }
          size={14}
          // A directory is quieter than a file, not louder: the web's
          // `.cw-tree-dir` is `$muted`. Painting every folder icon accent-blue
          // put a colour on most rows of a panel that has no colour in it.
          color={isDir ? colors.codeEditorTextMuted : colors.codeEditorText}
        />
        <Text
          style={[
            st.rowLabel,
            { color: isSelected ? colors.text : colors.codeEditorText },
          ]}
          numberOfLines={1}
        >
          {node.name}
        </Text>
      </PressableScale>

      {isDir && isOpen
        ? (node.children ?? []).map((child) => (
            <Row
              key={child.path}
              node={child}
              depth={depth + 1}
              colors={colors}
              selectedPath={selectedPath}
              expanded={expanded}
              onToggle={onToggle}
              onSelectFile={onSelectFile}
              onLongPress={onLongPress}
            />
          ))
        : null}
    </>
  );
}

export function FileTree({
  nodes,
  selectedPath,
  colors,
  onSelectFile,
  onCreateFile,
  onCreateFolder,
  onRename,
  onDelete,
}: {
  nodes: FileTreeNode[];
  selectedPath: string | null;
  colors: AppColors;
  onSelectFile: (path: string) => void;
  onCreateFile: (path: string) => void;
  onCreateFolder: (path: string) => void;
  onRename: (path: string, newPath: string) => void;
  onDelete: (path: string) => void;
}) {
  const [expanded, setExpanded] = React.useState<Set<string>>(new Set());
  const [pending, setPending] = React.useState<PendingAction | null>(null);
  const [actionsFor, setActionsFor] = React.useState<FileTreeNode | null>(null);
  const light = colors.statusBar !== 'light-content';

  function toggle(path: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function joinPath(parent: string, name: string) {
    return parent ? `${parent}/${name}` : name;
  }

  return (
    <View style={{ flex: 1 }}>
      <View style={[st.header, { borderColor: colors.codeEditorBorder }]}>
        <Text style={[st.headerLabel, { color: colors.textSub }]}>Files</Text>
        <PressableScale
          onPress={() => setPending({ kind: 'createFile', parentPath: '' })}
          hitSlop={8}
        >
          <Ionicons
            name="document-outline"
            size={16}
            color={colors.codeEditorText}
          />
        </PressableScale>
        <PressableScale
          onPress={() => setPending({ kind: 'createFolder', parentPath: '' })}
          hitSlop={8}
        >
          <Ionicons
            name="folder-outline"
            size={16}
            color={colors.codeEditorText}
          />
        </PressableScale>
      </View>

      {nodes.map((node) => (
        <Row
          key={node.path}
          node={node}
          depth={0}
          colors={colors}
          selectedPath={selectedPath}
          expanded={expanded}
          onToggle={toggle}
          onSelectFile={onSelectFile}
          onLongPress={setActionsFor}
        />
      ))}

      <PromptModal
        visible={
          pending?.kind === 'createFile' || pending?.kind === 'createFolder'
        }
        title={
          pending?.kind === 'createFile' ? 'New file name' : 'New folder name'
        }
        colors={colors}
        onCancel={() => setPending(null)}
        onSubmit={(name) => {
          if (
            pending?.kind !== 'createFile' &&
            pending?.kind !== 'createFolder'
          )
            return;
          const path = joinPath(pending.parentPath, name);
          if (pending.kind === 'createFile') onCreateFile(path);
          else onCreateFolder(path);
          setPending(null);
        }}
      />

      <PromptModal
        visible={pending?.kind === 'rename'}
        title="Rename"
        initialValue={pending?.kind === 'rename' ? pending.name : ''}
        colors={colors}
        onCancel={() => setPending(null)}
        onSubmit={(name) => {
          if (pending?.kind !== 'rename') return;
          const parent = pending.path.split('/').slice(0, -1).join('/');
          onRename(pending.path, joinPath(parent, name));
          setPending(null);
        }}
      />

      <Modal
        onShow={haptic.soft}
        visible={!!actionsFor}
        transparent
        animationType="fade"
        onRequestClose={() => setActionsFor(null)}
      >
        <Pressable
          onPressIn={haptic.tap}
          style={[
            pm.backdrop,
            light && { backgroundColor: colors.sheetOverlay },
          ]}
          onPress={() => setActionsFor(null)}
        >
          <Pressable
            style={[
              pm.card,
              {
                backgroundColor: colors.codeEditorSurface,
                borderColor: colors.codeEditorBorder,
              },
            ]}
          >
            <Text style={[pm.title, { color: colors.text }]} numberOfLines={1}>
              {actionsFor?.name}
            </Text>
            <PressableScale
              style={st.sheetAction}
              onPress={() => {
                if (actionsFor)
                  setPending({
                    kind: 'rename',
                    path: actionsFor.path,
                    name: actionsFor.name,
                  });
                setActionsFor(null);
              }}
            >
              <Ionicons name="pencil-outline" size={16} color={colors.text} />
              <Text style={{ color: colors.text, fontSize: 13.5 }}>Rename</Text>
            </PressableScale>
            {actionsFor?.type === 'dir' ? (
              <>
                <PressableScale
                  style={st.sheetAction}
                  onPress={() => {
                    if (actionsFor)
                      setPending({
                        kind: 'createFile',
                        parentPath: actionsFor.path,
                      });
                    setActionsFor(null);
                  }}
                >
                  <Ionicons
                    name="document-outline"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={{ color: colors.text, fontSize: 13.5 }}>
                    New file here
                  </Text>
                </PressableScale>
                <PressableScale
                  style={st.sheetAction}
                  onPress={() => {
                    if (actionsFor)
                      setPending({
                        kind: 'createFolder',
                        parentPath: actionsFor.path,
                      });
                    setActionsFor(null);
                  }}
                >
                  <Ionicons
                    name="folder-outline"
                    size={16}
                    color={colors.text}
                  />
                  <Text style={{ color: colors.text, fontSize: 13.5 }}>
                    New folder here
                  </Text>
                </PressableScale>
              </>
            ) : null}
            <PressableScale
              style={st.sheetAction}
              onPress={() => {
                if (actionsFor) onDelete(actionsFor.path);
                setActionsFor(null);
              }}
            >
              <Ionicons
                name="trash-outline"
                size={16}
                color={colors.codeEditorDanger}
              />
              <Text style={{ color: colors.codeEditorDanger, fontSize: 13.5 }}>
                Delete
              </Text>
            </PressableScale>
          </Pressable>
        </Pressable>
      </Modal>
    </View>
  );
}

const st = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  headerLabel: {
    flex: 1,
    fontSize: 11.5,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 8,
    paddingRight: 12,
  },
  rowLabel: { fontSize: 13, flexShrink: 0, flex: 1 },
  sheetAction: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    paddingVertical: 12,
  },
});

const pm = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 24,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderWidth: 1,
    borderRadius: 16,
    padding: 16,
    gap: 12,
  },
  title: { fontSize: 14.5, fontWeight: '700' },
  input: {
    borderWidth: 1,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 13.5,
  },
  actions: { flexDirection: 'row', justifyContent: 'flex-end', gap: 14 },
  actionBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
    alignItems: 'center',
    justifyContent: 'center',
  },
});
