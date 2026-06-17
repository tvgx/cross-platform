# HANDOFF — Tính năng Tìm kiếm (Search page + Search Results page)

> Cập nhật: 2026-06-17 · Nhánh: `audit-fixes` · **Trạng thái: ĐÃ DUYỆT PLAN, CHƯA CODE.**
> Plan gốc: `C:\Users\Admin\.claude\plans\ph-n-t-m-ki-m-lazy-ember.md`
> Tham chiếu UX: [docs/shopee_advance.txt](docs/shopee_advance.txt)
> Ràng buộc chung (không đổi): server là chuẩn, validate phía client trước khi gửi, một nguồn sự thật (SQLite), **chỉ commit khi được lệnh**.

## 0. Bối cảnh
Hiện app **chưa có trải nghiệm tìm kiếm riêng**. Thanh tìm kiếm trên topbar Home ([CustomAppBar.tsx](components/navigation/CustomAppBar.tsx)) là `TextInput` gõ trực tiếp, submit thẳng sang `all-products?q=...`. [AllProductsView.tsx](pages/products/AllProductsView.tsx) nạp **toàn bộ** catalog rồi lọc bằng JS (không gọi API search, không phân trang). Đây cũng là mục còn tồn đọng đã ghi trong [HANDOFF.md](HANDOFF.md) mục 3 ("Search & Category ở Home mới là `// TODO`").

Mục tiêu: tách thành **2 màn riêng** theo phong cách Shopee:
1. **Trang Tìm kiếm** — mở khi tap thanh search ở Home. Hiện lịch sử tìm kiếm (lưu cả server + cache local, có thể xóa) + shortcut danh mục, và gợi ý type-ahead cục bộ khi gõ.
2. **Trang Kết quả tìm kiếm** — lưới sản phẩm cho 1 từ khóa, tái dùng layout của AllProductsView, có sort + lọc giá/danh mục + phân trang.

## 1. QUYẾT ĐỊNH ĐÃ CHỐT (đã hỏi & duyệt với người dùng)
- **Nguồn dữ liệu:** **Hybrid** — online gọi API search; offline fallback lọc catalog đã cache.
- **Type-ahead:** Lịch sử + gợi ý khớp với tên SP đã cache cục bộ (KHÔNG gọi API mỗi lần gõ).
- **Thanh search Home:** Thành **pressable không gõ được** — tap vào là điều hướng sang trang Tìm kiếm.
- **Bộ lọc:** Sort chips (sẵn có) **+ lọc khoảng giá + lọc danh mục** (dùng các field `ProductFilters` API đã hỗ trợ).
- **Loại kết quả:** **Chỉ sản phẩm** (bỏ qua kết quả user/shop mà endpoint search có thể trả).
- **Xóa lịch sử:** Chỉ xóa **cache local** (server chưa có endpoint delete; từ khóa server có thể quay lại sau khi sync — chấp nhận tạm).
- **Trang Tìm kiếm khi rỗng:** Lịch sử tìm kiếm (có nút xóa) + chips danh mục từ catalog store.
- **Tap gợi ý/lịch sử:** Chạy tìm kiếm ngay (điều hướng sang Kết quả).

