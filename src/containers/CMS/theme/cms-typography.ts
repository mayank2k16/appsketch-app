/**
 * Single font-scale reference for the whole CMS — reconciles the modal/detail
 * scale (proven in the original OrderDetailModal design) with the list-card
 * scale, so every CMS screen pulls from one place instead of each hardcoding
 * its own numbers. Plain values only — no fontFamily anywhere, CMS relies on
 * the platform's system font throughout.
 */
export const cmsType = {
  // Bottom-sheet / card section headers ("Customer & Delivery", "Products (3)")
  sectionTitle: { fontSize: 12.5, fontWeight: '800' as const, textTransform: 'uppercase' as const, letterSpacing: 0.5 },
  // Read-only label/value pairs (Field)
  fieldLabel: { fontSize: 10.5, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  fieldValue: { fontSize: 13.5, fontWeight: '600' as const },
  // Money/summary rows
  summaryLabel: { fontSize: 13, fontWeight: '500' as const },
  summaryValue: { fontSize: 13, fontWeight: '600' as const },
  summaryLabelBold: { fontSize: 15, fontWeight: '800' as const },
  summaryValueBold: { fontSize: 15, fontWeight: '800' as const },
  // Form inputs (CmsInput labels/values, CmsSelect)
  inputLabel: { fontSize: 10.5, fontWeight: '700' as const, textTransform: 'uppercase' as const, letterSpacing: 0.4 },
  inputValue: { fontSize: 14, fontWeight: '500' as const },
  inputError: { fontSize: 11, fontWeight: '600' as const },
  // Buttons
  buttonLabel: { fontSize: 14, fontWeight: '700' as const },
  // List-card rows (OrderListItem, InventoryCard)
  listTitle: { fontSize: 15, fontWeight: '800' as const },
  listSubtitle: { fontSize: 13, fontWeight: '600' as const },
  listMeta: { fontSize: 12, fontWeight: '400' as const },
  listBadge: { fontSize: 11, fontWeight: '700' as const },
  // Bottom-sheet title (CmsModal header)
  modalTitle: { fontSize: 16, fontWeight: '700' as const },
} as const;
