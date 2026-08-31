import React, { useMemo, useRef, useState } from 'react';
import {
  Alert,
  Image,
  KeyboardAvoidingView,
  Linking,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { recommendFood } from '../api/foodiaApi';
import AssistantRecipeListItem from '../components/AssistantRecipeListItem';
import { colors } from '../constants/theme';
import { useFoodPreferences } from '../context/FoodPreferencesContext';
import { buildAssistantRequestContext } from '../services/recommendationContext';

const STARTER_PROMPTS = ['점심 메뉴 추천', '20분내로 만들 수 있는 요리'];

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  text: '안녕하세요! 오늘 무엇을 먹을지 함께 찾아드릴게요. 원하는 메뉴나 보유한 재료를 입력하거나 사진을 보내주세요.',
};

export default function AssistantHome({ navigation }) {
  const { defaultExcludedIngredients, preferences } = useFoodPreferences();
  const [messages, setMessages] = useState([WELCOME_MESSAGE]);
  const [draft, setDraft] = useState('');
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);

  const todayLabel = useMemo(
    () =>
      new Intl.DateTimeFormat('ko-KR', {
        month: 'long',
        day: 'numeric',
        weekday: 'long',
      }).format(new Date()),
    [],
  );

  const openRecipeSource = async (recipe) => {
    if (!recipe.source?.url) {
      Alert.alert('원문 링크 없음', '연결할 만개의레시피 주소가 없습니다.');
      return;
    }

    try {
      await Linking.openURL(recipe.source.url);
    } catch {
      Alert.alert('링크 열기 실패', '만개의레시피 페이지를 열지 못했습니다.');
    }
  };

  const sendMessage = async (suggestedText) => {
    const text = (
      typeof suggestedText === 'string' ? suggestedText : draft
    ).trim();
    if (!text || sending) return;

    const userMessage = { id: `user-${Date.now()}`, role: 'user', text };

    setDraft('');
    setSending(true);
    setMessages((current) => [...current, userMessage]);

    try {
      const assistantContext = await buildAssistantRequestContext(preferences);
      const result = await recommendFood({
        message: text,
        excludeIngredients: defaultExcludedIngredients,
        ...assistantContext,
        maxResults: 3,
      });
      const count = result.recipes.length;
      setMessages((current) => [
        ...current,
        {
          id: `assistant-${Date.now()}`,
          role: 'assistant',
          text: result.assistant_message || (count
            ? `조건을 확인해 ${count}개의 레시피를 찾았어요.`
            : '조건에 맞는 검증된 레시피를 찾지 못했어요.'),
          recipes: result.recipes,
        },
      ]);
    } catch (error) {
      setMessages((current) => [
        ...current,
        {
          id: `assistant-error-${Date.now()}`,
          role: 'assistant',
          text: error.message || 'AI 음식 비서에 연결하지 못했습니다.',
          isError: true,
        },
      ]);
    } finally {
      setSending(false);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.keyboardView}
      >
        <View style={styles.header}>
          <View style={styles.brandRow}>
            <Image
              source={require('../../assets/Image/main_logo.png')}
              style={styles.logo}
            />
            <View>
              <Text style={styles.brand}>Foodia AI</Text>
              <Text style={styles.date}>{todayLabel}</Text>
            </View>
          </View>
          <View style={styles.statusBadge}>
            <View style={styles.statusDot} />
            <Text style={styles.statusText}>AI 음식 비서</Text>
          </View>
        </View>

        {defaultExcludedIngredients.length ? (
          <View style={styles.exclusionBar}>
            <Text numberOfLines={1} style={styles.exclusionText}>
              자동 제외 · {defaultExcludedIngredients.join(', ')}
            </Text>
          </View>
        ) : null}

        <ScrollView
          contentContainerStyle={styles.messages}
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() =>
            scrollRef.current?.scrollToEnd({ animated: true })
          }
          ref={scrollRef}
        >
          {messages.map((message, messageIndex) => (
            <View key={message.id} style={styles.messageBlock}>
              <View
                style={[
                  styles.messageRow,
                  message.role === 'user' && styles.userMessageRow,
                ]}
              >
                {message.role === 'assistant' ? (
                  <View style={styles.avatar}>
                    <Text style={styles.avatarText}>F</Text>
                  </View>
                ) : null}
                <View
                  style={[
                    styles.bubble,
                    message.role === 'user'
                      ? styles.userBubble
                      : styles.assistantBubble,
                    message.isError && styles.errorBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      message.role === 'user' && styles.userMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              </View>

              {messageIndex === 0 && messages.length === 1 ? (
                <View style={styles.promptList}>
                  {STARTER_PROMPTS.map((prompt) => (
                    <TouchableOpacity
                      key={prompt}
                      onPress={() => sendMessage(prompt)}
                      style={styles.promptButton}
                    >
                      <Text style={styles.promptText}>{prompt}</Text>
                      <Text style={styles.promptArrow}>›</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              ) : null}

              {message.recipes?.length ? (
                <View style={styles.recipeResults}>
                  {message.recipes.map((recipe) => (
                    <AssistantRecipeListItem
                      key={recipe.id}
                      onPress={() => openRecipeSource(recipe)}
                      recipe={recipe}
                    />
                  ))}
                </View>
              ) : null}
            </View>
          ))}

          {sending ? (
            <View style={styles.messageRow}>
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>F</Text>
              </View>
              <View style={[styles.bubble, styles.assistantBubble]}>
                <Text style={styles.typingText}>
                  요청과 제외 조건을 확인하고 있어요...
                </Text>
              </View>
            </View>
          ) : null}
        </ScrollView>

        <View style={styles.composerArea}>
          <Text style={styles.composerHint}>
            재료, 원하는 메뉴 또는 조건을 자유롭게 입력하세요.
          </Text>
          <View style={styles.composer}>
            <TouchableOpacity
              accessibilityLabel="재료 사진 추가"
              onPress={() => navigation.navigate('Camera')}
              style={styles.photoButton}
            >
              <Text style={styles.photoButtonText}>＋</Text>
            </TouchableOpacity>
            <TextInput
              multiline
              onChangeText={setDraft}
              placeholder="Foodia에게 물어보기"
              placeholderTextColor="#9D9891"
              style={styles.input}
              value={draft}
            />
            <TouchableOpacity
              disabled={!draft.trim() || sending}
              onPress={sendMessage}
              style={[
                styles.sendButton,
                (!draft.trim() || sending) && styles.sendButtonDisabled,
              ]}
            >
              <Text style={styles.sendButtonText}>↑</Text>
            </TouchableOpacity>
          </View>
          <Text style={styles.safetyText}>
            AI 추천은 참고용이며 알레르기와 제품 표시사항을 직접 확인해 주세요.
          </Text>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { backgroundColor: colors.background, flex: 1 },
  keyboardView: { flex: 1 },
  header: {
    alignItems: 'center',
    borderBottomColor: colors.border,
    borderBottomWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 18,
    paddingVertical: 13,
  },
  brandRow: { alignItems: 'center', flexDirection: 'row' },
  logo: { height: 36, marginRight: 10, resizeMode: 'contain', width: 36 },
  brand: { color: colors.text, fontSize: 18, fontWeight: '900' },
  date: { color: colors.textMuted, fontSize: 11, marginTop: 2 },
  statusBadge: {
    alignItems: 'center',
    backgroundColor: colors.primarySoft,
    borderRadius: 15,
    flexDirection: 'row',
    paddingHorizontal: 9,
    paddingVertical: 7,
  },
  statusDot: {
    backgroundColor: colors.success,
    borderRadius: 4,
    height: 7,
    marginRight: 5,
    width: 7,
  },
  statusText: { color: colors.primaryDark, fontSize: 10, fontWeight: '900' },
  exclusionBar: {
    backgroundColor: '#FFF8E8',
    paddingHorizontal: 18,
    paddingVertical: 9,
  },
  exclusionText: { color: colors.warning, fontSize: 11, fontWeight: '700' },
  messages: { flexGrow: 1, padding: 18, paddingBottom: 28 },
  messageBlock: { marginBottom: 18 },
  messageRow: { alignItems: 'flex-start', flexDirection: 'row' },
  userMessageRow: { justifyContent: 'flex-end' },
  avatar: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 14,
    height: 28,
    justifyContent: 'center',
    marginRight: 9,
    width: 28,
  },
  avatarText: { color: '#FFFFFF', fontSize: 12, fontWeight: '900' },
  bubble: {
    borderRadius: 18,
    maxWidth: '84%',
    paddingHorizontal: 15,
    paddingVertical: 12,
  },
  assistantBubble: {
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderTopLeftRadius: 6,
    borderWidth: 1,
  },
  userBubble: { backgroundColor: colors.text, borderBottomRightRadius: 6 },
  errorBubble: { backgroundColor: '#FFF1F0', borderColor: '#F2B8B5' },
  messageText: { color: colors.text, fontSize: 14, lineHeight: 21 },
  userMessageText: { color: '#FFFFFF' },
  typingText: { color: colors.textMuted, fontSize: 13, fontWeight: '600' },
  promptList: { marginLeft: 37, marginTop: 10 },
  promptButton: {
    alignItems: 'center',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 14,
    borderWidth: 1,
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  promptText: { color: colors.text, flex: 1, fontSize: 13, fontWeight: '700' },
  promptArrow: { color: colors.primary, fontSize: 21, marginLeft: 8 },
  recipeResults: {
    borderColor: colors.border,
    borderRadius: 16,
    borderWidth: 1,
    marginLeft: 37,
    marginTop: 12,
    overflow: 'hidden',
  },
  composerArea: {
    backgroundColor: colors.background,
    borderTopColor: colors.border,
    borderTopWidth: 1,
    paddingHorizontal: 14,
    paddingTop: 10,
  },
  composerHint: {
    color: colors.textMuted,
    fontSize: 11,
    marginBottom: 7,
    marginLeft: 5,
  },
  composer: {
    alignItems: 'flex-end',
    backgroundColor: colors.surface,
    borderColor: colors.border,
    borderRadius: 24,
    borderWidth: 1,
    flexDirection: 'row',
    padding: 6,
  },
  photoButton: {
    alignItems: 'center',
    borderColor: colors.border,
    borderRadius: 18,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  photoButtonText: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '300',
    lineHeight: 27,
  },
  input: {
    color: colors.text,
    flex: 1,
    fontSize: 14,
    maxHeight: 100,
    minHeight: 38,
    paddingHorizontal: 11,
    paddingVertical: 9,
  },
  sendButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 18,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  sendButtonDisabled: { backgroundColor: '#D8D3CC' },
  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '900',
    lineHeight: 25,
  },
  safetyText: {
    color: colors.textMuted,
    fontSize: 9,
    paddingBottom: 7,
    paddingTop: 6,
    textAlign: 'center',
  },
});
