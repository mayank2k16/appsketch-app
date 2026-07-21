import { Ionicons } from '@expo/vector-icons';
import { useColorScheme } from 'nativewind';
import * as React from 'react';
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native';

import { useAppTheme } from '@/lib/theme';

import { useCodeEditor } from './CodeEditorProvider';
import { CodeEditorPane } from './Editor/CodeEditorPane';
import { FileTree } from './FileTree/FileTree';

/** Phone screens don't have room for a permanent file-tree + editor split,
 * so this shows one pane at a time: the file list first, then the editor
 * full-screen once a file is picked (with a back arrow to return to files) —
 * rather than a cramped side-by-side layout. */
export function CodeScreen() {
  const { colorScheme } = useColorScheme();
  const t = useAppTheme(colorScheme);
  const { fileTree, createFile, createFolder, renamePath, deletePath } = useCodeEditor();

  const [selectedPath, setSelectedPath] = React.useState<string | null>(null);

  if (selectedPath) {
    return (
      <View style={[st.root, { backgroundColor: t.codeEditorBg }]}>
        <View style={[st.header, { borderColor: t.codeEditorBorder, backgroundColor: t.codeEditorSurface }]}>
          <TouchableOpacity onPress={() => setSelectedPath(null)} hitSlop={10} style={st.backBtn}>
            <Ionicons name="chevron-back" size={20} color={t.text} />
          </TouchableOpacity>
          <Text style={[st.fileName, { color: t.text }]} numberOfLines={1}>
            {selectedPath}
          </Text>
        </View>
        <CodeEditorPane path={selectedPath} />
      </View>
    );
  }

  return (
    <View style={[st.root, { backgroundColor: t.bg }]}>
      <FileTree
        nodes={fileTree}
        selectedPath={selectedPath}
        colors={t}
        onSelectFile={setSelectedPath}
        onCreateFile={createFile}
        onCreateFolder={createFolder}
        onRename={renamePath}
        onDelete={deletePath}
      />
    </View>
  );
}

const st = StyleSheet.create({
  root: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
  },
  backBtn: { width: 32, height: 32, alignItems: 'center', justifyContent: 'center' },
  fileName: { flex: 1, fontSize: 13, fontWeight: '700' },
});
