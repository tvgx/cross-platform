# HANDOFF — Audit & fix dự án "cross-platform" (TiếpTế / Sàn TMĐT quân đội)

> Cập nhật: 2026-06-17 · Nhánh: `audit-fixes` · **Toàn bộ thay đổi đang UNCOMMITTED** (chưa commit theo yêu cầu — chỉ commit khi được lệnh).
> Kiểm tra: `npx tsc --noEmit` → **sạch (0 lỗi)**.

## 0. Bối cảnh & ràng buộc (không đổi)
- **Server là chuẩn**: mã/response server đã được thông qua → app phải conform và xử lý **đủ MỌI mã** server trả cho từng API.
- **Validate phía client TRƯỚC khi gửi**: sai thao tác / sai định dạng phải báo ngay trên app, không gửi data rác cho server.
- **Một nguồn sự thật**: lưu data server vào SQLite rồi dùng chính DB đó cho toàn app.
- Git: **chỉ commit khi người dùng yêu cầu**.

---

## 1. ĐÃ LÀM ĐƯỢC

### Đợt 0 — Lỗi runtime (tsc strict bắt)
- ✅ Thêm import `ProductRepository` ở [app/(main)/detail.tsx](app/(main)/detail.tsx) → trang chi tiết SP hết crash.
- ✅ Thêm import `SyncQueueRepository` ở [lib/repositories/ProductRepository.ts](lib/repositories/ProductRepository.ts) → like/comment offline không mất.
- ✅ Cap `retry_count` trong [lib/repositories/SyncQueueRepository.ts](lib/repositories/SyncQueueRepository.ts) → hết retry vô hạn 15s.
- ✅ `npx tsc --noEmit` từ 3 lỗi → **0 lỗi**.

### Đợt 1 — Chuẩn hoá xử lý response
- ✅ [lib/api/client.ts](lib/api/client.ts): đảo sang **allowlist** (`SUCCESS_CODES = 1000/9994/200/201`); mọi mã khác trả kèm HTTP 200 → **reject kèm message đã map**; xử lý `9998` (token hết hạn ở body 200) → xoá phiên, buộc đăng nhập lại; gắn `serverCode` + `response` vào error; log nhạy cảm gated sau `__DEV__`.
- ✅ Hồi sinh [lib/helpers/errorMapper.ts](lib/helpers/errorMapper.ts): bảng `RESPONSE_CODE_MESSAGES` tiếng Việt đủ mã 1000–1018, 9992–9999; helper `isSuccessCode`, `getMessageForCode`, hằng `EMPTY_LIST_CODE='9994'`, `TOKEN_INVALID_CODE='9998'`.
- ✅ Sửa path/field sai trong endpoints: [auth.ts](lib/api/endpoints/auth.ts), [misc.ts](lib/api/endpoints/misc.ts), [orders.ts](lib/api/endpoints/orders.ts), [social.ts](lib/api/endpoints/social.ts) (theo 81 path server thật).
- ✅ [pages/profile/ChangePasswordView.tsx](pages/profile/ChangePasswordView.tsx): gọi **API thật** thay vì mô phỏng.
- ✅ [app/(main)/notifications.tsx](app/(main)/notifications.tsx): nối store + API thật thay vì màn rỗng hardcode.

### Đợt 2 — Validate client trước khi gửi (hạ tầng đã dựng)
- ✅ Thêm [lib/utils/validators.ts](lib/utils/validators.ts) (SĐT/email/mật khẩu/OTP/…); đã nối vào: [SignupView](pages/signup/SignupView.tsx), [LoginView](pages/login/LoginView.tsx), [EditPersonalInfoView](pages/profile/EditPersonalInfoView.tsx), [address-add](app/(main)/address-add.tsx).
- ✅ Thêm [components/ui/LocationPicker.tsx](components/ui/LocationPicker.tsx) → chọn Tỉnh/Phường từ API lấy id (thay nhập tay), đã nối vào [address-add](app/(main)/address-add.tsx); bỏ field rác `address_id:[]`.

### Đợt 3 — Một phần đánh bóng / sửa logic nhỏ
- ✅ [app/index.tsx](app/index.tsx): nhận diện sĩ quan theo cả `role` lẫn `rank`.
- ✅ [components/navigation/SwipeWrapper.tsx](components/navigation/SwipeWrapper.tsx): swipe đổi tab dùng `router.navigate` (không chồng stack).
- ✅ [pages/profile/WalletView.tsx](pages/profile/WalletView.tsx): bỏ text đùa "Quỹ đen…", message ví trung tính.
- ✅ [pages/profile/ProfileView.tsx](pages/profile/ProfileView.tsx): cover dùng `require('../../assets/images/cover.jpg')`.
- ✅ [pages/signup/SignupView.tsx](pages/signup/SignupView.tsx): sửa ví tân binh (bỏ 1e18đ); check 9996 theo code thay vì HTTP status.
- ✅ Sửa lặt vặt: [HomeView.tsx](pages/home/HomeView.tsx), [AllProductsView.tsx](pages/products/AllProductsView.tsx), [store/network.ts](store/network.ts), [store/notifications.ts](store/notifications.ts), [services/SyncService.ts](services/SyncService.ts), [store/catalog.ts](store/catalog.ts).

---

## 2. ĐÃ SỬA (2 bug người dùng báo — ưu tiên cao nhất)

