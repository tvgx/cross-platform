import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useEffect, useState, useRef, useMemo } from 'react';
import { ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeArea } from '../../components/layout/SafeArea';
import { UI_CONFIG } from '../../constants/config';
import { ROUTES } from '../../lib/navigation/routes';
import { useCatalogStore } from '../../store/catalog';
import { useSearchStore } from '../../store/search';

const removeTones = (str: string) => {
  return str.normalize('NFD').replace(/[\u0300-\u036f]/g, '').replace(/đ/g, 'd').replace(/Đ/g, 'D');
};

export function SearchView() {
  const router = useRouter();
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const inputRef = useRef<TextInput>(null);

  const { recentSearches, addRecentSearch, removeRecentSearch, clearRecentSearches, hydrateFromServer } = useSearchStore();
  const categories = useCatalogStore(state => state.categories);
  const products = useCatalogStore(state => state.products);

  useEffect(() => {
    hydrateFromServer();
    // Auto focus with a slight delay for smooth transition on Android
    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query.trim());
    }, 200);
    return () => clearTimeout(handler);
  }, [query]);

  const handleSubmit = (q: string) => {
    const trimmed = q.trim();
    if (!trimmed) return;
    addRecentSearch(trimmed);
    router.push(ROUTES.SEARCH_RESULTS(trimmed));
  };

  const handleCategoryPress = (categoryId: string) => {
    router.push(ROUTES.SEARCH_RESULTS('', categoryId));
  };

  const suggestions = useMemo(() => {
    if (!debouncedQuery) return [];
    
    const q = removeTones(debouncedQuery.toLowerCase());
    const matchedHistory = recentSearches.filter(h => removeTones(h.toLowerCase()).includes(q));
    
    const matchedProducts = products
      .map(p => p.title || p.name || '')
      .filter(title => {
        if (!title) return false;
        return removeTones(title.toLowerCase()).includes(q);
      });
      
    // dedupe
    const combined = Array.from(new Set([...matchedHistory, ...matchedProducts])).slice(0, 10);
    return combined;
  }, [debouncedQuery, recentSearches, products]);

  return (
    <SafeArea edges={['top']} style={{ flex: 1 }}>
      <View style={styles.appBar}>
        <TouchableOpacity style={styles.backButton} onPress={() => router.back()}>
          <Ionicons name="arrow-back" size={24} color={UI_CONFIG.colors.text} />
        </TouchableOpacity>
        <View style={styles.searchBar}>
          <Ionicons name="search" size={20} color={UI_CONFIG.colors.textSecondary} />
          <TextInput
            ref={inputRef}
            style={styles.searchInput}
            placeholder="Tìm kiếm sản phẩm..."
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={() => handleSubmit(query)}
            returnKeyType="search"
            autoCapitalize="none"
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')}>
              <Ionicons name="close-circle" size={20} color={UI_CONFIG.colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView style={styles.content} keyboardShouldPersistTaps="handled">
          {!debouncedQuery ? (
            <>
              {/* Lịch sử tìm kiếm */}
              {recentSearches.length > 0 && (
                <View style={styles.section}>
                  <View style={styles.sectionHeader}>
                    <Text style={styles.sectionTitle}>Tìm kiếm gần đây</Text>
                    <TouchableOpacity onPress={clearRecentSearches}>
                      <Text style={styles.clearText}>Xóa tất cả</Text>
                    </TouchableOpacity>
                  </View>
                  {recentSearches.map((item, index) => (
                    <View key={`history-${index}`} style={styles.historyItemRow}>
                      <TouchableOpacity style={styles.historyItemContent} onPress={() => handleSubmit(item)}>
                        <Ionicons name="time-outline" size={20} color={UI_CONFIG.colors.textSecondary} />
                        <Text style={styles.historyText} numberOfLines={1}>{item}</Text>
                      </TouchableOpacity>
                      <TouchableOpacity style={styles.historyRemoveBtn} onPress={() => removeRecentSearch(item)}>
                        <Ionicons name="close" size={20} color={UI_CONFIG.colors.textSecondary} />
                      </TouchableOpacity>
                    </View>
                  ))}
                </View>
              )}

              {/* Danh mục nổi bật */}
              {categories && categories.length > 0 && (
                <View style={styles.section}>
                  <Text style={styles.sectionTitle}>Danh mục</Text>
                  <View style={styles.chipContainer}>
                    {categories.map((cat) => (
                      <TouchableOpacity
                        key={cat.id}
                        style={styles.chip}
                        onPress={() => handleCategoryPress(String(cat.id))}
                      >
                        <Text style={styles.chipText}>{cat.name}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </View>
              )}
            </>
          ) : (
            /* Gợi ý tìm kiếm */
            <View style={styles.section}>
              <TouchableOpacity style={styles.suggestionItem} onPress={() => handleSubmit(debouncedQuery)}>
                <Ionicons name="search" size={20} color={UI_CONFIG.colors.primary} />
                <Text style={[styles.suggestionText, { color: UI_CONFIG.colors.primary, fontWeight: '500' }]} numberOfLines={1}>
                  Tìm "{debouncedQuery}"
                </Text>
              </TouchableOpacity>
              {suggestions.map((item, index) => (
                <TouchableOpacity
                  key={`suggestion-${index}`}
                  style={styles.suggestionItem}
                  onPress={() => handleSubmit(item)}
                >
                  <Ionicons name="search-outline" size={20} color={UI_CONFIG.colors.textSecondary} />
                  <Text style={styles.suggestionText} numberOfLines={1}>{item}</Text>
                </TouchableOpacity>
              ))}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeArea>
  );
}

const styles = StyleSheet.create({
  appBar: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: UI_CONFIG.colors.border,
  },
  backButton: {
    marginRight: UI_CONFIG.spacing.sm,
    padding: UI_CONFIG.spacing.xs,
  },
  searchBar: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: UI_CONFIG.borderRadius.md,
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
  },
  searchInput: {
    flex: 1,
    marginLeft: UI_CONFIG.spacing.sm,
    marginRight: UI_CONFIG.spacing.sm,
    fontSize: 16,
    paddingVertical: 0,
  },
  content: {
    flex: 1,
    backgroundColor: '#fff',
  },
  section: {
    padding: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: UI_CONFIG.spacing.sm,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: UI_CONFIG.colors.text,
    marginBottom: UI_CONFIG.spacing.sm,
  },
  clearText: {
    fontSize: 14,
    color: UI_CONFIG.colors.primary,
  },
  historyItemRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: UI_CONFIG.spacing.sm,
  },
  historyItemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  historyText: {
    marginLeft: UI_CONFIG.spacing.sm,
    fontSize: 15,
    color: UI_CONFIG.colors.text,
  },
  historyRemoveBtn: {
    padding: UI_CONFIG.spacing.xs,
  },
  chipContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: UI_CONFIG.spacing.sm,
  },
  chip: {
    backgroundColor: '#f5f5f5',
    paddingHorizontal: UI_CONFIG.spacing.md,
    paddingVertical: UI_CONFIG.spacing.sm,
    borderRadius: 20,
  },
  chipText: {
    fontSize: 14,
    color: UI_CONFIG.colors.text,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: UI_CONFIG.spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f9f9f9',
  },
  suggestionText: {
    marginLeft: UI_CONFIG.spacing.md,
    fontSize: 15,
    color: UI_CONFIG.colors.text,
  }
});
