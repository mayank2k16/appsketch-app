/**
 * Domain search + year/price picker — ported from the web reference
 * (`HomeV3/CartPage/Cart.jsx`'s `domainSection` block), as its own
 * standalone piece of the Cart screen rather than embedded inline.
 */
import * as React from 'react';
import { ActivityIndicator, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import type { DomainSearchResult } from '@/api/domains';
import { domainRegisterOptions, formatINR, getDomainPriceFromItem, priceForRegisterOption } from '@/lib/domain-pricing';
import { F } from '@/lib/fonts';
import type { AppColors } from '@/lib/theme';

export function DomainSearchSection({
  query,
  onChangeQuery,
  results,
  isLoading,
  selectedDomain,
  selectedYears,
  onSelect,
  t,
  domainOnly = false,
}: {
  query: string;
  onChangeQuery: (v: string) => void;
  results: DomainSearchResult[] | undefined;
  isLoading: boolean;
  selectedDomain: DomainSearchResult | null;
  selectedYears: number;
  onSelect: (result: DomainSearchResult, years: number, price: number) => void;
  t: AppColors;
  /** True when there's no plan riding along in this order (the user already
   * owns one) — swaps the "billed together with your plan" copy for one that
   * doesn't imply a plan charge. */
  domainOnly?: boolean;
}) {
  // Available domains first — the ones a user can actually buy shouldn't be
  // buried under taken ones just because of API result order.
  const sortedResults = React.useMemo(
    () => [...(results ?? [])].sort((a, b) => Number(b.available) - Number(a.available)),
    [results]
  );

  return (
    <View style={[st.wrap, { backgroundColor: t.card, borderColor: t.border }]}>
      <Text style={[st.title, { color: t.text }]}>Every website needs a domain</Text>
      <Text style={[st.subtitle, { color: t.textSub }]}>
        {domainOnly
          ? "Search and add a domain — you'll only be charged for the domain."
          : "Search and add a domain — it'll be billed together with your plan."}
      </Text>

      <View style={[st.searchRow, { borderColor: t.border, backgroundColor: t.agentTabBg }]}>
        <Ionicons name="search" size={16} color={t.textMuted} />
        <TextInput
          value={query}
          onChangeText={onChangeQuery}
          placeholder="Search a domain (e.g. mystore.com)"
          placeholderTextColor={t.textMuted}
          autoCapitalize="none"
          autoCorrect={false}
          style={[st.searchInput, { color: t.text }]}
        />
        {isLoading && <ActivityIndicator size="small" color={t.accent} />}
      </View>

      <View style={{ marginTop: 10 }}>
        {sortedResults.map((item) => {
          const isSelected = selectedDomain?.domain === item.domain;
          const options = domainRegisterOptions(item);

          return (
            <View
              key={item.domain}
              style={[
                st.resultRow,
                { borderColor: isSelected ? t.accent : t.border, backgroundColor: t.agentTabBg },
                isSelected && st.resultRowSelected,
              ]}
            >
              <View style={st.resultHeader}>
                <Text style={[st.resultName, { color: t.text }]}>{item.domain}</Text>
                <Text style={{ color: item.available ? '#1FA971' : '#E0392B', fontSize: 12.5, fontFamily: F.sans600 }}>
                  {item.available ? 'Available' : 'Unavailable'}
                </Text>
              </View>

              {item.available && options.length > 0 ? (
                <View style={st.yearGrid}>
                  {options.map((opt) => {
                    const years = Number(opt.years) || 1;
                    const price = priceForRegisterOption(opt);
                    const yearSelected = isSelected && selectedYears === years;
                    return (
                      <TouchableOpacity
                        key={years}
                        onPress={() => onSelect(item, years, price)}
                        activeOpacity={0.85}
                        style={[
                          st.yearChip,
                          { borderColor: t.border },
                          yearSelected && { backgroundColor: t.accent, borderColor: t.accent },
                        ]}
                      >
                        <Text style={[st.yearChipYears, { color: yearSelected ? '#FFFFFF' : t.text }]}>{years}Y</Text>
                        <Text style={[st.yearChipPrice, { color: yearSelected ? '#FFFFFF' : t.textSub }]}>
                          {formatINR(price)}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              ) : item.available ? (
                <TouchableOpacity
                  onPress={() => onSelect(item, 1, getDomainPriceFromItem(item))}
                  activeOpacity={0.85}
                  style={[st.flatSelectRow, isSelected && { backgroundColor: t.accentSoft }]}
                >
                  <Text style={[st.resultPrice, { color: t.text }]}>{formatINR(getDomainPriceFromItem(item))}</Text>
                  <Text style={[st.selectText, { color: t.accent }]}>{isSelected ? 'Selected' : 'Select'}</Text>
                </TouchableOpacity>
              ) : null}
            </View>
          );
        })}
      </View>

      {
        !isLoading && query.trim().length > 1 && sortedResults.length === 0 && (
          <Text style={[st.emptyText, { color: t.textMuted }]}>No results for "{query}".</Text>
        )
      }
    </View >
  );
}

const st = StyleSheet.create({
  wrap: { borderRadius: 16, borderWidth: 1, padding: 18, marginBottom: 20 },
  title: { fontFamily: F.sans700, fontSize: 15, marginBottom: 4 },
  subtitle: { fontFamily: F.sans400, fontSize: 12.5, lineHeight: 18, marginBottom: 14 },

  searchRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    borderRadius: 10,
    borderWidth: 1,
    paddingHorizontal: 12,
    height: 42,
    marginTop: 8,
  },
  searchInput: { flex: 1, fontFamily: F.sans500, fontSize: 13.5, height: '100%' },

  resultRow: { borderRadius: 12, borderWidth: 1, padding: 12, marginBottom: 10 },
  resultRowSelected: { borderWidth: 1.5 },
  resultHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 3 },
  resultName: { fontFamily: F.sans700, fontSize: 14 },
  resultPrice: { fontFamily: F.sans700, fontSize: 14 },

  yearGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, paddingTop: 10 },
  yearChip: { borderWidth: 1, borderRadius: 10, paddingVertical: 8, paddingHorizontal: 12, alignItems: 'center', minWidth: 64 },
  yearChipYears: { fontFamily: F.sans700, fontSize: 12.5 },
  yearChipPrice: { fontFamily: F.sans500, fontSize: 10.5, marginTop: 2 },

  flatSelectRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 4 },
  selectText: { fontFamily: F.sans700, fontSize: 12.5 },

  emptyText: { fontFamily: F.sans400, fontSize: 12.5, textAlign: 'center', paddingVertical: 8 },
});