### ✅ Bug 1 — Like crash `FOREIGN KEY constraint failed` — ĐÃ FIX
- **Triệu chứng**: Like sản phẩm từ Home → `NativeStatement.finalizeSync ... FOREIGN KEY constraint failed`.
- **Gốc rễ**: [store/product.ts](store/product.ts) nạp SP Home **chỉ ghi vào zustand**, KHÔNG ghi bảng SQLite `Products` → khi `likeProduct` `INSERT INTO Likes` thì FK tới `Products(id)`/`Users(id)` không có hàng đích → vi phạm FK.
- **Đã code**:
  - (a) [ProductRepository.likeProduct](lib/repositories/ProductRepository.ts) **phòng thủ**: trước khi INSERT Likes, gọi `ensureUserRow(userId)` (INSERT OR IGNORE Users, kể cả `guest`) + `_insertProductRow(product)` (upsert hàng Products tối thiểu) → FK luôn resolve. Nhận thêm tham số `product?` (truyền từ [store/catalog.ts](store/catalog.ts) `toggleLike`).
  - (b) **Write-through**: [store/product.ts](store/product.ts) (`fetchInitialData` + `fetchBackgroundNextPage`) gọi `ProductRepository.cacheProductsLocally(items)` (INSERT OR IGNORE — không ghi đè like cục bộ) để lưu SP Home vào SQLite `Products` → đúng "một nguồn sự thật".
  - DB lưu local: `expo-sqlite` file `army_db_v2.db`, tự `initDB()` qua `CREATE TABLE IF NOT EXISTS` ([lib/storage/sqlite.ts](lib/storage/sqlite.ts)).

### ✅ Bug 2 — Hiển thị lỗi auth chưa thân thiện — ĐÃ FIX
- **Triệu chứng**: hiển thị message **thô của server** (vd `1004` = "Parameter value is invalid") thay vì tiếng Việt.
- **Đã code**:
  - [errorMapper.ts](lib/helpers/errorMapper.ts) `getMessageForCode`: đảo thứ tự → **mã đã biết ưu tiên bảng tiếng Việt**; chỉ dùng `serverMessage` cho mã CHƯA map.
  - Thêm `AUTH_CODE_MESSAGES` + helper `getAuthErrorMessage(code, fallback)`: `1002/1003/1004` → "Tên đăng nhập hoặc mật khẩu không đúng"; `9995` → "Tài khoản chưa được đăng ký trên hệ thống"; `9996` → "Số điện thoại này đã được đăng ký"; `9993` → "Mã xác thực không chính xác". **Bỏ qua text thô của server trong ngữ cảnh auth.**
  - [LoginView.tsx](pages/login/LoginView.tsx) + [SignupView.tsx](pages/signup/SignupView.tsx): lấy message từ `serverCode` qua `getAuthErrorMessage` thay vì `response.data.message`; HTTP status chỉ dùng khi không có mã nghiệp vụ.
  - Cập nhật [apiClient.test.ts](__tests__/lib/api/apiClient.test.ts): mã đã biết → message map VN; mã lạ → fallback serverMessage.
- **Còn lại (tùy chọn)**: áp `getAuthErrorMessage` cho ResetPassword / ChangePassword nếu muốn đồng bộ trải nghiệm.

---

## 3. CÒN TỒN ĐỌNG (theo plan, chưa làm)
- **Một nguồn sự thật đầy đủ**: cart server, checkout ghi đơn, `Transactions` (ví), `Messages` (chat), News — nhiều bảng tạo mà chưa ai đọc/ghi; mọi list nên đọc qua repository (server → SQLite → UI) + persist offline.
- **Tính năng vỏ còn lại**: màn chat thread (gửi tin), Search & Category ở Home (mới là `// TODO`), seller add product (chưa có UI), rút ví (API không tồn tại — cần bỏ/ẩn).
- **Cosmetic**: [TacticalImage.tsx](components/ui/TacticalImage.tsx) đang truyền `product_id` làm `categoryId` → ảnh thiếu hiện AK-47 sai; ảnh list từ DB hỏng URI (JSON string làm uri).
- **declare-info**: gửi sai field (`full_name/unit/rank` server bỏ qua) — cần gửi đúng field server.
- **Đồng bộ/smell còn lại**: payload `MESSAGE_SEND` lệch trong SyncService; `LoginView` poll NetInfo mỗi 1s (H2); mojibake comment trong `sqlite.ts` (H4).

---

## 4. KIỂM TRA / VERIFY
- ✅ `npx tsc --noEmit` — sạch.
- ⏳ Chưa chạy lại `npx jest` sau các sửa gần nhất → **cần chạy lại**.
- ⏳ Chưa chạy thử trên server thật cho 2 bug mới (Like / auth display).

## 5. BƯỚC TIẾP THEO (đề xuất, làm ngay)
1. Sửa **Bug 1**: `likeProduct` phòng thủ (upsert Products + ensure Users) + write-through SP Home vào SQLite.
2. Sửa **Bug 2**: `getMessageForCode` ưu tiên bảng map cho mã đã biết + map auth-context; cập nhật `LoginView` (và Signup/Reset/Change) dùng `serverCode`.
3. Chạy `npx tsc --noEmit` + `npx jest`; thử Like từ Home và đăng nhập sai/SĐT chưa đăng ký trên server thật.
4. **Không commit** cho tới khi người dùng yêu cầu.
