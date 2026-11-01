import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useRouter } from 'expo-router';
import * as React from 'react';
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { postTemplateComment, templateKeys } from '@/api/templates';
import { useAuth } from '@/hooks/useAuth';
import { F } from '@/lib/fonts';
import { toast } from '@/lib/toast';

import type { PageTheme } from '../theme';

const errorOf = (e: unknown) =>
  (e as { response?: { data?: { error?: string } } })?.response?.data?.error ??
  'Could not post your comment. Try again.';

/** "Add a comment": a field and a Post button for signed-in people; a
 *  sign-in button for everyone else. Posting refreshes the list. */
export function CommentComposer({ id, t }: { id: number; t: PageTheme }) {
  const signedIn = useAuth.use.status() === 'signIn';
  const router = useRouter();
  const qc = useQueryClient();
  const [body, setBody] = React.useState('');
  const post = useMutation({
    mutationFn: (text: string) => postTemplateComment('code', id, text),
    onSuccess: () => {
      setBody('');
      qc.invalidateQueries({ queryKey: [...templateKeys.all, 'comments', id] });
      qc.invalidateQueries({ queryKey: [...templateKeys.all, 'detail'] });
    },
    onError: (e) => toast.error(errorOf(e)),
  });
  if (!signedIn) {
    return (
      <Pressable
        onPress={() => router.push('/login' as never)}
        style={[s.signIn, { borderColor: t.edge, backgroundColor: t.chip }]}
      >
        <Text style={[s.signInText, { color: t.ink }]}>Sign in to comment</Text>
      </Pressable>
    );
  }
  const text = body.trim();
  const ready = !!text && !post.isPending;
  return (
    <View style={[s.box, { backgroundColor: t.chip, borderColor: t.edge }]}>
      <TextInput
        value={body}
        onChangeText={setBody}
        placeholder="Add a comment…"
        placeholderTextColor={t.muted}
        multiline
        maxLength={1000}
        style={[s.input, { color: t.ink }]}
      />
      <Pressable
        disabled={!ready}
        onPress={() => post.mutate(text)}
        style={[s.post, { backgroundColor: t.ink, opacity: ready ? 1 : 0.35 }]}
      >
        {post.isPending ? (
          <ActivityIndicator size="small" color={t.panel} />
        ) : (
          <Text style={[s.postText, { color: t.panel }]}>Post</Text>
        )}
      </Pressable>
    </View>
  );
}

const s = StyleSheet.create({
  box: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
    borderRadius: 18,
    borderWidth: 1,
    paddingLeft: 14,
    paddingRight: 6,
    paddingVertical: 6,
    marginBottom: 10,
  },
  input: {
    flex: 1,
    fontFamily: F.sans500,
    fontSize: 14,
    maxHeight: 110,
    paddingVertical: 7,
  },
  post: {
    height: 32,
    minWidth: 58,
    paddingHorizontal: 14,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  postText: { fontFamily: F.sans700, fontSize: 13 },
  signIn: {
    height: 42,
    borderRadius: 21,
    borderWidth: 1,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 10,
  },
  signInText: { fontFamily: F.sans700, fontSize: 13.5 },
});