## 2. ENDPOINT SỬ DỤNG (đã có sẵn, KHÔNG cần backend mới)
- **Kết quả:** `productsApi.getListProducts({ keyword, sort, min_price, max_price, category_id, page, limit })` — [lib/api/endpoints/products.ts](lib/api/endpoints/products.ts). Trả `ProductListItem[]` (chỉ SP), phân trang, đủ filter. **Ưu tiên cái này** thay vì `socialApi.search` (vì search trộn product + user).
- **Lịch sử:** `socialApi.saveSearch(keyword)` + `socialApi.getSavedSearches()` — [lib/api/endpoints/social.ts:178-182](lib/api/endpoints/social.ts#L178-L182). ⚠️ **KHÔNG có** endpoint xóa lịch sử.
- Hạ tầng offline cache của `apiCall` tự persist response read-path → search offline lặp lại query cũ vẫn có data.

## 3. FILES CẦN TẠO
1. **[store/search.ts](store/search.ts)** — store lịch sử tìm kiếm. Theo pattern zustand + `persist` + `zustandStorage` của [store/catalog.ts](store/catalog.ts).
   - State: `recentSearches: string[]`.
   - Actions: `addRecentSearch` (dedupe không phân biệt hoa/thường, đẩy lên đầu, cap ~10, fire-and-forget `saveSearch`), `removeRecentSearch`, `clearRecentSearches`, `hydrateFromServer` (gọi `getSavedSearches`, merge, best-effort).
   - Persist name: `'search-storage'`.
2. **[pages/search/SearchView.tsx](pages/search/SearchView.tsx)** — trang Tìm kiếm.
   - `CustomAppBar` (showBack) + `TextInput` **auto-focus** ngay khi vào màn.
   - Rỗng: list "Tìm kiếm gần đây" (mỗi dòng tap được + nút `x` xóa 1; nút "Xóa tất cả") + hàng chips danh mục từ `useCatalogStore(s => s.categories)`.
   - Khi gõ: gợi ý debounce ~200ms = lịch sử khớp + tên SP từ `useCatalogStore(s => s.products)`, dùng helper `removeTones` (copy từ [AllProductsView.tsx:23-25](pages/products/AllProductsView.tsx#L23-L25)).
   - 3 cách submit: tap icon search / `onSubmitEditing` (returnKeyType="search") / tap 1 dòng gợi ý → `addRecentSearch(q)` rồi `router.push` sang Kết quả.
   - Gọi `hydrateFromServer()` khi mount.
3. **[pages/search/SearchResultsView.tsx](pages/search/SearchResultsView.tsx)** — trang Kết quả. Phỏng theo [AllProductsView.tsx](pages/products/AllProductsView.tsx) (giữ FlatList grid, ProductCard, numColumns web/mobile, sort chips, RefreshControl, styles). Khác:
   - Đọc param `useLocalSearchParams<{ q?: string; category_id?: string }>()`.
   - App bar có ô search **gõ được** chứa query hiện tại, submit để search lại.
   - Fetch qua `ProductRepository.searchProducts(...)` (mục 4) thay cho `getProducts`.
   - **Phân trang/infinite scroll:** `onEndReached` → tải trang kế, append; theo dõi `page`/`hasMore`/`isFetchingMore`.
   - **UI lọc:** sort chips + khoảng giá (chips preset hoặc 2 ô số → `min_price`/`max_price`) + chips danh mục (→ `category_id`). Đổi filter → chạy lại từ trang 1.
   - Empty: "Không tìm thấy sản phẩm nào cho '<q>'".
4. **[app/(main)/search.tsx](app/(main)/search.tsx)** + **[app/(main)/search-results.tsx](app/(main)/search-results.tsx)** — route file mỏng, kiểu [app/(main)/all-products.tsx](app/(main)/all-products.tsx). expo-router tự nhận diện (drawer ở [app/(main)/_layout.tsx](app/(main)/_layout.tsx) chỉ khai `(tabs)`; các route anh em như `all-products`/`detail` vẫn chạy dù không khai) → **không cần sửa `_layout`**.

## 4. FILES CẦN SỬA
- **[components/navigation/CustomAppBar.tsx](components/navigation/CustomAppBar.tsx)** (nhánh `showSearch`, dòng [46-60](components/navigation/CustomAppBar.tsx#L46-L60)): thay `TextInput` + state `searchQuery` bằng `Pressable` giả-ô-search (icon + placeholder) gọi `router.push(ROUTES.SEARCH)`. Bỏ dùng prop `onSearch`.
- **[pages/home/HomeView.tsx](pages/home/HomeView.tsx)** (dòng [52-56, 97](pages/home/HomeView.tsx#L52)): bỏ `handleSearch`; `<CustomAppBar showSearch />` không cần `onSearch` nữa.
- **[lib/navigation/routes.ts](lib/navigation/routes.ts)**: thêm `SEARCH: '/(main)/search'` và `SEARCH_RESULTS: (q, categoryId?) => ...` (builder query-string, kiểu `DETAIL`).
- **[lib/repositories/ProductRepository.ts](lib/repositories/ProductRepository.ts)**: thêm `async searchProducts(keyword, filters, page, forceRefresh)`.
  - Online-first: `productsApi.getListProducts({ keyword, ...filters, page, limit })`; write-through SQLite qua `cacheProductsLocally`/`fetchAndSyncProducts` sẵn có; trả về trang.
  - Offline/lỗi: lọc local theo keyword. Mở rộng `getLocalProducts` để nhận `filters.keyword` (thêm clause `title LIKE ?`) hoặc lọc JS bằng `removeTones`. ⚠️ [getLocalProducts:46-114](lib/repositories/ProductRepository.ts#L46-L114) hiện **chỉ** xử lý `category_id`/`brand_id`/`sort` → **cần bổ sung** clause `keyword` và `min_price`/`max_price`.

## 5. EDGE CASES / GOTCHAS (đừng bỏ qua)
- Không có endpoint xóa lịch sử server → `clearRecentSearches` chỉ xóa local.
- Query rỗng/toàn khoảng trắng → chặn submit, không điều hướng, không lưu.
- Lịch sử trùng → dedupe không phân biệt hoa/thường, re-search thì đẩy lên đầu.
- Submit offline → hiện kết quả cache/lọc + gợi ý nhẹ "offline"; không được crash.
- Web vs native → giữ switch `numColumns` + trick `key` remount của AllProductsView; tầng MMKV đã tự xử lý web qua localStorage.
- Back: từ Kết quả → về trang Tìm kiếm; từ Tìm kiếm → về Home.
- Đua phân trang + filter → reset `page`/results khi đổi keyword/filter; bỏ qua response cũ.
- Auto-focus bàn phím khi vào trang Tìm kiếm (Android có thể cần delay nhỏ).

## 6. KIỂM TRA / VERIFY
1. `npm start` → Home, tap thanh search → vào trang Tìm kiếm, bàn phím bật, thấy lịch sử + chips danh mục.
2. Gõ vài ký tự → gợi ý cục bộ hiện, **không** có call network mỗi phím (xem log Metro).
3. Submit 3 cách (icon / enter / tap gợi ý) → lưới Kết quả tải; từ khóa vào lịch sử và còn sau khi restart app.
4. Kết quả: đổi sort, set khoảng giá, chọn danh mục → lưới đổi; cuộn đáy → trang kế append.
5. Bật máy bay, search lại query cũ → vẫn ra kết quả cache/lọc.
6. Xóa lịch sử (nút `x` lẻ + "Xóa tất cả") → list rỗng ngay.
7. `npx tsc --noEmit` → 0 lỗi.

## 7. THỨ TỰ THỰC HIỆN ĐỀ XUẤT
1. `routes.ts` (thêm SEARCH + SEARCH_RESULTS) → `store/search.ts`.
2. `ProductRepository.searchProducts` + mở rộng `getLocalProducts`.
3. `SearchResultsView.tsx` + route `search-results.tsx`.
4. `SearchView.tsx` + route `search.tsx`.
5. Sửa `CustomAppBar.tsx` + `HomeView.tsx` (nối nút tap).
6. `npx tsc --noEmit` → chạy thử end-to-end theo mục 6. **Không commit** tới khi được lệnh.
